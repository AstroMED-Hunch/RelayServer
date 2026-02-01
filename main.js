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

app.use(express.static(path.join(__dirname, 'src')));

function changeSystemStatus(newStatus) {
    systemStatus = newStatus;
    console.log(`system status changed to: ${systemStatus}`);
    submitMsgToApp.dispatch('statusUpdate', systemStatus, "kiosk");
}

wsApplication.on('connection', (socket) => {
    let isKiosk = false;
    console.log('connected');

    socket.on('disconnect', () => {
        console.log('disconnected');
    });

    socket.on('message', (data) => {
        const dataJson = JSON.parse(data);
        if (dataJson.type === 'statusUpdate') {
            if (isKiosk) return; // not for kiosk

            systemStatus = dataJson.status;
            console.log(`new status from app ${systemStatus}`);
            changeSystemStatus(systemStatus);
        }
        else if (dataJson.type === 'kioskConnected') {
            console.log('kiosk connected');
            isKiosk = true;
        }
        else if (dataJson.type === 'boxEntered') {
            if (isKiosk) return; // not for kiosk
            console.log('box entered shelf reported by app');
            submitMsgToApp.dispatch('boxEnterConfirmation', null, "kiosk"); // forward to kiosks
        }
        else if (dataJson.type === 'boxExited') {
            if (isKiosk) return;
            console.log('box exit confirmation response from app');
            submitMsgToApp.dispatch('boxEnterCancel', dataJson.response, "kiosk"); // forward to kiosks
        }
        else if (dataJson.type === 'registerBox') {
            if (!isKiosk) return;
            console.log('box registration request from kiosk');
            submitMsgToApp.dispatch('registerBox', null, "app");
        }
    });

    submitMsgToApp.add((type, msg, recipient) => {
        if (recipient == "kiosk" && !isKiosk) return;
        if (recipient == "app" && isKiosk) return;
        socket.send(JSON.stringify({ type: type, message: msg }));
    });

    socket.on('close', () => {
        console.log('socket closed - removing signal binding');
        socket.close();
    });
});

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'src', 'index.html'));
});