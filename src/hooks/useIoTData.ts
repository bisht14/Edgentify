import { useEffect, useState } from "react";
import mqtt from "mqtt";
import {
  fromCognitoIdentityPool
} from "@aws-sdk/credential-providers";
import { CognitoIdentityClient } from "@aws-sdk/client-cognito-identity";
import { Sha256 } from "@aws-crypto/sha256-js";
import { SignatureV4 } from "@aws-sdk/signature-v4";
import { HttpRequest } from "@aws-sdk/protocol-http";

interface LogEntry {
  timestamp: number;
  temperature: number;
  pressure: number;
  vibration: number;
  status: string;
}

export default function useIoTData() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [latestLog, setLatestLog] = useState<LogEntry | null>(null);

  useEffect(() => {
    const REGION = "us-east-1";
    const IOT_ENDPOINT = "aky0hohdi2yni-ats.iot.us-east-1.amazonaws.com"; // Change to your AWS IoT endpoint host (no wss://)
    const COGNITO_POOL_ID = "us-east-1:a0c877b0-81e3-4b76-804b-076edcbb447d";

    async function connectMqtt() {
      // 1️⃣ Get temporary AWS credentials
      const credentials = await fromCognitoIdentityPool({
        client: new CognitoIdentityClient({ region: REGION }),
        identityPoolId: COGNITO_POOL_ID,
      })();

      // 2️⃣ Sign the WebSocket URL with SigV4
      const signer = new SignatureV4({
        credentials,
        region: REGION,
        service: "iotdevicegateway",
        sha256: Sha256,
      });

      const request = new HttpRequest({
        protocol: "wss:",
        hostname: IOT_ENDPOINT,
        method: "GET",
        path: "/mqtt",
        headers: {},
      });

      const signed = await signer.presign(request);

      // 3️⃣ Convert signed URL into string
      const queryParams = new URLSearchParams(signed.query as any).toString();
      const url = `${signed.protocol}//${signed.hostname}${signed.path}?${queryParams}`;

      // 4️⃣ Connect to MQTT
      const clientId = "mqtt_" + Math.random().toString(16).substr(2, 8);
      const client = mqtt.connect(url, { clientId });

      client.on("connect", () => {
        console.log("✅ Connected to AWS IoT");
        client.subscribe("iot/device/data"); // Change topic if needed
      });

      client.on("message", (_topic, message) => {
        try {
          const payload = JSON.parse(message.toString());
          const newLog: LogEntry = {
            timestamp: payload.timestamp,
            temperature: parseFloat(payload.temperature),
            pressure: parseFloat(payload.pressure),
            vibration: parseFloat(payload.vibration),
            status: payload.status,
          };
          setLogs((prev) => [...prev.slice(-19), newLog]);
          setLatestLog(newLog);
        } catch (err) {
          console.error("❌ MQTT message parse error:", err);
        }
      });

      client.on("error", (err) => {
        console.error("❌ MQTT Error:", err);
      });
    }

    connectMqtt();
  }, []);

  return { logs, latestLog };
}
