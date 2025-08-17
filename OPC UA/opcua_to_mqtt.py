# import time
# import json
# from opcua import Client
# import paho.mqtt.client as mqtt

# # ---------- CONFIG ----------
# OPC_UA_ENDPOINT = "opc.tcp://localhost:4840/ua/metrics"  # Change if remote
# NAMESPACE_URI = "urn:example:opcua:metrics"
# MQTT_BROKER = "test.mosquitto.org"  # Public broker for testing
# MQTT_PORT = 1883
# MQTT_TOPIC = "opcua/metrics"
# PUBLISH_INTERVAL = 5  # seconds
# # ----------------------------

# # Connect to MQTT broker
# mqtt_client = mqtt.Client()
# mqtt_client.connect(MQTT_BROKER, MQTT_PORT, 60)
# mqtt_client.loop_start()
# print(f"[MQTT] Connected to broker {MQTT_BROKER}:{MQTT_PORT}")

# # Connect to OPC UA server
# opc_client = Client(OPC_UA_ENDPOINT)
# opc_client.connect()
# print(f"[OPC UA] Connected to {OPC_UA_ENDPOINT}")

# # Get namespace index
# ns_idx = opc_client.get_namespace_index(NAMESPACE_URI)

# # Access variables
# cpu_node = opc_client.get_node(f"ns={ns_idx};s=CPU_Usage_Percent")
# mem_node = opc_client.get_node(f"ns={ns_idx};s=Memory_Usage_Percent")

# try:
#     while True:
#         cpu_value = cpu_node.get_value()
#         mem_value = mem_node.get_value()

#         # Prepare payload
#         payload = {
#             "cpu_percent": cpu_value,
#             "mem_percent": mem_value,
#             "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
#         }

#         # Publish to MQTT
#         mqtt_client.publish(MQTT_TOPIC, json.dumps(payload))
#         print(f"[PUSHED] {payload}")

#         time.sleep(PUBLISH_INTERVAL)

# except KeyboardInterrupt:
#     print("\nStopping client...")

# finally:
#     opc_client.disconnect()
#     mqtt_client.loop_stop()
#     mqtt_client.disconnect()
#     print("Disconnected from OPC UA and MQTT.")





#!/usr/bin/env python3
# """
# Greengrass OPC UA Client Component

# Connects to an OPC UA server (running locally or remotely),
# reads system metrics variables, and publishes them to AWS IoT Core.

# Intended to run as an AWS IoT Greengrass v2 component.
# """
# import time
# import json
# from opcua import Client as UAClient
# import greengrasssdk

# # OPC UA server endpoint (adjust to your setup)
# OPCUA_ENDPOINT = "opc.tcp://localhost:4840/ua/metrics"

# # AWS IoT publish topic
# IOT_TOPIC = "laptop/metrics"

# # Polling interval in seconds
# POLL_INTERVAL = 5

# # Initialize AWS IoT Greengrass IPC SDK client
# iot_client = greengrasssdk.client('iot-data')

# # Initialize OPC UA client
# ua_client = UAClient(OPCUA_ENDPOINT)

# try:
#     print(f"Connecting to OPC UA server at {OPCUA_ENDPOINT} ...")
#     ua_client.connect()
#     print("Connected to OPC UA server.")

#     # Get root objects node
#     objects_node = ua_client.get_objects_node()

#     # Browse down to our metrics object
#     # Path: Objects → SystemMetrics → variable name
#     cpu_var = objects_node.get_child(["0:Objects", "2:SystemMetrics", "2:CPU_Usage_Percent"])
#     mem_var = objects_node.get_child(["0:Objects", "2:SystemMetrics", "2:Memory_Usage_Percent"])
#     disk_var = objects_node.get_child(["0:Objects", "2:SystemMetrics", "2:Disk_Usage_Percent_Root"])
#     swap_var = objects_node.get_child(["0:Objects", "2:SystemMetrics", "2:Swap_Usage_Percent"])
#     net_sent_var = objects_node.get_child(["0:Objects", "2:SystemMetrics", "2:Net_Bytes_Sent"])
#     net_recv_var = objects_node.get_child(["0:Objects", "2:SystemMetrics", "2:Net_Bytes_Recv"])
#     uptime_var = objects_node.get_child(["0:Objects", "2:SystemMetrics", "2:Uptime_Secs"])
#     load1_var = objects_node.get_child(["0:Objects", "2:SystemMetrics", "2:Load_Avg_1m"])
#     load5_var = objects_node.get_child(["0:Objects", "2:SystemMetrics", "2:Load_Avg_5m"])
#     load15_var = objects_node.get_child(["0:Objects", "2:SystemMetrics", "2:Load_Avg_15m"])
#     proc_count_var = objects_node.get_child(["0:Objects", "2:SystemMetrics", "2:Processes_Count"])
#     temp_var = objects_node.get_child(["0:Objects", "2:SystemMetrics", "2:CPU_Temperature_C"])

#     while True:
#         # Read all values from server
#         payload = {
#             "cpu_percent": cpu_var.get_value(),
#             "mem_percent": mem_var.get_value(),
#             "disk_percent_root": disk_var.get_value(),
#             "swap_percent": swap_var.get_value(),
#             "net_bytes_sent": net_sent_var.get_value(),
#             "net_bytes_recv": net_recv_var.get_value(),
#             "uptime_secs": uptime_var.get_value(),
#             "load_1m": load1_var.get_value(),
#             "load_5m": load5_var.get_value(),
#             "load_15m": load15_var.get_value(),
#             "process_count": proc_count_var.get_value(),
#             "temp_c": temp_var.get_value(),
#             "timestamp": int(time.time())
#         }

#         # Publish to AWS IoT Core
#         iot_client.publish(topic=IOT_TOPIC, payload=json.dumps(payload))
#         print(f"Published metrics to {IOT_TOPIC}: {payload}")

#         time.sleep(POLL_INTERVAL)

# except Exception as e:
#     print(f"Error: {e}")
# finally:
#     try:
#         ua_client.disconnect()
#         print("Disconnected from OPC UA server.")
#     except Exception:
#         pass





#!/usr/bin/env python3
# """
# OPC UA -> MQTT bridge

# - Reads metrics from your OPC UA Metrics Server.
# - Publishes to either:
#    A) Public MQTT broker (paho-mqtt), or
#    B) AWS IoT Core with mTLS (awscrt+awsiotsdk).

# Switch by setting MQTT_MODE = "public" or "aws".
# """

# import json
# import time
# import sys
# import logging
# from typing import Dict, Any, List

# from opcua import Client as UAClient, ua

# # ----------------- CONFIG -----------------
# OPCUA_ENDPOINT = "opc.tcp://localhost:4840/ua/metrics"
# NAMESPACE_URI = "urn:example:opcua:metrics"
# POLL_SECONDS = 5


# MQTT_MODE = "public"  # "public" | "aws"

# # --- Public broker (for testing now) ---
# PUBLIC_BROKER_HOST = "test.mosquitto.org"
# PUBLIC_BROKER_PORT = 1883
# PUBLIC_TOPIC = "opcua/metrics"

# # --- AWS IoT Core 
# AWS_ENDPOINT = "aky0hohdi2yni-ats.iot.us-east-1.amazonaws.com"
# AWS_CLIENT_ID = "opcua-bridge-client"
# AWS_TOPIC = "laptop/metrics"
# AWS_PATH_TO_CERT = "D:/AWS/IOT platform/certs/device_001-certificate.pem.crt"
# AWS_PATH_TO_KEY = "D:/AWS/IOT platform/certs/device_001-private.pem.key"
# AWS_PATH_TO_ROOT_CA = "D:/AWS/IOT platform/certs/AmazonRootCA1.pem"

# # OPC UA variable browse names under Objects -> SystemMetrics
# METRIC_NAMES: List[str] = [
#     "CPU_Usage_Percent",
#     "Memory_Usage_Percent",
#     "Disk_Usage_Percent_Root",
#     "Swap_Usage_Percent",
#     "Net_Bytes_Sent",
#     "Net_Bytes_Recv",
#     "Uptime_Secs",
#     "Load_Avg_1m",
#     "Load_Avg_5m",
#     "Load_Avg_15m",
#     "Processes_Count",
#     "CPU_Temperature_C",
# ]
# # ----------------------------------------

# # Reduce noisy attribute warnings from python-opcua
# logging.getLogger("opcua").setLevel(logging.ERROR)


# class MqttPublisher:
#     """Abstracts publishing so we can swap backends easily."""

#     def __init__(self):
#         self.mode = MQTT_MODE
#         if self.mode == "public":
#             import paho.mqtt.client as mqtt
#             # ✅ Updated for paho-mqtt v2.x
#             self._mqtt = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
#             self._mqtt.loop_start()
#             self._connected = False

#             def on_connect(client, userdata, flags, reason_code, properties=None):
#                 self._connected = True
#                 print(f"[MQTT] Connected to {PUBLIC_BROKER_HOST}:{PUBLIC_BROKER_PORT} (rc={reason_code})")

#             def on_disconnect(client, userdata, reason_code, properties=None):
#                 self._connected = False
#                 print(f"[MQTT] Disconnected (rc={reason_code})")

#             self._mqtt.on_connect = on_connect
#             self._mqtt.on_disconnect = on_disconnect
#             self._connect_public()

#         elif self.mode == "aws":
#             from awscrt import io, mqtt
#             from awsiot import mqtt_connection_builder

#             self._io = io
#             self._mqtt_mod = mqtt

#             event_loop_group = io.EventLoopGroup(1)
#             host_resolver = io.DefaultHostResolver(event_loop_group)
#             client_bootstrap = io.ClientBootstrap(event_loop_group, host_resolver)

#             self._conn = mqtt_connection_builder.mtls_from_path(
#                 endpoint=AWS_ENDPOINT,
#                 cert_filepath=AWS_PATH_TO_CERT,
#                 pri_key_filepath=AWS_PATH_TO_KEY,
#                 client_bootstrap=client_bootstrap,
#                 ca_filepath=AWS_PATH_TO_ROOT_CA,
#                 client_id=AWS_CLIENT_ID,
#                 clean_session=False,
#                 keep_alive_secs=30,
#             )
#             print("[AWS IoT] Connecting...")
#             self._conn.connect().result()
#             print("[AWS IoT] Connected.")
#         else:
#             raise ValueError("MQTT_MODE must be 'public' or 'aws'")

#     def _connect_public(self):
#         if not self._connected:
#             try:
#                 self._mqtt.connect(PUBLIC_BROKER_HOST, PUBLIC_BROKER_PORT, 60)
#             except Exception as e:
#                 print(f"[MQTT] Connect error: {e}")

#     def publish(self, payload: Dict[str, Any]):
#         data = json.dumps(payload)
#         if self.mode == "public":
#             if not self._connected:
#                 self._connect_public()
#             self._mqtt.publish(PUBLIC_TOPIC, data)
#         else:
#             self._conn.publish(
#                 topic=AWS_TOPIC,
#                 payload=data,
#                 qos=self._mqtt_mod.QoS.AT_LEAST_ONCE
#             )

#     def close(self):
#         if self.mode == "public":
#             try:
#                 self._mqtt.loop_stop()
#                 self._mqtt.disconnect()
#             except Exception:
#                 pass
#         else:
#             try:
#                 self._conn.disconnect().result()
#             except Exception:
#                 pass


# def resolve_metric_nodes(client: UAClient, namespace_uri: str) -> Dict[str, Any]:
#     ns_idx = client.get_namespace_index(namespace_uri)
#     objects = client.get_objects_node()
#     system_metrics = objects.get_child([ua.QualifiedName("SystemMetrics", ns_idx)])

#     nodes = {}
#     for name in METRIC_NAMES:
#         try:
#             node = system_metrics.get_child([ua.QualifiedName(name, ns_idx)])
#             nodes[name] = node
#         except Exception:
#             nodes[name] = None
#     return nodes


# def read_metrics(nodes: Dict[str, Any]) -> Dict[str, Any]:
#     data: Dict[str, Any] = {}
#     for name, node in nodes.items():
#         if node is None:
#             data[name] = None
#             continue
#         try:
#             data[name] = node.get_value()
#         except Exception:
#             data[name] = None
#     return data


# def main():
#     print(f"[OPC UA] Connecting to {OPCUA_ENDPOINT} ...")
#     ua_client = UAClient(OPCUA_ENDPOINT)
#     ua_client.connect()
#     print("[OPC UA] Connected.")

#     nodes = resolve_metric_nodes(ua_client, NAMESPACE_URI)
#     available = [k for k, v in nodes.items() if v is not None]
#     missing = [k for k, v in nodes.items() if v is None]
#     print(f"[OPC UA] Available metrics: {available}")
#     if missing:
#         print(f"[OPC UA] Missing metrics (will publish null): {missing}")

#     publisher = MqttPublisher()
#     print(f"[Bridge] Mode: {MQTT_MODE!r}. Polling every {POLL_SECONDS}s.")

#     try:
#         while True:
#             values = read_metrics(nodes)
#             payload = {
#                 "timestamp": int(time.time()),
#                 "cpu_percent": values.get("CPU_Usage_Percent"),
#                 "mem_percent": values.get("Memory_Usage_Percent"),
#                 "disk_percent_root": values.get("Disk_Usage_Percent_Root"),
#                 "swap_percent": values.get("Swap_Usage_Percent"),
#                 "net_bytes_sent": values.get("Net_Bytes_Sent"),
#                 "net_bytes_recv": values.get("Net_Bytes_Recv"),
#                 "uptime_secs": values.get("Uptime_Secs"),
#                 "load_1m": values.get("Load_Avg_1m"),
#                 "load_5m": values.get("Load_Avg_5m"),
#                 "load_15m": values.get("Load_Avg_15m"),
#                 "process_count": values.get("Processes_Count"),
#                 "temp_c": values.get("CPU_Temperature_C"),
#             }
#             publisher.publish(payload)
#             print(f"[PUBLISHED] {payload}")
#             time.sleep(POLL_SECONDS)

#     except KeyboardInterrupt:
#         print("\nStopping...")

#     finally:
#         try:
#             ua_client.disconnect()
#             print("[OPC UA] Disconnected.")
#         except Exception:
#             pass
#         publisher.close()
#         print("[MQTT] Closed.")


# if __name__ == "__main__":
#     try:
#         main()
#     except Exception as e:
#         print(f"Fatal error: {e}")
#         sys.exit(1)
# #     except KeyboardInterrupt:
# #         print("\nInterrupted by user.")





import json
import time
import sys
import logging
import random
import math
from typing import Dict, Any, List

from opcua import Client as UAClient, ua
import paho.mqtt.client as mqtt

# ----------------- CONFIG -----------------
OPCUA_ENDPOINT = "opc.tcp://localhost:4840/ua/metrics"
NAMESPACE_URI = "urn:example:opcua:metrics"
POLL_SECONDS = 5
DUMMY_MODE = True  # ✅ Set to False when using real OPC UA

# MQTT settings (Public Broker for now)
MQTT_BROKER = "test.mosquitto.org"
MQTT_PORT = 1883
MQTT_TOPIC = "opcua/metrics"

# OPC UA variable browse names
METRIC_NAMES: List[str] = [
    "CPU_Usage_Percent",
    "Memory_Usage_Percent",
    "Disk_Usage_Percent_Root",
    "Swap_Usage_Percent",
    "Net_Bytes_Sent",
    "Net_Bytes_Recv",
    "Uptime_Secs",
    "Load_Avg_1m",
    "Load_Avg_5m",
    "Load_Avg_15m",
    "Processes_Count",
    "CPU_Temperature_C",
]
# ----------------------------------------

logging.getLogger("opcua").setLevel(logging.ERROR)


def safe_number(value):
    """Replace NaN with None for JSON compatibility."""
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
    """Read from OPC UA server and sanitize values."""
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


def main():
    # MQTT client setup
    # client = mqtt.Client()
    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
    client.connect(MQTT_BROKER, MQTT_PORT, 60)

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
                # Simulated values
                payload = {
                    "timestamp": int(time.time()),
                    "temperature": safe_number(random.uniform(20, 80)),
                    "pressure": safe_number(random.uniform(900, 1100)),
                    "vibration": safe_number(random.uniform(0, 5)),
                    "status": "ok"
                }
            else:
                # Real OPC UA readings
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

            client.publish(MQTT_TOPIC, json.dumps(payload))
            print("[PUBLISHED]", payload)
            time.sleep(1 if DUMMY_MODE else POLL_SECONDS)

    except KeyboardInterrupt:
        print("\nStopping...")

    finally:
        if not DUMMY_MODE:
            ua_client.disconnect()
            print("[OPC UA] Disconnected.")
        client.disconnect()
        print("[MQTT] Closed.")


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"Fatal error: {e}")
        sys.exit(1)
#     except KeyboardInterrupt:
#         print("\nInterrupted by user.")