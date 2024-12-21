const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Snake game state
let gameState = {
    snake: [{x: 20, y: 15}], // Initial position
    foods: [{x: 10, y: 10}],
    direction: {x: 1, y: 0},
    score: 0,
    directionScores: {
        'up': 0,
        'right': 0,
        'down': 0,
        'left': 0
    },
    directionAttempts: {
        'up': 0,
        'right': 0,
        'down': 0,
        'left': 0
    },
    directionChanges: 0,
    lastChangeTime: Date.now(),
    startTime: Date.now(),
    lastFoodTime: Date.now(),  // Last time food was added
    gridSize: 20,
    boardWidth: 40,  // 800/20
    boardHeight: 30,  // 600/20
    lastMoveTime: Date.now(),  // Last move time
    pendingMoves: 0,  // Number of pending moves
    maxMovesPerSecond: 1,  // Maximum 1 move per second
    deaths: 0,  // Death counter
    maxFoods: 10,  // Maximum 10 foods on board
    foodInterval: 30000  // Food generation interval (30 seconds)
};

// Store known transaction IDs
let knownTransactions = new Set();

// Game logic
function updateGame() {
    const now = Date.now();
    const timeSinceLastMove = now - gameState.lastMoveTime;
    
    // Check if need to generate new food
    if (gameState.foods.length === 0) {
        // If no food, generate one immediately
        const newFood = generateNewFood();
        if (newFood) {
            gameState.foods.push(newFood);
        }
        gameState.lastFoodTime = now;
    } else if (now - gameState.lastFoodTime >= gameState.foodInterval && gameState.foods.length < gameState.maxFoods) {
        // Try to generate new food every 30 seconds
        const newFood = generateNewFood();
        if (newFood) {
            gameState.foods.push(newFood);
        }
        gameState.lastFoodTime = now;
    }

    // Check if can move
    if (timeSinceLastMove >= (1000 / gameState.maxMovesPerSecond) && gameState.pendingMoves > 0) {
        // Move snake
        const newHead = {
            x: gameState.snake[0].x + gameState.direction.x,
            y: gameState.snake[0].y + gameState.direction.y
        };

        // Wall passing
        newHead.x = (newHead.x + gameState.boardWidth) % gameState.boardWidth;
        newHead.y = (newHead.y + gameState.boardHeight) % gameState.boardHeight;

        // Check self collision
        if (checkCollision(newHead)) {
            resetSnake();
            gameState.pendingMoves = Math.max(0, gameState.pendingMoves - 1);  // Ensure collision consumes a move
            return true;
        }

        // Check if food eaten
        const foodIndex = gameState.foods.findIndex(food => 
            food.x === newHead.x && food.y === newHead.y
        );

        if (foodIndex !== -1) {
            gameState.foods.splice(foodIndex, 1);
            gameState.score++;
            
            if (gameState.foods.length === 0) {
                const newFood = generateNewFood();
                if (newFood) {
                    gameState.foods.push(newFood);
                }
                gameState.lastFoodTime = now;
            }

            const currentDirName = getDirName(gameState.direction);
            gameState.directionScores[currentDirName] = (gameState.directionScores[currentDirName] || 0) + 1;
        } else {
            gameState.snake.pop();
        }

        gameState.snake.unshift(newHead);
        gameState.lastMoveTime = now;
        gameState.pendingMoves = Math.max(0, gameState.pendingMoves - 1);  // Use Math.max to prevent negative values

        if (now - gameState.lastChangeTime >= 5000) {
            changeDirection();
            gameState.lastChangeTime = now;
        }

        return true;
    }

    return false;
}

// Get direction name
function getDirName(dir) {
    if (dir.x === 1) return 'right';
    if (dir.x === -1) return 'left';
    if (dir.y === 1) return 'down';
    if (dir.y === -1) return 'up';
}

// Change direction
function changeDirection() {
    const possibleDirs = [
        {x: 1, y: 0},   // right
        {x: -1, y: 0},  // left
        {x: 0, y: 1},   // down
        {x: 0, y: -1}   // up
    ];

    // Randomly select new direction (excluding current direction)
    const currentDir = gameState.direction;
    const newDirs = possibleDirs.filter(dir => 
        !(dir.x === currentDir.x && dir.y === currentDir.y)
    );

    const randomDir = newDirs[Math.floor(Math.random() * newDirs.length)];
    const dirName = getDirName(randomDir);
    gameState.directionAttempts[dirName]++;
    gameState.direction = randomDir;
    gameState.directionChanges++;
}

function resetSnake() {
    // Keep direction weights and score unchanged
    const savedDirectionScores = {...gameState.directionScores};
    const savedDirectionAttempts = {...gameState.directionAttempts};
    const savedScore = gameState.score;
    const savedDeaths = gameState.deaths;
    
    // Reset snake position and length
    gameState.snake = [{x: 20, y: 15}];
    gameState.direction = {x: 1, y: 0};
    gameState.directionChanges = 0;
    gameState.lastChangeTime = Date.now();
    gameState.deaths = savedDeaths + 1;
    
    // Restore saved data
    gameState.directionScores = savedDirectionScores;
    gameState.directionAttempts = savedDirectionAttempts;
    gameState.score = savedScore;
    
    // Ensure at least one food on reset
    if (gameState.foods.length === 0) {
        const newFood = generateNewFood();
        if (newFood) {
            gameState.foods.push(newFood);
        }
        gameState.lastFoodTime = Date.now();
    }
}

function checkCollision(head) {
    // Check self collision (starting from second body segment)
    return gameState.snake.slice(1).some(segment => 
        segment.x === head.x && segment.y === head.y
    );
}

// Generate new food function
function generateNewFood() {
    if (gameState.foods.length >= gameState.maxFoods) {
        return null;  // If maximum food count reached, don't generate new food
    }

    let newFood;
    do {
        newFood = {
            x: Math.floor(Math.random() * gameState.boardWidth),
            y: Math.floor(Math.random() * gameState.boardHeight)
        };
    } while (
        gameState.snake.some(segment => segment.x === newFood.x && segment.y === newFood.y) ||
        gameState.foods.some(food => food.x === newFood.x && food.y === newFood.y)
    );
    return newFood;
}

app.use(cors());
app.use(express.json());
app.use(express.static('.')); // Serve static files

// Get game state
app.get('/api/state', (req, res) => {
    res.json(gameState);
});

// Add manual update function
app.post('/api/update-game', (req, res) => {
    updateGame();
    res.json(gameState);
});

// Modify token transaction API to trigger game update when new transactions are received
app.get('/api/token-transactions', async (req, res) => {
    try {
        const { address } = req.query;
        if (!address) {
            return res.status(400).json({ error: 'Token address is required' });
        }

        const response = await axios.get(`https://pro-api.solscan.io/v2.0/token/transfer`, {
            params: {
                address: address,
                page: 1,
                page_size: 10,
                sort_by: 'block_time',
                sort_order: 'desc'
            },
            headers: {
                'accept': 'application/json',
                'token': process.env.SOLSCAN_API_KEY
            },
            timeout: 5000
        });
        
        if (!response.data || !response.data.success) {
            return res.status(500).json({ error: 'Invalid response from Solscan API' });
        }

        const transactions = response.data.data.map(tx => ({
            signature: tx.trans_id,
            time: tx.time,
            from: tx.from_address,
            to: tx.to_address,
            amount: tx.value,
            isNew: !knownTransactions.has(tx.trans_id)
        }));

        // Find new transactions
        const newTransactions = transactions.filter(tx => !knownTransactions.has(tx.signature));
        
        // Update known transactions set
        newTransactions.forEach(tx => knownTransactions.add(tx.signature));

        // Add a pending move for each new transaction
        if (newTransactions.length > 0) {
            gameState.pendingMoves += newTransactions.length;
        }
        
        // Try to update game state
        updateGame();
        
        res.json({ 
            transactions,
            newTransactionsCount: newTransactions.length,
            pendingMoves: gameState.pendingMoves,
            tokenInfo: {
                name: response.data.metadata.tokens[address]?.token_name || 'Unknown',
                symbol: response.data.metadata.tokens[address]?.token_symbol || 'Unknown',
                icon: response.data.metadata.tokens[address]?.token_icon || ''
            },
            gameState
        });
    } catch (error) {
        console.error('Error details:', error);
        res.status(500).json({ 
            error: 'Failed to get token transactions',
            details: error.response?.data?.message || 'Please ensure SOLSCAN_API_KEY environment variable is set correctly'
        });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    
    // Add game loop to check for moves every 50ms
    setInterval(() => {
        if (gameState.pendingMoves > 0) {
            updateGame();
        }
    }, 50);
}); 