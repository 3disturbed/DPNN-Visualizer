// Initialization state tracking
let initialized = false;

// Initialize only once all required elements are present
function checkInitialization() {
    if (initialized) return true;
    
    const requiredElements = [
        'weightsTableBody',
        'score',
        'timer',
        'lastError',
        'trainingIterations',
        'avgReward',
        'functionDistribution'
    ];
    
    const allElementsPresent = requiredElements.every(id => 
        document.getElementById(id) !== null
    );
    
    if (allElementsPresent) {
        initialized = true;
        return true;
    }
    return false;
}

function safeVisualizeNetwork() {
    if (!checkInitialization()) {
        // Try again in 100ms if not initialized
        setTimeout(safeVisualizeNetwork, 100);
        return;
    }
    
    if (typeof drawNetworkWithGameData === 'function') {
        drawNetworkWithGameData();
    }
}

// Shared game variables and settings
let gameSpeed = 1; // ms per frame
let aiControlled = true;
let fastMode = false;
let gameInterval;
let gameRunning = true;
let lastGameTick = 0;
const targetFrameTime = 1000 / 60; // 60 FPS

// Initialize the neural network with the exact structure from the readme
let nn = new DPNN(4, [], 4);

// This is the main controller script that ties together the game, neural network, and visualization

// Function to update the weights table with enhanced information
function updateWeightsTable() {
    const tableBody = document.getElementById('weightsTableBody');
    if (!tableBody || !nn) return; // Exit if elements don't exist
    
    tableBody.innerHTML = ''; // Clear existing rows
    
    // Iterate through each layer
    for (let l = 0; l < nn.layers.length; l++) {
        // Add a header row for each layer
        const headerRow = document.createElement('tr');
        const headerCell = document.createElement('td');
        headerCell.colSpan = 5;
        headerCell.className = 'layer-header';
        headerCell.textContent = `Layer ${l} (${nn.layerTypes[l]})`;
        headerRow.appendChild(headerCell);
        tableBody.appendChild(headerRow);
        
        // Add rows for each node in this layer
        for (let i = 0; i < nn.layers[l].length; i++) {
            const row = document.createElement('tr');
            row.className = nn.activations[l][i] ? 'weight-row active-node' : 'weight-row';
            
            // Node info cell
            const nodeCell = document.createElement('td');
            nodeCell.textContent = `Node ${i}`;
            row.appendChild(nodeCell);
            
            // Value cell
            const valueCell = document.createElement('td');
            valueCell.textContent = nn.layers[l][i].toFixed(3);
            row.appendChild(valueCell);
            
            // Add empty cells for spacing
            for (let j = 0; j < 3; j++) {
                row.appendChild(document.createElement('td'));
            }
            
            tableBody.appendChild(row);
            
            // Add connection rows if not in last layer
            if (l < nn.layers.length - 1) {
                for (let j = 0; j < nn.layers[l + 1].length; j++) {
                    const connRow = document.createElement('tr');
                    connRow.className = 'weight-row indent';
                    
                    // Connection info cell
                    const connCell = document.createElement('td');
                    connCell.textContent = `→ to Node ${j}`;
                    connRow.appendChild(connCell);
                    
                    // Weight value cell
                    const weightCell = document.createElement('td');
                    weightCell.textContent = nn.weights[l][i][j].toFixed(3);
                    connRow.appendChild(weightCell);
                    
                    // Add empty cells for spacing
                    for (let k = 0; k < 3; k++) {
                        connRow.appendChild(document.createElement('td'));
                    }
                    
                    tableBody.appendChild(connRow);
                }
            }
        }
        
        // Add spacer row between layers
        if (l < nn.layers.length - 1) {
            const spacerRow = document.createElement('tr');
            const spacerCell = document.createElement('td');
            spacerCell.colSpan = 5;
            spacerCell.className = 'spacer';
            spacerRow.appendChild(spacerCell);
            tableBody.appendChild(spacerRow);
        }
    }
}

// Function to update network statistics display
function updateNetworkStats() {
    if (!nn) return;
    
    const stats = nn.getNetworkStats();
    
    // Update UI elements with null checks
    const elements = {
        'lastError': stats.lastError.toFixed(3),
        'trainingIterations': stats.trainingIterations,
        'avgReward': stats.avgReward
    };
    
    Object.entries(elements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    });
    
    // Format and update function distribution
    const element = document.getElementById('functionDistribution');
    if (element) {
        const funcDist = Object.entries(stats.functionDistribution)
            .filter(([_, count]) => count > 0)
            .map(([func, count]) => `${func}: ${count}`)
            .join(', ');
        
        element.textContent = funcDist || 'All default (leakyrelu)';
    }
}

// Function to get snake's current state for neural network input
function getGameState() {
    if (!gameRunning || !snake.length) return [0, 0, 0, 0];
    
    const head = snake[0];
    
    // Enhanced state information with normalized values
    // Add extra validation to ensure no NaN values
    const normalizedX = head.x / tileCount || 0;
    const normalizedFoodX = food.x / tileCount || 0;
    const normalizedY = head.y / tileCount || 0;
    const normalizedFoodY = food.y / tileCount || 0;

    return [
        normalizedX,     // Snake X position (normalized 0-1)
        normalizedFoodX, // Food X position (normalized 0-1)
        normalizedY,     // Snake Y position (normalized 0-1)
        normalizedFoodY  // Food Y position (normalized 0-1)
    ];
}

// Function to make the neural network decide the direction
function decideDirection() {
    if (!nn || !gameRunning) return;

    // Get the current game state
    const state = getGameState();
    if (!state || state.some(v => v === undefined || v === null)) return;

    // Run the forward pass
    const output = nn.forward(state);
    if (!output || output.length !== 4) return;

    // Find the direction with highest activation
    let maxIndex = 0;
    for (let i = 1; i < output.length; i++) {
        if (output[i] > output[maxIndex]) {
            maxIndex = i;
        }
    }
    
    // Map index to direction
    const directions = ['up', 'right', 'down', 'left'];
    const newDirection = directions[maxIndex];
    
    // Prevent reversing direction
    const opposites = {
        'up': 'down',
        'down': 'up',
        'left': 'right',
        'right': 'left'
    };
    
    // Only change direction if it's a valid move
    if (opposites[newDirection] !== direction) {
        direction = newDirection;
    } else {
        // If the network tries to reverse direction, choose the next best option
        const sortedDirections = directions
            .map((dir, idx) => ({ dir, value: output[idx] }))
            .sort((a, b) => b.value - a.value)
            .filter(option => opposites[option.dir] !== direction);
        
        if (sortedDirections.length > 0) {
            direction = sortedDirections[0].dir;
        }
    }

    // Run network maintenance tasks
    if (typeof nn.pruneConnections === 'function') {
        nn.pruneConnections();
    }
    if (typeof nn.verifyNetworkIntegrity === 'function') {
        nn.verifyNetworkIntegrity();
    }
    
    // Update visualization if all required elements exist
    if (document.getElementById('weightsTableBody') && 
        typeof drawNetworkWithGameData === 'function') {
        requestAnimationFrame(drawNetworkWithGameData);
    }
}

// Function to update the UI to reflect the neural network
function drawNetworkWithGameData() {
    if (!nn) return;  // Exit if neural network doesn't exist
    
    // Prepare data for visualization with null checks
    const visualData = {
        inputSize: nn.inputSize || 4,
        outputSize: nn.outputSize || 4,
        expansionLayers: nn.expansionLayers || [],
        centralLayers: nn.centralLayers || [],
        contractionLayers: nn.contractionLayers || [],
        nodeActivations: nn.layers || [],
        activations: nn.activations || [],
        activePaths: nn.activePaths || []
    };
    
    // Add detailed layer information with null checks
    visualData.layerNames = ['Input'].concat(
        (nn.expansionLayers || []).map((_, i) => `Exp ${i+1}`),
        (nn.centralLayers || []).map((_, i) => `Central ${i+1}`),
        (nn.contractionLayers || []).map((_, i) => `Con ${i+1}`),
        ['Output']
    );
    
    // Only attempt to draw if all required functions exist
    if (typeof drawNetwork === 'function') {
        drawNetwork(visualData);
    }
    
    // Only update tables and stats if the functions exist
    if (typeof updateWeightsTable === 'function') {
        updateWeightsTable();
    }
    
    if (typeof updateNetworkStats === 'function') {
        updateNetworkStats();
    }
}

// Function to update game stats
function updateGameStats() {
    if (!nn) return;

    // Update game-related stats if elements exist
    const scoreElement = document.getElementById('score');
    if (scoreElement) {
        scoreElement.textContent = score.toString();
    }
    
    const timerElement = document.getElementById('timer');
    if (timerElement) {
        timerElement.textContent = timer.toString();
    }

    // Call updateNetworkStats to refresh all stats
    updateNetworkStats();
}

// Game loop function
function gameLoop() {
    if (!gameRunning || !nn) {
        clearInterval(gameInterval);
        return;
    }

    // Ensure game state is initialized
    if (typeof clearCanvas !== 'function' || typeof update !== 'function' || typeof draw !== 'function') {
        console.error('Game functions not initialized');
        return;
    }
    
    clearCanvas();
    
    if (aiControlled) {
        requestAnimationFrame(decideDirection);
    }
    
    update();
    draw();

    // Only update visualization if game is fully initialized
    if (document.readyState === 'complete') {
        requestAnimationFrame(() => {
            if (typeof drawNetworkWithGameData === 'function') {
                drawNetworkWithGameData();
            }
        });
    }
}

// Update game loop initialization
function startGameLoop() {
    clearInterval(gameInterval);
    lastGameTick = performance.now();
    
    function tick(currentTime) {
        if (!gameRunning) return;
        
        const elapsed = currentTime - lastGameTick;
        
        if (elapsed >= (fastMode ? targetFrameTime/2 : targetFrameTime)) {
            gameLoop();
            lastGameTick = currentTime;
        }
        
        requestAnimationFrame(tick);
    }
    
    requestAnimationFrame(tick);
}

// Function to apply parameter changes from the UI to the neural network
function applyParameters() {
    if (!nn) return;
    
    // Get values from sliders
    const baseLearningRate = parseFloat(document.getElementById('baseLearningRate').value);
    const confidenceModifier = parseFloat(document.getElementById('confidenceModifier').value);
    const mutationThreshold = parseFloat(document.getElementById('mutationThreshold').value);
    const mutationRate = parseFloat(document.getElementById('mutationRate').value);
    const rewardScaling = parseFloat(document.getElementById('rewardScaling').value);
    
    // Update neural network learning parameters
    nn.updateLearningParams({
        baseLearningRate,
        confidenceModifier,
        mutationThreshold,
        mutationRate,
        rewardScaling
    });
    

    
    // Flash the apply button to provide visual feedback
    const applyBtn = document.getElementById('applyParamsBtn');
    applyBtn.textContent = 'Applied!';
    applyBtn.style.backgroundColor = '#4CAF50';
    setTimeout(() => {
        applyBtn.textContent = 'Apply Parameters';
        applyBtn.style.backgroundColor = '#2196F3';
    }, 1000);
}

// Function to update slider value displays
function updateSliderValues() {
    const sliders = [
        'baseLearningRate',
        'confidenceModifier',
        'mutationThreshold',
        'mutationRate',
        'rewardScaling'
    ];
    
    sliders.forEach(id => {
        const slider = document.getElementById(id);
        const valueDisplay = document.getElementById(`${id}Value`);
        if (slider && valueDisplay) {
            valueDisplay.textContent = parseFloat(slider.value).toFixed(
                id === 'baseLearningRate' ? 3 : 2
            );
        }
    });
}

// Initialize game state and neural network
window.onload = function() {
    // Initialize neural network
    nn = new DPNN(4, [], 4);
    
    // Initialize game
    initGame();
    
    // Start game loop only after everything is initialized
    setTimeout(() => {
        gameRunning = true;
        startGameLoop();
        
        // Force initial visualization update
        if (typeof drawNetworkWithGameData === 'function') {
            drawNetworkWithGameData();
        }
    }, 100);
}

// Add event listeners for all parameter controls
document.querySelectorAll('.parameter-slider').forEach(slider => {
    slider.addEventListener('input', updateSliderValues);
});

// Parameter initialization
function initializeParameters() {
    if (!nn?.learningParams) return;
    
    const params = nn.learningParams;
    
    // Set initial slider values
    Object.entries({
        'baseLearningRate': params.baseLearningRate,
        'confidenceModifier': params.confidenceModifier,
        'mutationThreshold': params.mutationThreshold,
        'mutationRate': params.mutationRate,
        'rewardScaling': params.rewardScaling
    }).forEach(([id, value]) => {
        const slider = document.getElementById(id);
        if (slider) {
            slider.value = value;
        }
    });
    
    // Update value displays
    updateSliderValues();
}

// Initialize parameters after page load
document.addEventListener('DOMContentLoaded', initializeParameters);

// Model management functions
function updateModelList() {
    const modelSelect = document.getElementById('modelSelect');
    if (!modelSelect) return;
    
    modelSelect.innerHTML = '<option value="">Select Model</option>';
    
    // Get all saved models from localStorage
    Object.keys(localStorage)
        .filter(key => key.startsWith('snake_model_'))
        .forEach(key => {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = key.replace('snake_model_', '');
            modelSelect.appendChild(option);
        });
}

function saveModel(name) {
    if (!nn) return;
    
    try {
        const modelData = {
            weights: nn.weights,
            biases: nn.biases,
            nodeConfidence: nn.nodeConfidence,
            connectionConfidence: nn.connectionConfidence,
            learningParams: nn.learningParams,
            stats: nn.stats
        };
        
        localStorage.setItem(`snake_model_${name}`, JSON.stringify(modelData));
        updateModelList();
        return true;
    } catch (error) {
        console.error('Failed to save model:', error);
        return false;
    }
}

function loadModel(key) {
    try {
        const modelData = JSON.parse(localStorage.getItem(key));
        if (!modelData) return false;
        
        // Create new network with same structure
        const newNN = new DPNN(4, [], 4);
        
        // Restore saved properties
        Object.assign(newNN, modelData);
        
        // Replace current network
        nn = newNN;
        
        return true;
    } catch (error) {
        console.error('Failed to load model:', error);
        return false;
    }
}