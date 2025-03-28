// File: snake-game/js/Game.js

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const timerElement = document.getElementById('timer');

const gridSize = 20;
const tileCount = canvas.width / gridSize;

let snake = [{ x: 10, y: 10 }];
let food = {
    x: Math.floor(Math.random() * tileCount),
    y: Math.floor(Math.random() * tileCount)
};
let score = 0;
let direction = 'right';
let timer = 10;
let timerInterval;
let lastMove = null; // Track the last successful move

function clearCanvas() {
    // Dark blue background to match the UI theme
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add subtle grid pattern for sci-fi look
    ctx.strokeStyle = 'rgba(0, 255, 157, 0.05)';
    ctx.lineWidth = 1;
    
    // Vertical grid lines
    for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    
    // Horizontal grid lines
    for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
}

function draw() {
    if (!gameRunning) {
        // Game over message with sci-fi styling
        ctx.fillStyle = 'rgba(0, 255, 157, 0.8)';
        ctx.font = '30px Consolas';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0, 255, 157, 0.8)';
        ctx.shadowBlur = 10;
        ctx.fillText('SIMULATION TERMINATED', canvas.width / 2, canvas.height / 2);
        ctx.shadowBlur = 0;
        return;
    }

    // Draw snake with sci-fi styling
    snake.forEach((segment, index) => {
        // Use gradient coloring for snake
        if (index === 0) {
            // Snake head with glow effect
            ctx.fillStyle = '#00ff9d';
            ctx.shadowColor = 'rgba(0, 255, 157, 0.8)';
            ctx.shadowBlur = 10;
        } else {
            // Snake body with gradient based on position
            const intensity = 1 - (index / snake.length) * 0.7;
            ctx.fillStyle = `rgba(0, ${Math.floor(255 * intensity)}, ${Math.floor(157 * intensity)}, 0.9)`;
            ctx.shadowBlur = 0;
        }
        
        // Draw rounded rectangle for snake segments
        const segSize = gridSize - 2;
        const cornerRadius = 3;
        const x = segment.x * gridSize + 1;
        const y = segment.y * gridSize + 1;
        
        ctx.beginPath();
        ctx.moveTo(x + cornerRadius, y);
        ctx.lineTo(x + segSize - cornerRadius, y);
        ctx.quadraticCurveTo(x + segSize, y, x + segSize, y + cornerRadius);
        ctx.lineTo(x + segSize, y + segSize - cornerRadius);
        ctx.quadraticCurveTo(x + segSize, y + segSize, x + segSize - cornerRadius, y + segSize);
        ctx.lineTo(x + cornerRadius, y + segSize);
        ctx.quadraticCurveTo(x, y + segSize, x, y + segSize - cornerRadius);
        ctx.lineTo(x, y + cornerRadius);
        ctx.quadraticCurveTo(x, y, x + cornerRadius, y);
        ctx.closePath();
        ctx.fill();
    });
    ctx.shadowBlur = 0;

    // Draw food with sci-fi pulse effect
    const pulseSize = Math.sin(Date.now() / 200) * 2;
    ctx.fillStyle = '#0066cc';
    ctx.shadowColor = '#0099ff';
    ctx.shadowBlur = 15;
    
    const foodX = food.x * gridSize + 1;
    const foodY = food.y * gridSize + 1;
    const foodSize = gridSize - 2 + pulseSize;
    
    // Draw hexagonal food
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI / 3) - Math.PI / 6;
        const radius = foodSize / 2;
        const pointX = foodX + radius + Math.cos(angle) * radius;
        const pointY = foodY + radius + Math.sin(angle) * radius;
        
        if (i === 0) {
            ctx.moveTo(pointX, pointY);
        } else {
            ctx.lineTo(pointX, pointY);
        }
    }
    ctx.closePath();
    ctx.fill();
    
    // Add inner glow to food
    ctx.fillStyle = '#00ccff';
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI / 3) - Math.PI / 6;
        const radius = foodSize / 4;
        const pointX = foodX + foodSize/2 + Math.cos(angle) * radius;
        const pointY = foodY + foodSize/2 + Math.sin(angle) * radius;
        
        if (i === 0) {
            ctx.moveTo(pointX, pointY);
        } else {
            ctx.lineTo(pointX, pointY);
        }
    }
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    
    // Draw direction arrow with sci-fi styling
    drawDirectionIndicator(snake[0].x, snake[0].y, direction);
    
    // Draw the latest reward indicator if available
    if (window.lastReward !== undefined) {
        drawRewardIndicator(window.lastReward);
    }
}

// Function to draw a direction indicator on the snake's head
function drawDirectionIndicator(x, y, dir) {
    const centerX = x * gridSize + gridSize / 2;
    const centerY = y * gridSize + gridSize / 2;
    const radius = gridSize / 3;
    
    ctx.fillStyle = 'rgba(0, 255, 157, 0.8)';
    ctx.shadowColor = 'rgba(0, 255, 157, 0.8)';
    ctx.shadowBlur = 5;
    ctx.beginPath();
    
    switch(dir) {
        case 'up':
            ctx.moveTo(centerX, centerY - radius);
            ctx.lineTo(centerX - radius * 0.6, centerY + radius * 0.3);
            ctx.lineTo(centerX + radius * 0.6, centerY + radius * 0.3);
            break;
        case 'down':
            ctx.moveTo(centerX, centerY + radius);
            ctx.lineTo(centerX - radius * 0.6, centerY - radius * 0.3);
            ctx.lineTo(centerX + radius * 0.6, centerY - radius * 0.3);
            break;
        case 'left':
            ctx.moveTo(centerX - radius, centerY);
            ctx.lineTo(centerX + radius * 0.3, centerY - radius * 0.6);
            ctx.lineTo(centerX + radius * 0.3, centerY + radius * 0.6);
            break;
        case 'right':
            ctx.moveTo(centerX + radius, centerY);
            ctx.lineTo(centerX - radius * 0.3, centerY - radius * 0.6);
            ctx.lineTo(centerX - radius * 0.3, centerY + radius * 0.6);
            break;
    }
    
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
}

// Function to draw the reward/penalty indicator
function drawRewardIndicator(reward) {
    ctx.font = '14px Consolas';
    ctx.textAlign = 'left';
    ctx.shadowBlur = 3;
    
    let text;
    let color;
    
    if (reward > 0.5) {
        text = `REWARD +${reward.toFixed(2)}`;
        color = '#00ff9d';
        ctx.shadowColor = '#00ff9d';
    } else if (reward > 0) {
        text = `+${reward.toFixed(2)}`;
        color = '#00aa66';
        ctx.shadowColor = '#00aa66';
    } else if (reward < -0.5) {
        text = `PENALTY ${reward.toFixed(2)}`;
        color = '#ff3366';
        ctx.shadowColor = '#ff3366';
    } else if (reward < 0) {
        text = `${reward.toFixed(2)}`;
        color = '#cc3366';
        ctx.shadowColor = '#cc3366';
    } else {
        text = `${reward.toFixed(2)}`;
        color = '#888888';
        ctx.shadowColor = '#888888';
    }
    
    ctx.fillStyle = color;
    ctx.fillText(text, 10, canvas.height - 10);
    ctx.shadowBlur = 0;
}

function update() {
    const head = { x: snake[0].x, y: snake[0].y };
    lastMove = direction; // Store current direction before potentially dying
    
    // Calculate distance to food before moving
    const prevDist = calculateFoodDistance(head, food);

    switch (direction) {
        case 'up': head.y--; break;
        case 'down': head.y++; break;
        case 'left': head.x--; break;
        case 'right': head.x++; break;
    }

    // Check for collisions
    if (
        head.x < 0 || head.x >= tileCount ||
        head.y < 0 || head.y >= tileCount ||
        snake.some(segment => segment.x === head.x && segment.y === head.y)
    ) {
        gameRunning = false;
        clearInterval(timerInterval);
        
        // Provide strong negative feedback for collision
        if (nn) {
            const state = getGameState();
            nn.forward(state); // This will set activations
            nn.train(-1.5); // Stronger negative reward for collision/game over
        }
        
        // Show game over message
        ctx.fillStyle = '#333';
        ctx.font = '30px Arial';
        ctx.fillText('Game Over!', canvas.width / 2 - 80, canvas.height / 2);
        
        // Restart game after a short delay
        setTimeout(() => {
            initGame();
            startGameLoop(); // Restart the game loop
        }, 150); // 1.5 second delay before restart
        
        return;
    }

    snake.unshift(head);

    // Check if food is eaten
    if (head.x === food.x && head.y === food.y) {
        score += 10;
        scoreElement.textContent = score;
        createFood();
        resetTimer(); // Reset timer when food is collected
        
        // Strong positive reward for eating food - scales with snake length for progressive difficulty
        if (nn) {
            const state = getGameState();
            nn.forward(state);
            // Reward scales with snake length - harder to get food with longer snake
            const reward = 1.0 + (snake.length / 20); // Increases reward as snake grows
            nn.train(reward);
            window.lastReward = reward; // Store the last reward for visualization
        }
    } else {
        snake.pop();
        
        // Calculate new distance to food after moving
        const newDist = calculateFoodDistance(head, food);
        
        // Enhanced reward system based on distance change
        if (nn) {
            const state = getGameState();
            nn.forward(state);
            
            // Calculate distance change as a percentage of the game board
            const distanceChange = prevDist - newDist;
            const normalizedChange = distanceChange / (tileCount * 2); // Normalize by max possible distance
            
            let reward = 0;
            
            if (newDist < prevDist) {
                // Reward for moving closer to food - smooth gradient based on improvement
                // Better improvements get proportionally larger rewards
                const baseReward = 0.2;
                const improvementBonus = normalizedChange * 1.0; // Scale factor
                
                // Add closeness bonus that increases as snake gets very close to food
                const closenessRatio = 1.0 - (newDist / (tileCount * 2));
                const closenessBonus = Math.pow(closenessRatio, 2) * 0.3;
                
                reward = baseReward + improvementBonus + closenessBonus;
                  } else if (newDist > prevDist) {
                // Penalty for moving away from food - proportional to how much further
                const basePenalty = -0.1;
                const distancePenalty = normalizedChange * -0.8; // Scale negative change
                
                // Reduced penalty if snake is very long (exploration needs more freedom)
                const lengthFactor = Math.min(snake.length / 20, 1.0);
                
                reward = basePenalty + distancePenalty * (1.0 - lengthFactor * 0.5);
                 } else {
                // Neither closer nor further - small negative reward to encourage progress
                reward = -0.05;
              }
            
            nn.train(reward);
            window.lastReward = reward; // Store for visualization
        }
    }
    
    // Apply small constant negative reward to encourage efficiency (time penalty)
    if (nn && gameRunning) {
        const timeRatio = timer / 10; // Normalize to 0-1
        const efficiencyPenalty = -0.01 * (1 - timeRatio); // Increases as timer decreases
        nn.train(efficiencyPenalty);
        window.lastReward = efficiencyPenalty; // Store the last reward for visualization
    }
}

// Calculate Manhattan distance to food
function calculateFoodDistance(pos, foodPos) {
    // Safe check to ensure pos is defined
    if (!pos || !foodPos) return 0;
    
    return Math.abs(pos.x - foodPos.x) + Math.abs(pos.y - foodPos.y);
}

function createFood() {
    do {
        food = {
            x: Math.floor(Math.random() * tileCount),
            y: Math.floor(Math.random() * tileCount)
        };
    } while (snake.some(segment => segment.x === food.x && segment.y === food.y));
}

function resetTimer() {
    timer = 10;
    timerElement.textContent = timer;
}

function startTimer() {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timer--;
        timerElement.textContent = timer;
        if (timer <= 0) {
            gameRunning = false;
            clearInterval(timerInterval);
            
            // Stronger time penalty when time runs out
            if (nn) {
                const state = getGameState();
                nn.forward(state);
                nn.train(-1.0); // Strong negative reward for timeout
                window.lastReward = -1.0; // Store the last reward for visualization
            }
            
            // Show timeout message
            ctx.fillStyle = '#333';
            ctx.font = '30px Arial';
            ctx.fillText('Time Out!', canvas.width / 2 - 70, canvas.height / 2);
            
            // Restart game after a short delay
            setTimeout(() => {
                initGame();
                startGameLoop();
            }, 15);
        }
    }, 1000);
}

function initGame() {
    snake = [{ x: 10, y: 10 }];
    direction = 'right';
    score = 0;
    gameRunning = true;
    scoreElement.textContent = '0';
    createFood(); // Reset food location on game start
    clearCanvas();
    draw();
    resetTimer();
    startTimer();
}

document.addEventListener('keydown', (event) => {
    // Ensure manual controls are connected and prevent reversing direction
    const newDirection = getKeyDirection(event.key);
    if (newDirection && isValidDirectionChange(direction, newDirection)) {
        direction = newDirection;
    }
});

function getKeyDirection(key) {
    switch (key) {
        case 'ArrowUp': return 'up';
        case 'ArrowDown': return 'down';
        case 'ArrowLeft': return 'left';
        case 'ArrowRight': return 'right';
        default: return null;
    }
}

function isValidDirectionChange(currentDir, newDir) {
    return !(
        (currentDir === 'up' && newDir === 'down') ||
        (currentDir === 'down' && newDir === 'up') ||
        (currentDir === 'left' && newDir === 'right') ||
        (currentDir === 'right' && newDir === 'left')
    );
}

function getGameState() {
    if (!gameRunning || !snake.length) return [0, 0, 0, 0];
    
    const head = snake[0];
    
    // Calculate distances to food in all four directions, normalized between 0 and 1
    const distances = [0, 0, 0, 0]; // [Up, Right, Down, Left]
    
    // Up direction (negative y)
    if (head.y > food.y) {
        distances[0] = (head.y - food.y) / tileCount;
    }
    
    // Right direction (positive x)
    if (head.x < food.x) {
        distances[1] = (food.x - head.x) / tileCount;
    }
    
    // Down direction (positive y)
    if (head.y < food.y) {
        distances[2] = (food.y - head.y) / tileCount;
    }
    
    // Left direction (negative x)
    if (head.x > food.x) {
        distances[3] = (head.x - food.x) / tileCount;
    }

    return distances;
}