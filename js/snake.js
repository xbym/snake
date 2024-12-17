class Snake {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.gridSize = 20;
        
        // 设置初始位置在画布中间
        const startX = Math.floor(canvas.width / (2 * this.gridSize));
        const startY = Math.floor(canvas.height / (2 * this.gridSize));
        
        // 初始化蛇的身体
        this.snake = [{x: startX, y: startY}];
        // 初始方向向右
        this.direction = {x: 1, y: 0};
        this.foods = [{x: 10, y: 10}];  // 改为食物数组
        this.lastFoodTime = Date.now();  // 记录上次添加食物的时间
        this.FOOD_ADD_INTERVAL = 15000;  // 15秒
        this.score = 0;
    }

    generateFood() {
        let food;
        do {
            food = {
                x: Math.floor(Math.random() * (this.canvas.width / this.gridSize)),
                y: Math.floor(Math.random() * (this.canvas.height / this.gridSize))
            };
        } while (
            this.snake.some(segment => segment.x === food.x && segment.y === food.y) ||
            this.foods.some(f => f.x === food.x && f.y === food.y)  // 确保新食物不会与现有食物重叠
        );
        return food;
    }

    update() {
        // 更新蛇的位置
        const head = {
            x: this.snake[0].x + this.direction.x,
            y: this.snake[0].y + this.direction.y
        };

        // 穿墙处理
        const gridWidth = this.canvas.width / this.gridSize;
        const gridHeight = this.canvas.height / this.gridSize;

        if (head.x < 0) head.x = gridWidth - 1;
        else if (head.x >= gridWidth) head.x = 0;
        if (head.y < 0) head.y = gridHeight - 1;
        else if (head.y >= gridHeight) head.y = 0;

        this.snake.unshift(head);

        // 检查是否吃到任何食物
        let foodEaten = false;
        this.foods = this.foods.filter(food => {
            if (head.x === food.x && head.y === food.y) {
                foodEaten = true;
                this.score += 1;
                return false;  // 移除被吃掉的食物
            }
            return true;  // 保留未被吃掉的食物
        });

        // 如果吃到食物，不移除尾部（蛇变长）
        if (!foodEaten) {
            this.snake.pop();
        }

        // 在蛇长度小于10时，每15秒添加一个新食物
        const now = Date.now();
        if (this.snake.length < 10 && now - this.lastFoodTime >= this.FOOD_ADD_INTERVAL) {
            this.foods.push(this.generateFood());
            this.lastFoodTime = now;
        }

        // 确保至少有一个食物
        if (this.foods.length === 0) {
            this.foods.push(this.generateFood());
        }
    }

    draw() {
        // 清空画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制网格（可选）
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
        
        // 绘制蛇
        this.ctx.fillStyle = 'green';
        this.snake.forEach((segment, index) => {
            this.ctx.fillRect(
                segment.x * this.gridSize + 1,
                segment.y * this.gridSize + 1,
                this.gridSize - 2,
                this.gridSize - 2
            );
            
            // 绘制蛇头
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

        // 绘制所有食物
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

    // 添加视觉感知方法
    vision() {
        let inputs = [];
        // 8个方向的视觉输入
        const directions = [
            {x: 0, y: -1},  // 上
            {x: 1, y: -1},  // 右上
            {x: 1, y: 0},   // 右
            {x: 1, y: 1},   // 右下
            {x: 0, y: 1},   // 下
            {x: -1, y: 1},  // 左下
            {x: -1, y: 0},  // 左
            {x: -1, y: -1}  // 左上
        ];

        // 对每个方向检测三种情况：墙壁、食物、自身
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

            // 检查是否撞墙
            if (pos.x < 0 || pos.x >= this.canvas.width/this.gridSize || 
                pos.y < 0 || pos.y >= this.canvas.height/this.gridSize) {
                if (type === 'wall') return 1/distance;
                break;
            }

            // 检查是否找到食物
            if (type === 'food' && pos.x === this.food.x && pos.y === this.food.y) {
                return 1/distance;
            }

            // 检查是否碰到自己
            if (type === 'self' && this.snake.some(s => s.x === pos.x && s.y === pos.y)) {
                return 1/distance;
            }
        }
        return 0;
    }

    isDead() {
        const head = this.snake[0];
        
        // 撞墙检测
        if (head.x < 0 || head.x >= this.canvas.width/this.gridSize || 
            head.y < 0 || head.y >= this.canvas.height/this.gridSize) {
            return true;
        }
        
        // 撞自己检测
        for (let i = 1; i < this.snake.length; i++) {
            if (head.x === this.snake[i].x && head.y === this.snake[i].y) {
                return true;
            }
        }
        
        return false;
    }

    setDirection(direction) {
        // 防止蛇反向移动
        const opposites = {
            'up': 'down',
            'down': 'up',
            'left': 'right',
            'right': 'left'
        };

        // 获取当前方向
        let currentDirection = '';
        if (this.direction.x === 1) currentDirection = 'right';
        if (this.direction.x === -1) currentDirection = 'left';
        if (this.direction.y === 1) currentDirection = 'down';
        if (this.direction.y === -1) currentDirection = 'up';

        // 如果是相反方向，则忽略
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