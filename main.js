const express = require('express');
const ws = require('ws');
const http = require('http');
const path = require('path');
const {Signal} = require('signals');

const app = express();
const server = http.createServer(app);
const wsApplication = new ws.Server({ server });

const PORT = process.env.PORT || 3000;

const submitMsgToApp = new Signal();

let systemStatus = "idle";

function changeSystemStatus(newStatus) {
    systemStatus = newStatus;
    console.log(`system status changed to: ${systemStatus}`);
    submitMsgToApp.dispatch('statusUpdate', systemStatus, "kiosk");
}

wsApplication.on('connection', (socket) => {
    let isKiosk = false;
    console.log('connected');

    const signalListener = (type, msg, recipient) => {
        if (recipient === "kiosk" && !isKiosk) return;
        if (recipient === "app" && isKiosk) return;

        if (socket.readyState === ws.OPEN) {
            socket.send(JSON.stringify({ type: type, message: msg }));
        }
    };

    submitMsgToApp.add(signalListener);

    socket.on('message', (data) => {
        try {
            const dataJson = JSON.parse(data);
            const { type } = dataJson;

            if (type === 'kioskConnected') {
                console.log('kiosk connected');
                isKiosk = true;
                return;
            }

            if (isKiosk) {
                if (type === 'registerBox') {
                    console.log('box registration request from kiosk');
                    submitMsgToApp.dispatch('registerBox', null, "app");
                }
            } else {
                switch (type) {
                    case 'statusUpdate':
                        systemStatus = dataJson.status;
                        console.log(`new status from app ${systemStatus}`);
                        changeSystemStatus(systemStatus);
                        break;
                    case 'boxEntered':
                        console.log('box entered shelf reported by app');
                        submitMsgToApp.dispatch('boxEnterConfirmation', dataJson.message, "kiosk");
                        break;
                    case 'boxExited':
                        console.log('box exit confirmation response from app');
                        submitMsgToApp.dispatch('boxEnterCancel', dataJson.response, "kiosk");
                        break;
                    case 'boxLocation':
                        console.log('box location from app');
                        submitMsgToApp.dispatch('boxLocation', dataJson.msg, "kiosk"); // TODO: fix our message consistency
                        break;
                    case 'boxUpdate':
                        console.log('box update from app');
                        submitMsgToApp.dispatch('boxUpdate', dataJson.message, "kiosk");
                        break;
                    case "faceRecognitionUpdate":
                        console.log('face recognition update from app');
                        submitMsgToApp.dispatch('faceRecognitionUpdate', dataJson.message, "kiosk");
                        break;
                }
            }
        } catch (e) {
            console.error("Invalid JSON received");
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