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
  
  // Get room ID from URL parameter
  const urlParams = new URLSearchParams(window.location.search);
  const roomId = urlParams.get('roomId');
  const roomRef = database.ref(`rooms/${roomId}`);
  const player1Ref = roomRef.child('player1');
  const player2Ref = roomRef.child('player2');
  const gameStatusRef = roomRef.child('gameStatus');

  function initializeGame() {
    if (isPlaying) {
      console.warn("Game is already in progress. Cannot initialize a new game.");
      return;
    }
  
    const urlParams = new URLSearchParams(window.location.search);
    const roomId = urlParams.get('roomId');
    const playerNumber = urlParams.get('player');
  
    if (!roomId || !playerNumber) {
      console.error("Invalid URL parameters. Cannot initialize the game.");
      return;
    }
  
    const roomRef = database.ref(`rooms/${roomId}`);
    const gameStatusRef = roomRef.child('gameStatus');
    const playerRef = (playerNumber === '1') ? roomRef.child('player1') : roomRef.child('player2');
  
    Promise.all([
      playerRef.once('value'),
      player1Ref.once('value'),
      player2Ref.once('value')
    ])
      .then(([playerSnapshot, player1Snapshot, player2Snapshot]) => {
        const playerData = playerSnapshot.val() || {};
        const player1Data = player1Snapshot.val() || {};
        const player2Data = player2Snapshot.val() || {};
  
        if (!playerData.joined || !playerData.ready || !player1Data.joined || !player1Data.ready || !player2Data.joined || !player2Data.ready) {
          console.warn("One or more players are not ready. Cannot initialize the game.");
          return;
        }
  
        // Assume parameters are valid and set player as joined and ready
        playerRef.update({ joined: true, ready: true });
  
        // Immediately setup and start the game
        setupGameBoard(INCREMENT_VALUE);
        startTimer(gameTime);
        isPlaying = true;
        toggleMusic(); // Start music if that is part of the initial game setup
  
        // Update UI immediately or show the game page
        gamePage.classList.remove('hidden');
  
        // Listen for game status updates directly, without additional checks
        gameStatusRef.on('value', snapshot => {
          const gameStatus = snapshot.val();
          if (gameStatus && typeof gameStatus === 'object' && gameStatus.hasOwnProperty('ended')) {
            if (gameStatus.ended) {
              endGame();
            }
          } else {
            console.warn('Invalid gameStatus data:', gameStatus);
          }
        });
  
        player1Ref.child('score').on('value', snapshot => {
          const score = snapshot.val() || 0;
          if (playerNumber === '1') {
            player1ScoreDisplay.textContent = `YOU: ${score}`;
          } else {
            player1ScoreDisplay.textContent = `Player: ${score}`;
          }
        });
  
        player2Ref.child('score').on('value', snapshot => {
          const score = snapshot.val() || 0;
          if (playerNumber === '2') {
            player2ScoreDisplay.textContent = `YOU: ${score}`;
          } else {
            player2ScoreDisplay.textContent = `Player: ${score}`;
          }
        });
  
        console.log("Game initialized and started.");
      })
      .catch(error => {
        console.error("Error initializing the game:", error);
      });
  }

  
  function shuffleAllCards() {
    const boardCards = Array.from(gameBoard.querySelectorAll('.card'));
    const boardValues = boardCards.map(card => parseInt(card.querySelector('.card-value').textContent, 10));
    shuffleArray(boardValues);  // Shuffle the board values

    // Update the board card values with the shuffled values
    boardCards.forEach((card, index) => {
        const valueSpan = card.querySelector('.card-value');
        valueSpan.textContent = boardValues[index];
        card.classList.remove('correct', 'incorrect');  // Reset card states
        card.draggable = true;  // Ensure cards are draggable again

        const correctMessageSpan = card.querySelector('.correct-message');
        if (correctMessageSpan) {
            correctMessageSpan.remove();
        }
    });

    // Optionally reshuffle the player's hand to match new board setup
    reshufflePlayersHand(boardValues, INCREMENT_VALUE);
}

  let player1Joined = false;
  let player1Ready = false;
  let player2Joined = false;
  let player2Ready = false;
  
  player1Ref.on('value', (snapshot) => {
    const { joined, ready } = snapshot.val() || {};
    player1Joined = joined || false;
    player1Ready = ready || false;
    checkIfBothPlayersReady();
  });
  
  player2Ref.on('value', (snapshot) => {
    const { joined, ready } = snapshot.val() || {};
    player2Joined = joined || false;
    player2Ready = ready || false;
    checkIfBothPlayersReady();
  });

  
  function checkIfBothPlayersReady() {
    if (player1Joined && player1Ready && player2Joined && player2Ready) {
      initializeGame(); // Call initializeGame when both players are ready
    }
  }
  
  
  function startGame() {
    const urlParams = new URLSearchParams(window.location.search);
    const roomId = urlParams.get('roomId');
    const playerNumber = urlParams.get('player');
  
    // Directly reference database paths
    const roomRef = database.ref(`rooms/${roomId}`);
    const gameStatusRef = roomRef.child('gameStatus');
    const playerRef = (playerNumber === '1') ? roomRef.child('player1') : roomRef.child('player2');
  
    // Assume parameters are valid and set player as joined and ready
    playerRef.update({ joined: true, ready: true });
  
    // Check if both players are ready before proceeding (prevent race conditions)
    Promise.all([
      player1Ref.once('value'),
      player2Ref.once('value')
    ]).then(([player1Snapshot, player2Snapshot]) => {
      const player1Data = player1Snapshot.val() || {};
      const player2Data = player2Snapshot.val() || {};
  
      if (player1Data.joined && player1Data.ready && player2Data.joined && player2Data.ready) {
        // Both players are ready, start the game
  
        // Immediately setup and start the game
        setupGameBoard(INCREMENT_VALUE);
  
        // Start local timer for display update (smoother UI)
        startTime = Date.now();
        gameTimer = setInterval(checkGameEndCondition, 1000);
  
        isMusicPlaying = true; // Set isMusicPlaying to false initially
        isPlaying = true;
        toggleMusic(); // Start music if that is part of the initial game setup
  
        // Update UI immediately or show the game page
        gamePage.classList.remove('hidden');
  
        // Listen for game status updates directly, without additional checks
        gameStatusRef.on('value', snapshot => {
          const gameStatus = snapshot.val();
          if (gameStatus && typeof gameStatus === 'object' && gameStatus.hasOwnProperty('ended')) {
            if (gameStatus.ended) {
              endGame();
            }
          } else {
            console.warn('Invalid gameStatus data:', gameStatus);
          }
        });
  
        player1Ref.child('score').on('value', snapshot => {
          const score = snapshot.val() || 0;
          if (playerNumber === '1') {
            player1ScoreDisplay.textContent = `YOU: ${score}`;
          } else {
            player1ScoreDisplay.textContent = `Player: ${score}`;
          }
        });
  
        player2Ref.child('score').on('value', snapshot => {
          const score = snapshot.val() || 0;
          if (playerNumber === '2') {
            player2ScoreDisplay.textContent = `YOU: ${score}`;
          } else {
            player2ScoreDisplay.textContent = `Player: ${score}`;
          }
        });
  
        console.log("Game initialized and started.");
      } else {
        console.log("Waiting for both players to be ready...");
      }
    });
  }
  
  // Update player's "joined" and "ready" status in Firebase
  const playerNumber = urlParams.get('player');
  const playerRef = (playerNumber === '1') ? player1Ref : player2Ref;
  playerRef.update({ joined: true, ready: true });
  
  let score = 0;
  let isPlaying = false;
  let isMusicPlaying = false; // Set isMusicPlaying to false initially
  let player1Score = 0;
  let player2Score = 0;
  let selectedCard = null;
  let incrementValue = 0; // Default to 0 or any suitable default
  const INCREMENT_VALUE = 2;

const gameTime = 60; // Define gameTime centrally
let startTime = 0;
let gameTimer = null;
  
  // DOM elements
  const timerDisplay = document.getElementById('timer');
  const scoreDisplay = document.getElementById('score');
  const player1ScoreDisplay = document.getElementById('player1-score');
  const player2ScoreDisplay = document.getElementById('player2-score');
  const gameBoard = document.getElementById('game-board');
  const playersHand = document.getElementById('players-hand');
  const gamePage = document.getElementById('game-page');
  const toggleMusicButton = document.getElementById('toggle-music');
  
  
  document.addEventListener('DOMContentLoaded', function() {
    const isSmallScreen = window.matchMedia("(max-width: 768px)").matches;
  
    if (isSmallScreen) {
      setupTapEvents(); // Setup tap events for small screens
    } else {
      setupDragAndDropEvents(); // Setup drag and drop for larger screens
    }
  });

  document.addEventListener('click', function() {
    const audio = document.getElementById('bg-music');
    if (audio.paused) {
      audio.play().catch(e => console.error('Error playing audio:', e));
    }
  });

  
  
  // Adjust setupEventListeners function as needed
  function setupEventListeners() {
    toggleMusicButton.addEventListener('click', toggleMusic);
    if (isTouchDevice()) {
      setupTapEvents();
    } else {
      setupDragAndDropEvents();
    }
  }

  function stopGame() {
    if (gameTimer !== null) {
        clearInterval(gameTimer);
        gameTimer = null;
        console.log("Game stopped manually, timer cleared");
    }
}
 

let timerStarted = false; // This flag will check if the timer has already been started

function startTimer() {
  if (!timerStarted) {
    clearInterval(gameTimer);  // Ensuring no previous timers are running.
    startTime = Date.now();
    gameTimer = setInterval(() => {
      const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
      let timeLeft = gameTime - elapsedSeconds;
      timeLeft = Math.max(timeLeft, 0);
      updateTimerDisplay(timeLeft);
      if (timeLeft <= 0) {
        clearInterval(gameTimer);
        timerStarted = false;  // Reset timer started flag when time is up.
        endGame();
      }
    }, 1000);
    timerStarted = true;  // Set the flag to true after starting the timer.
  }
}



function endGame() {
  isPlaying = false;
  clearInterval(gameTimer);

  const bgMusic = document.getElementById('bg-music');
  bgMusic.pause();
  isMusicPlaying = false;

  // Check if a modal is already displayed
  const existingModal = document.querySelector('.modal-overlay');
  if (existingModal) {
      return; // If there's already a modal, do nothing
  }

  // Retrieve scores and determine winner
  Promise.all([
      player1Ref.child('score').once('value'),
      player2Ref.child('score').once('value')
  ]).then(([player1ScoreSnapshot, player2ScoreSnapshot]) => {
      const player1Score = player1ScoreSnapshot.val() || 0;
      const player2Score = player2ScoreSnapshot.val() || 0;
      const playerNumber = new URLSearchParams(window.location.search).get('player');
      let message;

      if (player1Score === player2Score) {
          message = "It's a Tie!";
      } else {
          const iWin = (player1Score > player2Score && playerNumber === '1') || (player2Score > player1Score && playerNumber === '2');
          message = iWin ? "You Win! 🎉" : "You Lose 🥲";
      }

      // Create and display the modal
      const modalOverlay = document.createElement('div');
      modalOverlay.className = 'modal-overlay';

      const modalContent = document.createElement('div');
      modalContent.className = 'modal-content';
      modalContent.innerHTML = `
          <h2>Game Over!</h2>
          <p>${message}</p>
          <p>You: ${playerNumber === '1' ? player1Score : player2Score}</p>
          <p>${playerNumber === '1' ? 'Player 2' : 'Player 1'} Score: ${playerNumber === '1' ? player2Score : player1Score}</p>
          <div>
              <button id="exit-room-btn">Exit Room</button>
          </div>
      `;
      modalOverlay.appendChild(modalContent);
      document.body.appendChild(modalOverlay);

      // Handle exit button click, redirect to the main page
      document.getElementById('exit-room-btn').addEventListener('click', () => {
        window.location.href = 'index.html';  // Relative path to index.html
    });
    
  }).catch(error => {
      console.error('Failed to retrieve scores:', error);
  });
}




  
  function resetGameState() {
    timerDisplay.textContent = '01:00';
    updateScore(0);
    player1Score = 0;
    player2Score = 0;
    updatePlayerScores();
  
    // Clear the game board and players hand to start fresh
    gameBoard.innerHTML = '';
    playersHand.innerHTML = '';
  }
  
  function isTouchDevice() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;
  }
  function isLargeScreen() {
    return window.matchMedia("(min-width: 769px)").matches;
  }
  
  function loadPlayersCards(boardCardValues, increment) {
    playersHand.innerHTML = '';  // Clear the existing content of the players-hand div
  
    // Select 4 cards from the board to have matching cards in the player's hand
    let matchingCards = boardCardValues.slice(0, 4);
  
    // Create the player's hand cards that are correct
    matchingCards.forEach(value => {
      let correctValue = value + increment;  // Calculate the correct card value
      let card = createCardElement(correctValue, true);  // Create a player card
      playersHand.appendChild(card);
    });
  
    // Add one incorrect card to ensure it is not a correct match
    let incorrectValue;
    do {
      incorrectValue = getRandomNumber(1, 50);  // Generate a random value for the incorrect card
    } while (matchingCards.includes(incorrectValue - increment));

playersHand.appendChild(createCardElement(incorrectValue, true));

// Shuffle the player's hand to randomize the cards' positions
shufflePlayersHand();  // Use a specific function to shuffle hand cards
}

function getUserConfiguration() {
const userIncrement = prompt("Enter the increment value (2, 4, ..., 50):");
const increment = parseInt(userIncrement, 10);
if (isNaN(increment) || increment < 2 || increment > 50 || increment % 2 !== 0) {
  alert("Invalid increment value. Using the default value of 2.");
  return 2;
}
return increment;
}

function setupGameBoard(increment) {
  // Clear the game board to prepare for new game setup
  gameBoard.innerHTML = '';
  let boardCardValues = [];

  // Generate board card values ensuring they are unique and allow space for the increment
  while (boardCardValues.length < 4) {
      const randomValue = getRandomNumber(1, 50 - increment);
      if (!boardCardValues.includes(randomValue)) {
          boardCardValues.push(randomValue);
      }
  }

  // Shuffle the values to randomize the game board
  shuffleArray(boardCardValues);

  // Create and append board cards to the game board
  boardCardValues.forEach(value => {
      let card = createCardElement(value, false);  // Cards are not draggable by default
      gameBoard.appendChild(card);
      
      // Attach drag event listeners only on large screens
      if (isLargeScreen()) {
          card.addEventListener('dragover', handleDragOver);
          card.addEventListener('drop', (event) => handleCardDrop(event, increment));
      }
  });

  // Load player cards that could potentially match the board cards
  loadPlayersCards(boardCardValues, increment);
}

function playCorrectSound() {
const correctSound = document.getElementById('correct-sound'); // Make sure this ID matches your <audio> element
correctSound.play();
}



function toggleMusic() {
const music = document.getElementById('bg-music');
const musicIcon = document.getElementById('music-icon');
if (music.paused) {
  music.play();
  isMusicPlaying = true;
  musicIcon.src = 'assets/images/volume_on.png';
} else {
  music.pause();
  isMusicPlaying = false;
  musicIcon.src = 'assets/images/volume_off.png';
}
}
// Add the event listener to the toggle button
document.getElementById('toggle-music').addEventListener('click', toggleMusic);

function setupDragEvents() {
const cards = document.querySelectorAll('.card');
cards.forEach(card => {
  card.addEventListener('dragstart', playDragSound);
});
}

function playDragSound() {
const dragSound = document.getElementById('drag-sound');
console.log("Playing drag sound"); // Confirm this is logged
dragSound.play();
}

// Utility functions
function getRandomNumber(min, max) {
return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffleArray(array) {
for (let i = array.length - 1; i > 0; i--) {
  let j = Math.floor(Math.random() * (i + 1));
  [array[i], array[j]] = [array[j], array[i]];
}
}

function createCardElement(value, isPlayerCard) {
let card = document.createElement('div');
card.classList.add('card');

// Create an img element for the card image
let img = document.createElement('img');

// Check if the value is greater than 50, then choose a random image
if (value > 50) {
  // Array of random images, ensure these are available in your assets/images directory
  const randomImages = [
    '1.png',
    '5.png',
    '10.png',
    '15.png',
    '20.png'
  ];
  const randomIndex = Math.floor(Math.random() * randomImages.length);
  img.src = `assets/images/${randomImages[randomIndex]}`; // Select random image from the array
} else {
  img.src = `assets/images/${value}.png`; // Use the value-based image
}

img.draggable = false; // Prevent the image from being draggable
card.appendChild(img); // Add the image to the card

// Create a span for the card value (if you still want it visible)
let valueSpan = document.createElement('span');
valueSpan.classList.add('card-value');
valueSpan.textContent = value;
card.appendChild(valueSpan); // Add the value span to the card

if (isPlayerCard) {
  // Make the player's card draggable
  card.draggable = true;
  card.addEventListener('dragstart', handleDragStart);
  card.addEventListener('dragend', handleDragEnd);
}

return card;
}

function addDropEventsToBoardCards(increment) {
Array.from(gameBoard.children).forEach(card => {
  card.addEventListener('drop', (event) => handleCardDrop(event, increment));
  card.addEventListener('dragover', handleDragOver);
});
}


function handleCardTap(event) {
  const tappedCard = event.target.closest('.card');
  const isPlayerCard = tappedCard.parentNode.id === 'players-hand';
  const tappedCardValue = parseInt(tappedCard.querySelector('.card-value').textContent, 10);

  if (isPlayerCard) {
      // Player selects a card from their hand
      if (selectedCard) {
          selectedCard.classList.remove('selected');
      }
      tappedCard.classList.add('selected');
      selectedCard = tappedCard;
  } else if (selectedCard) {
      // Player attempts to match a selected card from their hand with a board card
      const selectedCardValue = parseInt(selectedCard.querySelector('.card-value').textContent, 10);

      if (selectedCardValue === tappedCardValue + INCREMENT_VALUE) {
          // Correct match
          tappedCard.classList.add('correct');
          let correctMessageSpan = tappedCard.querySelector('.correct-message');
          if (!correctMessageSpan) {
              correctMessageSpan = document.createElement('span');
              correctMessageSpan.classList.add('correct-message');
              correctMessageSpan.textContent = "Correct!";
              tappedCard.appendChild(correctMessageSpan);
          }

          // Update score
          updateScore(10);

          // Remove the card from the player's hand
          if (selectedCard.parentNode) {
              selectedCard.parentNode.removeChild(selectedCard);
              selectedCard = null;
          }

          // Move to the next stage if all cards are correct
          if (checkIfAllCardsCorrect()) {
              moveToNextStage(INCREMENT_VALUE);
          }
      } else {
          // Incorrect match
          tappedCard.classList.add('incorrect');
          if (selectedCard) {
              selectedCard.classList.remove('selected');
          }
          selectedCard = null; // Clear the selected card variable
      }
  }
}
  

  let correctAnswersCount = 0;  // Shared counter for correct answers by any player
  const successfulDrops = new Set();  // Set to keep track of successful card-target pairs
  
  function handleCardDrop(event, increment) {
    event.preventDefault();
    console.log("Card drop event handled");

    const playerNumber = new URLSearchParams(window.location.search).get('player');
    if (!playerNumber) {
        console.error("Invalid player number. Cannot process card drop.");
        return;
    }

    const draggedCardValue = parseInt(event.dataTransfer.getData('text'), 10);
    const targetCard = event.target.closest('.card');
    if (!targetCard) {
        console.error("Card drop target not found. Cannot process card drop.");
        return;
    }

    const boardCardValue = parseInt(targetCard.querySelector('.card-value').textContent, 10);
    const playerRef = (playerNumber === '1') ? player1Ref : player2Ref;

    // Check if the card has already been matched correctly and prevent state reversion
    if (targetCard.classList.contains('correct')) {
        console.log("Drop on already correctly matched card. No action taken.");
        return;
    }

    // Generate a unique identifier for this particular card-target combination
    const dropIdentifier = `player${playerNumber}-card${draggedCardValue}-target${boardCardValue}`;

    // Reset the visual state before applying new result
    targetCard.classList.remove('correct', 'incorrect');

    if (draggedCardValue === boardCardValue + increment) {
        if (!successfulDrops.has(dropIdentifier)) {
            console.log(`Correct card dropped by Player ${playerNumber}`);
            updatePlayerScore(playerRef, 10);  // Update score in Firebase and UI
            successfulDrops.add(dropIdentifier);  // Add this pair to the set to prevent future score updates
            targetCard.classList.add('correct');

            // Remove the card from the player's hand
            if (selectedCard) {
                selectedCard.parentNode.removeChild(selectedCard);
            }

            // Increment the correct answers counter for any correct drop
            correctAnswersCount++;
            if (correctAnswersCount >= 4) {
                // Only shuffle on non-small screens
                if (!window.matchMedia("(max-width: 768px)").matches) {
                    shuffleAllCards();  // Shuffle all cards function
                }
                correctAnswersCount = 0;  // Reset the count
                successfulDrops.clear();  // Clear the set of successful drops
            }
        } else {
            console.log(`Repeat correct card drop detected, no score added`);
        }
    } else {
        console.error(`Incorrect card dropped by Player ${playerNumber}`);
        targetCard.classList.add('incorrect');
        targetCard.querySelector('.card-value').style.visibility = 'visible'; // Ensure the incorrect value is visible for player feedback
    }
}

  



function checkGameEndCondition() {
  // Example condition: check if the game time has expired
  const currentTime = Date.now();
  if (currentTime - startTime >= gameTime * 1000) {
      endGame();
  }
}

  

function updatePlayerScore(playerRef, increment) {
  playerRef.child('score').transaction(currentScore => {
      return (currentScore || 0) + increment;
  });
}


function updateTimerDisplay(timeLeft) {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  timerDisplay.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}




function moveToNextStage(increment) {
  // Generate new board card values
  const boardCards = Array.from(gameBoard.querySelectorAll('.card'));
  const newBoardValues = boardCards.map(() => getRandomNumber(1, 50 - increment));
  shuffleArray(newBoardValues);

  // Update the board card values with the new values
  boardCards.forEach((card, index) => {
    const valueSpan = card.querySelector('.card-value');
    valueSpan.textContent = newBoardValues[index];
    valueSpan.style.visibility = 'visible';
    card.classList.remove('correct', 'incorrect');
    card.draggable = true;

    const correctMessageSpan = card.querySelector('.correct-message');
    if (correctMessageSpan) {
      correctMessageSpan.remove();
    }
  });

  // Reshuffle the player's hand with new matching cards
  reshufflePlayersHand(newBoardValues, increment);
}


function reshufflePlayersHand(newScore) {
  const boardValues = Array.from(gameBoard.querySelectorAll('.card')).map(card => parseInt(card.querySelector('.card-value').textContent, 10));
  const increment = getUserConfiguration(); // Assuming this function prompts the user for the increment value

  playersHand.innerHTML = '';

  const correctValues = shuffleArray([...boardValues]).slice(0, 4).map(value => value + increment);
  let fakeValue;
  do {
      fakeValue = getRandomNumber(1, 100);
  } while (correctValues.includes(fakeValue));

  const playerCardValues = [...correctValues, fakeValue];
  shuffleArray(playerCardValues);

  playerCardValues.forEach((value, index) => {
      setTimeout(() => {
          const card = createCardElement(value, true);
          playersHand.appendChild(card);
      }, index * 100);
  });

  console.log(`Player's hand reshuffled at score ${newScore}`);
}


function shufflePlayersHand() {
    let handCards = Array.from(playersHand.children);
    shuffleArray(handCards);
    handCards.forEach(card => playersHand.appendChild(card));  // Re-append shuffled cards
}



function reshufflePlayersHand(boardValues, increment) {
    playersHand.innerHTML = '';

    
    const correctValues = shuffleArray([...boardValues]).slice(0, 4).map(value => value + increment);
    let fakeValue;
    do {
        fakeValue = getRandomNumber(1, 100);  
    } while (correctValues.includes(fakeValue));

    const playerCardValues = [...correctValues, fakeValue];
    shuffleArray(playerCardValues); 

    
    playerCardValues.forEach((value, index) => {
        setTimeout(() => {
            const card = createCardElement(value, true);
            playersHand.appendChild(card);
        }, index * 100);  
    });
}


function getRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}


function setupTapEvents() {
  // Setup tap event for player's hand
  playersHand.addEventListener('click', function(event) {
      let targetCard = event.target.closest('.card');
      if (targetCard && targetCard.parentNode === playersHand && selectedCard !== targetCard) {
          handleCardSelection(targetCard);
          playDragSound();  // Play sound on selecting a card from the hand
      }
  });

  // Setup tap event for game board
  gameBoard.addEventListener('click', function(event) {
      let targetCard = event.target.closest('.card');
      if (selectedCard && targetCard && targetCard.parentNode === gameBoard) {
          validateCardSelection(targetCard, selectedCard);
          playDragSound();  // Play sound on validating card placement
          selectedCard.classList.remove('selected');
          selectedCard = null;  // Deselect after placing
      }
  });
}

function handleCardSelection(card) {
    if (selectedCard) {
        selectedCard.classList.remove('selected');
    }
    selectedCard = card;
    selectedCard.classList.add('selected');
}

function playDragSound() {
    const dragSound = document.getElementById('drag-sound');
    dragSound.play();
}



function handleCardSelection(card) {
    if (selectedCard) {
        selectedCard.classList.remove('selected');
    }
    selectedCard = card;
    selectedCard.classList.add('selected');
}


const successfulTaps = new Set();  // Set to keep track of successful card-target pairs


function validateCardSelection(boardCard, playerCard) {
  const boardValue = parseInt(boardCard.querySelector('.card-value').textContent.trim());
  const playerValue = parseInt(playerCard.querySelector('.card-value').textContent.trim());

  const playerNumber = new URLSearchParams(window.location.search).get('player');
  const playerRef = (playerNumber === '1') ? player1Ref : player2Ref;
  const dropIdentifier = `${playerNumber}-card${playerValue}-target${boardValue}`;

  // Reset previous states
  boardCard.classList.remove('incorrect');
  boardCard.querySelector('.card-value').style.visibility = 'visible'; // Always show the card value initially

  if (playerValue === boardValue + INCREMENT_VALUE) {
      if (!successfulTaps.has(dropIdentifier)) {
          // Prevents scoring for already successful card-target pairs
          boardCard.classList.add('correct');
          updatePlayerScore(playerRef, 10); // Update score in Firebase and UI
          successfulTaps.add(dropIdentifier); // Register this successful tap
          correctAnswersCount++; // Track number of correct answers

          // Hide the correctly played card from the player's hand
          playerCard.style.display = 'none';

          // Check if it's time to shuffle and reset
          if (correctAnswersCount >= 4) {
              shuffleAllCards(); // Shuffle all cards on the board
              correctAnswersCount = 0; // Reset the correct answers count
              successfulTaps.clear(); // Clear recorded successful taps
          }
      } else {
          console.log("Repeat correct tap detected, no score added."); // Log an attempted repeat of a successful action
      }
  } else {
      // Only add the 'incorrect' class if the card is not already marked as 'correct'
      if (!boardCard.classList.contains('correct')) {
          boardCard.classList.add('incorrect');
      }
  }
}


function addStatusMessage(card, message) {
    const messageSpan = document.createElement('span');
    messageSpan.classList.add('status-message');
    messageSpan.textContent = message;
    card.appendChild(messageSpan);
}

function removeStatusMessage(card) {
    const existingMessage = card.querySelector('.status-message');
    if (existingMessage) {
        card.removeChild(existingMessage);
    }
}


function checkIfAllCardsCorrect() {
  const cards = gameBoard.querySelectorAll('.card.correct');
  return cards.length === gameBoard.querySelectorAll('.card').length;
}


function setupDragAndDropEvents() {
    const playersHand = document.getElementById('players-hand');
    const gameBoard = document.getElementById('game-board');

    // Ensure all cards in the player's hand and the game board are set up for dragging
    playersHand.querySelectorAll('.card').forEach(card => {
        card.setAttribute('draggable', true);
        card.addEventListener('dragstart', function(event) {
            handleDragStart(event);
            playDragSound(); // Ensures sound plays on drag start
        });
        card.addEventListener('dragend', handleDragEnd);
    });

    gameBoard.querySelectorAll('.card').forEach(card => {
        card.addEventListener('dragover', handleDragOver);
        card.addEventListener('drop', function(event) {
            handleDrop(event);
        });
    });
}






function handleDragStart(event) {
  event.dataTransfer.setData('text', event.target.textContent.trim());
  selectedCard = event.target; // Storing the selected card for drop validation
  playDragSound(); // Ensures sound plays on drag start
  // Set the opacity of the dragging card to less visible
  selectedCard.style.opacity = '0.2'; 
}

function handleDragEnd(event) {
  // Reset the opacity of the dragging card to fully visible
  if (selectedCard) {
      selectedCard.style.opacity = '2'; 
  }
  selectedCard = null; // Clear the selected card once dragging ends
}

function handleDragOver(event) {
    event.preventDefault();
}

function handleDrop(event) {
    event.preventDefault();
    let targetCard = event.target.closest('.card');
    validateCardSelection(targetCard, selectedCard);
}

let lastShuffleScore = 0; // Keep track of the last score at which the player's hand was shuffled

function updateScore(playerNumber, increment) {
  const playerRef = (playerNumber === '1') ? player1Ref : player2Ref;
  playerRef.child('score').transaction(currentScore => {
      const currentScoreValue = currentScore !== null && currentScore !== undefined ? currentScore : 0;
      const incrementValue = isNaN(increment) ? 0 : increment;

      if (isNaN(currentScoreValue) || isNaN(incrementValue)) {
          console.error('Invalid score or increment value. Transaction aborted.');
          return; // Abort the transaction if either value is not a valid number
      }

      const newScore = currentScoreValue + incrementValue;

      // Check if the new score is a multiple of 40 and greater than the last shuffle score
      if (newScore % 40 === 0 && newScore > lastShuffleScore) {
          reshufflePlayersHand(newScore);
          lastShuffleScore = newScore;
      }

      return newScore;
  });
}


function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secondsRemain = seconds % 60;
  return `${minutes}:${secondsRemain < 10 ? '0' : ''}${secondsRemain}`;
}


window.addEventListener('load', initializeGame);
