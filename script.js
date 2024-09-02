import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getDatabase, ref, push, onChildAdded } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-database.js";

// Configuration Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCSSoY4D_UfGpc-EXAStXNDVXPtpPwwARw",
  authDomain: "live-chat-00.firebaseapp.com",
  projectId: "live-chat-00",
  storageBucket: "live-chat-00.appspot.com",
  messagingSenderId: "825591531103",
  appId: "1:825591531103:web:cdf9df57460d5daa5cfdea",
  measurementId: "G-36TSWRPZEQ",
  databaseURL: "https://live-chat-00-default-rtdb.firebaseio.com/"
};

// Initialisation de Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

document.getElementById('join-chat').addEventListener('click', function() {
    const username = document.getElementById('username').value.trim();
    if (username) {
        document.getElementById('user-info').classList.add('hidden');
        document.getElementById('chat-box').classList.remove('hidden');

        // Écoute des nouveaux messages
        const messagesRef = ref(database, 'messages');
        onChildAdded(messagesRef, function(snapshot) {
            const messageData = snapshot.val();
            const messageElement = document.createElement('div');
            messageElement.className = 'message';
            messageElement.innerHTML = `<strong>${messageData.username}:</strong> ${messageData.message}`;
            document.getElementById('messages').appendChild(messageElement);
            scrollToBottom();
        });

        // Notification d'entrée dans le chat
        document.getElementById('messages').innerHTML += `<div class="message"><strong>${username}</strong> a rejoint le chat.</div>`;
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
        const messagesRef = ref(database, 'messages');
        push(messagesRef, {
            username: username,
            message: message
        });
        messageInput.value = '';
    }
});

function scrollToBottom() {
    const messages = document.getElementById('messages');
    messages.scrollTop = messages.scrollHeight;
}