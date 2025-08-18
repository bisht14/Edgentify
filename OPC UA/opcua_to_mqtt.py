
import json
import time
import sys
import logging
import random
import math
from typing import Dict, Any, List
import ssl

from opcua import Client as UAClient, ua
import paho.mqtt.client as mqtt

# ----------------- CONFIG -----------------
OPCUA_ENDPOINT = "opc.tcp://localhost:4840/ua/metrics"
NAMESPACE_URI = "urn:example:opcua:metrics"
POLL_SECONDS = 5
DUMMY_MODE = False  # Set to False when using real OPC UA

# === AWS IoT Core settings ===
AWS_ENDPOINT = "aky0hohdi2yni-ats.iot.us-east-1.amazonaws.com"
AWS_PORT = 8883                     # use 8883 (TLS). If blocked, set USE_ALPN_443=True below.
MQTT_TOPIC = "iot/device/data"      # single source of truth

# Path to AWS IoT device certs (ensure these files exist)
CA_PATH   = "D:/AWS/IOT platform/certs/AmazonRootCA1.pem"
CERT_PATH = "D:/AWS/IOT platform/certs/device_001-certificate.pem.crt"
KEY_PATH  = "D:/AWS/IOT platform/certs/device_001-private.pem.key"

# Optional: use MQTT over 443 with ALPN if 8883 is blocked by network
USE_ALPN_443 = False  # set True if you need to go through corporate/firewalled networks

# OPC UA variable browse names
METRIC_NAMES: List[str] = [
    "CPU_Usage_Percent", "Memory_Usage_Percent", "Disk_Usage_Percent_Root",
    "Swap_Usage_Percent", "Net_Bytes_Sent", "Net_Bytes_Recv", "Uptime_Secs",
    "Load_Avg_1m", "Load_Avg_5m", "Load_Avg_15m", "Processes_Count", "CPU_Temperature_C",
]
# ----------------------------------------

logging.getLogger("opcua").setLevel(logging.ERROR)

def safe_number(value):
    if value is None or (isinstance(value, float) and math.isnan(value)):
        return None
    return value

def resolve_metric_nodes(client: UAClient, namespace_uri: str) -> Dict[str, Any]:
    ns_idx = client.get_namespace_index(namespace_uri)
    objects = client.get_objects_node()
    system_metrics = objects.get_child([ua.QualifiedName("SystemMetrics", ns_idx)])
    nodes = {}
    for name in METRIC_NAMES:
        try:
            node = system_metrics.get_child([ua.QualifiedName(name, ns_idx)])
            nodes[name] = node
        except Exception:
            nodes[name] = None
    return nodes

def read_metrics(nodes: Dict[str, Any]) -> Dict[str, Any]:
    data: Dict[str, Any] = {}
    for name, node in nodes.items():
        if node is None:
            data[name] = None
            continue
        try:
            data[name] = safe_number(node.get_value())
        except Exception:
            data[name] = None
    return data

# -------- MQTT callbacks (v2 API) --------
def on_connect(client, userdata, flags, reason_code, properties=None):
    print(f"[MQTT] Connected rc={reason_code}")
    if reason_code != 0:
        print("[MQTT] Connect was not successful. Check certs/policy/endpoint/clock skew.")

def on_publish(client, userdata, mid, reason_code, properties=None):
    print(f"[MQTT] Pub ACK mid={mid} rc={reason_code}")

def on_log(client, userdata, level, buf):
    # Uncomment if you need super-verbose logs during troubleshooting
    # print(f"[PAHO] {level}: {buf}")
    pass
# -----------------------------------------

def build_ssl_context():
    if not USE_ALPN_443:
        # Standard TLS on 8883
        ctx = ssl.create_default_context()
        ctx.minimum_version = ssl.TLSVersion.TLSv1_2
        ctx.load_verify_locations(CA_PATH)
        ctx.load_cert_chain(certfile=CERT_PATH, keyfile=KEY_PATH)
        return ctx, AWS_PORT
    else:
        # MQTT over 443 with ALPN (x-amzn-mqtt-ca)
        ctx = ssl.create_default_context()
        ctx.minimum_version = ssl.TLSVersion.TLSv1_2
        ctx.set_alpn_protocols(['x-amzn-mqtt-ca'])
        ctx.load_verify_locations(CA_PATH)
        ctx.load_cert_chain(certfile=CERT_PATH, keyfile=KEY_PATH)
        return ctx, 443

def main():
    # MQTT client setup for AWS IoT
    client = mqtt.Client(
        client_id="opcua_publisher",
        protocol=mqtt.MQTTv311,
        callback_api_version=mqtt.CallbackAPIVersion.VERSION2
    )
    client.enable_logger()  # routes through Python logging (can help)
    client.on_connect = on_connect
    client.on_publish = on_publish
    client.on_log = on_log

    ssl_ctx, port = build_ssl_context()
    client.tls_set_context(ssl_ctx)
    client.tls_insecure_set(False)

    print(f"[MQTT] Connecting to {AWS_ENDPOINT}:{port} ...")
    client.connect(AWS_ENDPOINT, port, keepalive=120)

    # Start network loop in background so publish() is non-blocking
    client.loop_start()

    if not DUMMY_MODE:
        print(f"[OPC UA] Connecting to {OPCUA_ENDPOINT} ...")
        ua_client = UAClient(OPCUA_ENDPOINT)
        ua_client.connect()
        print("[OPC UA] Connected.")
        nodes = resolve_metric_nodes(ua_client, NAMESPACE_URI)
        available = [k for k, v in nodes.items() if v is not None]
        missing = [k for k, v in nodes.items() if v is None]
        print(f"[OPC UA] Available metrics: {available}")
        if missing:
            print(f"[OPC UA] Missing metrics (will publish null): {missing}")

    try:
        while True:
            if DUMMY_MODE:
                payload = {
                    "timestamp": int(time.time()),
                    "temperature": safe_number(random.uniform(20, 80)),
                    "pressure": safe_number(random.uniform(900, 1100)),
                    "vibration": safe_number(random.uniform(0, 5)),
                    "status": "ok"
                }
            else:
                values = read_metrics(nodes)
                payload = {
                    "timestamp": int(time.time()),
                    "cpu_percent": values.get("CPU_Usage_Percent"),
                    "mem_percent": values.get("Memory_Usage_Percent"),
                    "disk_percent_root": values.get("Disk_Usage_Percent_Root"),
                    "swap_percent": values.get("Swap_Usage_Percent"),
                    "net_bytes_sent": values.get("Net_Bytes_Sent"),
                    "net_bytes_recv": values.get("Net_Bytes_Recv"),
                    "uptime_secs": values.get("Uptime_Secs"),
                    "load_1m": values.get("Load_Avg_1m"),
                    "load_5m": values.get("Load_Avg_5m"),
                    "load_15m": values.get("Load_Avg_15m"),
                    "process_count": values.get("Processes_Count"),
                    "temp_c": values.get("CPU_Temperature_C"),
                }

            # QoS 1 publish (wait for mid if you want strict confirmation)
            info = client.publish(MQTT_TOPIC, json.dumps(payload), qos=1)
            # Optionally wait for completion:
            info.wait_for_publish(timeout=5)
            print("[PUBLISHED]", payload)

            time.sleep(1 if DUMMY_MODE else POLL_SECONDS)

    except KeyboardInterrupt:
        print("\nStopping...")

    finally:
        if not DUMMY_MODE:
            ua_client.disconnect()
            print("[OPC UA] Disconnected.")
        client.loop_stop()
        client.disconnect()
        print("[MQTT] Closed.")

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"Fatal error: {e}")
        sys.exit(1)
