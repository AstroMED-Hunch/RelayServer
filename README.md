# RelayServer

A WebSocket-based relay server that facilitates real-time communication between a kiosk and a backend application. The server acts as a message broker, routing signals and messages between connected clients.

## Project Overview

RelayServer is built with Node.js and Express, providing a WebSocket server that enables bidirectional communication between:
- **Kiosk**: A client that sends box registration requests and receives status updates
- **App**: A backend application that manages system state and sends commands to the kiosk

The server uses a signal-based messaging system to handle various events including:
- System status updates
- Box registration and location tracking
- Face recognition updates
- Box entry and exit confirmations

## Prerequisites

- **Node.js** (v14 or higher)
- **npm** (Node Package Manager)

## Installation

1. Clone or download the repository:
```bash
cd /Users/marcostulic/WebstormProjects/RelayServer
```

2. Install dependencies:
```bash
npm install
```

This will install the following packages:
- `express`: Web framework for serving static files
- `signaljs`: Signal dispatching library
- `signals`: Signal event system
- `socketio`: Socket.IO library (included in dependencies)
- `ws`: WebSocket library

## Configuration

The server runs on port `3000` by default. You can customize the port by setting the `PORT` environment variable:

```bash
export PORT=8080
```

## Running the Server

Start the server with:

```bash
node main.js
```

You should see output like:
```
Server is running on port 3000
```

## How It Works

### WebSocket Connections
The server accepts WebSocket connections and identifies clients as either a "kiosk" or "app" based on the messages they send.

### Message Flow

1. **Kiosk Connection**: When a kiosk connects, it sends a `kioskConnected` message
2. **App Messages**: The app sends various message types (status updates, box operations, etc.)
3. **Signal Routing**: The server dispatches messages to the appropriate recipient (kiosk or app)

### Supported Message Types

**From App to Kiosk:**
- `statusUpdate`: System status changes
- `boxEnterConfirmation`: Confirmation when a box enters the shelf
- `boxEnterCancel`: Cancellation of box entry
- `boxLocation`: Box location information
- `boxUpdate`: Updates to box data
- `faceRecognitionUpdate`: Face recognition events

**From Kiosk to App:**
- `kioskConnected`: Initial kiosk connection signal

## Development

The main server logic is contained in `main.js`. The server:
- Creates an HTTP server with Express
- Attaches a WebSocket server to handle connections
- Maintains a signal dispatcher for message routing
- Logs all connections, disconnections, and message types for debugging

## Troubleshooting

- **Connection Refused**: Make sure the server is running and listening on the correct port
- **Invalid JSON**: The server will log an error if it receives malformed JSON; check your client code
- **Messages Not Received**: Verify that you're using the correct recipient field in your message routing logic
