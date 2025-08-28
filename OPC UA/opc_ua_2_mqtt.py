# #!/usr/bin/env python3
# """
# OPC UA → MQTT Bridge
# Reads metrics from OPC UA server and publishes to MQTT topic
# """

# import math
# import time
# from opcua import Client
# import paho.mqtt.client as mqtt

# # --- OPC UA Settings ---
# OPC_ENDPOINT = "opc.tcp://localhost:4840/ua/metrics"
# NAMESPACE_URI = "urn:example:opcua:metrics"

# # --- MQTT Settings ---
# #MQTT_BROKER = "localhost"      # change to your broker or AWS IoT endpoint
# #MQTT_PORT = 1883

# #-----For AWS use below two------
# MQTT_BROKER = "aky0hohdi2yni-ats.iot.us-east-1.amazonaws.com"
# MQTT_PORT = 8883


# MQTT_TOPIC = "opcua/metrics"

# DEVICE_ID = "laptop-core-01"   # set your device ID here



# def connect_opcua():
#     while True:
#         try:
#             client = Client(OPC_ENDPOINT)
#             client.connect()
#             print(f"✅ Connected to OPC UA server @ {OPC_ENDPOINT}")
#             return client
#         except Exception as e:
#             print(f"❌ OPC UA connect failed: {e}, retrying in 5s...")
#             time.sleep(5)

# def connect_mqtt():
#     while True:
#         try:
#             mqtt_client = mqtt.Client(
#                 client_id="opcua_publisher",
#                 protocol=mqtt.MQTTv311,
#                 callback_api_version=mqtt.CallbackAPIVersion.VERSION1
#             )

#             # Callbacks
#             mqtt_client.on_connect = lambda client, userdata, flags, rc: print("✅ MQTT Connected:", rc)
#             mqtt_client.on_disconnect = lambda client, userdata, rc: print("⚠️ MQTT Disconnected:", rc)
#             mqtt_client.on_publish = lambda client, userdata, mid: print("📤 Message published, mid:", mid)
#             mqtt_client.on_log = lambda client, userdata, level, buf: print("📜 Log:", buf)

#             # AWS IoT TLS
#             mqtt_client.tls_set(
#                 ca_certs="D:/IOT Project/IOT platform/certs/AmazonRootCA1.pem",
#                 certfile="D:/IOT Project/IOT platform/certs/device.pem.crt",
#                 keyfile="D:/IOT Project/IOT platform/certs/private.pem.key"
#             )
#             mqtt_client.tls_insecure_set(False)

#             mqtt_client.connect(MQTT_BROKER, MQTT_PORT, keepalive=60)
#             mqtt_client.loop_start()

#             print(f"✅ Connected/ Publishing to MQTT broker @ {MQTT_BROKER}:{MQTT_PORT}")
#             return mqtt_client
#         except Exception as e:
#             print(f"❌ MQTT connect failed: {e}, retrying in 5s...")
#             time.sleep(5)



# def main():
#     client = connect_opcua()
#     idx = client.get_namespace_index(NAMESPACE_URI)
#     mqtt_client = connect_mqtt()

#     objects = client.get_objects_node()
#     system_metrics = objects.get_child([f"{idx}:SystemMetrics"])

#     variables = [
#         "CPU_Usage_Percent",
#         "Memory_Usage_Percent",
#         "Disk_Usage_Percent_Root",
#         "Swap_Usage_Percent",
#         "Net_Bytes_Sent",
#         "Net_Bytes_Recv",
#         "Uptime_Secs",
#         "Load_Avg_1m",
#         "Load_Avg_5m",
#         "Load_Avg_15m",
#         "Processes_Count",
#         "CPU_Temperature_C",
#     ]

#     payload_mapping = {
#     "CPU_Usage_Percent": "cpu_percent",
#     "Memory_Usage_Percent": "mem_percent",
#     "Disk_Usage_Percent_Root": "disk_percent_root",
#     "Swap_Usage_Percent": "swap_percent",
#     "Net_Bytes_Sent": "net_bytes_sent",
#     "Net_Bytes_Recv": "net_bytes_recv",
#     "Uptime_Secs": "uptime_secs",
#     "Load_Avg_1m": "load_1m",
#     "Load_Avg_5m": "load_5m",
#     "Load_Avg_15m": "load_15m",
#     "Processes_Count": "process_count",
#     "CPU_Temperature_C": "temp_c"
#     }

#     try:
#         while True:
#             try:
#                 values={}

#                 for opc_var, payload_key in payload_mapping.items():
#                     node = system_metrics.get_child([f"{idx}:{opc_var}"])
#                     values[payload_key] = node.get_value()
#                     val = node.get_value()
#                     # Replace NaN with None for JSON compatibility
#                     if isinstance(val, float) and math.isnan(val):
#                         val = None
#                     values[payload_key] = val
                
#                 payload = {"device_id": DEVICE_ID, "timestamp": int(time.time() * 1000),**values}

#                 # publish as JSON
#                 import json
#                 mqtt_client.publish(MQTT_TOPIC, json.dumps(payload, indent=2))
#                 print("Published:", payload)
#                 pass
#             except Exception as e:
#                 print(f"⚠️ Error: {e}")
#                 time.sleep(2)
#             time.sleep(5)  # every 5 seconds
#     except KeyboardInterrupt:
#         print("Stopped bridge.")

#     finally:
#         client.disconnect()
#         mqtt_client.disconnect()

# if __name__ == "__main__":
#     main()






#!/usr/bin/env python3
"""
OPC UA → MQTT Bridge
Reads metrics from OPC UA server and publishes to MQTT topic
Also stores logs to S3
"""

# import math
# import time
# from opcua import Client
# import paho.mqtt.client as mqtt
# import json
# from datetime import datetime
# import boto3  # added for S3

# # --- OPC UA Settings ---
# OPC_ENDPOINT = "opc.tcp://localhost:4840/ua/metrics"
# NAMESPACE_URI = "urn:example:opcua:metrics"

# # --- MQTT Settings ---
# #MQTT_BROKER = "localhost"      # change to your broker or AWS IoT endpoint
# #MQTT_PORT = 1883


# #-----For AWS use below two------
# MQTT_BROKER = "aky0hohdi2yni-ats.iot.us-east-1.amazonaws.com"
# MQTT_PORT = 8883

# MQTT_TOPIC = "opcua/metrics"
# DEVICE_ID = "laptop-core-01"   # Set your device ID here


# # --- WebSocket Broker for React Dashboard ---
# WS_BROKER = "wss://test.mosquitto.org:8081"  # public WebSocket broker
# WS_TOPIC = MQTT_TOPIC

# # --- S3 Settings ---
# S3_BUCKET = "harsh03bucket"   # Replace with your S3 bucket name
# s3_client = boto3.client(
#     "s3",
#     aws_access_key_id="AKIAXYKJSJY6H7S2ICOM",       # replace with your IAM user keys
#     aws_secret_access_key="HAj2bYcpdGkFX/wBjl6MnyUq0CO2IATv9NaF6oqv",  # replace with your IAM user keys
#     region_name="us-east-1"
# )

# def connect_opcua():
#     while True:
#         try:
#             client = Client(OPC_ENDPOINT)
#             client.connect()
#             print(f"✅ Connected to OPC UA server @ {OPC_ENDPOINT}")
#             return client
#         except Exception as e:
#             print(f"❌ OPC UA connect failed: {e}, retrying in 5s...")
#             time.sleep(5)

# def connect_mqtt():
#     while True:
#         try:
#             mqtt_client = mqtt.Client(
#                 client_id="opcua_publisher",
#                 protocol=mqtt.MQTTv311,
#                 callback_api_version=mqtt.CallbackAPIVersion.VERSION1
#             )

#             # Callbacks
#             mqtt_client.on_connect = lambda client, userdata, flags, rc: print("✅ MQTT Connected:", rc)
#             mqtt_client.on_disconnect = lambda client, userdata, rc: print("⚠️ MQTT Disconnected:", rc)
#             mqtt_client.on_publish = lambda client, userdata, mid: print("📤 Message published, mid:", mid)
#             mqtt_client.on_log = lambda client, userdata, level, buf: print("📜 Log:", buf)

#             # AWS IoT TLS
#             mqtt_client.tls_set(
#                 ca_certs="D:/IOT Project/IOT platform/certs/AmazonRootCA1.pem",
#                 certfile="D:/IOT Project/IOT platform/certs/device.pem.crt",
#                 keyfile="D:/IOT Project/IOT platform/certs/private.pem.key"
#             )
#             mqtt_client.tls_insecure_set(False)

#             mqtt_client.connect(MQTT_BROKER, MQTT_PORT, keepalive=60)
#             mqtt_client.loop_start()

#             print(f"✅ Connected/ Publishing to MQTT broker @ {MQTT_BROKER}:{MQTT_PORT}")
#             return mqtt_client
#         except Exception as e:
#             print(f"❌ MQTT connect failed: {e}, retrying in 5s...")
#             time.sleep(5)

# # def connect_mqtt_ws():
# #     """Connect to a WebSocket broker for browser dashboard"""
# #     client = mqtt.Client(transport="websockets")
# #     client.connect(WS_BROKER, 8081)
# #     client.loop_start()
# #     print(f"✅ Connected/Publishing to WebSocket broker @ {WS_BROKER}")
# #     return client

# def connect_mqtt_ws():
#     """Connect to a WebSocket broker for browser dashboard"""
#     # Use the latest callback API version
#     client = mqtt.Client(client_id="opcua_ws_publisher", transport="websockets", callback_api_version=mqtt.CallbackAPIVersion.VERSION1)
#     client.connect(WS_BROKER, 8081)
#     client.loop_start()
#     print(f"✅ Connected/Publishing to WebSocket broker @ {WS_BROKER}")
#     return client


# def save_to_s3(payload):
#     """Uploads the MQTT payload as a JSON file to S3"""
#     try:
#         timestamp = datetime.utcnow().strftime("%Y-%m-%d_%H-%M-%S")
#         s3_key = f"logs/{timestamp}.json"
#         s3_client.put_object(Bucket=S3_BUCKET, Key=s3_key, Body=json.dumps(payload, indent=2))
#         print(f"✅ Log saved to S3: {s3_key}")
#     except Exception as e:
#         print(f"⚠️ Failed to save log to S3: {e}")

# def main():
#     client = connect_opcua()
#     idx = client.get_namespace_index(NAMESPACE_URI)
#     mqtt_client = connect_mqtt()
#     mqtt_client_ws = connect_mqtt_ws()

#     objects = client.get_objects_node()
#     system_metrics = objects.get_child([f"{idx}:SystemMetrics"])

#     variables = [
#         "CPU_Usage_Percent",
#         "Memory_Usage_Percent",
#         "Disk_Usage_Percent_Root",
#         "Swap_Usage_Percent",
#         "Net_Bytes_Sent",
#         "Net_Bytes_Recv",
#         "Uptime_Secs",
#         "Load_Avg_1m",
#         "Load_Avg_5m",
#         "Load_Avg_15m",
#         "Processes_Count",
#         "CPU_Temperature_C",
#     ]

#     payload_mapping = {
#         "CPU_Usage_Percent": "cpu_percent",
#         "Memory_Usage_Percent": "mem_percent",
#         "Disk_Usage_Percent_Root": "disk_percent_root",
#         "Swap_Usage_Percent": "swap_percent",
#         "Net_Bytes_Sent": "net_bytes_sent",
#         "Net_Bytes_Recv": "net_bytes_recv",
#         "Uptime_Secs": "uptime_secs",
#         "Load_Avg_1m": "load_1m",
#         "Load_Avg_5m": "load_5m",
#         "Load_Avg_15m": "load_15m",
#         "Processes_Count": "process_count",
#         "CPU_Temperature_C": "temp_c"
#     }

#     try:
#         while True:
#             try:
#                 values = {}
#                 for opc_var, payload_key in payload_mapping.items():
#                     node = system_metrics.get_child([f"{idx}:{opc_var}"])
#                     val = node.get_value()
#                     # Replace NaN with None for JSON compatibility
#                     if isinstance(val, float) and math.isnan(val):
#                         val = None
#                     values[payload_key] = val
                
#                 payload = {"device_id": DEVICE_ID, "timestamp": int(time.time() * 1000), **values}

#                 # publish to MQTT
#                 mqtt_client.publish(MQTT_TOPIC, json.dumps(payload, indent=2))
#                 print("Published:", payload)

#                 # --- Publish to WebSocket broker ---
#                 mqtt_client_ws.publish(WS_TOPIC, json.dumps(payload))
#                 print("📤 Published payload to AWS + WebSocket:", payload)

#                 # save to S3
#                 save_to_s3(payload)

#             except Exception as e:
#                 print(f"⚠️ Error: {e}")
#                 time.sleep(2)
#             time.sleep(5)  # every 5 seconds
#     except KeyboardInterrupt:
#         print("Stopped bridge.")
#     finally:
#         client.disconnect()
#         mqtt_client.disconnect()
#         mqtt_client_ws.disconnect()

# if __name__ == "__main__":
#     main()

















import math
import time
from opcua import Client
import paho.mqtt.client as mqtt
import json
from datetime import datetime
import boto3

# --- OPC UA Settings ---
OPC_ENDPOINT = "opc.tcp://localhost:4840/ua/metrics"
NAMESPACE_URI = "urn:example:opcua:metrics"

# --- MQTT Settings (AWS IoT) ---
MQTT_BROKER = "aky0hohdi2yni-ats.iot.us-east-1.amazonaws.com"
MQTT_PORT = 8883
MQTT_TOPIC = "opcua/metrics"
DEVICE_ID = "laptop-core-01"

# --- WebSocket Broker for React Dashboard ---
WS_BROKER = "test.mosquitto.org"  # hostname only
WS_PORT = 8081
WS_TOPIC = MQTT_TOPIC

# --- S3 Settings ---
S3_BUCKET = "harsh03bucket"
s3_client = boto3.client(
    "s3",
    aws_access_key_id="AKIAXYKJSJY6H7S2ICOM",
    aws_secret_access_key="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",
    region_name="us-east-1"
)

def connect_opcua():
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
    try:
        timestamp = datetime.utcnow().strftime("%Y-%m-%d_%H-%M-%S")
        s3_key = f"logs/{timestamp}.json"
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

                mqtt_client.publish(MQTT_TOPIC, json.dumps(payload, indent=2))
                mqtt_ws_client.publish(WS_TOPIC, json.dumps(payload))
                print("📤 Published payload to AWS + WS:", payload)

                save_to_s3(payload)
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
