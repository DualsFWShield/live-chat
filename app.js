import { EmojiButton } from 'https://cdn.jsdelivr.net/npm/@joeattardi/emoji-button@4.6.2/dist/index.min.js';

// ====== Configuration Firebase ====== //
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    databaseURL: "YOUR_DATABASE_URL",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID",
    measurementId: "YOUR_MEASUREMENT_ID"
};

// Initialiser Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();
const storage = firebase.storage();

// ====== Authentification Anonyme ====== //
auth.signInAnonymously()
    .catch(error => {
        console.error("Erreur d'authentification :", error);
    });

// ====== Références Firebase ====== //
const messagesRef = db.ref('messages');
const presenceRef = db.ref('presence');

// ====== Gestion de la Présence des Utilisateurs ====== //
auth.onAuthStateChanged(user => {
    if (user) {
        const uid = user.uid;
        const userPresenceRef = presenceRef.child(uid);
        userPresenceRef.set(true);
        userPresenceRef.onDisconnect().remove();

        // Mettre à jour le nombre d'utilisateurs en ligne
        presenceRef.on('value', snapshot => {
            const users = snapshot.val() || {};
            const count = Object.keys(users).length;
            document.getElementById('user-count').textContent = `Utilisateurs en ligne: ${count}`;
        });

        // Vérifier si l'utilisateur a un nom d'utilisateur, sinon en demander un
        db.ref(`users/${uid}/displayName`).once('value').then(snapshot => {
            if (!snapshot.exists()) {
                let displayName = "";
                while (displayName.trim() === "") {
                    displayName = prompt("Entrez votre nom d'utilisateur:");
                    if (displayName === null) { // Si l'utilisateur annule
                        displayName = "Anonyme";
                        break;
                    }
                }
                db.ref(`users/${uid}/displayName`).set(displayName.trim() || "Anonyme");
            }
        });
    } else {
        console.error("Aucun utilisateur authentifié.");
    }
});

// ====== Écouter les Nouveaux Messages ====== //
messagesRef.on('child_added', snapshot => {
    const message = snapshot.val();
    afficherMessage(message);
});

// ====== Gestion de l'Envoi de Messages Texte ====== //
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');

messageForm.addEventListener('submit', e => {
    e.preventDefault();
    const text = messageInput.value.trim();
    if (text !== "") {
        const message = {
            type: 'text',
            text: text,
            timestamp: Date.now(),
            userId: auth.currentUser.uid
        };
        messagesRef.push(message);
        messageInput.value = "";
    }
});

// ====== Gestion de l'Envoi de Fichiers ====== //
const fileForm = document.getElementById('file-form');
const fileInput = document.getElementById('file-input');

fileForm.addEventListener('submit', e => {
    e.preventDefault();
    const file = fileInput.files[0];
    if (file && file.size <= 1e9) { // Limite à 1 Go
        const filePath = `files/${auth.currentUser.uid}_${Date.now()}_${file.name}`;
        const fileRef = storage.ref().child(filePath);
        const uploadTask = fileRef.put(file);

        uploadTask.on('state_changed', 
            snapshot => {
                // Optionnel: Afficher la progression
            }, 
            error => {
                console.error("Erreur de téléchargement de fichier :", error);
            }, 
            () => {
                uploadTask.snapshot.ref.getDownloadURL().then(downloadURL => {
                    let message = {
                        type: 'file',
                        url: downloadURL,
                        name: file.name,
                        timestamp: Date.now(),
                        userId: auth.currentUser.uid
                    };
                    if (file.type.startsWith('image/')) {
                        message.type = 'image';
                    }
                    messagesRef.push(message);
                });
            }
        );
    } else {
        alert("Veuillez sélectionner un fichier valide (moins de 1 Go).");
    }
    fileInput.value = "";
});

// ====== Gestion de la Recherche sur Internet ====== //
const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');

searchForm.addEventListener('submit', e => {
    e.preventDefault();
    const query = searchInput.value.trim();
    if (query !== "") {
        const encodedQuery = encodeURIComponent(query);
        const url = `https://www.google.com/search?q=${encodedQuery}`;

        const message = {
            type: 'text',
            text: `Recherche Google pour "${query}": <a href="${url}" target="_blank">Voir les résultats</a>`,
            timestamp: Date.now(),
            userId: 'Système'
        };
        messagesRef.push(message);

        searchInput.value = "";
    }
});

// ====== Affichage des Messages dans le DOM ====== //
function afficherMessage(message) {
    const messagesDiv = document.getElementById('messages');
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message');

    const userSpan = document.createElement('strong');
    if (message.userId === 'Système') {
        userSpan.innerHTML = `Système: `;
        userSpan.style.color = '#007bff';
    } else {
        // Récupérer le nom d'utilisateur depuis la base de données
        db.ref(`users/${message.userId}/displayName`).once('value').then(snapshot => {
            const displayName = snapshot.val() || 'Anonyme';
            userSpan.innerHTML = `${displayName}: `;

            const contentSpan = document.createElement('span');

            if (message.type === 'text') {
                // Convertir les sauts de ligne en <br> et autoriser les liens
                contentSpan.innerHTML = message.text.replace(/\n/g, '<br>');
            } else if (message.type === 'image') {
                const img = document.createElement('img');
                img.src = message.url;
                img.alt = message.name;
                contentSpan.appendChild(img);
            } else if (message.type === 'file') {
                const fileLink = document.createElement('a');
                fileLink.href = message.url;
                fileLink.textContent = message.name;
                fileLink.target = '_blank';
                contentSpan.appendChild(fileLink);
            }

            const timestamp = document.createElement('div');
            timestamp.classList.add('timestamp');
            timestamp.textContent = dayjs(message.timestamp).format('HH:mm:ss');

            messageDiv.appendChild(userSpan);
            messageDiv.appendChild(contentSpan);
            messageDiv.appendChild(timestamp);
            messagesDiv.appendChild(messageDiv);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        });
        return; // Sortir de la fonction car l'affichage est asynchrone
    }

    const contentSpan = document.createElement('span');

    if (message.type === 'text') {
        // Convertir les sauts de ligne en <br> et autoriser les liens
        contentSpan.innerHTML = message.text.replace(/\n/g, '<br>');
    } else if (message.type === 'image') {
        const img = document.createElement('img');
        img.src = message.url;
        img.alt = message.name;
        contentSpan.appendChild(img);
    } else if (message.type === 'file') {
        const fileLink = document.createElement('a');
        fileLink.href = message.url;
        fileLink.textContent = message.name;
        fileLink.target = '_blank';
        contentSpan.appendChild(fileLink);
    }

    const timestamp = document.createElement('div');
    timestamp.classList.add('timestamp');
    timestamp.textContent = dayjs(message.timestamp).format('HH:mm:ss');

    messageDiv.appendChild(userSpan);
    messageDiv.appendChild(contentSpan);
    messageDiv.appendChild(timestamp);
    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// ====== Fonction pour supprimer les messages expirés ====== //
function deleteExpiredMessages() {
    const oneHourAgo = Date.now() - 60 * 60 * 1000; // Timestamp d'une heure en arrière
    messagesRef.once('value', snapshot => {
        snapshot.forEach(childSnapshot => {
            const message = childSnapshot.val();
            if (message.timestamp && message.timestamp < oneHourAgo) {
                // Supprimer le message s'il est plus ancien qu'une heure
                messagesRef.child(childSnapshot.key).remove();
            }
        });
    });
}

// ====== Vérifie les messages expirés toutes les minutes ====== //
setInterval(deleteExpiredMessages, 60 * 1000); // Vérifie toutes les minutes

// ====== Intégration des Émojis ====== //
const emojiButton = document.getElementById('emoji-button');
const picker = new EmojiButton();

emojiButton.addEventListener('click', () => {
    picker.togglePicker(emojiButton);
});

picker.on('emoji', selection => {
    // Extraire la propriété 'emoji' de l'objet 'selection'
    if (selection && selection.emoji) {
        messageInput.value += selection.emoji;
        messageInput.focus();
    } else {
        console.error("Émoji non valide sélectionné :", selection);
    }
});
