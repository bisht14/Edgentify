
#!/usr/bin/env python3
"""
OPC UA Metrics Server

Exposes system metrics (CPU, memory, disk, network, uptime, load avg) as OPC UA variables.
Tested with python-opcua >= 1.3.3 and psutil >= 5.9.

Run:
  python opcua_metrics_server.py --endpoint opc.tcp://0.0.0.0:4840/ua/metrics --name LaptopMetricsServer --interval 5

Browse path (QualifiedName):
  Objects → <ns=your_idx>:SystemMetrics → variables

Security: by default runs without encryption for local testing. See the
`enable_security()` function for how to add basic encryption & auth.
"""
from __future__ import annotations

import argparse
import signal
import sys
import time
from datetime import datetime, timedelta
from typing import Optional

import psutil
from opcua import Server, ua


class MetricsServer:
    def __init__(
        self,
        endpoint: str = "opc.tcp://0.0.0.0:4840/ua/metrics",
        server_name: str = "LaptopMetricsServer",
        namespace_uri: str = "urn:example:opcua:metrics",
        update_interval: int = 5,
    ) -> None:
        self.endpoint = endpoint
        self.server_name = server_name
        self.namespace_uri = namespace_uri
        self.update_interval = max(1, int(update_interval))

        self.server: Optional[Server] = None
        self.idx: Optional[int] = None

        # Variable handles filled at setup time
        self.vars = {}
        self._start_time = datetime.utcnow()

    def setup(self) -> None:
        server = Server()
        server.set_endpoint(self.endpoint)
        server.set_server_name(self.server_name)

        # Register our namespace
        idx = server.register_namespace(self.namespace_uri)

        # Root object for our metrics
        metrics_obj = server.nodes.objects.add_object(idx, "SystemMetrics")

        # Commonly-used metrics
        self.vars["cpu_percent"] = metrics_obj.add_variable(idx, "CPU_Usage_Percent", 0.0, varianttype=ua.VariantType.Double)
        self.vars["mem_percent"] = metrics_obj.add_variable(idx, "Memory_Usage_Percent", 0.0, varianttype=ua.VariantType.Double)
        self.vars["disk_percent_root"] = metrics_obj.add_variable(idx, "Disk_Usage_Percent_Root", 0.0, varianttype=ua.VariantType.Double)
        self.vars["swap_percent"] = metrics_obj.add_variable(idx, "Swap_Usage_Percent", 0.0, varianttype=ua.VariantType.Double)

        # Network counters (cumulative)
        self.vars["net_bytes_sent"] = metrics_obj.add_variable(idx, "Net_Bytes_Sent", 0, varianttype=ua.VariantType.UInt64)
        self.vars["net_bytes_recv"] = metrics_obj.add_variable(idx, "Net_Bytes_Recv", 0, varianttype=ua.VariantType.UInt64)

        # Uptime and load average
        self.vars["uptime_secs"] = metrics_obj.add_variable(idx, "Uptime_Secs", 0, varianttype=ua.VariantType.UInt64)
        self.vars["load_1m"] = metrics_obj.add_variable(idx, "Load_Avg_1m", 0.0, varianttype=ua.VariantType.Double)
        self.vars["load_5m"] = metrics_obj.add_variable(idx, "Load_Avg_5m", 0.0, varianttype=ua.VariantType.Double)
        self.vars["load_15m"] = metrics_obj.add_variable(idx, "Load_Avg_15m", 0.0, varianttype=ua.VariantType.Double)

        # Process count
        self.vars["process_count"] = metrics_obj.add_variable(idx, "Processes_Count", 0, varianttype=ua.VariantType.UInt32)

        # Optional temperature (may not exist on all laptops/WSL)
        self.vars["temp_c"] = metrics_obj.add_variable(idx, "CPU_Temperature_C", float("nan"), varianttype=ua.VariantType.Double)

        # Make variables read-only to clients (server updates them)
        for v in self.vars.values():
            v.set_writable(False)

        self.server = server
        self.idx = idx

    def enable_security(self, cert_path: str, key_path: str, username: Optional[str] = None, password: Optional[str] = None) -> None:
        """Optional: enable basic security. Provide paths to PEM certificate and private key.
        To enforce username/password, pass both username and password.
        """
        assert self.server is not None
        # Load cert & key
        self.server.load_certificate(cert_path)
        self.server.load_private_key(key_path)
        # Allow basic secure policies; adjust as needed
        self.server.set_security_policy([
            ua.SecurityPolicyType.Basic256Sha256_SignAndEncrypt,
            ua.SecurityPolicyType.Basic256Sha256_Sign,
            ua.SecurityPolicyType.NoSecurity,  # keep for local testing if desired
        ])
        if username and password:
            # Very simple user manager — replace for production if needed
            class UserManager:
                def __init__(self, user, pwd):
                    self.user = user
                    self.pwd = pwd

                def get_user(self, iserver, username_, password_):
                    if username_ == self.user and password_ == self.pwd:
                        return ua.UserNameIdentityToken()
                    return None

            self.server.user_manager.set_user_manager(UserManager(username, password).get_user)

    def _collect_metrics(self) -> dict:
        # CPU and memory
        cpu_percent = psutil.cpu_percent(interval=None)
        vm = psutil.virtual_memory()
        mem_percent = float(vm.percent)

        # Disk usage for root filesystem
        try:
            disk_percent_root = float(psutil.disk_usage("/").percent)
        except Exception:
            disk_percent_root = float("nan")

        # Swap
        swap = psutil.swap_memory()
        swap_percent = float(swap.percent)

        # Network I/O (cumulative since boot)
        net = psutil.net_io_counters()
        net_bytes_sent = int(net.bytes_sent)
        net_bytes_recv = int(net.bytes_recv)

        # Uptime
        boot_time = datetime.utcfromtimestamp(psutil.boot_time())
        uptime = int((datetime.utcnow() - boot_time).total_seconds())

        # Load average (not available on Windows; WSL exposes it)
        try:
            load1, load5, load15 = psutil.getloadavg()
        except (AttributeError, OSError):
            load1 = load5 = load15 = float("nan")

        # Processes count
        try:
            process_count = len(psutil.pids())
        except Exception:
            process_count = 0

        # Temperature (may be missing)
        temp_c = float("nan")
        try:
            temps = psutil.sensors_temperatures()
            # Try common keys; pick first available reading
            for key in ("coretemp", "acpitz", "k10temp", "cpu-thermal"):
                if key in temps and temps[key]:
                    temp_c = float(temps[key][0].current)
                    break
        except Exception:
            pass

        return {
            "cpu_percent": float(cpu_percent),
            "mem_percent": mem_percent,
            "disk_percent_root": disk_percent_root,
            "swap_percent": swap_percent,
            "net_bytes_sent": net_bytes_sent,
            "net_bytes_recv": net_bytes_recv,
            "uptime_secs": uptime,
            "load_1m": float(load1),
            "load_5m": float(load5),
            "load_15m": float(load15),
            "process_count": int(process_count),
            "temp_c": temp_c,
        }

    def start(self) -> None:
        assert self.server is not None
        self.server.start()
        print(f"OPC UA Metrics Server started: {self.endpoint}")
        print(f"Namespace: {self.namespace_uri}")
        print("Press Ctrl+C to stop.")

        running = True

        def handle_stop(signum, frame):
            nonlocal running
            print("\nStopping...")
            running = False

        signal.signal(signal.SIGINT, handle_stop)
        signal.signal(signal.SIGTERM, handle_stop)

        try:
            while running:
                data = self._collect_metrics()
                # Update variables
                for key, value in data.items():
                    self.vars[key].set_value(value)
                time.sleep(self.update_interval)
        finally:
            self.server.stop()
            print("Server stopped.")


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="OPC UA server exposing system metrics")
    p.add_argument("--endpoint", default="opc.tcp://0.0.0.0:4840/ua/metrics", help="Endpoint URL to bind")
    p.add_argument("--name", default="LaptopMetricsServer", help="Server name")
    p.add_argument("--ns", dest="namespace_uri", default="urn:example:opcua:metrics", help="Custom namespace URI")
    p.add_argument("--interval", type=int, default=5, help="Update interval seconds (>=1)")
    # Security (optional)
    p.add_argument("--cert", help="Path to server certificate (PEM)")
    p.add_argument("--key", help="Path to server private key (PEM)")
    p.add_argument("--user", help="Username to allow (optional)")
    p.add_argument("--password", help="Password for username (optional)")
    return p.parse_args()


def main() -> None:
    args = parse_args()
    ms = MetricsServer(
        endpoint=args.endpoint,
        server_name=args.name,
        namespace_uri=args.namespace_uri,
        update_interval=args.interval,
    )
    ms.setup()

    if args.cert and args.key:
        ms.enable_security(args.cert, args.key, args.user, args.password)

    ms.start()


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"Fatal error: {e}")
        sys.exit(1)
