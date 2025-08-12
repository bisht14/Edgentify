import { useEffect } from "react";
import mqtt from "mqtt";
import { CognitoIdentityClient, GetIdCommand, GetCredentialsForIdentityCommand } from "@aws-sdk/client-cognito-identity";
import { SignatureV4 } from "@aws-sdk/signature-v4";
import { Sha256 } from "@aws-crypto/sha256-js";
import { HttpRequest } from "@aws-sdk/protocol-http";

type OnMessage = (payload: any) => void;

export async function makePresignedUrl(iotEndpoint: string, region: string, creds: any) {
  const signer = new SignatureV4({
    credentials: {
      accessKeyId: creds.AccessKeyId,
      secretAccessKey: creds.SecretKey,
      sessionToken: creds.SessionToken
    },
    service: "iotdevicegateway",
    region,
    sha256: Sha256
  });

  const request = new HttpRequest({
    protocol: "wss:",
    hostname: iotEndpoint,
    method: "GET",
    path: "/mqtt",
    headers: {
      host: iotEndpoint
    }
  });

  const signed = await signer.presign(request, { expiresIn: 15 });
  // signature-v4 returns object with path + query in "signed"
  // Build full URL:
  const query = new URLSearchParams(signed.query || signed.headers || {});
  // SignatureV4.presign attaches query parameters to signed.headers under `...` depending on implementation
  // Safest approach: recompose from signed
  const queryString = Object.entries(signed.query || {}).map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join("&");
  const url = `wss://${iotEndpoint}/mqtt?${queryString}`;
  return url;
}

export function useMqtt(onMessage: OnMessage) {
  useEffect(() => {
    let client: mqtt.MqttClient | null = null;
    const connect = async () => {
      const REGION = "us-east-1"; // <-- set your region
      const IDENTITY_POOL_ID = "us-east-1:a0c877b0-81e3-4b76-804b-076edcbb447d"; // <-- set your Cognito Identity Pool id
      const IOT_ENDPOINT = "aky0hohdi2yni-ats.iot.us-east-1.amazonaws.com"; // <-- set your IoT endpoint (no protocol)

      const cognito = new CognitoIdentityClient({ region: REGION });
      const idResp = await cognito.send(new GetIdCommand({ IdentityPoolId: IDENTITY_POOL_ID }));
      const credsResp = await cognito.send(new GetCredentialsForIdentityCommand({ IdentityId: idResp.IdentityId! }));
      const credentials = credsResp.Credentials as any;

      // Create a presigned websocket URL (Signature V4)
      const url = await makePresignedUrl(IOT_ENDPOINT, REGION, {
        AccessKeyId: credentials.AccessKeyId,
        SecretKey: credentials.SecretKey,
        SessionToken: credentials.SessionToken
      });

      client = mqtt.connect(url, {
        protocol: "wss",
        keepalive: 30,
        reconnectPeriod: 3000
      });

      client.on("connect", () => {
        console.log("MQTT connected");
        client!.subscribe("iot/device/data", { qos: 0 }, (err) => {
          if (err) console.error("subscribe error", err);
        });
      });

      client.on("message", (topic, message) => {
        try {
          const parsed = JSON.parse(message.toString());
          onMessage(parsed);
        } catch (e) {
          console.error("mqtt parse error", e);
        }
      });

      client.on("error", (err) => {
        console.error("MQTT error:", err);
      });
    };

    connect();

    return () => {
      if (client) client.end(true);
    };
  }, [onMessage]);
}
