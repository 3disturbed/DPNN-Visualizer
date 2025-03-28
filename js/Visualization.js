// This file handles the visualization of the neural network on a canvas

const networkCanvas = document.getElementById('networkCanvas');
const netCtx = networkCanvas.getContext('2d');

// Set canvas size to match the specified resolution
networkCanvas.width = 1920;
networkCanvas.height = 1080;

// Enable antialiasing
netCtx.imageSmoothingEnabled = true;
netCtx.imageSmoothingQuality = 'high';

// Add sci-fi HUD background
function drawHUDBackground() {
    netCtx.fillStyle = 'rgba(10, 10, 26, 0.95)';
    netCtx.fillRect(0, 0, networkCanvas.width, networkCanvas.height);
    
    // Draw grid pattern
    netCtx.strokeStyle = 'rgba(0, 255, 157, 0.1)';
    netCtx.lineWidth = 1;
    
    // Vertical lines
    for (let x = 0; x < networkCanvas.width; x += 50) {
        netCtx.beginPath();
        netCtx.moveTo(x, 0);
        netCtx.lineTo(x, networkCanvas.height);
        netCtx.stroke();
    }
    
    // Horizontal lines
    for (let y = 0; y < networkCanvas.height; y += 50) {
        netCtx.beginPath();
        netCtx.moveTo(0, y);
        netCtx.lineTo(networkCanvas.width, y);
        netCtx.stroke();
    }
    
    // Add scanning line effect
    const scanLineY = (Date.now() / 50) % networkCanvas.height;
    const gradient = netCtx.createLinearGradient(0, scanLineY - 10, 0, scanLineY + 10);
    gradient.addColorStop(0, 'rgba(0, 255, 157, 0)');
    gradient.addColorStop(0.5, 'rgba(0, 255, 157, 0.1)');
    gradient.addColorStop(1, 'rgba(0, 255, 157, 0)');
    
    netCtx.fillStyle = gradient;
    netCtx.fillRect(0, scanLineY - 10, networkCanvas.width, 20);
}

// Update drawNetwork function
function drawNetwork(visualData) {
    // Clear the canvas
    netCtx.clearRect(0, 0, networkCanvas.width, networkCanvas.height);
    
    // Draw HUD background
    drawHUDBackground();
    
    // If no neural network data, exit
    if (!visualData) return;
    
    // Define layout parameters with more space
    const padding = 100;
    const width = networkCanvas.width - 2 * padding;
    const height = networkCanvas.height - 2 * padding;
    
    // Extract neural network structure from the visualization data
    const inputSize = visualData.inputSize;
    const outputSize = visualData.outputSize;
    const expansionLayers = visualData.expansionLayers || [];
    const centralLayers = visualData.centralLayers || [];
    const contractionLayers = visualData.contractionLayers || [];
    
    // Build layer sizes array for all layers
    const layerSizes = [inputSize, ...expansionLayers, ...centralLayers, ...contractionLayers, outputSize];
    
    // Track the type of each layer for specialized visualization
    const layerTypes = [];
    layerTypes.push('input');
    expansionLayers.forEach(() => layerTypes.push('expansion'));
    centralLayers.forEach(() => layerTypes.push('central'));
    contractionLayers.forEach(() => layerTypes.push('contraction'));
    layerTypes.push('output');
    
    const numLayers = layerSizes.length;
    
    // Calculate positions for each layer
    const layerSpacing = height / (numLayers - 1);
    const layerYPositions = Array(numLayers).fill().map((_, i) => padding + i * layerSpacing);
    
    // Calculate horizontal positions for nodes in each layer
    const layerXPositions = layerSizes.map((size, layerIndex) => 
        Array(size).fill().map((_, nodeIndex) => 
            padding + (nodeIndex + 0.5) * (width / Math.max(size, 1))
        )
    );
    
    // Draw in correct order for proper layering
    drawLayerBackgrounds(layerYPositions, layerTypes, width, height, padding);
    drawAllConnections(layerSizes, layerTypes, layerXPositions, layerYPositions, visualData);
    drawAllNodes(layerSizes, layerTypes, layerXPositions, layerYPositions, visualData);
    drawNetworkStats(visualData, layerSizes, layerTypes, padding);
    drawLayerLabels(layerYPositions, layerTypes, layerSizes, padding);
    drawHUDOverlay(visualData);
}

// Add new function for HUD overlay elements
function drawHUDOverlay(visualData) {
    // Draw corner decorations
    const cornerSize = 50;
    netCtx.strokeStyle = 'rgba(0, 255, 157, 0.5)';
    netCtx.lineWidth = 2;
    
    // Top-left corner
    netCtx.beginPath();
    netCtx.moveTo(0, cornerSize);
    netCtx.lineTo(0, 0);
    netCtx.lineTo(cornerSize, 0);
    netCtx.stroke();
    
    // Top-right corner
    netCtx.beginPath();
    netCtx.moveTo(networkCanvas.width - cornerSize, 0);
    netCtx.lineTo(networkCanvas.width, 0);
    netCtx.lineTo(networkCanvas.width, cornerSize);
    netCtx.stroke();
    
    // Bottom-left corner
    netCtx.beginPath();
    netCtx.moveTo(0, networkCanvas.height - cornerSize);
    netCtx.lineTo(0, networkCanvas.height);
    netCtx.lineTo(cornerSize, networkCanvas.height);
    netCtx.stroke();
    
    // Bottom-right corner
    netCtx.beginPath();
    netCtx.moveTo(networkCanvas.width - cornerSize, networkCanvas.height);
    netCtx.lineTo(networkCanvas.width, networkCanvas.height);
    netCtx.lineTo(networkCanvas.width, networkCanvas.height - cornerSize);
    netCtx.stroke();
    
    // Draw system status
    netCtx.font = '16px Consolas';
    netCtx.fillStyle = 'rgba(0, 255, 157, 0.8)';
    netCtx.textAlign = 'left';
    
    const timestamp = new Date().toISOString();
    netCtx.fillText(`SYSTEM TIME: ${timestamp}`, 20, networkCanvas.height - 20);
    
    // Draw network status on the right
    netCtx.textAlign = 'right';
    const activeNodes = visualData.activations.flat().filter(Boolean).length;
    const totalNodes = visualData.activations.flat().length;
    const activationRate = ((activeNodes / totalNodes) * 100).toFixed(1);
    
    netCtx.fillText(`NETWORK ACTIVATION: ${activationRate}%`, networkCanvas.width - 20, networkCanvas.height - 20);
}

// Update drawing styles for nodes
function drawSingleNode(x, y, isActive, value, layerType, nodeIndex, layerIndex) {
    // Calculate node size based on activation and value
    const baseSize = isActive ? 10 : 8;
    const absValue = Math.abs(value);
    const valueScaledSize = isActive ? baseSize + (absValue * 4) : baseSize;
    const nodeSize = Math.min(valueScaledSize, 18); // Cap maximum size
    
    // Add glow effect for active nodes
    if (isActive) {
        netCtx.shadowColor = 'rgba(0, 255, 157, 0.5)';
        netCtx.shadowBlur = 15;
    }
    
    // Draw node border with special styling for each layer type
    netCtx.beginPath();
    netCtx.arc(x, y, nodeSize + 2, 0, Math.PI * 2);
    
    if (layerType === 'central') {
        // Central layer nodes - indicate high/low pass gates
        if (nodeIndex % 2 === 0) {
            // High pass node (even) - blue border
            netCtx.fillStyle = isActive ? 'rgba(100, 200, 255, 0.4)' : 'rgba(100, 200, 255, 0.2)';
        } else {
            // Low pass node (odd) - pink border
            netCtx.fillStyle = isActive ? 'rgba(255, 100, 200, 0.4)' : 'rgba(255, 100, 200, 0.2)';
        }
    } 
    else if (layerType === 'expansion') {
        // Expansion layer nodes - indicate positive/negative receivers
        if (nodeIndex % 2 === 0) {
            // Even nodes receive positive activations
            netCtx.fillStyle = isActive ? 'rgba(0, 150, 0, 0.4)' : 'rgba(0, 150, 0, 0.2)';
        } else {
            // Odd nodes receive negative activations
            netCtx.fillStyle = isActive ? 'rgba(150, 0, 0, 0.4)' : 'rgba(150, 0, 0, 0.2)';
        }
    }
    else if (layerType === 'contraction') {
        // Contraction layer nodes receive from pairs
        netCtx.fillStyle = isActive ? 'rgba(100, 100, 255, 0.4)' : 'rgba(100, 100, 255, 0.2)';
    }
    else if (layerType === 'input') {
        // Input nodes
        netCtx.fillStyle = isActive ? 'rgba(150, 150, 150, 0.4)' : 'rgba(150, 150, 150, 0.2)';
    }
    else if (layerType === 'output') {
        // Output nodes
        netCtx.fillStyle = isActive ? 'rgba(180, 180, 0, 0.4)' : 'rgba(180, 180, 0, 0.2)';
    }
    netCtx.fill();
    
    // Draw the node circle
    netCtx.beginPath();
    netCtx.arc(x, y, nodeSize, 0, Math.PI * 2);
    
    // Color based on activation status and value
    if (isActive) {
        // Determine color based on value sign
        if (value >= 0) {
            const intensity = Math.min(Math.abs(value) * 0.8 + 0.2, 1);
            netCtx.fillStyle = `rgba(${Math.floor(50 + intensity * 100)}, ${Math.floor(180 + intensity * 75)}, ${Math.floor(50 + intensity * 50)}, ${0.7 + intensity * 0.3})`;
        } else {
            const intensity = Math.min(Math.abs(value) * 0.8 + 0.2, 1);
            netCtx.fillStyle = `rgba(${Math.floor(180 + intensity * 75)}, ${Math.floor(50 + intensity * 50)}, ${Math.floor(50 + intensity * 50)}, ${0.7 + intensity * 0.3})`;
        }
    } else {
        netCtx.fillStyle = 'rgba(200, 200, 200, 0.5)';
    }
    
    netCtx.fill();
    netCtx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
    netCtx.lineWidth = 1;
    netCtx.stroke();
    
    // Reset shadow
    netCtx.shadowColor = 'transparent';
    netCtx.shadowBlur = 0;
    
    // Add labels and values
    addNodeLabels(x, y, layerType, nodeIndex, isActive, value);
}

function addNodeLabels(x, y, layerType, nodeIndex, isActive, value) {
    netCtx.fillStyle = isActive ? 'white' : 'black';
    
    // Special handling for input and output layers
    if (layerType === 'input') {
        const inputLabels = ['MyX', 'FoodX', 'MyY', 'FoodY'];
        if (nodeIndex < inputLabels.length) {
            netCtx.font = 'bold 10px Arial';
            netCtx.textAlign = 'center';
            netCtx.fillText(inputLabels[nodeIndex], x, y - 15);
        }
        
        // Show input value
        if (isActive) {
            netCtx.font = '10px Arial';
            netCtx.fillText(value.toFixed(2), x, y + 20);
        }
    } else if (layerType === 'output') {
        const directionLabel = ['UP', 'RIGHT', 'DOWN', 'LEFT'][nodeIndex % 4];
        netCtx.font = 'bold 10px Arial';
        netCtx.textAlign = 'center';
        netCtx.fillText(directionLabel, x, y - 15);
        
        // Show output value
        netCtx.font = '10px Arial';
        netCtx.fillText(value.toFixed(2), x, y + 20);
    } else {
        // Add special indicators based on layer type
        netCtx.font = '8px Arial';
        netCtx.textAlign = 'center';
        
        if (layerType === 'central') {
            // Show high/low pass indicator for central layers
            const passType = nodeIndex % 2 === 0 ? 'H' : 'L'; // H for high-pass, L for low-pass
            netCtx.fillText(`${nodeIndex}(${passType})`, x, y + 3);
        }
        else if (layerType === 'expansion') {
            // Show positive/negative indicator for expansion layers
            const signType = nodeIndex % 2 === 0 ? '+' : '-'; // + for positive receiver, - for negative
            netCtx.fillText(`${nodeIndex}${signType}`, x, y + 3);
        }
        else if (layerType === 'contraction') {
            // Show averaging indicator for contraction layers
            netCtx.fillText(`Avg${nodeIndex}`, x, y + 3);
        }
    }
}

function drawNetworkStats(visualData, layerSizes, layerTypes, padding) {
    // Position stats in top-right corner
    const x = networkCanvas.width - padding - 300;
    const y = padding + 20;
    
    // Draw stats background
    netCtx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    netCtx.fillRect(x - 10, y - 20, 290, 100);
    netCtx.strokeStyle = 'rgba(0, 255, 157, 0.3)';
    netCtx.strokeRect(x - 10, y - 20, 290, 100);
    
    // Draw stats text
    netCtx.font = '12px Consolas';
    netCtx.fillStyle = 'rgba(0, 255, 157, 0.8)';
    netCtx.textAlign = 'left';
    
    // Calculate stats
    const activeNodes = visualData.activations.flat().filter(Boolean).length;
    const totalNodes = visualData.activations.flat().length;
    const activationRate = ((activeNodes / totalNodes) * 100).toFixed(1);
    
    const pathTypes = {
        expansion: 0,
        central: 0,
        contraction: 0,
        direct: 0
    };
    
    if (visualData.activePaths) {
        visualData.activePaths.forEach(path => {
            pathTypes[path.type] = (pathTypes[path.type] || 0) + 1;
        });
    }
    
    // Display stats
    netCtx.fillText(`NETWORK STATUS`, x, y);
    netCtx.fillText(`Active Nodes: ${activeNodes}/${totalNodes} (${activationRate}%)`, x, y + 20);
    netCtx.fillText(`Active Paths: ${visualData.activePaths?.length || 0}`, x, y + 40);
    netCtx.fillText(`Path Types: E:${pathTypes.expansion} C:${pathTypes.central}`, x, y + 60);
    netCtx.fillText(`           D:${pathTypes.direct} T:${pathTypes.contraction}`, x, y + 80);
}

// Add background decoration for different layer types
function drawLayerBackgrounds(layerYPositions, layerTypes, width, height, padding) {
    // Define colors for different layer types
    const layerColors = {
        'input': 'rgba(50, 50, 70, 0.2)',
        'expansion': 'rgba(0, 100, 0, 0.1)',
        'central': 'rgba(0, 0, 100, 0.1)',
        'contraction': 'rgba(100, 0, 0, 0.1)',
        'output': 'rgba(70, 70, 50, 0.2)'
    };

    // Draw backgrounds for each layer
    layerTypes.forEach((type, index) => {
        const y = layerYPositions[index] - height/layerYPositions.length/2;
        const layerHeight = height/layerYPositions.length;
        
        // Draw main background
        netCtx.fillStyle = layerColors[type] || 'rgba(50, 50, 50, 0.1)';
        netCtx.fillRect(padding/2, y, width + padding, layerHeight);
        
        // Add decorative elements based on layer type
        netCtx.strokeStyle = 'rgba(0, 255, 157, 0.1)';
        netCtx.lineWidth = 1;
        
        if (type === 'expansion') {
            // Draw Y-pattern lines for expansion layers
            for (let x = padding; x < width + padding; x += 50) {
                netCtx.beginPath();
                netCtx.moveTo(x, y);
                netCtx.lineTo(x + 25, y + layerHeight);
                netCtx.stroke();
            }
        } else if (type === 'central') {
            // Draw grid pattern for central layers
            for (let x = padding; x < width + padding; x += 25) {
                netCtx.beginPath();
                netCtx.moveTo(x, y);
                netCtx.lineTo(x, y + layerHeight);
                netCtx.stroke();
            }
        } else if (type === 'contraction') {
            // Draw inverted Y-pattern for contraction layers
            for (let x = padding; x < width + padding; x += 50) {
                netCtx.beginPath();
                netCtx.moveTo(x, y + layerHeight);
                netCtx.lineTo(x + 25, y);
                netCtx.stroke();
            }
        }
    });
}

function drawAllConnections(layerSizes, layerTypes, layerXPositions, layerYPositions, visualData) {
    if (!visualData.activePaths) return;

    // Draw all active paths
    visualData.activePaths.forEach(path => {
        const fromX = layerXPositions[path.layer][path.from];
        const fromY = layerYPositions[path.layer];
        const toX = layerXPositions[path.layer + 1][path.to];
        const toY = layerYPositions[path.layer + 1];

        // Set line style based on path type and primary status
        netCtx.lineWidth = path.isPrimary ? 2 : 1;
        netCtx.shadowColor = 'rgba(0, 255, 157, 0.3)';
        netCtx.shadowBlur = path.isPrimary ? 5 : 2;

        // Determine color based on path type
        let pathColor;
        switch (path.type) {
            case 'expansion':
                pathColor = path.sign > 0 ? 'rgba(0, 180, 0, 0.8)' : 'rgba(180, 0, 0, 0.8)';
                break;
            case 'central':
                pathColor = path.to % 2 === 0 ? 'rgba(100, 200, 255, 0.8)' : 'rgba(255, 100, 200, 0.8)';
                break;
            case 'contraction':
                pathColor = 'rgba(100, 100, 255, 0.8)';
                break;
            default:
                pathColor = 'rgba(150, 150, 150, 0.8)';
        }

        // Draw connection line
        netCtx.strokeStyle = pathColor;
        netCtx.beginPath();
        netCtx.moveTo(fromX, fromY);
        netCtx.lineTo(toX, toY);
        netCtx.stroke();

        // Reset shadow
        netCtx.shadowColor = 'transparent';
        netCtx.shadowBlur = 0;
    });
}

function drawAllNodes(layerSizes, layerTypes, layerXPositions, layerYPositions, visualData) {
    // Draw nodes for each layer
    for (let l = 0; l < layerSizes.length; l++) {
        for (let i = 0; i < layerSizes[l]; i++) {
            const x = layerXPositions[l][i];
            const y = layerYPositions[l];
            const isActive = visualData.activations[l][i];
            const value = visualData.nodeActivations[l][i];
            
            drawSingleNode(x, y, isActive, value, layerTypes[l], i, l);
        }
    }
}

function drawLayerLabels(layerYPositions, layerTypes, layerSizes, padding) {
    netCtx.font = '12px Consolas';
    netCtx.fillStyle = 'rgba(0, 255, 157, 0.8)';
    netCtx.textAlign = 'right';

    layerTypes.forEach((type, index) => {
        const y = layerYPositions[index];
        const label = `${type.toUpperCase()} [${layerSizes[index]}]`;
        netCtx.fillText(label, padding - 10, y + 4);
    });
}