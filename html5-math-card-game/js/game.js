let gameTimer;
let score = 0;
let isPlaying = false;
let isMusicPlaying = true;
let player1Score = 0;
let player2Score = 0;
let selectedCard = null;
let incrementValue = 0; // Default to 0 or any suitable default
const gameTime = 60; // Game duration in seconds
const INCREMENT_VALUE = 2; 

// DOM elements
const timerDisplay = document.getElementById('timer');
const scoreDisplay = document.getElementById('score');
const player1ScoreDisplay = document.getElementById('player1-score');
const player2ScoreDisplay = document.getElementById('player2-score');
const gameBoard = document.getElementById('game-board');
const playersHand = document.getElementById('players-hand');
const startPage = document.getElementById('start-page');
const gamePage = document.getElementById('game-page');
const playOfflineButton = document.getElementById('play-offline');
const playOnlineButton = document.getElementById('play-online');
const toggleMusicButton = document.getElementById('toggle-music');

document.getElementById('play-offline').addEventListener('click', function() {
    document.getElementById('start-page').classList.add('hidden'); // Hide the start page
    document.getElementById('game-page').classList.remove('hidden'); // Show the game page
});


document.addEventListener('DOMContentLoaded', function() {
    const isSmallScreen = window.matchMedia("(max-width: 768px)").matches;

    if (isSmallScreen) {
        setupTapEvents(); // Setup tap events for small screens
    } else {
        setupDragAndDropEvents(); // Setup drag and drop for larger screens
    }
});


function initializeGame() {
    // Clear any existing game settings or data
    resetGameState();

    // Set initial game settings
    incrementValue = INCREMENT_VALUE;  // Use the constant increment value directly
    setupEventListeners();  // Setup all necessary event listeners

    // Determine screen type and setup interaction accordingly
    const isSmallScreen = window.matchMedia("(max-width: 768px)").matches;
    if (isSmallScreen) {
        setupTapEvents();  // For small screens
    } else {
        setupDragAndDropEvents();  // For large screens
    }

    setupUI();  // Additional UI setups

    const music = document.getElementById('bg-music');
    music.muted = true;
    music.play().then(() => {
        console.log("Autoplay started muted");
    }).catch(error => {
        console.log("Autoplay blocked");
    });

    // Unmute on first interaction
    document.body.addEventListener('click', function unmuteMusic() {
        if (music.muted) {
            music.muted = false;
            music.play();  // Ensure music plays when unmuted
        }
        // Remove this listener after it's used to prevent repeating
        document.body.removeEventListener('click', unmuteMusic);
    });

    
}

function setupEventListeners() {
    // Clear existing listeners to prevent duplication
    playOfflineButton.removeEventListener('click', startOfflineGame);
    playOnlineButton.removeEventListener('click', startOnlineGame);
    toggleMusicButton.removeEventListener('click', toggleMusic);

    // Re-attach event listeners
    playOfflineButton.addEventListener('click', startOfflineGame);
    playOnlineButton.addEventListener('click', startOnlineGame);
    toggleMusicButton.addEventListener('click', toggleMusic);
}

function setupUI() {
    playOfflineButton.addEventListener('click', startOfflineGame);
    playOnlineButton.addEventListener('click', startOnlineGame);
    toggleMusicButton.addEventListener('click', toggleMusic);
}


function startOfflineGame() {
    // Hide the start page and show the game page
    startPage.classList.add('hidden');
    gamePage.classList.remove('hidden');

    // Set game state as playing
    isPlaying = true;
    
    // Try starting the music, if not already playing
    if (!isMusicPlaying) {
        toggleMusic();  // This will check the state and play the music if needed
    }

    
    // Reset and update scores
    score = 0;
    player1Score = 0;
    player2Score = 0;
    updateScore(0);  // Reset the score display to 0
    updatePlayerScores();  // Update player scores displays

    // Start the game timer
    startTimer(gameTime);

    // Setup the game board using the constant increment value
    setupGameBoard(INCREMENT_VALUE);

    // Ensure game-related UI is correctly displayed
    gamePage.classList.remove('hidden');
    document.getElementById('player-info').classList.add('hidden');
}





// Function to start the online game
function startOnlineGame() {
    // Implement online game logic here
    document.getElementById('player-info').classList.remove('hidden');

    isPlaying = true;
    
    // Try starting the music, if not already playing
    if (!isMusicPlaying) {
        toggleMusic();  // This will check the state and play the music if needed
    }

}

// Function to start the timer
function startTimer(duration) {
    let startTime = Date.now();

    // Update the timer every second
    gameTimer = setInterval(function () {
        let elapsedTime = Date.now() - startTime;
        let timeLeft = duration - Math.floor(elapsedTime / 1000);
        if (timeLeft >= 0) {
            timerDisplay.textContent = formatTime(timeLeft);
        } else {
            endGame();
        }
    }, 1000);
}


function endGame() {
    isPlaying = false;
    clearInterval(gameTimer);

    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay';

    const popup = document.createElement('div');
    popup.className = 'popup';
    popup.innerHTML = `
        <h2>Time's up!</h2>
        <p>Your final score is: ${score}</p>
        <div>
            <button id="play-again-btn">
                <span class="icon-container"><i class="fas fa-redo"></i></span>Play Again
            </button>
            <button id="back-to-home-btn">
                <span class="icon-container"><i class="fas fa-home"></i></span>Back to Home
            </button>
        </div>
    `;
    modalOverlay.appendChild(popup);
    document.body.appendChild(modalOverlay);

    // Add functionality to buttons
    document.getElementById('play-again-btn').addEventListener('click', function() {
        resetGameState();
        document.body.removeChild(modalOverlay);
        startOfflineGame();
    });

    document.getElementById('back-to-home-btn').addEventListener('click', function() {
        resetGameState();
        document.body.removeChild(modalOverlay);
        startPage.classList.remove('hidden');
        gamePage.classList.add('hidden');
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
    } while (matchingCards.includes(incorrectValue - increment));  // Ensure it does not accidentally match

    // Add the incorrect card to the hand
    playersHand.appendChild(createCardElement(incorrectValue, true));

    // Shuffle the player's hand to randomize the cards' positions
    shufflePlayersHand();  // Use a specific function to shuffle hand cards
}

document.getElementById('config-btn').addEventListener('click', function() {
    let userIncrement = prompt("Enter a new increment value (2, 4, ..., 50):");
    incrementValue = getUserConfiguration(userIncrement);
    setupGameBoard(incrementValue);  // Re-setup the game board with new increment value
    document.getElementById('current-increment').textContent = incrementValue;  // Update the displayed increment
    alert(`Increment value updated to ${incrementValue}.`);
});

function getUserConfiguration(userInput) {
    const increment = parseInt(userInput, 10);
    if (isNaN(increment) || increment < 2 || increment > 50 || increment % 2 !== 0) {
        alert("Invalid increment value. Using the default value of 2.");
        return 2;  // Return default increment if invalid input
    }
    return increment;  // Return user-provided increment if valid
}


function setupGameBoard(increment) {
    // Clear the game board to prepare for new game setup
    gameBoard.innerHTML = '';
    let boardCardValues = [];

    // Generate board card values ensuring they allow space for the increment
    for (let i = 0; i < 4; i++) {
        boardCardValues.push(getRandomNumber(1, 50 - increment));
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


function updateScore(increment = 10) {
    if (!increment) {
        console.warn("Invalid or falsy value for score increment. Using the default value of 10.");
        increment = 10;
    }

    console.log(`Adding ${increment} to score. Current score before increment: ${score}`);
    score += increment;
    scoreDisplay.textContent = `Score: ${score}`;

    // Check if the score is a multiple of 40 and play the sound
    if (score % 40 === 0) {
        playCorrectSound();  // Function to play the sound
    }
}

function playCorrectSound() {
    const correctSound = document.getElementById('correct-sound'); // Make sure this ID matches your <audio> element
    correctSound.play();
}


// Update the player scores display
function updatePlayerScores() {
    player1ScoreDisplay.textContent = player1Score;
    player2ScoreDisplay.textContent = player2Score;
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
    const tappedCardValueSpan = tappedCard.querySelector('.card-value');
    const boardCardValue = parseInt(tappedCardValueSpan.textContent, 10);

    if (isPlayerCard && selectedCard !== tappedCard) {
        // Handle player card selection
        if (selectedCard) {
            selectedCard.classList.remove('selected');
        }
        tappedCard.classList.add('selected');
        selectedCard = tappedCard;
    } else if (!isPlayerCard && selectedCard) {
        // Handle board card matching logic
        const selectedCardValue = parseInt(selectedCard.querySelector('.card-value').textContent, 10);

        if (selectedCardValue === boardCardValue + INCREMENT_VALUE) {
            // Hide the card value and show "Correct"
            tappedCardValueSpan.style.visibility = 'hidden';

            let correctMessageSpan = tappedCard.querySelector('.correct-message');
            if (!correctMessageSpan) {
                correctMessageSpan = document.createElement('span');
                correctMessageSpan.classList.add('correct-message');
                tappedCard.appendChild(correctMessageSpan);
            }
            
            // Add 'correct' class and remove selection from the card
            tappedCard.classList.add('correct');
            if (selectedCard) {
                selectedCard.classList.remove('selected');
            }
            selectedCard = null;
            
            // Assuming you have a function to update the score
            score += 10;
            updateScore(score);

            // Check if all cards are correct to move to the next stage
            if (checkIfAllCardsCorrect()) {
                moveToNextStage(INCREMENT_VALUE);
            }
        } else {
            // Handle incorrect selection for a board card
            tappedCard.classList.add('incorrect');
            if (selectedCard) {
                selectedCard.classList.remove('selected');
            }
            selectedCard = null;
        }
    }
}



function handleCardDrop(event, increment) {
    event.preventDefault();
    const draggedCardValue = parseInt(event.dataTransfer.getData('text'), 10);
    const targetCard = event.target.closest('.card');
    
    if (targetCard) {
        const boardCardValueSpan = targetCard.querySelector('.card-value');

        if (boardCardValueSpan) {
            const boardCardValue = parseInt(boardCardValueSpan.textContent, 10);

            if (!isNaN(draggedCardValue) && !isNaN(boardCardValue)) {
                const isCorrect = (draggedCardValue === boardCardValue + increment);
                if (isCorrect) {
                    updateScore(10); // Add 10 to the score
                    targetCard.classList.add('correct');
                    targetCard.classList.remove('incorrect');

                    // Retain visibility of the card number instead of hiding it
                    // boardCardValueSpan.style.visibility = 'hidden'; // Remove or comment out this line

                    let correctMessageSpan = targetCard.querySelector('.correct-message');
                    if (!correctMessageSpan) {
                        // If the "Correct" message doesn't already exist, create and append it
                        correctMessageSpan = document.createElement('span');
                        correctMessageSpan.classList.add('correct-message');
                        targetCard.appendChild(correctMessageSpan);
                    }

                    targetCard.draggable = false; // Disable further interaction with the card

                    // If all cards on the board are correct, proceed to the next stage
                    if (checkIfAllCardsCorrect()) {
                        moveToNextStage(increment);
                    }
                } else {
                    targetCard.classList.add('incorrect');
                    targetCard.classList.remove('correct');
                    boardCardValueSpan.style.visibility = 'visible'; // Re-display the card number for incorrect guesses
                }
            } else {
                console.error('One of the card values is not a number.');
            }
        } else {
            console.error('card-value element not found');
        }
    } else {
        console.error('Target card element not found');
    }
}





function moveToNextStage(increment) {
    // Generate a random increment value between 1 and 10 for updating the board cards
    const randomIncrement = Math.floor(Math.random() * 10) + 1;

    const cards = gameBoard.querySelectorAll('.card');
    const newBoardValues = [];

    // Update each board card with a new value
    cards.forEach(card => {
        const valueSpan = card.querySelector('.card-value');
        let currentValue = parseInt(valueSpan.textContent, 10);
        let newValue = currentValue + randomIncrement;  // Apply the random increment

        valueSpan.textContent = newValue;  // Update the displayed value
        valueSpan.style.visibility = 'visible';  // Ensure the value is visible
        card.classList.remove('correct', 'incorrect');  // Remove any status classes
        card.draggable = true;  // Ensure the card is draggable

        newBoardValues.push(newValue);  // Store the new value for updating player's hand

        // Remove any existing 'correct-message' element
        const correctMessageSpan = card.querySelector('.correct-message');
        if (correctMessageSpan) {
            card.removeChild(correctMessageSpan);
        }
    });

    // After updating the board cards, reshuffle and reload the player's hand with new cards
    reshufflePlayersHand(newBoardValues, increment);
}

function reshufflePlayersHand(boardValues, increment) {
    playersHand.innerHTML = ''; // Clear the current player's hand

    // Generate new matching player cards
    boardValues.forEach(value => {
        let correctValue = value + increment;  // Correct value to match board
        let card = createCardElement(correctValue, true);  // Player card is draggable
        playersHand.appendChild(card);
    });

    // Optionally add an incorrect card not matching any board value
    let incorrectValue;
    do {
        incorrectValue = getRandomNumber(1, 100);  // Generate a distinct value
    } while (boardValues.includes(incorrectValue - increment));
    playersHand.appendChild(createCardElement(incorrectValue, true));  // Add the incorrect card

    // Shuffle the player's hand to randomize card order
    shufflePlayersHand();
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
    playersHand.addEventListener('click', function(event) {
        let targetCard = event.target.closest('.card');
        if (targetCard && targetCard.parentNode === playersHand && selectedCard !== targetCard) {
            handleCardSelection(targetCard);
            playDragSound();  // Play sound on selecting a card from the hand
        }
    });

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

function playDragSound() {
    const dragSound = document.getElementById('drag-sound');
    dragSound.play();
}


function setupUI() {
    // Additional setup for UI elements, like buttons, scores, etc.
    document.getElementById('play-offline').addEventListener('click', startOfflineGame);
    document.getElementById('play-online').addEventListener('click', function() {
        window.location.href = 'lobby.html';
      });}

function handleCardSelection(card) {
    if (selectedCard) {
        selectedCard.classList.remove('selected');
    }
    selectedCard = card;
    selectedCard.classList.add('selected');
}


function validateCardSelection(boardCard, playerCard) {
    const boardValue = parseInt(boardCard.querySelector('.card-value').textContent.trim());
    const playerValue = parseInt(playerCard.querySelector('.card-value').textContent.trim());

    if (playerValue === boardValue + INCREMENT_VALUE) {
        boardCard.classList.add('correct');
        boardCard.classList.remove('incorrect');
        

        const correctMessage = boardCard.querySelector('.correct-message') || document.createElement('span');
        correctMessage.classList.add('correct-message');
        boardCard.appendChild(correctMessage);

        updateScore(10); // Add 10 to the score

        if (checkIfAllCardsCorrect()) {
            moveToNextStage(INCREMENT_VALUE);
        }
    } else {
        boardCard.classList.add('incorrect');
        boardCard.classList.remove('correct');
        boardCard.querySelector('.card-value').style.visibility = 'visible'; // Show the card value if not correct
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
    const cards = gameBoard.querySelectorAll('.card');
    return Array.from(cards).every(card => card.classList.contains('correct'));
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
}

function handleDragEnd(event) {
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

function updateScore(increment) {
    console.log(`Adding ${increment} to score. Current score before increment: ${score}`);
    score += increment;
    scoreDisplay.textContent = `Score: ${score}`;
}


function formatTime(seconds) {
    let minutes = Math.floor(seconds / 60);
    let remainingSeconds = seconds % 60;
    return minutes.toString().padStart(2, '0') + ':' + remainingSeconds.toString().padStart(2, '0');
}




// Call the initialize function when the window is loaded
window.addEventListener('load', initializeGame);