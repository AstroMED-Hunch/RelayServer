const socket = new WebSocket(`ws://${window.location.host}`);
let systemStatus = "idle";
let messageBoxVisibility = false;

// elements
const confirmYesButton = document.getElementById('boxEnterConfirmationDiagBtnYes');
const confirmNoButton = document.getElementById('boxEnterConfirmationDiagBtnNo');
const diag = document.getElementById('boxEnterConfirmationDiag');
const multiBoxDiag = document.getElementById('multiBoxWarningDiag');
const boxLocationDiag = document.getElementById('boxLocationDiag');
const boxLocationDiagText = document.getElementById('boxLocationDiagText');
const boxLocationDiagBtnClose = document.getElementById('boxLocationDiagBtnClose');


function showBoxLocation(location) {
    boxLocationDiagText.textContent = `Box location: ${location}`;
    boxLocationDiag.style.display = 'block';
}

function updateMsgBoxVisibility() {
    diag.style.display = (messageBoxVisibility && systemStatus === 'idle') ? 'block' : 'none';
}

function showStatusDialog() {
    multiBoxDiag.style.display = (systemStatus === 'multiple_boxes') ? 'block' : 'none';
}


function sendMessage(type, payload = {}) {
    if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type, ...payload }));
    } else {
        console.warn(`Cannot send message "${type}", WebSocket is not open.`);
    }
}


boxLocationDiagBtnClose.addEventListener('click', () => {
    boxLocationDiag.style.display = 'none';
});

confirmYesButton.addEventListener('click', () => {
    sendMessage('registerBox');
    messageBoxVisibility = false;
    updateMsgBoxVisibility();
});

confirmNoButton.addEventListener('click', () => {
    messageBoxVisibility = false;
    updateMsgBoxVisibility();
});

const messageHandlers = {
    statusUpdate: (dataJson) => {
        systemStatus = dataJson.message;
        console.log(`Kiosk new status: ${systemStatus}`);
        updateMsgBoxVisibility();
        showStatusDialog();
    },
    boxEnterConfirmation: () => {
        messageBoxVisibility = true;
        updateMsgBoxVisibility();
    },
    boxEnterCancel: () => {
        messageBoxVisibility = false;
        updateMsgBoxVisibility();
    },
    boxLocation: (dataJson) => {
        showBoxLocation(dataJson.message);
        console.log(`Box location received from app: ${dataJson.message}`);
    }
};

socket.addEventListener('open', () => {
    console.log('Kiosk is connected to server');
    sendMessage('kioskConnected');
});

socket.addEventListener('message', (event) => {
    try {
        const dataJson = JSON.parse(event.data);
        const handler = messageHandlers[dataJson.type];

        if (handler) {
            handler(dataJson);
        } else {
            console.warn(`Unknown message type received: ${dataJson.type}`);
        }
    } catch (error) {
        console.error("Failed to parse incoming WebSocket message:", error);
    }
});

boxLocationDiag.style.display = 'none';
updateMsgBoxVisibility();
showStatusDialog();