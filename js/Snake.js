class Snake {
    constructor(ctx, size = 20) {
        this.ctx = ctx;
        this.size = size;
        this.reset();
    }

    reset() {
        // Initialize snake at center
        this.body = [{ x: 10, y: 10 }];
        this.direction = 'right';
        this.food = this.createFood();
        this.growing = false;
        this.alive = true;
        this.score = 0;
    }

    createFood() {
        const gridWidth = this.ctx.canvas.width / this.size;
        const gridHeight = this.ctx.canvas.height / this.size;
        
        let food;
        do {
            food = {
                x: Math.floor(Math.random() * gridWidth),
                y: Math.floor(Math.random() * gridHeight)
            };
        } while (this.body.some(segment => segment.x === food.x && segment.y === food.y));
        
        return food;
    }

    setDirection(direction) {
        const opposites = {
            'up': 'down',
            'down': 'up',
            'left': 'right',
            'right': 'left'
        };
        
        // Prevent reversing
        if (opposites[direction] !== this.direction) {
            this.direction = direction;
        }
    }

    update() {
        if (!this.alive) return false;
        
        // Create new head
        const head = { x: this.body[0].x, y: this.body[0].y };
        
        // Move head
        switch (this.direction) {
            case 'up': head.y--; break;
            case 'down': head.y++; break;
            case 'left': head.x--; break;
            case 'right': head.x++; break;
        }
        
        // Check wall collision
        const gridWidth = this.ctx.canvas.width / this.size;
        const gridHeight = this.ctx.canvas.height / this.size;
        
        if (head.x < 0 || head.x >= gridWidth || head.y < 0 || head.y >= gridHeight) {
            this.alive = false;
            return false;
        }
        
        // Check self collision
        if (this.body.some(segment => segment.x === head.x && segment.y === head.y)) {
            this.alive = false;
            return false;
        }
        
        // Add new head
        this.body.unshift(head);
        
        // Check food collision
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10;
            this.food = this.createFood();
            this.growing = true;
        }
        
        // Remove tail if not growing
        if (!this.growing) {
            this.body.pop();
        } else {
            this.growing = false;
        }
        
        return true;
    }

    draw() {
        // Draw snake with sci-fi styling
        // Head with glow effect
        this.ctx.shadowColor = 'rgba(0, 255, 157, 0.8)';
        this.ctx.shadowBlur = 10;
        this.ctx.fillStyle = '#00ff9d';
        
        this.body.forEach((segment, index) => {
            // Use gradient coloring for snake
            if (index === 0) {
                // Snake head with glow effect
                this.ctx.fillStyle = '#00ff9d';
            } else {
                // Snake body with gradient based on position
                const intensity = 1 - (index / this.body.length) * 0.7;
                this.ctx.fillStyle = `rgba(0, ${Math.floor(255 * intensity)}, ${Math.floor(157 * intensity)}, 0.9)`;
                this.ctx.shadowBlur = 0;
            }
            
            // Draw rounded rectangle for snake segments
            const segSize = this.size - 2;
            const cornerRadius = 3;
            const x = segment.x * this.size + 1;
            const y = segment.y * this.size + 1;
            
            this.ctx.beginPath();
            this.ctx.moveTo(x + cornerRadius, y);
            this.ctx.lineTo(x + segSize - cornerRadius, y);
            this.ctx.quadraticCurveTo(x + segSize, y, x + segSize, y + cornerRadius);
            this.ctx.lineTo(x + segSize, y + segSize - cornerRadius);
            this.ctx.quadraticCurveTo(x + segSize, y + segSize, x + segSize - cornerRadius, y + segSize);
            this.ctx.lineTo(x + cornerRadius, y + segSize);
            this.ctx.quadraticCurveTo(x, y + segSize, x, y + segSize - cornerRadius);
            this.ctx.lineTo(x, y + cornerRadius);
            this.ctx.quadraticCurveTo(x, y, x + cornerRadius, y);
            this.ctx.closePath();
            this.ctx.fill();
        });
        this.ctx.shadowBlur = 0;
        
        // Draw food with sci-fi pulse effect
        const pulseSize = Math.sin(Date.now() / 200) * 2;
        this.ctx.fillStyle = '#0066cc';
        this.ctx.shadowColor = '#0099ff';
        this.ctx.shadowBlur = 15;
        
        const foodX = this.food.x * this.size + 1;
        const foodY = this.food.y * this.size + 1;
        const foodSize = this.size - 2 + pulseSize;
        
        // Draw hexagonal food
        this.ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI / 3) - Math.PI / 6;
            const radius = foodSize / 2;
            const pointX = foodX + radius + Math.cos(angle) * radius;
            const pointY = foodY + radius + Math.sin(angle) * radius;
            
            if (i === 0) {
                this.ctx.moveTo(pointX, pointY);
            } else {
                this.ctx.lineTo(pointX, pointY);
            }
        }
        this.ctx.closePath();
        this.ctx.fill();
        
        // Add inner glow to food
        this.ctx.fillStyle = '#00ccff';
        this.ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI / 3) - Math.PI / 6;
            const radius = foodSize / 4;
            const pointX = foodX + foodSize/2 + Math.cos(angle) * radius;
            const pointY = foodY + foodSize/2 + Math.sin(angle) * radius;
            
            if (i === 0) {
                this.ctx.moveTo(pointX, pointY);
            } else {
                this.ctx.lineTo(pointX, pointY);
            }
        }
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
        
        // Draw direction indicator if this is the active snake
        if (this.direction) {
            this.drawDirectionIndicator(this.body[0].x, this.body[0].y, this.direction);
        }
    }
    
    // Add function to draw direction indicator
    drawDirectionIndicator(x, y, dir) {
        const centerX = x * this.size + this.size / 2;
        const centerY = y * this.size + this.size / 2;
        const radius = this.size / 3;
        
        this.ctx.fillStyle = 'rgba(0, 255, 157, 0.8)';
        this.ctx.shadowColor = 'rgba(0, 255, 157, 0.8)';
        this.ctx.shadowBlur = 5;
        this.ctx.beginPath();
        
        switch(dir) {
            case 'up':
                this.ctx.moveTo(centerX, centerY - radius);
                this.ctx.lineTo(centerX - radius * 0.6, centerY + radius * 0.3);
                this.ctx.lineTo(centerX + radius * 0.6, centerY + radius * 0.3);
                break;
            case 'down':
                this.ctx.moveTo(centerX, centerY + radius);
                this.ctx.lineTo(centerX - radius * 0.6, centerY - radius * 0.3);
                this.ctx.lineTo(centerX + radius * 0.6, centerY - radius * 0.3);
                break;
            case 'left':
                this.ctx.moveTo(centerX - radius, centerY);
                this.ctx.lineTo(centerX + radius * 0.3, centerY - radius * 0.6);
                this.ctx.lineTo(centerX + radius * 0.3, centerY + radius * 0.6);
                break;
            case 'right':
                this.ctx.moveTo(centerX + radius, centerY);
                this.ctx.lineTo(centerX - radius * 0.3, centerY - radius * 0.6);
                this.ctx.lineTo(centerX - radius * 0.3, centerY + radius * 0.6);
                break;
        }
        
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
    }
    
    // Gets the current state as inputs for the neural network
    getState() {
        // Get food distances in all four directions
        const foodDistances = this.getFoodDistances();
        
        // Return normalized food distances as inputs
        return foodDistances;
    }

    // Calculate distances to food in all four directions
    getFoodDistances() {
        const distances = [0, 0, 0, 0]; // [Up, Right, Down, Left]
        
        // Get head position
        const head = this.body[0];
        const food = this.food;
        
        // Calculate grid dimensions
        const gridWidth = this.ctx.canvas.width / this.size;
        const gridHeight = this.ctx.canvas.height / this.size;
        
        // Up direction (negative y)
        if (head.y > food.y) {
            // Food is above the snake
            distances[0] = (head.y - food.y) / gridHeight;
        }
        
        // Right direction (positive x)
        if (head.x < food.x) {
            // Food is to the right of the snake
            distances[1] = (food.x - head.x) / gridWidth;
        }
        
        // Down direction (positive y)
        if (head.y < food.y) {
            // Food is below the snake
            distances[2] = (food.y - head.y) / gridHeight;
        }
        
        // Left direction (negative x)
        if (head.x > food.x) {
            // Food is to the left of the snake
            distances[3] = (head.x - food.x) / gridWidth;
        }
        
        return distances;
    }

    getScore() {
        return this.score;
    }

    isAlive() {
        return this.alive;
    }
}