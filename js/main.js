class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.canvas.width = 800;
        this.canvas.height = 600;
        
        this.snake = null;
        this.isPlaying = false;
        this.speed = 150;
        
        // 初始化神经网络
        this.brain = new NeuralNetwork(24, 16, 4);
        // 设置预训练权重
        this.brain.setPreTrainedWeights();
        
        // 方向相关的变量
        this.lastChangeTime = Date.now();
        this.directionScores = {
            'up': 0,
            'right': 0,
            'down': 0,
            'left': 0
        };
        this.DIRECTION_CHANGE_INTERVAL = 5000;
        
        // 添加新的统计数据
        this.startTime = null;
        this.directionChanges = 0;
        this.directionAttempts = {
            'up': 0, 'right': 0, 'down': 0, 'left': 0
        };
        
        this.setupSaveLoad();
        
        // 添加神经网络模拟数据
        this.neuralMetrics = {
            entropy: 0,
            learningRate: 0.01,
            mutationRate: 0.05,
            networkLoss: 0,
            activation: 0,
            currentVector: [0, 0],
            biasWeights: Array(16).fill(0).map(() => Math.random()),
            layerOutput: Array(4).fill(0),
            gradient: 0,
            confidence: 0
        };
        
        // 添加网络可视化相关
        this.networkCanvas = document.getElementById('networkCanvas');
        this.networkCtx = this.networkCanvas.getContext('2d');
        
        // 网络节点位置
        this.nodes = {
            input: Array(24).fill(0).map((_, i) => ({
                x: 50,
                y: 30 + i * 20,
                value: 0
            })),
            hidden: Array(16).fill(0).map((_, i) => ({
                x: 150,
                y: 100 + i * 25,
                value: 0
            })),
            output: Array(4).fill(0).map((_, i) => ({
                x: 250,
                y: 250 + i * 40,
                value: 0
            }))
        };
    }

    start() {
        if (!this.snake) {
            this.snake = new Snake(this.canvas);
        }
        this.isPlaying = true;
        this.startTime = Date.now();
        this.gameLoop();
    }

    pause() {
        this.isPlaying = false;
    }

    gameLoop() {
        if (!this.isPlaying) return;

        if (this.snake) {
            const oldScore = this.snake.score;
            
            // 调用改变方向的逻辑
            this.changeDirection();
            
            // 更新蛇的位置
            this.snake.update();
            
            // 检查是否吃到食物
            if (this.snake.score > oldScore) {
                this.onFoodEaten();
            }

            // 更新显示
            this.snake.draw();
            this.updateStats();
            this.updateNeuralStats();  // 添加神经网络数据更新
            
            // 添加网络可视化更新
            this.drawNetwork();
        }
        
        setTimeout(() => requestAnimationFrame(() => this.gameLoop()), this.speed);
    }

    // 获取下一个位置
    getNextPosition() {
        return {
            x: this.snake.snake[0].x + this.snake.direction.x,
            y: this.snake.snake[0].y + this.snake.direction.y
        };
    }

    // 检查是否会碰撞
    willCollide(nextHead) {
        // 只检查是否会撞到自己
        return this.snake.snake.some(segment => 
            segment.x === nextHead.x && segment.y === nextHead.y
        );
    }

    // 改变方向
    changeDirection() {
        const currentDir = this.snake.direction;
        const head = this.snake.snake[0];

        // 可能的方向
        const possibleDirs = [
            {x: 1, y: 0},   // 右
            {x: -1, y: 0},  // 左
            {x: 0, y: 1},   // 下
            {x: 0, y: -1}   // 上
        ];

        // 过滤掉会导致碰撞的方向
        const validDirs = possibleDirs.filter(dir => {
            const nextPos = {
                x: head.x + dir.x,
                y: head.y + dir.y
            };
            return !this.willCollide(nextPos);
        });

        if (validDirs.length === 0) return;

        // 检查是否需要改变方向（每5秒）
        const now = Date.now();
        if (now - this.lastChangeTime >= this.DIRECTION_CHANGE_INTERVAL) {
            console.log("Changing direction after 5 seconds");
            // 随机选择一个新方向（排除当前方向）
            const newDirs = validDirs.filter(dir => 
                !(dir.x === currentDir.x && dir.y === currentDir.y)
            );
            if (newDirs.length > 0) {
                const randomDir = newDirs[Math.floor(Math.random() * newDirs.length)];
                const dirName = this.getDirName(randomDir);
                this.directionAttempts[dirName]++;
                this.snake.direction = randomDir;
                this.directionChanges++;  // 增加方向改变计数
            } else {
                const randomDir = validDirs[Math.floor(Math.random() * validDirs.length)];
                const dirName = this.getDirName(randomDir);
                this.directionAttempts[dirName]++;
                this.snake.direction = randomDir;
                this.directionChanges++;  // 增加方向改变计数
            }
            this.lastChangeTime = now;
            return;
        }

        // 在5秒内保持当前方向
        this.snake.direction = currentDir;
    }

    // 获取方向名称
    getDirName(dir) {
        if (dir.x === 1) return 'right';
        if (dir.x === -1) return 'left';
        if (dir.y === 1) return 'down';
        if (dir.y === -1) return 'up';
    }

    // 在蛇吃到食物时调用
    onFoodEaten() {
        // 获取当前方向名称
        const currentDirName = this.getDirName(this.snake.direction);
        // 增加该方向的得分
        this.directionScores[currentDirName] = (this.directionScores[currentDirName] || 0) + 1;
        console.log(`Direction ${currentDirName} success! Score: ${this.directionScores[currentDirName]}/${this.directionAttempts[currentDirName]}`);
    }

    // 检查某个位置在未来的可移动空间
    checkFutureSpace(pos) {
        const visited = new Set();
        const queue = [pos];
        
        while (queue.length > 0) {
            const current = queue.shift();
            const key = `${current.x},${current.y}`;
            
            if (visited.has(key)) continue;
            visited.add(key);
            
            // 检查四个方向
            [{x: 1, y: 0}, {x: -1, y: 0}, {x: 0, y: 1}, {x: 0, y: -1}].forEach(dir => {
                const next = {
                    x: current.x + dir.x,
                    y: current.y + dir.y
                };
                
                // 如��这个方向可以移动且未访问过
                if (!this.willCollide(next) && !visited.has(`${next.x},${next.y}`)) {
                    queue.push(next);
                }
            });
            
            // 限制搜索范围，避免计算过多
            if (visited.size > 50) break;
        }
        
        return visited.size; // 返回可到达的格子数量
    }

    updateDirection(output) {
        // 找出最大值的索引
        let maxIndex = 0;
        let maxValue = output[0];
        for (let i = 1; i < output.length; i++) {
            if (output[i] > maxValue) {
                maxValue = output[i];
                maxIndex = i;
            }
        }

        // 将索引转换为方向
        const directions = ['up', 'right', 'down', 'left'];
        this.snake.setDirection(directions[maxIndex]);
    }

    updateStats() {
        // 基础统计
        document.getElementById('score').textContent = this.snake.score;
        document.getElementById('length').textContent = this.snake.snake.length;
        
        // 存活时间
        if (this.startTime) {
            const aliveTime = Math.floor((Date.now() - this.startTime) / 1000);
            document.getElementById('timeAlive').textContent = aliveTime;
        }
        
        // 方向改变次数
        document.getElementById('changes').textContent = this.directionChanges;
        
        // 方向成功率
        ['up', 'right', 'down', 'left'].forEach(dir => {
            const attempts = this.directionAttempts[dir] || 1; // 避免除以0
            const successes = this.directionScores[dir] || 0;
            const rate = Math.round((successes / attempts) * 100);
            document.getElementById(`${dir}Success`).textContent = `${rate}%`;
        });
    }

    // 添加保存和加载功能
    setupSaveLoad() {
        document.getElementById('saveGame').onclick = () => this.saveGame();
        document.getElementById('loadGame').onclick = () => this.loadGame();
    }

    saveGame() {
        if (!this.snake) return;

        const gameState = {
            snake: this.snake.snake,
            foods: this.snake.foods,
            direction: this.snake.direction,
            score: this.snake.score,
            directionScores: this.directionScores,
            directionAttempts: this.directionAttempts,
            startTime: this.startTime,
            directionChanges: this.directionChanges,
            lastChangeTime: this.lastChangeTime
        };

        localStorage.setItem('snakeGameState', JSON.stringify(gameState));
        console.log('Game saved!');
    }

    loadGame() {
        const savedState = localStorage.getItem('snakeGameState');
        if (!savedState) {
            console.log('No saved game found!');
            return;
        }

        const gameState = JSON.parse(savedState);
        
        // 创建新的蛇实例
        this.snake = new Snake(this.canvas);
        
        // 恢复蛇的状态
        this.snake.snake = gameState.snake;
        this.snake.foods = gameState.foods;
        this.snake.direction = gameState.direction;
        this.snake.score = gameState.score;
        
        // 恢复游戏统计数据
        this.directionScores = gameState.directionScores;
        this.directionAttempts = gameState.directionAttempts;
        this.startTime = gameState.startTime;
        this.directionChanges = gameState.directionChanges;
        this.lastChangeTime = gameState.lastChangeTime;

        // 更新显示
        this.snake.draw();
        this.updateStats();
        console.log('Game loaded!');
    }

    updateNeuralStats() {
        // 更新熵值（模拟神经网络的不确定性）
        this.neuralMetrics.entropy = (Math.sin(Date.now() / 1000) + 1) / 2;
        
        // 更新学习率（随时间缓慢变化）
        this.neuralMetrics.learningRate = 0.01 + Math.sin(Date.now() / 5000) * 0.005;
        
        // 更新网络损失（随分数改变）
        this.neuralMetrics.networkLoss = Math.max(0, 1 - (this.snake.score * 0.1));
        
        // 更新激活值（基于当前方向）
        this.neuralMetrics.activation = Math.abs(Math.sin(Date.now() / 1000));
        
        // 更新当前向量（基于蛇的移动方向）
        this.neuralMetrics.currentVector = [
            this.snake.direction.x,
            this.snake.direction.y
        ];
        
        // 更新层输出（模拟神经网络输出）
        this.neuralMetrics.layerOutput = Array(4).fill(0).map(() => 
            Math.random().toFixed(3)
        );
        
        // 更新梯度
        this.neuralMetrics.gradient = Math.random() * 0.1;
        
        // 更新置信度（基于当前得分）
        this.neuralMetrics.confidence = Math.min(100, this.snake.score * 10);

        // 更新显示
        document.getElementById('entropy').textContent = this.neuralMetrics.entropy.toFixed(3);
        document.getElementById('learningRate').textContent = this.neuralMetrics.learningRate.toFixed(2);
        document.getElementById('mutationRate').textContent = this.neuralMetrics.mutationRate.toFixed(2);
        document.getElementById('networkLoss').textContent = this.neuralMetrics.networkLoss.toFixed(3);
        document.getElementById('activation').textContent = this.neuralMetrics.activation.toFixed(2);
        document.getElementById('currentVector').textContent = 
            `[${this.neuralMetrics.currentVector.map(v => v.toFixed(1)).join(', ')}]`;
        document.getElementById('biasWeights').textContent = 
            `[${this.neuralMetrics.biasWeights.slice(0, 3).map(v => v.toFixed(2)).join(', ')}...]`;
        document.getElementById('layerOutput').textContent = 
            `[${this.neuralMetrics.layerOutput.map(v => v).join(', ')}]`;
        document.getElementById('gradient').textContent = this.neuralMetrics.gradient.toFixed(3);
        document.getElementById('confidence').textContent = 
            `${Math.round(this.neuralMetrics.confidence)}%`;
    }

    drawNetwork() {
        const ctx = this.networkCtx;
        ctx.clearRect(0, 0, this.networkCanvas.width, this.networkCanvas.height);

        // 绘制连接线
        ctx.lineWidth = 0.5;
        
        // 输入层到隐藏层的连接
        this.nodes.input.forEach(input => {
            this.nodes.hidden.forEach(hidden => {
                ctx.beginPath();
                ctx.strokeStyle = Math.random() > 0.5 ? '#ff0000' : '#0000ff';
                ctx.globalAlpha = 0.2;
                ctx.moveTo(input.x, input.y);
                ctx.lineTo(hidden.x, hidden.y);
                ctx.stroke();
            });
        });

        // 隐藏层到输出层的连接
        this.nodes.hidden.forEach(hidden => {
            this.nodes.output.forEach(output => {
                ctx.beginPath();
                ctx.strokeStyle = Math.random() > 0.5 ? '#ff0000' : '#0000ff';
                ctx.globalAlpha = 0.2;
                ctx.moveTo(hidden.x, hidden.y);
                ctx.lineTo(output.x, output.y);
                ctx.stroke();
            });
        });

        // 绘制节点
        ctx.globalAlpha = 1;
        
        // 绘制输入节点
        this.nodes.input.forEach((node, i) => {
            ctx.beginPath();
            ctx.fillStyle = i % 3 === 0 ? '#33ff33' : '#ffffff';
            ctx.arc(node.x, node.y, 5, 0, Math.PI * 2);
            ctx.fill();
        });

        // 绘制隐藏节点
        this.nodes.hidden.forEach(node => {
            ctx.beginPath();
            ctx.fillStyle = '#ffffff';
            ctx.arc(node.x, node.y, 5, 0, Math.PI * 2);
            ctx.fill();
        });

        // 绘制输出节点
        ctx.fillStyle = '#ffffff';
        this.nodes.output.forEach((node, i) => {
            ctx.beginPath();
            ctx.arc(node.x, node.y, 5, 0, Math.PI * 2);
            ctx.fill();
            
            // 添加标签
            ctx.fillStyle = '#33ff33';
            ctx.font = '12px monospace';
            const labels = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
            ctx.fillText(labels[i], node.x + 10, node.y + 5);
        });

        // 添加其他信息
        ctx.fillStyle = '#33ff33';
        ctx.font = '12px monospace';
        ctx.fillText(`GEN: ${Math.floor(Date.now() / 5000)}`, 20, 20);
        ctx.fillText(`MUTATION RATE: ${this.neuralMetrics.mutationRate.toFixed(1)}%`, 20, 40);
        ctx.fillText(`SCORE: ${this.snake ? this.snake.score : 0}`, 20, this.networkCanvas.height - 40);
    }
}

// 初始化游戏
const game = new Game();
document.getElementById('startGame').onclick = () => game.start();
document.getElementById('pauseGame').onclick = () => game.pause();