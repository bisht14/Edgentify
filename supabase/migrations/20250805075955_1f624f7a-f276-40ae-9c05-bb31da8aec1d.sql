-- Create machine_logs table for real-time logging
CREATE TABLE public.machine_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id TEXT NOT NULL,
  device_name TEXT NOT NULL,
  log_level TEXT NOT NULL CHECK (log_level IN ('info', 'warning', 'error', 'critical')),
  message TEXT NOT NULL,
  component TEXT,
  temperature DECIMAL(5,2),
  pressure DECIMAL(8,2),
  vibration DECIMAL(6,3),
  status TEXT NOT NULL CHECK (status IN ('healthy', 'warning', 'critical', 'offline')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create edge_devices table for device management
CREATE TABLE public.edge_devices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  location TEXT NOT NULL,
  ip_address INET,
  firmware_version TEXT,
  status TEXT NOT NULL CHECK (status IN ('online', 'offline', 'maintenance', 'error')) DEFAULT 'offline',
  last_ping TIMESTAMP WITH TIME ZONE,
  battery_level INTEGER CHECK (battery_level >= 0 AND battery_level <= 100),
  signal_strength INTEGER CHECK (signal_strength >= 0 AND signal_strength <= 100),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.machine_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.edge_devices ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since this is an internal IoT platform)
CREATE POLICY "Allow public read access to machine_logs" 
ON public.machine_logs FOR SELECT USING (true);

CREATE POLICY "Allow public insert to machine_logs" 
ON public.machine_logs FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read access to edge_devices" 
ON public.edge_devices FOR SELECT USING (true);

CREATE POLICY "Allow public insert to edge_devices" 
ON public.edge_devices FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update to edge_devices" 
ON public.edge_devices FOR UPDATE USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_edge_devices_updated_at
BEFORE UPDATE ON public.edge_devices
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for both tables
ALTER TABLE public.machine_logs REPLICA IDENTITY FULL;
ALTER TABLE public.edge_devices REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.machine_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.edge_devices;

-- Insert sample data for machine logs
INSERT INTO public.machine_logs (device_id, device_name, log_level, message, component, temperature, pressure, vibration, status) VALUES
('IOT-001', 'Temperature Sensor A1', 'info', 'Temperature reading within normal range', 'Temperature Sensor', 23.5, NULL, NULL, 'healthy'),
('IOT-002', 'Smart Gateway B2', 'info', 'Data transmission successful', 'Network Module', NULL, NULL, NULL, 'healthy'),
('IOT-003', 'Vibration Monitor C1', 'warning', 'Vibration levels elevated', 'Vibration Sensor', NULL, NULL, 4.2, 'warning'),
('IOT-004', 'Air Quality Sensor D1', 'error', 'Communication timeout', 'Communication Module', NULL, NULL, NULL, 'critical'),
('IOT-001', 'Temperature Sensor A1', 'warning', 'Temperature approaching upper threshold', 'Temperature Sensor', 26.8, NULL, NULL, 'warning');

-- Insert sample data for edge devices
INSERT INTO public.edge_devices (device_id, name, type, location, ip_address, firmware_version, status, last_ping, battery_level, signal_strength) VALUES
('IOT-001', 'Temperature Sensor A1', 'Environmental Sensor', 'Building A - Floor 3', '192.168.1.101', 'v2.1.3', 'online', now() - interval '2 minutes', 87, 92),
('IOT-002', 'Smart Gateway B2', 'Edge Gateway', 'Building B - Server Room', '192.168.1.102', 'v3.0.1', 'online', now() - interval '30 seconds', NULL, 78),
('IOT-003', 'Vibration Monitor C1', 'Industrial Sensor', 'Factory Floor - Machine #7', '192.168.1.103', 'v1.8.4', 'online', now() - interval '5 minutes', 23, 45),
('IOT-004', 'Air Quality Sensor D1', 'Environmental Sensor', 'Building D - HVAC Room', '192.168.1.104', 'v2.0.7', 'offline', now() - interval '2 hours', 0, 0),
('IOT-005', 'Pressure Monitor E1', 'Industrial Sensor', 'Factory Floor - Pipeline A', '192.168.1.105', 'v1.9.2', 'online', now() - interval '1 minute', 65, 88);