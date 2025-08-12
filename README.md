# Edgentify

**Edgentify** is a custom-built IoT monitoring dashboard that displays sensor data from AWS IoT in real time. It combines live MQTT updates with historical records, presenting them in interactive charts and highlighting critical events as they happen. Designed for engineers and developers, it streamlines device tracking and analysis.

---

## Table of Contents
- [About the Project]
- [Main Features]
- [Preview]
- [Setup Guide]
  - [Requirements]
  - [Installation]
- [How It Works]
- [Tech Stack]
- [Contributing]
- [License]

---

## About the Project
Edgentify was created to make IoT data easier to understand and act on.  
With this tool, you can:
- Stream **real-time device readings** through AWS IoT Core.
- Load **past sensor logs** from an AWS API.
- Automatically flag and display **alerts** for unusual conditions.
- View everything in a responsive, modern web interface.

---

## Main Features
- **Historical Data Access** – Pull and review recent logs for temperature, pressure, and vibration.
- **Live Data Feed** – Get instant updates from devices via MQTT over WebSocket.
- **Automatic Alerts** – Warnings appear for threshold breaches (e.g., temperature above 50°C) or error statuses.
- **Interactive Graphs** – Line charts that adapt to screen size and support tooltips.
- **Color-Coded Logs** – Quickly identify normal vs. critical entries.
- **Cross-Device Friendly** – Works on desktops, tablets, and mobile devices.

---




## Setup Guide

### Requirements
Before starting, ensure you have:
- **Node.js** (v16 or later) with npm or yarn.
- An AWS IoT configuration that includes:
  - MQTT endpoint
  - API Gateway endpoint for fetching logs
- Proper AWS IAM permissions for connecting to the MQTT topic and API.

### Installation
```bash
# Clone the repository
git clone https://github.com/bisht14/Edgentify.git
cd Edgentify

# Install dependencies
npm install   # or yarn install

# (Optional) Add a .env file for your AWS IoT and API details

# Run in development mode
npm run dev

# Build for production
npm run build

