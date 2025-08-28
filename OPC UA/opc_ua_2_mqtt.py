
import os
import math
import time
from opcua import Client
import paho.mqtt.client as mqtt
import json
from datetime import datetime, timezone
import boto3

# OPC UA 
OPC_ENDPOINT = "opc.tcp://localhost:4840/ua/metrics"
NAMESPACE_URI = "urn:example:opcua:metrics"

# MQTT Settings (AWS IoT) 
MQTT_BROKER = "aky0hohdi2yni-ats.iot.us-east-1.amazonaws.com"
MQTT_PORT = 8883
MQTT_TOPIC = "opcua/metrics"
DEVICE_ID = "laptop-core-01"

# WebSocket Broker 
WS_BROKER = "test.mosquitto.org" 
WS_PORT = 8081
WS_TOPIC = MQTT_TOPIC

# S3 Settings
S3_BUCKET = "harsh03bucket"

# Make sure to run:  setx AWS_PROFILE opcua-logger  (Windows)
session = boto3.Session(profile_name="opcua-logger", region_name="us-east-1")
s3_client = session.client("s3")


def connect_opcua():
    """Connect to OPC UA server."""
    while True:
        try:
            client = Client(OPC_ENDPOINT)
            client.connect()
            print(f"✅ Connected to OPC UA server @ {OPC_ENDPOINT}")
            return client
        except Exception as e:
            print(f"❌ OPC UA connect failed: {e}, retrying in 5s...")
            time.sleep(5)


def connect_mqtt():
    """Connect to AWS IoT Core via MQTT."""
    while True:
        try:
            client = mqtt.Client(client_id="opcua_publisher")
            client.on_connect = lambda c, u, f, rc: print("✅ MQTT Connected:", rc)
            client.on_disconnect = lambda c, u, rc: print("⚠️ MQTT Disconnected:", rc)
            client.on_publish = lambda c, u, mid: print("📤 Message published, mid:", mid)

            client.tls_set(
                ca_certs="D:/IOT Project/IOT platform/certs/AmazonRootCA1.pem",
                certfile="D:/IOT Project/IOT platform/certs/device.pem.crt",
                keyfile="D:/IOT Project/IOT platform/certs/private.pem.key"
            )
            client.tls_insecure_set(False)

            client.connect(MQTT_BROKER, MQTT_PORT, keepalive=60)
            client.loop_start()
            print(f"✅ Connected/Publishing to AWS IoT @ {MQTT_BROKER}:{MQTT_PORT}")
            return client
        except Exception as e:
            print(f"❌ MQTT connect failed: {e}, retrying in 5s...")
            time.sleep(5)


def connect_mqtt_ws():
    """Connect to WebSocket broker for React dashboard."""
    while True:
        try:
            client = mqtt.Client(client_id="opcua_ws_publisher", transport="websockets")
            client.on_connect = lambda c, u, f, rc: print("✅ WS Connected:", rc)
            client.on_disconnect = lambda c, u, rc: print("⚠️ WS Disconnected:", rc)

            # TLS for secure WebSocket
            client.tls_set()
            client.tls_insecure_set(True)

            client.connect(WS_BROKER, WS_PORT)
            client.loop_start()
            print(f"✅ Connected/Publishing to WebSocket broker @ {WS_BROKER}:{WS_PORT}")
            return client
        except Exception as e:
            print(f"❌ WS connect failed: {e}, retrying in 5s...")
            time.sleep(5)


def save_to_s3(payload):
    """Save JSON logs to S3 bucket, organized per device."""
    try:
        ts = datetime.now(timezone.utc).strftime("%Y-%m-%d/%H/%M/%S-%f")
        s3_key = f"logs/{DEVICE_ID}/{ts}.json"
        s3_client.put_object(Bucket=S3_BUCKET, Key=s3_key, Body=json.dumps(payload, indent=2))
        print(f"✅ Log saved to S3: {s3_key}")
    except Exception as e:
        print(f"⚠️ Failed to save log to S3: {e}")


def main():
    client = connect_opcua()
    idx = client.get_namespace_index(NAMESPACE_URI)
    mqtt_client = connect_mqtt()
    mqtt_ws_client = connect_mqtt_ws()

    objects = client.get_objects_node()
    system_metrics = objects.get_child([f"{idx}:SystemMetrics"])

    payload_mapping = {
        "CPU_Usage_Percent": "cpu_percent",
        "Memory_Usage_Percent": "mem_percent",
        "Disk_Usage_Percent_Root": "disk_percent_root",
        "Swap_Usage_Percent": "swap_percent",
        "Net_Bytes_Sent": "net_bytes_sent",
        "Net_Bytes_Recv": "net_bytes_recv",
        "Uptime_Secs": "uptime_secs",
        "Load_Avg_1m": "load_1m",
        "Load_Avg_5m": "load_5m",
        "Load_Avg_15m": "load_15m",
        "Processes_Count": "process_count",
        "CPU_Temperature_C": "temp_c"
    }

    try:
        while True:
            try:
                values = {}
                for opc_var, key in payload_mapping.items():
                    node = system_metrics.get_child([f"{idx}:{opc_var}"])
                    val = node.get_value()
                    if isinstance(val, float) and math.isnan(val):
                        val = None
                    values[key] = val

                payload = {"device_id": DEVICE_ID, "timestamp": int(time.time() * 1000), **values}

                # Publish to MQTT (AWS IoT Core)
                mqtt_client.publish(MQTT_TOPIC, json.dumps(payload, indent=2))

                # Publish to WebSocket
                mqtt_ws_client.publish(WS_TOPIC, json.dumps(payload))

                save_to_s3(payload)

                print("📤 Published payload to AWS + WS:", payload)
            except Exception as e:
                print(f"⚠️ Error in main loop: {e}")
                time.sleep(2)

            time.sleep(5)

    except KeyboardInterrupt:
        print("Stopped bridge.")
    finally:
        client.disconnect()
        mqtt_client.disconnect()
        mqtt_ws_client.disconnect()


if __name__ == "__main__":
    main()
