class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.canvas.width = 800;
        this.canvas.height = 600;
        
        this.snake = null;
        this.gridSize = 20;
        
        // Initialize neural network visualization
        this.networkCanvas = document.getElementById('networkCanvas');
        this.networkCtx = this.networkCanvas.getContext('2d');
        
        // Start periodic state polling
        this.startStatePolling();
        
        // Start transaction polling
        this.startTransactionPolling();

        // Set GitHub link
        const githubButton = document.querySelector('.social-button.github');
        if (githubButton) {
            githubButton.href = 'https://github.com/xbym/snake';
        }
    }

    startStatePolling() {
        // Get state every 100ms
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

    startTransactionPolling() {
        // Poll for new transactions every second
        setInterval(async () => {
            try {
                const response = await fetch('/api/token-transactions?address=2zMMhcVQEXDtdE6vsFS7S7D5oUodfJHE8vd1gnBouauv');
                const data = await response.json();
                this.updateTransactions(data.transactions);
            } catch (error) {
                console.error('Error fetching transactions:', error);
            }
        }, 1000);
    }

    updateGameState(gameState) {
        // Update game state
        this.snake = {
            snake: gameState.snake,
            foods: gameState.foods,
            direction: gameState.direction,
            score: gameState.score
        };
        
        // Update statistics
        this.directionScores = gameState.directionScores;
        this.directionAttempts = gameState.directionAttempts;
        this.startTime = gameState.startTime;
        this.directionChanges = gameState.directionChanges;
        this.lastChangeTime = gameState.lastChangeTime;

        // Draw game state
        this.draw();
        this.updateStats();
        this.updateNeuralStats();
        this.drawNetwork();
    }

    updateTransactions(transactions) {
        const hashList = document.getElementById('hashList');
        if (!hashList) return;

        // Display transactions with highlighting for new ones
        hashList.innerHTML = transactions.map(tx => `
            <div class="hash-item ${tx.isNew ? 'new-transaction' : ''}">
                ${tx.signature}
            </div>
        `).join('');
    }

    draw() {
        const ctx = this.canvas.getContext('2d');
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw food
        ctx.fillStyle = '#ff0000';
        this.snake.foods.forEach(food => {
            ctx.fillRect(
                food.x * this.gridSize,
                food.y * this.gridSize,
                this.gridSize - 2,
                this.gridSize - 2
            );
        });

        // Draw snake
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
        // Basic statistics
        document.getElementById('score').textContent = this.snake.score;
        document.getElementById('length').textContent = this.snake.snake.length;
        
        // Survival time
        if (this.startTime) {
            const aliveTime = Math.floor((Date.now() - this.startTime) / 1000);
            document.getElementById('timeAlive').textContent = aliveTime;
        }
        
        // Direction change count
        document.getElementById('changes').textContent = this.directionChanges;
        
        // Direction success rates
        ['up', 'right', 'down', 'left'].forEach(dir => {
            const attempts = this.directionAttempts[dir] || 1;
            const successes = this.directionScores[dir] || 0;
            const rate = Math.round((successes / attempts) * 100);
            document.getElementById(`${dir}Success`).textContent = `${rate}%`;
        });
    }

    updateNeuralStats() {
        // Simulate neural network data
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

        // Update display
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

        // Draw connections
        ctx.lineWidth = 0.5;
        
        // Define node positions
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

        // Draw connections
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

        // Draw nodes
        ctx.globalAlpha = 1;
        
        // Input nodes
        nodes.input.forEach((node, i) => {
            ctx.beginPath();
            ctx.fillStyle = i % 3 === 0 ? '#33ff33' : '#ffffff';
            ctx.arc(node.x, node.y, 5, 0, Math.PI * 2);
            ctx.fill();
        });

        // Hidden nodes
        nodes.hidden.forEach(node => {
            ctx.beginPath();
            ctx.fillStyle = '#ffffff';
            ctx.arc(node.x, node.y, 5, 0, Math.PI * 2);
            ctx.fill();
        });

        // Output nodes
        ctx.fillStyle = '#ffffff';
        nodes.output.forEach((node, i) => {
            ctx.beginPath();
            ctx.arc(node.x, node.y, 5, 0, Math.PI * 2);
            ctx.fill();
            
            // Add labels
            ctx.fillStyle = '#33ff33';
            ctx.font = '12px monospace';
            const labels = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
            ctx.fillText(labels[i], node.x + 10, node.y + 5);
        });

        // Add other information
        ctx.fillStyle = '#33ff33';
        ctx.font = '12px monospace';
        ctx.fillText(`GEN: ${Math.floor(Date.now() / 5000)}`, 20, 20);
        ctx.fillText(`SCORE: ${this.snake ? this.snake.score : 0}`, 20, this.networkCanvas.height - 40);
    }
}

// Initialize game
const game = new Game();