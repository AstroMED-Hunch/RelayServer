const express = require('express');
const ws = require('ws');
const http = require('http');
const path = require('path');
const {Signal} = require('signals');

const app = express();
const server = http.createServer(app);
const wsApplication = new ws.Server({server});

const PORT = process.env.PORT || 3000;

const submitMsgToApp = new Signal();

let systemStatus = "idle";

function changeSystemStatus(newStatus) {
    systemStatus = newStatus;
    console.log(`system status changed to: ${systemStatus}`);

    submitMsgToApp.dispatch({type: 'statusUpdate', message: systemStatus}, "kiosk");
}

wsApplication.on('connection', (socket) => {
    let isKiosk = false;
    console.log('connected');
    const signalListener = (payload, recipient) => {
        if (recipient === "kiosk" && !isKiosk) return;
        if (recipient === "app" && isKiosk) return;

        if (socket.readyState === ws.OPEN) {
            socket.send(JSON.stringify(payload));
        }
    };

    submitMsgToApp.add(signalListener);

    socket.on('message', (data) => {
        try {
            const dataJson = JSON.parse(data);
            const {type} = dataJson;

            if (type === 'kioskConnected') {
                console.log('kiosk connected');
                isKiosk = true;
                return;
            }

            if (isKiosk) {
                console.log(`message from kiosk: ${type}`);
                submitMsgToApp.dispatch(dataJson, "app");
            } else {
                switch (type) {
                    case 'statusUpdate':
                        systemStatus = dataJson.status;
                        console.log(`new status from app ${systemStatus}`);
                        changeSystemStatus(systemStatus);
                        break;
                    case 'boxEntered':
                        console.log('box entered shelf reported by app');
                        submitMsgToApp.dispatch({type: 'boxEntered', message: dataJson.message}, "kiosk");
                        break;
                    case 'boxExited':
                        console.log('box exit confirmation response from app');
                        submitMsgToApp.dispatch({type: 'boxExited', message: dataJson.message}, "kiosk");
                        break;
                    case 'boxLocation':
                        console.log('box location from app');
                        submitMsgToApp.dispatch({
                            type: 'boxLocation',
                            message: dataJson.msg,
                            pills: dataJson.pills
                        }, "kiosk");
                        break;
                    case 'boxUpdate':
                        console.log('box update from app');
                        submitMsgToApp.dispatch({type: 'boxUpdate', message: dataJson.box_code_id}, "kiosk");
                        break;
                    case "faceRecognitionUpdate":
                        console.log('face recognition update from app');
                        submitMsgToApp.dispatch({type: 'faceRecognitionUpdate', message: dataJson.message}, "kiosk");
                        break;
                    case "pillScanResult":
                        console.log('pill scan result from app');
                        submitMsgToApp.dispatch({type: 'pillScanResult', pills: dataJson.pills}, "kiosk");
                        break;
                    default:
                        console.log(`Unhandled message type from app: ${type}`);
                        break;
                }
            }
        } catch (e) {
            console.error("Invalid JSON received or error processing message:", e);
        }
    });

    socket.on('close', () => {
        console.log('socket closed - removing signal binding');
        submitMsgToApp.remove(signalListener);
    });

    socket.on('error', (err) => {
        console.error("WebSocket error:", err);
    });
});

app.use(express.static(path.join(__dirname, 'public')));

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});