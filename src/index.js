const socket = new WebSocket('ws://' + window.location.host);
let systemStatus = "idle";

const confirmYesButton = document.getElementById('boxEnterConfirmationDiagBtnYes');
const confirmNoButton = document.getElementById('boxEnterConfirmationDiagBtnNo');
const diag = document.getElementById('boxEnterConfirmationDiag');
const multiBoxDiag = document.getElementById('multiBoxWarningDiag');

let messageBoxVisiblity = false;

function updateMsgBoxVisibility() {
    diag.style.display = (messageBoxVisiblity && systemStatus == 'idle') ? 'block' : 'none';
}

function showStatusDialog() {
    if (systemStatus == 'multiple_boxes') {
        multiBoxDiag.style.display = 'block';
    } else {
        multiBoxDiag.style.display = 'none';
    }
    
}

confirmYesButton.addEventListener('click', () => {
    socket.send(JSON.stringify({ type: 'registerBox' }));
});

updateMsgBoxVisibility();
showStatusDialog();

socket.addEventListener('open', function (event) {
    console.log('kiosk is connected to server');
    socket.send(JSON.stringify({ type: 'kioskConnected'}));
});

socket.addEventListener('message', function (event) {
    const dataJson = JSON.parse(event.data);
    if (dataJson.type === 'statusUpdate') {
        systemStatus = dataJson.message;
        console.log(`kiosk new status: ${systemStatus}`);
        updateMsgBoxVisibility();
        showStatusDialog();

    }
    else if (dataJson.type === 'boxEnterConfirmation') {
        messageBoxVisiblity = true;
        updateMsgBoxVisibility();
    }
    else if (dataJson.type === 'boxEnterCancel') {
        messageBoxVisiblity = false;
        updateMsgBoxVisibility();
    }
});