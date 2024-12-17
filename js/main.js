class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.canvas.width = 800;
        this.canvas.height = 600;
        
        this.snake = null;
        this.gridSize = 20;
        
        // 初始化神经网络可视化
        this.networkCanvas = document.getElementById('networkCanvas');
        this.networkCtx = this.networkCanvas.getContext('2d');
        
        // 开始定期获取状态
        this.startStatePolling();
    }

    startStatePolling() {
        // 每100ms获取一次状态
        setInterval(async () => {
            try {
                const response = await fetch('/api/state');
                const gameState = await response.json();
                this.updateGameState(gameState);
            } catch (error) {
                console.error('Error fetching game state:', error);
            }
        }, 100);
    }

    updateGameState(gameState) {
        // 更新游戏状态
        this.snake = {
            snake: gameState.snake,
            foods: gameState.foods,
            direction: gameState.direction,
            score: gameState.score
        };
        
        // 更新统计数据
        this.directionScores = gameState.directionScores;
        this.directionAttempts = gameState.directionAttempts;
        this.startTime = gameState.startTime;
        this.directionChanges = gameState.directionChanges;
        this.lastChangeTime = gameState.lastChangeTime;

        // 绘制游戏状态
        this.draw();
        this.updateStats();
        this.updateNeuralStats();
        this.drawNetwork();
    }

    draw() {
        const ctx = this.canvas.getContext('2d');
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 绘制食物
        ctx.fillStyle = '#ff0000';
        this.snake.foods.forEach(food => {
            ctx.fillRect(
                food.x * this.gridSize,
                food.y * this.gridSize,
                this.gridSize - 2,
                this.gridSize - 2
            );
        });

        // 绘制蛇
        ctx.fillStyle = '#33ff33';
        this.snake.snake.forEach((segment, i) => {
            ctx.fillRect(
                segment.x * this.gridSize,
                segment.y * this.gridSize,
                this.gridSize - 2,
                this.gridSize - 2
            );
        });
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
            const attempts = this.directionAttempts[dir] || 1;
            const successes = this.directionScores[dir] || 0;
            const rate = Math.round((successes / attempts) * 100);
            document.getElementById(`${dir}Success`).textContent = `${rate}%`;
        });
    }

    updateNeuralStats() {
        // 模拟神经网络数据
        const neuralMetrics = {
            entropy: (Math.sin(Date.now() / 1000) + 1) / 2,
            learningRate: 0.01 + Math.sin(Date.now() / 5000) * 0.005,
            networkLoss: Math.max(0, 1 - (this.snake.score * 0.1)),
            activation: Math.abs(Math.sin(Date.now() / 1000)),
            currentVector: [this.snake.direction.x, this.snake.direction.y],
            layerOutput: Array(4).fill(0).map(() => Math.random().toFixed(3)),
            gradient: Math.random() * 0.1,
            confidence: Math.min(100, this.snake.score * 10)
        };

        // 更新显示
        document.getElementById('entropy').textContent = neuralMetrics.entropy.toFixed(3);
        document.getElementById('learningRate').textContent = neuralMetrics.learningRate.toFixed(2);
        document.getElementById('mutationRate').textContent = '0.05';
        document.getElementById('networkLoss').textContent = neuralMetrics.networkLoss.toFixed(3);
        document.getElementById('activation').textContent = neuralMetrics.activation.toFixed(2);
        document.getElementById('currentVector').textContent = 
            `[${neuralMetrics.currentVector.map(v => v.toFixed(1)).join(', ')}]`;
        document.getElementById('layerOutput').textContent = 
            `[${neuralMetrics.layerOutput.join(', ')}]`;
        document.getElementById('gradient').textContent = neuralMetrics.gradient.toFixed(3);
        document.getElementById('confidence').textContent = 
            `${Math.round(neuralMetrics.confidence)}%`;
    }

    drawNetwork() {
        const ctx = this.networkCtx;
        ctx.clearRect(0, 0, this.networkCanvas.width, this.networkCanvas.height);

        // 绘制连接线
        ctx.lineWidth = 0.5;
        
        // 定义节点位置
        const nodes = {
            input: Array(24).fill(0).map((_, i) => ({
                x: 50,
                y: 30 + i * 20
            })),
            hidden: Array(16).fill(0).map((_, i) => ({
                x: 150,
                y: 100 + i * 25
            })),
            output: Array(4).fill(0).map((_, i) => ({
                x: 250,
                y: 250 + i * 40
            }))
        };

        // 绘制连接
        nodes.input.forEach(input => {
            nodes.hidden.forEach(hidden => {
                ctx.beginPath();
                ctx.strokeStyle = Math.random() > 0.5 ? '#ff0000' : '#0000ff';
                ctx.globalAlpha = 0.2;
                ctx.moveTo(input.x, input.y);
                ctx.lineTo(hidden.x, hidden.y);
                ctx.stroke();
            });
        });

        nodes.hidden.forEach(hidden => {
            nodes.output.forEach(output => {
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
        
        // 输入节点
        nodes.input.forEach((node, i) => {
            ctx.beginPath();
            ctx.fillStyle = i % 3 === 0 ? '#33ff33' : '#ffffff';
            ctx.arc(node.x, node.y, 5, 0, Math.PI * 2);
            ctx.fill();
        });

        // 隐藏节点
        nodes.hidden.forEach(node => {
            ctx.beginPath();
            ctx.fillStyle = '#ffffff';
            ctx.arc(node.x, node.y, 5, 0, Math.PI * 2);
            ctx.fill();
        });

        // 输出节点
        ctx.fillStyle = '#ffffff';
        nodes.output.forEach((node, i) => {
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
        ctx.fillText(`SCORE: ${this.snake ? this.snake.score : 0}`, 20, this.networkCanvas.height - 40);
    }
}

// 初始化游戏
const game = new Game();