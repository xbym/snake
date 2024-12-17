const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// 蛇的游戏状态
let gameState = {
    snake: [{x: 20, y: 15}], // 初始位置
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
    lastFoodTime: Date.now(),  // 上次添加食物的时间
    gridSize: 20,
    boardWidth: 40,  // 800/20
    boardHeight: 30,  // 600/20
    lastMoveTime: Date.now(),  // 上次移动时间
    pendingMoves: 0,  // 待处理的移动次数
    maxMovesPerSecond: 2,  // 每秒最大移动次数
    deaths: 0,  // 添加死亡计数
    maxFoods: 3,  // 修改最大食物数量为3
    foodInterval: 30000  // 食物生成间隔（30秒）
};

// 存储已知的交易ID
let knownTransactions = new Set();

// 游戏逻辑
function updateGame() {
    const now = Date.now();
    const timeSinceLastMove = now - gameState.lastMoveTime;
    
    // 检查是否需要生成新食物
    if (gameState.foods.length === 0) {
        // 如果没有食物，立即生成一个
        const newFood = generateNewFood();
        if (newFood) {
            gameState.foods.push(newFood);
        }
        gameState.lastFoodTime = now;
    } else if (now - gameState.lastFoodTime >= gameState.foodInterval && gameState.foods.length < gameState.maxFoods) {
        // 每30秒尝试生成一个新食物
        const newFood = generateNewFood();
        if (newFood) {
            gameState.foods.push(newFood);
        }
        gameState.lastFoodTime = now;
    }

    // 检查是否可以移动
    if (timeSinceLastMove >= (1000 / gameState.maxMovesPerSecond) && gameState.pendingMoves > 0) {
        // 移动蛇
        const newHead = {
            x: gameState.snake[0].x + gameState.direction.x,
            y: gameState.snake[0].y + gameState.direction.y
        };

        // 穿墙
        newHead.x = (newHead.x + gameState.boardWidth) % gameState.boardWidth;
        newHead.y = (newHead.y + gameState.boardHeight) % gameState.boardHeight;

        // 检查自身碰撞
        if (checkCollision(newHead)) {
            resetSnake();
            return true;
        }

        // 检查是否吃到食物
        const foodIndex = gameState.foods.findIndex(food => 
            food.x === newHead.x && food.y === newHead.y
        );

        if (foodIndex !== -1) {
            // 吃到食物
            gameState.foods.splice(foodIndex, 1);
            gameState.score++;
            // 如果没有食物了，立即生成一个新的
            if (gameState.foods.length === 0) {
                const newFood = generateNewFood();
                if (newFood) {
                    gameState.foods.push(newFood);
                }
                gameState.lastFoodTime = now;
            }

            // 更新方向得分
            const currentDirName = getDirName(gameState.direction);
            gameState.directionScores[currentDirName] = (gameState.directionScores[currentDirName] || 0) + 1;
        } else {
            // 没吃到食物，删除尾部
            gameState.snake.pop();
        }

        // 添加新头部
        gameState.snake.unshift(newHead);
        gameState.lastMoveTime = now;
        gameState.pendingMoves--;

        // 每5秒改变一次方向
        if (now - gameState.lastChangeTime >= 5000) {
            changeDirection();
            gameState.lastChangeTime = now;
        }

        return true;  // 移动成功
    }

    return false;  // 未移动
}

// 获取方向名称
function getDirName(dir) {
    if (dir.x === 1) return 'right';
    if (dir.x === -1) return 'left';
    if (dir.y === 1) return 'down';
    if (dir.y === -1) return 'up';
}

// 改变方向
function changeDirection() {
    const possibleDirs = [
        {x: 1, y: 0},   // 右
        {x: -1, y: 0},  // 左
        {x: 0, y: 1},   // 下
        {x: 0, y: -1}   // 上
    ];

    // 随机选择一个新方向（排除当前方向）
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
    // 保持方向权重和分数不变
    const savedDirectionScores = {...gameState.directionScores};
    const savedDirectionAttempts = {...gameState.directionAttempts};
    const savedScore = gameState.score;
    const savedDeaths = gameState.deaths;
    
    // 重置蛇的位置和长度
    gameState.snake = [{x: 20, y: 15}];
    gameState.direction = {x: 1, y: 0};
    gameState.directionChanges = 0;
    gameState.lastChangeTime = Date.now();
    gameState.deaths = savedDeaths + 1;
    
    // 恢复保存的数据
    gameState.directionScores = savedDirectionScores;
    gameState.directionAttempts = savedDirectionAttempts;
    gameState.score = savedScore;
    
    // 重置时确保至少有一个食物
    if (gameState.foods.length === 0) {
        const newFood = generateNewFood();
        if (newFood) {
            gameState.foods.push(newFood);
        }
        gameState.lastFoodTime = Date.now();
    }
}

function checkCollision(head) {
    // 检查是否与自身碰撞（从第二个身体段开始检查）
    return gameState.snake.slice(1).some(segment => 
        segment.x === head.x && segment.y === head.y
    );
}

// 生成新食物的函数
function generateNewFood() {
    if (gameState.foods.length >= gameState.maxFoods) {
        return null;  // 如果已达到最大食物数量，不生成新食物
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
app.use(express.static('.')); // 服务静态文件

// 获取游戏状态
app.get('/api/state', (req, res) => {
    res.json(gameState);
});

// 添加手动更新函数
app.post('/api/update-game', (req, res) => {
    updateGame();
    res.json(gameState);
});

// 修改代币交易API，使其在获取新交易时触发游戏更新
app.get('/api/token-transactions', async (req, res) => {
    try {
        const { address } = req.query;
        if (!address) {
            return res.status(400).json({ error: '需要提供代币地址' });
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
            return res.status(500).json({ error: 'Solscan API 返回了无效的响应' });
        }

        const transactions = response.data.data.map(tx => ({
            signature: tx.trans_id,
            time: tx.time,
            from: tx.from_address,
            to: tx.to_address,
            amount: tx.value,
            isNew: !knownTransactions.has(tx.trans_id)
        }));

        // 找出新交易
        const newTransactions = transactions.filter(tx => !knownTransactions.has(tx.signature));
        
        // 更新已知交易集合
        newTransactions.forEach(tx => knownTransactions.add(tx.signature));

        // 为每个新交易添加一个待处理的移动
        gameState.pendingMoves += newTransactions.length;
        
        // 尝试更新游戏状态
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
        console.error('错误详情:', error);
        res.status(500).json({ 
            error: '获取代币交易失败',
            details: error.response?.data?.message || '请确保已设置正确的 SOLSCAN_API_KEY 环境变量'
        });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    
    // 添加游戏循环，每50毫秒检查一次是否需要移动
    setInterval(() => {
        if (gameState.pendingMoves > 0) {
            updateGame();
        }
    }, 50);
}); 