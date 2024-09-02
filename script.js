// Configuration Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCSSoY4D_UfGpc-EXAStXNDVXPtpPwwARw",
    authDomain: "live-chat-00.firebaseapp.com",
    projectId: "live-chat-00",
    storageBucket: "live-chat-00.appspot.com",
    messagingSenderId: "825591531103",
    appId: "1:825591531103:web:cdf9df57460d5daa5cfdea",
    measurementId: "G-36TSWRPZEQ"
};

// Initialisation de Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

document.getElementById('join-chat').addEventListener('click', function() {
    const username = document.getElementById('username').value.trim();
    if (username) {
        document.getElementById('user-info').classList.add('hidden');
        document.getElementById('chat-box').classList.remove('hidden');
        document.getElementById('messages').innerHTML += `<div class="message"><strong>${username}</strong> a rejoint le chat.</div>`;

        // Écoute des nouveaux messages
        database.ref('messages').on('child_added', function(snapshot) {
            const messageData = snapshot.val();
            document.getElementById('messages').innerHTML += `<div class="message"><strong>${messageData.username}:</strong> ${messageData.message}</div>`;
            scrollToBottom();
        });
    } else {
        alert("Veuillez entrer un nom d'utilisateur.");
    }
});

document.getElementById('send-message').addEventListener('click', function() {
    const messageInput = document.getElementById('message-input');
    const message = messageInput.value.trim();
    const username = document.getElementById('username').value;

    if (message) {
        // Envoie du message à Firebase
        database.ref('messages').push({
            username: username,
            message: message
        });
        messageInput.value = '';
        scrollToBottom();
    }
});

function scrollToBottom() {
    const messages = document.getElementById('messages');
    messages.scrollTop = messages.scrollHeight;
}
