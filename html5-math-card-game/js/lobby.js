// Initialize Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAiIf2TRPhmmFf0O59js3Qtv_mm8RJH4VA",
    authDomain: "mathsprint-c4b90.firebaseapp.com",
    databaseURL: "https://mathsprint-c4b90-default-rtdb.firebaseio.com",
    projectId: "mathsprint-c4b90",
    storageBucket: "mathsprint-c4b90.appspot.com",
    messagingSenderId: "1008371924817",
    appId: "1:1008371924817:web:5b9bd7d407fb5db1dc9d70",
    measurementId: "G-KYNWZD8WBM"
};

firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// DOM elements
const createRoomBtn = document.getElementById('create-room-btn');
const joinRoomBtn = document.getElementById('join-room-btn');
const roomIdInput = document.getElementById('room-id-input');
const incrementInput = document.getElementById('increment-value'); // Increment input element

// Function to generate a random room ID
function generateRoomId() {
    return Math.random().toString(36).substring(2, 10); // Generates an 8-character alphanumeric ID
}

// Create a new room with specified increment value
createRoomBtn.addEventListener('click', () => {
    const roomId = generateRoomId();
    const incrementValue = parseInt(incrementInput.value, 10); // Parse the increment value from input
    database.ref('rooms/' + roomId).set({
        player1Joined: true,
        player2Joined: false,
        increment: incrementValue, // Store the increment in Firebase
        roomId: roomId
    }).then(() => {
        roomIdInput.value = roomId; // Display the room ID in the input field
        // Set up a listener to redirect when player 2 joins
        database.ref(`rooms/${roomId}/player2Joined`).on('value', snapshot => {
            if (snapshot.val() === true) {
                window.location.href = `onlineGame.html?roomId=${roomId}&player=1`;
                database.ref(`rooms/${roomId}/player2Joined`).off(); // Detach listener after redirect
            }
        });
    }).catch(error => {
        console.error('Error creating room:', error);
    });
});

// Join an existing room
joinRoomBtn.addEventListener('click', () => {
    const roomId = roomIdInput.value.trim();
    if (!roomId) {
        alert('Please enter a room ID');
        return;
    }

    const roomRef = database.ref(`rooms/${roomId}`);
    roomRef.once('value', snapshot => {
        if (snapshot.exists() && !snapshot.val().player2Joined) {
            roomRef.update({ player2Joined: true }).then(() => {
                window.location.href = `onlineGame.html?roomId=${roomId}&player=2`;
            }).catch(error => {
                console.error('Error joining room:', error);
            });
        } else {
            alert('Room is full or does not exist');
        }
    });
});
