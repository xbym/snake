class Snake {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.gridSize = 20;
        
        // Set initial position at the center of canvas
        const startX = Math.floor(canvas.width / (2 * this.gridSize));
        const startY = Math.floor(canvas.height / (2 * this.gridSize));
        
        // Initialize snake body
        this.snake = [{x: startX, y: startY}];
        // Initial direction is right
        this.direction = {x: 1, y: 0};
        this.foods = [{x: 10, y: 10}];  // Changed to food array
        this.lastFoodTime = Date.now();  // Record last food addition time
        this.FOOD_ADD_INTERVAL = 30000;  // 30 seconds
        this.MAX_FOODS = 10;  // Maximum 10 foods on board
        this.score = 0;
    }

    generateFood() {
        if (this.foods.length >= this.MAX_FOODS) {
            return null;  // If maximum food count reached, don't generate new food
        }

        let food;
        do {
            food = {
                x: Math.floor(Math.random() * (this.canvas.width / this.gridSize)),
                y: Math.floor(Math.random() * (this.canvas.height / this.gridSize))
            };
        } while (
            this.snake.some(segment => segment.x === food.x && segment.y === food.y) ||
            this.foods.some(f => f.x === food.x && f.y === food.y)  // Ensure new food doesn't overlap with existing food
        );
        return food;
    }

    update() {
        // Update snake position
        const head = {
            x: this.snake[0].x + this.direction.x,
            y: this.snake[0].y + this.direction.y
        };

        // Wall passing logic
        const gridWidth = this.canvas.width / this.gridSize;
        const gridHeight = this.canvas.height / this.gridSize;

        if (head.x < 0) head.x = gridWidth - 1;
        else if (head.x >= gridWidth) head.x = 0;
        if (head.y < 0) head.y = gridHeight - 1;
        else if (head.y >= gridHeight) head.y = 0;

        this.snake.unshift(head);

        // Check if any food is eaten
        let foodEaten = false;
        this.foods = this.foods.filter(food => {
            if (head.x === food.x && head.y === food.y) {
                foodEaten = true;
                this.score += 1;
                return false;  // Remove eaten food
            }
            return true;  // Keep uneaten food
        });

        // If food is eaten, don't remove tail (snake grows)
        if (!foodEaten) {
            this.snake.pop();
        }

        // Add new food every 15 seconds when snake length is less than 10
        const now = Date.now();
        if (this.snake.length < 10 && now - this.lastFoodTime >= this.FOOD_ADD_INTERVAL) {
            this.foods.push(this.generateFood());
            this.lastFoodTime = now;
        }

        // Ensure at least one food exists
        if (this.foods.length === 0) {
            this.foods.push(this.generateFood());
        }
    }

    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid (optional)
        this.ctx.strokeStyle = '#eee';
        for (let i = 0; i < this.canvas.width; i += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(i, 0);
            this.ctx.lineTo(i, this.canvas.height);
            this.ctx.stroke();
        }
        for (let i = 0; i < this.canvas.height; i += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, i);
            this.ctx.lineTo(this.canvas.width, i);
            this.ctx.stroke();
        }
        
        // Draw snake
        this.ctx.fillStyle = 'green';
        this.snake.forEach((segment, index) => {
            this.ctx.fillRect(
                segment.x * this.gridSize + 1,
                segment.y * this.gridSize + 1,
                this.gridSize - 2,
                this.gridSize - 2
            );
            
            // Draw snake head
            if (index === 0) {
                this.ctx.fillStyle = 'darkgreen';
                this.ctx.fillRect(
                    segment.x * this.gridSize + 1,
                    segment.y * this.gridSize + 1,
                    this.gridSize - 2,
                    this.gridSize - 2
                );
            }
        });

        // Draw all food
        this.ctx.fillStyle = 'red';
        this.foods.forEach(food => {
            this.ctx.fillRect(
                food.x * this.gridSize + 1,
                food.y * this.gridSize + 1,
                this.gridSize - 2,
                this.gridSize - 2
            );
        });
    }

    // Add visual perception method
    vision() {
        let inputs = [];
        // Visual inputs for 8 directions
        const directions = [
            {x: 0, y: -1},  // Up
            {x: 1, y: -1},  // Up-Right
            {x: 1, y: 0},   // Right
            {x: 1, y: 1},   // Down-Right
            {x: 0, y: 1},   // Down
            {x: -1, y: 1},  // Down-Left
            {x: -1, y: 0},  // Left
            {x: -1, y: -1}  // Up-Left
        ];

        // Check three conditions for each direction: wall, food, self
        directions.forEach(dir => {
            inputs.push(this.lookInDirection(dir, 'wall'));
            inputs.push(this.lookInDirection(dir, 'food'));
            inputs.push(this.lookInDirection(dir, 'self'));
        });

        return inputs;
    }

    lookInDirection(direction, type) {
        let pos = {...this.snake[0]};
        let distance = 0;
        
        while (true) {
            pos.x += direction.x;
            pos.y += direction.y;
            distance++;

            // Check for wall collision
            if (pos.x < 0 || pos.x >= this.canvas.width/this.gridSize || 
                pos.y < 0 || pos.y >= this.canvas.height/this.gridSize) {
                if (type === 'wall') return 1/distance;
                break;
            }

            // Check for food
            if (type === 'food' && pos.x === this.food.x && pos.y === this.food.y) {
                return 1/distance;
            }

            // Check for self collision
            if (type === 'self' && this.snake.some(s => s.x === pos.x && s.y === pos.y)) {
                return 1/distance;
            }
        }
        return 0;
    }

    isDead() {
        const head = this.snake[0];
        
        // Wall collision detection
        if (head.x < 0 || head.x >= this.canvas.width/this.gridSize || 
            head.y < 0 || head.y >= this.canvas.height/this.gridSize) {
            return true;
        }
        
        // Self collision detection
        for (let i = 1; i < this.snake.length; i++) {
            if (head.x === this.snake[i].x && head.y === this.snake[i].y) {
                return true;
            }
        }
        
        return false;
    }

    setDirection(direction) {
        // Prevent snake from moving in opposite direction
        const opposites = {
            'up': 'down',
            'down': 'up',
            'left': 'right',
            'right': 'left'
        };

        // Get current direction
        let currentDirection = '';
        if (this.direction.x === 1) currentDirection = 'right';
        if (this.direction.x === -1) currentDirection = 'left';
        if (this.direction.y === 1) currentDirection = 'down';
        if (this.direction.y === -1) currentDirection = 'up';

        // Ignore if opposite direction
        if (opposites[direction] === currentDirection) {
            return;
        }

        const directions = {
            'up': {x: 0, y: -1},
            'right': {x: 1, y: 0},
            'down': {x: 0, y: 1},
            'left': {x: -1, y: 0}
        };

        if (directions[direction]) {
            this.direction = directions[direction];
        }
    }
} 