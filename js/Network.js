class DPNN {
    constructor(inputSize, hiddenLayers, outputSize) {
        this.inputSize = inputSize;
        this.outputSize = outputSize;
        this.hiddenLayers = hiddenLayers; // Store for initialization reference
        
        // Define the network structure based on the exact architecture in readme
        // Expansion layers: Input (4) -> 8 -> 16
        // Central layers: 4 layers of size 16
        // Contraction layers: 16 -> 8 -> 4 (output)
        
        // Force the exact diamond structure from readme regardless of passed parameters
        const expansionSizes = [inputSize, 8, 16];
        const centralSizes = [16, 16, 16, 16]; // 4 central layers of size 16
        const contractionSizes = [16, 8, outputSize];
        
        // Store layer sizes for visualization and reference
        this.expansionLayers = expansionSizes.slice(1); // Skip input layer
        this.centralLayers = centralSizes;
        this.contractionLayers = contractionSizes.slice(0, -1); // Skip output layer
        
        // Calculate total layers for tracking
        this.totalLayers = expansionSizes.length - 1 + centralSizes.length + contractionSizes.length - 1;
        
        // Initialize all layers
        this.layers = [];
        this.weights = [];
        this.biases = [];
        
        // Initialize input layer
        this.layers.push(Array(inputSize).fill(0));
        
        // Initialize expansion layers
        let prevSize = inputSize;
        for (let i = 1; i < expansionSizes.length; i++) {
            const size = expansionSizes[i];
            this.layers.push(Array(size).fill(0));
            
            // Initialize weights with random values for expansion layers
            this.weights.push(
                Array.from({ length: prevSize }, () => Array(size).fill(0).map(() => Math.random() * 2 - 1))
            );
            this.biases.push(Array(size).fill(0).map(() => Math.random() * 0.5 - 0.25));
            prevSize = size;
        }
        
        // Initialize central layers
        for (let i = 0; i < centralSizes.length; i++) {
            const size = centralSizes[i];
            this.layers.push(Array(size).fill(0));
            
            // Initialize weights with random values for central layers
            // Central layers have full cross-connections between nodes
            this.weights.push(
                Array.from({ length: prevSize }, () => Array(size).fill(0).map(() => Math.random() * 2 - 1))
            );
            this.biases.push(Array(size).fill(0).map(() => Math.random() * 0.5 - 0.25));
            prevSize = size;
        }
        
        // Initialize contraction layers
        for (let i = 0; i < contractionSizes.length - 1; i++) {
            const size = contractionSizes[i];
            this.layers.push(Array(size).fill(0));
            
            // Initialize weights with random values for contraction layers
            this.weights.push(
                Array.from({ length: prevSize }, () => Array(size).fill(0).map(() => Math.random() * 2 - 1))
            );
            this.biases.push(Array(size).fill(0).map(() => Math.random() * 0.5 - 0.25));
            prevSize = size;
        }
        
        // Initialize output layer
        this.layers.push(Array(outputSize).fill(0));
        this.weights.push(
            Array.from({ length: prevSize }, () => Array(outputSize).fill(0).map(() => Math.random() * 2 - 1))
        );
        this.biases.push(Array(outputSize).fill(0).map(() => Math.random() * 0.5 - 0.25));
        
        // Verify all weights and biases are properly initialized
        // Check if weights dimensions match the connected layers
        for (let l = 0; l < this.weights.length; l++) {
            const fromSize = this.layers[l].length;
            const toSize = this.layers[l+1].length;
            
            // Ensure weight matrix dimensions are correct
            if (this.weights[l].length !== fromSize) {
                console.error(`Weight matrix dimension mismatch at layer ${l}: expected ${fromSize} rows but got ${this.weights[l].length}`);
                // Fix by reinitializing with correct dimensions
                this.weights[l] = Array.from({ length: fromSize }, () => 
                    Array(toSize).fill(0).map(() => Math.random() * 2 - 1)
                );
            }
            
            // Check each row of weights
            for (let i = 0; i < this.weights[l].length; i++) {
                if (this.weights[l][i].length !== toSize) {
                    console.error(`Weight matrix column dimension mismatch at layer ${l}, row ${i}: expected ${toSize} but got ${this.weights[l][i].length}`);
                    // Fix this row
                    this.weights[l][i] = Array(toSize).fill(0).map(() => Math.random() * 2 - 1);
                }
            }
            
            // Ensure bias dimensions are correct
            if (this.biases[l].length !== toSize) {
                console.error(`Bias dimension mismatch at layer ${l}: expected ${toSize} but got ${this.biases[l].length}`);
                // Fix by reinitializing with correct dimensions
                this.biases[l] = Array(toSize).fill(0).map(() => Math.random() * 0.5 - 0.25);
            }
        }
        
        // Track activations for each node
        this.activations = this.layers.map(layer => Array(layer.length).fill(false));
        
        // Track which paths were used during forward propagation
        this.activePaths = [];
        
        // Confidence ratings for each node and connection (from the readme)
        this.nodeConfidence = this.layers.map(layer => Array(layer.length).fill(0.5)); // Start with medium confidence
        this.connectionConfidence = this.weights.map((layer, l) => 
            Array.from({ length: layer.length }, (_, i) => 
                Array(this.layers[l+1].length).fill(0.5) // Start with medium confidence
            )
        );
        
        // Store layer types for easy reference
        this.layerTypes = [];
        for (let i = 0; i < this.layers.length; i++) {
            if (i === 0) {
                this.layerTypes.push('input');
            } else if (i < expansionSizes.length) {
                this.layerTypes.push('expansion');
            } else if (i < expansionSizes.length + centralSizes.length) {
                this.layerTypes.push('central');
            } else if (i < this.layers.length - 1) {
                this.layerTypes.push('contraction');
            } else {
                this.layerTypes.push('output');
            }
        }

        // Add configurable learning parameters
        this.learningParams = {
            baseLearningRate: 0.05,
            confidenceModifier: 3.0,  // Scales the impact of confidence on learning rate
            mutationThreshold: 0.15,  // Confidence threshold below which mutations occur
            mutationRate: 0.25,       // Probability of mutation for low confidence connections
            rewardScaling: 2.0        // Scaling factor for reward-based learning
        };
        
        // Add training statistics
        this.stats = {
            trainingIterations: 0,
            lastError: 0,
            totalReward: 0,
            rewardCount: 0,
            activationFunctionCounts: {
                'leakyrelu': 0,
                'relu': 0,
                'sigmoid': 0,
                'tanh': 0,
                'swish': 0,
                'elu': 0
            }
        };
        
        // Add tracking for movement and reward history
        this.movementHistory = {
            lastDirection: null,
            consecutiveCorrectMoves: 0,
            distanceFromFood: [],
            lastDistanceFromFood: -1,
            correctDirections: [],
            wrongDirections: []
        };
    }

    forward(input) {
        // Reset activations and active paths for this forward pass
        this.activations = this.layers.map(layer => Array(layer.length).fill(false));
        this.activePaths = [];

        // Enhanced input validation to handle various incorrect input types
        let safeInput;
        
        if (Array.isArray(input) && input.length === this.inputSize) {
            // Input is correct array format - sanitize values
            safeInput = input.map(val => {
                if (isNaN(val) || !isFinite(val)) return 0;
                return Number(val) || 0;
            });
        } else if (typeof input === 'number' || typeof input === 'string') {
            // Input is a scalar (number or string) - convert to array of correct length
            console.warn(`Invalid input: expected array of length ${this.inputSize}, got ${input}`);
            safeInput = Array(this.inputSize).fill(0);
            
            // If it's a number, put it in the first position
            if (!isNaN(Number(input))) {
                safeInput[0] = Number(input);
            }
        } else if (!input || typeof input !== 'object') {
            // Input is null, undefined, or not an object
            console.warn(`Invalid input: expected array of length ${this.inputSize}, got ${input}`);
            safeInput = Array(this.inputSize).fill(0);
        } else {
            // Input is an object but not an array
            console.warn(`Invalid input: expected array of length ${this.inputSize}, got object`, input);
            safeInput = Array(this.inputSize).fill(0);
            
            // Try to extract values from object if possible
            if ('x' in input) safeInput[0] = Number(input.x) || 0;
            if ('y' in input) safeInput[2] = Number(input.y) || 0;
        }

        // Set input layer values
        this.layers[0] = safeInput;
        this.activations[0] = safeInput.map(v => v !== 0);
        
        // Log the sanitized input for debugging
        // Forward propagation through layers
        for (let l = 1; l < this.layers.length; l++) {
            if (!this.layers[l] || !this.weights[l-1] || !this.biases[l-1]) {
                console.error(`Missing layer data at layer ${l}`);
                continue;
            }

            const currentLayer = this.layers[l];
            const prevLayer = this.layers[l-1];
            const weights = this.weights[l-1];
            const biases = this.biases[l-1];
            const layerType = this.layerTypes[l];
            
            // Calculate the current section based on the layer structure
            const inputSize = 1; // Input is layer 0
            const expansionLayerCount = this.expansionLayers.length;
            const centralLayerCount = this.centralLayers.length;
            const contractionLayerCount = this.contractionLayers.length;
            
            const isLastExpansionToFirstCentral = 
                l === expansionLayerCount + 1; // +1 because layers include input layer
                
            const isLastCentralToFirstContraction = 
                l === expansionLayerCount + centralLayerCount + 1;
                
            const isLastContractionToOutput = 
                l === expansionLayerCount + centralLayerCount + contractionLayerCount + 1;

            // Initialize current layer
            currentLayer.fill(0);
            let layerHasActivation = false;

            // Process each node in previous layer
            for (let i = 0; i < prevLayer.length; i++) {
                if (!this.activations[l-1][i]) continue;

                const activation = prevLayer[i];
                if (!weights[i]) continue;

                // Special handling for transition layers with direct index-to-index connections
                if (isLastExpansionToFirstCentral) {
                    // Direct 1:1 connection from last expansion layer to first central layer
                    // Map index-to-index, but only within bounds
                    const targetIdx = i < currentLayer.length ? i : i % currentLayer.length;
                    
                    if (weights[i][targetIdx] !== undefined) {
                        const contribution = activation * weights[i][targetIdx];
                        currentLayer[targetIdx] += contribution;
                        this.activations[l][targetIdx] = true;
                        layerHasActivation = true;

                        // Track this direct connection for visualization
                        this.activePaths.push({
                            layer: l-1,
                            from: i,
                            to: targetIdx,
                            value: Math.abs(activation),
                            sign: Math.sign(activation),
                            type: 'direct',  // Mark as direct connection for visualization
                            isPrimary: true
                        });
                    }
                }
                else if (isLastCentralToFirstContraction) {
                    // Direct 1:1 connection from last central layer to first contraction layer
                    // Map index-to-index, but only within bounds
                    const targetIdx = i < currentLayer.length ? i : i % currentLayer.length;
                    
                    if (weights[i][targetIdx] !== undefined) {
                        const contribution = activation * weights[i][targetIdx];
                        currentLayer[targetIdx] += contribution;
                        this.activations[l][targetIdx] = true;
                        layerHasActivation = true;

                        // Track this direct connection for visualization
                        this.activePaths.push({
                            layer: l-1,
                            from: i,
                            to: targetIdx,
                            value: Math.abs(activation),
                            sign: Math.sign(activation),
                            type: 'direct',  // Mark as direct connection for visualization
                            isPrimary: true
                        });
                    }
                }
                else if (isLastContractionToOutput) {
                    // Direct 1:1 connection from last contraction layer to output layer
                    // Map index-to-index, but only within bounds
                    const targetIdx = i < currentLayer.length ? i : i % currentLayer.length;
                    
                    if (weights[i][targetIdx] !== undefined) {
                        const contribution = activation * weights[i][targetIdx];
                        currentLayer[targetIdx] += contribution;
                        this.activations[l][targetIdx] = true;
                        layerHasActivation = true;

                        // Track this direct connection for visualization
                        this.activePaths.push({
                            layer: l-1,
                            from: i,
                            to: targetIdx,
                            value: Math.abs(activation),
                            sign: Math.sign(activation),
                            type: 'direct',  // Mark as direct connection for visualization
                            isPrimary: true
                        });
                    }
                }
                else if (layerType === 'expansion') {
                    // Normal Y-fork pattern for standard expansion layers
                    const targetIdx = activation >= 0 ? 
                        (i * 2) % currentLayer.length : 
                        (i * 2 + 1) % currentLayer.length;

                    if (targetIdx < currentLayer.length && weights[i][targetIdx] !== undefined) {
                        const contribution = Math.abs(activation) * weights[i][targetIdx];
                        currentLayer[targetIdx] += contribution;
                        this.activations[l][targetIdx] = true;
                        layerHasActivation = true;

                        this.activePaths.push({
                            layer: l-1,
                            from: i,
                            to: targetIdx,
                            value: Math.abs(activation),
                            sign: activation >= 0 ? 1 : -1,
                            type: 'expansion',
                            isPrimary: true
                        });
                    }
                }
                else if (layerType === 'central') {
                    // Determine if this is the last central layer (connecting to first contraction layer)
                    const isLastCentralLayer = l === expansionLayerCount + centralLayerCount;
                    
                    if (isLastCentralLayer) {
                        // Last central layer needs BOTH:
                        // 1. Index-to-index direct connections (handled by isLastCentralToFirstContraction)
                        // 2. Connections to all nodes in next layer (as with other central layers)
                        
                        // For the last central layer to first contraction layer, connect to ALL nodes
                        // while giving preference (higher weight) to the index-to-index connections
                        for (let j = 0; j < currentLayer.length; j++) {
                            // Skip if weight doesn't exist
                            if (!weights[i][j]) continue;
                            
                            // Apply weight and add to target node
                            const contribution = activation * weights[i][j];
                            
                            // Determine if this is a primary (index-to-index) or secondary connection
                            const isPrimaryConnection = (i === j);
                            
                            // Add contribution - we'll still process the direct connections separately
                            // with isLastCentralToFirstContraction for emphasis on those paths
                            currentLayer[j] += contribution * (isPrimaryConnection ? 1.0 : 0.5);
                            this.activations[l][j] = true;
                            layerHasActivation = true;
                            
                            // Only track secondary connections here, as primary ones are tracked in 
                            // isLastCentralToFirstContraction
                            if (!isPrimaryConnection) {
                                this.activePaths.push({
                                    layer: l-1,
                                    from: i,
                                    to: j,
                                    value: Math.abs(activation) * 0.5,
                                    sign: Math.sign(activation),
                                    type: 'central',
                                    isPrimary: false
                                });
                            }
                        }
                    }
                    else {
                        // For central-to-central connections, fully connect to ALL nodes in next layer
                        for (let j = 0; j < currentLayer.length; j++) {
                            // Skip if weight doesn't exist
                            if (!weights[i][j]) continue;
                            
                            // Apply weights without filtering
                            const contribution = activation * weights[i][j];
                            currentLayer[j] += contribution;
                            this.activations[l][j] = true;
                            layerHasActivation = true;
                            
                            // Determine if this is a "primary" connection based on index correspondence
                            // This is mainly for visualization purposes
                            const isPrimaryConnection = (i === j);
                            
                            // Track this path for visualization
                            this.activePaths.push({
                                layer: l-1,
                                from: i,
                                to: j,
                                value: Math.abs(activation),
                                sign: Math.sign(activation),
                                type: 'central',
                                isPrimary: isPrimaryConnection
                            });
                        }
                    }
                }
                else if (layerType === 'contraction') {
                    // Check if this is the last contraction layer connecting to output
                    const isLastContractionLayer = l === this.layers.length - 2;
                    
                    if (isLastContractionLayer) {
                        // Last contraction layer connects to ALL nodes in output layer
                        // with preference for index-to-index connections
                        for (let j = 0; j < currentLayer.length; j++) {
                            // Skip if weight doesn't exist
                            if (!weights[i][j]) continue;
                            
                            // Apply weight and add to target node
                            const contribution = activation * weights[i][j];
                            
                            // Determine if this is a primary (index-to-index) or secondary connection
                            const isPrimaryConnection = (i === j);
                            
                            // Add contribution - we'll still process the direct connections separately
                            // with isLastContractionToOutput for emphasis on those paths
                            currentLayer[j] += contribution * (isPrimaryConnection ? 1.0 : 0.5);
                            this.activations[l][j] = true;
                            layerHasActivation = true;
                            
                            // Only track secondary connections here, as primary ones are tracked in 
                            // isLastContractionToOutput
                            if (!isPrimaryConnection) {
                                this.activePaths.push({
                                    layer: l-1,
                                    from: i,
                                    to: j,
                                    value: Math.abs(activation) * 0.5,
                                    sign: Math.sign(activation),
                                    type: 'contraction',
                                    isPrimary: false
                                });
                            }
                        }
                    } else {
                        // Standard contraction layer: pair averaging
                        // Calculate the target index based on pair averaging
                        const targetIdx = Math.floor(i / 2);
                        
                        if (targetIdx < currentLayer.length && weights[i][targetIdx] !== undefined) {
                            // Apply weight with pair averaging
                            const contribution = activation * weights[i][targetIdx];
                            
                            // Count how many nodes connect to this target for proper averaging
                            const pathsToTarget = this.layers[l-1].length / 2;
                            const avgFactor = pathsToTarget > 0 ? 1.0 / pathsToTarget : 1.0;
                            
                            // Apply the averaged contribution
                            currentLayer[targetIdx] += contribution * avgFactor;
                            this.activations[l][targetIdx] = true;
                            layerHasActivation = true;

                            this.activePaths.push({
                                layer: l-1,
                                from: i,
                                to: targetIdx,
                                value: Math.abs(activation),
                                sign: Math.sign(activation),
                                type: 'contraction',
                                isPrimary: true
                            });
                        }
                    }
                }
                
                // Apply activation function with support for different types
                for (let j = 0; j < currentLayer.length; j++) {
                    if (!this.activations[l][j]) continue;
                    
                    if (biases[j] !== undefined) {
                        currentLayer[j] += biases[j];
                    }

                    // Apply activation function for hidden layers
                    if (l < this.layers.length - 1) {
                        // Use the node's specific activation function if defined
                        const activationFunc = 
                            this.nodeActivationFuncs && 
                            this.nodeActivationFuncs[l] && 
                            this.nodeActivationFuncs[l][j] 
                                ? this.nodeActivationFuncs[l][j] 
                                : 'leakyrelu'; // Default to leaky ReLU
                        
                        // Apply the appropriate activation function
                        switch (activationFunc) {
                            case 'relu':
                                // ReLU: max(0, x)
                                currentLayer[j] = Math.max(0, currentLayer[j]);
                                break;
                                
                            case 'leakyrelu':
                                // Leaky ReLU: x if x > 0 else 0.01 * x
                                currentLayer[j] = currentLayer[j] > 0 
                                    ? currentLayer[j] 
                                    : 0.01 * currentLayer[j];
                                break;
                                
                            case 'sigmoid':
                                // Sigmoid: 1 / (1 + e^-x)
                                currentLayer[j] = 1 / (1 + Math.exp(-currentLayer[j]));
                                break;
                                
                            case 'tanh':
                                // Hyperbolic tangent: tanh(x)
                                currentLayer[j] = Math.tanh(currentLayer[j]);
                                break;
                                
                            case 'swish':
                                // Swish: x * sigmoid(x)
                                const sigmoid = 1 / (1 + Math.exp(-currentLayer[j]));
                                currentLayer[j] = currentLayer[j] * sigmoid;
                                break;
                                
                            case 'elu':
                                // ELU: x if x > 0 else alpha * (e^x - 1)
                                currentLayer[j] = currentLayer[j] > 0 
                                    ? currentLayer[j] 
                                    : 0.1 * (Math.exp(currentLayer[j]) - 1);
                                break;
                                
                            default:
                                // Default to leaky ReLU if unknown
                                currentLayer[j] = currentLayer[j] > 0 
                                    ? currentLayer[j] 
                                    : 0.01 * currentLayer[j];
                        }
                        
                        // Consider a node active if it has any non-zero output
                        this.activations[l][j] = currentLayer[j] !== 0;
                    }
                }
            }

            // Ensure at least one node is active
            if (!layerHasActivation && l < this.layers.length - 1) {
                currentLayer[0] = 0.1;
                this.activations[l][0] = true;
            }
        }

        return this.layers[this.layers.length - 1];
    }

    backpropagate(target, learningRate = 0.01) {
        const outputLayer = this.layers[this.layers.length - 1];
        
        // Ensure target is an array with proper length
        const safeTarget = Array.isArray(target) ? target : Array(outputLayer.length).fill(0);
        while (safeTarget.length < outputLayer.length) {
            safeTarget.push(0);
        }
        
        // Calculate errors with increased emphasis on large errors
        const errors = outputLayer.map((output, i) => {
            const error = i < safeTarget.length ? safeTarget[i] - output : 0;
            // Apply error scaling for more aggressive training on large errors
            return Math.sign(error) * Math.pow(Math.abs(error), 1.5);
        });
        
        // Group active paths by layer for easier processing
        const pathsByLayer = {};
        for (const path of this.activePaths) {
            if (!pathsByLayer[path.layer]) {
                pathsByLayer[path.layer] = [];
            }
            pathsByLayer[path.layer].push(path);
        }
        
        // Initialize gradients for weights and biases
        const weightGradients = [];
        const biasGradients = [];
        
        for (let l = 0; l < this.layers.length - 1; l++) {
            weightGradients.push(
                Array.from({ length: this.layers[l].length }, 
                    () => Array(this.layers[l+1].length).fill(0))
            );
            biasGradients.push(Array(this.layers[l+1].length).fill(0));
        }
        
        // Calculate output layer gradients directly from errors
        for (let j = 0; j < outputLayer.length; j++) {
            biasGradients[this.biases.length - 1][j] = errors[j];
            
            // For each active path to this output node
            const lastLayerPaths = pathsByLayer[this.layers.length - 2] || [];
            for (const path of lastLayerPaths) {
                if (path.to === j) {
                    // Update weight gradient
                    const i = path.from;
                    weightGradients[this.weights.length - 1][i][j] = 
                        errors[j] * this.layers[this.layers.length - 2][i];
                }
            }
        }
        
        // Backpropagate error through hidden layers
        for (let l = this.layers.length - 2; l > 0; l--) {
            const layerType = this.layerTypes[l];
            
            for (let i = 0; i < this.layers[l].length; i++) {
                // Skip inactive nodes - DPNN only updates active paths
                if (!this.activations[l][i]) continue;
                
                // Calculate node delta based on layer type and connections
                let nodeDelta = 0;
                
                // Sum contributions from forward paths (paths from this node)
                const nextLayerPaths = pathsByLayer[l] || [];
                const pathsFromNode = nextLayerPaths.filter(path => path.from === i);
                
                for (const path of pathsFromNode) {
                    const nextLayerIndex = path.to;
                    const nextLayerType = this.layerTypes[l+1];
                    
                    // Get delta from the next layer - depends on layer type
                    if (nextLayerType === 'output') {
                        // Direct error from output layer
                        nodeDelta += errors[nextLayerIndex] * this.weights[l][i][nextLayerIndex];
                    } 
                    else if (nextLayerType === 'contraction') {
                        // For contraction layers, delta is affected by averaging
                        // Count paths to the node for averaging factor
                        const pathsToNextNode = nextLayerPaths.filter(p => p.to === nextLayerIndex).length;
                        const averagingFactor = pathsToNextNode > 0 ? 1 / pathsToNextNode : 1;
                        
                        // Get the next layer's gradient
                        const nextNodeDelta = biasGradients[l][nextLayerIndex];
                        nodeDelta += nextNodeDelta * this.weights[l][i][nextLayerIndex] * averagingFactor;
                    }
                    else {
                        // Central or expansion layers
                        const nextNodeDelta = biasGradients[l][nextLayerIndex];
                        
                        // For central layers with high/low pass gates, account for path strength
                        if (nextLayerType === 'central' && !path.isPrimary) {
                            // Secondary paths have reduced influence proportional to their strength
                            nodeDelta += nextNodeDelta * this.weights[l][i][nextLayerIndex] * 0.3;
                        } else {
                            nodeDelta += nextNodeDelta * this.weights[l][i][nextLayerIndex];
                        }
                    }
                }
                
                // Apply derivative of ReLU (only for non-input layers)
                if (layerType !== 'input') {
                    nodeDelta *= (this.layers[l][i] > 0) ? 1 : 0;
                }
                
                // Store this node's delta in its bias gradient
                biasGradients[l-1][i] = nodeDelta;
                
                // Update weight gradients for incoming connections
                const prevLayerPaths = pathsByLayer[l-1] || [];
                for (const path of prevLayerPaths) {
                    if (path.to === i) {
                        const h = path.from;
                        weightGradients[l-1][h][i] = nodeDelta * this.layers[l-1][h];
                    }
                }
            }
        }
        
        // Apply gradients with learning rate - only to active paths and nodes
        for (let l = 0; l < this.layers.length - 1; l++) {
            // Update weights only for active paths
            const layerPaths = pathsByLayer[l] || [];
            for (const path of layerPaths) {
                const i = path.from;
                const j = path.to;
                this.weights[l][i][j] += learningRate * weightGradients[l][i][j];
            }
            
            // Update biases only for active nodes in the next layer
            for (let j = 0; j < this.layers[l+1].length; j++) {
                if (this.activations[l+1][j]) {
                    this.biases[l][j] += learningRate * biasGradients[l][j];
                }
            }
        }
        
        // Return total error for monitoring
        return errors.reduce((sum, err) => sum + Math.abs(err), 0) / errors.length;
    }

    confidenceBasedBackpropagation(target, learningRate = 0.01) {
        const outputLayer = this.layers[this.layers.length - 1];
        
        // Ensure target is an array with proper length
        const safeTarget = Array.isArray(target) ? target : Array(outputLayer.length).fill(0);
        while (safeTarget.length < outputLayer.length) {
            safeTarget.push(0);
        }
        
        // Calculate errors with increased emphasis on large errors
        const errors = outputLayer.map((output, i) => {
            const error = i < safeTarget.length ? safeTarget[i] - output : 0;
            // Apply error scaling for more aggressive training on large errors
            return Math.sign(error) * Math.pow(Math.abs(error), 1.5);
        });
        
        // Group active paths by layer for easier processing
        const pathsByLayer = {};
        for (const path of this.activePaths) {
            if (!pathsByLayer[path.layer]) {
                pathsByLayer[path.layer] = [];
            }
            pathsByLayer[path.layer].push(path);
        }
        
        // Initialize gradients for weights and biases
        const weightGradients = [];
        const biasGradients = [];
        
        for (let l = 0; l < this.layers.length - 1; l++) {
            weightGradients.push(
                Array.from({ length: this.layers[l].length }, 
                    () => Array(this.layers[l+1].length).fill(0))
            );
            biasGradients.push(Array(this.layers[l+1].length).fill(0));
        }
        
        // Calculate output layer gradients directly from errors
        for (let j = 0; j < outputLayer.length; j++) {
            biasGradients[this.biases.length - 1][j] = errors[j];
            
            // For each active path to this output node
            const lastLayerPaths = pathsByLayer[this.layers.length - 2] || [];
            for (const path of lastLayerPaths) {
                if (path.to === j) {
                    // Update weight gradient
                    const i = path.from;
                    weightGradients[this.weights.length - 1][i][j] = 
                        errors[j] * this.layers[this.layers.length - 2][i];
                }
            }
        }
        
        // Backpropagate error through hidden layers
        for (let l = this.layers.length - 2; l > 0; l--) {
            const layerType = this.layerTypes[l];
            
            for (let i = 0; i < this.layers[l].length; i++) {
                // Skip inactive nodes - DPNN only updates active paths
                if (!this.activations[l][i]) continue;
                
                // Calculate node delta based on layer type and connections
                let nodeDelta = 0;
                
                // Sum contributions from forward paths (paths from this node)
                const nextLayerPaths = pathsByLayer[l] || [];
                const pathsFromNode = nextLayerPaths.filter(path => path.from === i);
                
                for (const path of pathsFromNode) {
                    const nextLayerIndex = path.to;
                    const nextLayerType = this.layerTypes[l+1];
                    
                    // Get delta from the next layer - depends on layer type
                    if (nextLayerType === 'output') {
                        // Direct error from output layer
                        nodeDelta += errors[nextLayerIndex] * this.weights[l][i][nextLayerIndex];
                    } 
                    else if (nextLayerType === 'contraction') {
                        // For contraction layers, delta is affected by averaging
                        // Count paths to the node for averaging factor
                        const pathsToNextNode = nextLayerPaths.filter(p => p.to === nextLayerIndex).length;
                        const averagingFactor = pathsToNextNode > 0 ? 1 / pathsToNextNode : 1;
                        
                        // Get the next layer's gradient
                        const nextNodeDelta = biasGradients[l][nextLayerIndex];
                        nodeDelta += nextNodeDelta * this.weights[l][i][nextLayerIndex] * averagingFactor;
                    }
                    else {
                        // Central or expansion layers
                        const nextNodeDelta = biasGradients[l][nextLayerIndex];
                        
                        // For central layers with high/low pass gates, account for path strength
                        if (nextLayerType === 'central' && !path.isPrimary) {
                            // Secondary paths have reduced influence proportional to their strength
                            nodeDelta += nextNodeDelta * this.weights[l][i][nextLayerIndex] * 0.3;
                        } else {
                            nodeDelta += nextNodeDelta * this.weights[l][i][nextLayerIndex];
                        }
                    }
                }
                
                // Apply derivative of ReLU (only for non-input layers)
                if (layerType !== 'input') {
                    nodeDelta *= (this.layers[l][i] > 0) ? 1 : 0;
                }
                
                // Store this node's delta in its bias gradient
                biasGradients[l-1][i] = nodeDelta;
                
                // Update weight gradients for incoming connections
                const prevLayerPaths = pathsByLayer[l-1] || [];
                for (const path of prevLayerPaths) {
                    if (path.to === i) {
                        const h = path.from;
                        weightGradients[l-1][h][i] = nodeDelta * this.layers[l-1][h];
                    }
                }
            }
        }
        
        // Apply gradients with learning rate - only to active paths and nodes
        // But now modified by confidence ratings and customizable parameters
        for (let l = 0; l < this.layers.length - 1; l++) {
            // First ensure ALL active paths have their connection confidence updated
            // This addresses the core requirement to update ALL fired connections
            for (const path of this.activePaths) {
                if (path.layer === l) {
                    const i = path.from;
                    const j = path.to;
                    
                    // Get the error magnitude for this connection, defaulting to a small value if not calculated
                    let errorMagnitude = Math.abs(weightGradients[l][i][j]);
                    
                    // Ensure confidence is updated even if no specific error gradient was calculated
                    // This captures ALL fired connections, not just ones with gradients
                    if (errorMagnitude < 0.1) {
                        // Small or no error = good performance = increase confidence
                        this.connectionConfidence[l][i][j] = Math.min(
                            this.connectionConfidence[l][i][j] + 0.01, 
                            1.0
                        );
                    } else {
                        // Large error = poor performance = decrease confidence
                        this.connectionConfidence[l][i][j] = Math.max(
                            this.connectionConfidence[l][i][j] - 0.02 * errorMagnitude, 
                            0.05
                        );
                    }
                }
            }
            
            // Now update weights using the updated confidence values - only for active paths with gradients
            const layerPaths = pathsByLayer[l] || [];
            for (const path of layerPaths) {
                const i = path.from;
                const j = path.to;
                
                // Use connection confidence to adjust learning rate
                const connConfidence = this.connectionConfidence[l][i][j];
                
                // Lower confidence leads to higher learning rate (more aggressive adjustments)
                // Higher confidence leads to lower learning rate (more stable, conservative adjustments)
                // Now using configurable confidence modifier
                const confidenceModifier = Math.pow(1.0 - connConfidence, 2) * 
                    this.learningParams.confidenceModifier + 0.2;
                
                // Apply confidence-adjusted learning rate to weight update
                // Check for NaN or Infinity before applying the update
                const weightDelta = learningRate * weightGradients[l][i][j] * confidenceModifier;
                if (!isNaN(weightDelta) && isFinite(weightDelta)) {
                    this.weights[l][i][j] += weightDelta;
                }
                
                // If confidence is very low, mutate the weight randomly
                // Now using configurable mutation threshold and rate
                if (this.connectionConfidence[l][i][j] < this.learningParams.mutationThreshold) {
                    // Apply random mutation to weight with configurable probability
                    if (Math.random() < this.learningParams.mutationRate) {
                        const mutationStrength = (this.learningParams.mutationThreshold - 
                            this.connectionConfidence[l][i][j]) * 8;
                        
                        // Check for NaN or Infinity before applying mutation
                        if (!isNaN(mutationStrength) && isFinite(mutationStrength)) {
                            this.weights[l][i][j] += (Math.random() * 2 - 1) * mutationStrength;
                        }
                    }
                }
            }
            
            // Update biases only for active nodes in the next layer
            for (let j = 0; j < this.layers[l+1].length; j++) {
                if (this.activations[l+1][j]) {
                    this.biases[l][j] += learningRate * biasGradients[l][j];
                }
            }
        }
        
        // Update training statistics
        this.stats.trainingIterations++;
        this.stats.lastError = errors.reduce((sum, err) => sum + Math.abs(err), 0) / errors.length;
        
        // Verify network integrity to catch and fix any NaN values
        this.verifyNetworkIntegrity();
        
        // Return total error for monitoring
        return this.stats.lastError;
    }

    train(input, target, learningRate = 0.05) {
        // Use the base learning rate from parameters instead of default
        const baseLearningRate = this.learningParams.baseLearningRate;
        
        // If input is a number (reward value), we need to handle this special case
        // This happens when train() is called with just a reward value from Game.js
        if (typeof input === 'number') {
            // This is a reward-only call (common in reinforcement learning)
            // Use the last input that was processed in forward()
            const reward = input;
            
            // Update reward statistics
            this.stats.totalReward += reward;
            this.stats.rewardCount++;
            
            // More aggressive target values
            const outputLayer = this.layers[this.layers.length - 1];
            const targetOutput = Array(outputLayer.length).fill(0).map((_, i) => {
                if (reward > 0) {
                    // For positive rewards, push values more strongly toward 1.0
                    return Math.max(outputLayer[i], 0.7);
                } else {
                    // For negative rewards, more aggressively invert the output
                    return outputLayer[i] > 0.4 ? 0 : 1;
                }
            });
            
            // Use higher learning rate for reinforcement learning
            // Now scales with configurable reward scaling
            const reinforcementRate = Math.abs(reward) * baseLearningRate * 
                this.learningParams.rewardScaling;
            return this.confidenceBasedBackpropagation(targetOutput, reinforcementRate);
        }
        
        // Normal case: both input and target provided
        // Forward pass
        this.forward(input);
        
        // If target is a number (reward), convert to expected output format
        if (typeof target === 'number') {
            // Update reward statistics
            this.stats.totalReward += target;
            this.stats.rewardCount++;
            
            // Positive reward: reinforce current output more aggressively
            // Negative reward: more strongly inverse current output
            const outputLayer = this.layers[this.layers.length - 1];
            
            // More aggressive target values
            const targetOutput = Array(outputLayer.length).fill(0).map((_, i) => {
                if (target > 0) {
                    // For positive rewards, push values more strongly toward 1.0
                    return Math.max(outputLayer[i], 0.7);
                } else {
                    // For negative rewards, more aggressively invert the output
                    return outputLayer[i] > 0.4 ? 0 : 1;
                }
            });
            
            // Use higher learning rate for reinforcement learning
            // Now scales with configurable reward scaling
            const reinforcementRate = Math.abs(target) * baseLearningRate * 
                this.learningParams.rewardScaling;
            return this.confidenceBasedBackpropagation(targetOutput, reinforcementRate);
        } else {
            // Regular training with specific target values - still use enhanced learning rate
            return this.confidenceBasedBackpropagation(target, baseLearningRate * 1.5);
        }
    }

    updateLearningParams(params) {
        // Update learning parameters with new values from UI
        if (params.baseLearningRate !== undefined) {
            this.learningParams.baseLearningRate = params.baseLearningRate;
        }
        if (params.confidenceModifier !== undefined) {
            this.learningParams.confidenceModifier = params.confidenceModifier;
        }
        if (params.mutationThreshold !== undefined) {
            this.learningParams.mutationThreshold = params.mutationThreshold;
        }
        if (params.mutationRate !== undefined) {
            this.learningParams.mutationRate = params.mutationRate;
        }
        if (params.rewardScaling !== undefined) {
            this.learningParams.rewardScaling = params.rewardScaling;
        }
    }

    // Update activation function counting for statistics
    updateActivationFunctionStats() {
        // Reset counts
        Object.keys(this.stats.activationFunctionCounts).forEach(key => {
            this.stats.activationFunctionCounts[key] = 0;
        });
        
        // Count occurrences of each activation function
        if (this.nodeActivationFuncs) {
            for (let l = 1; l < this.nodeActivationFuncs.length; l++) {
                for (let i = 0; i < this.nodeActivationFuncs[l].length; i++) {
                    const func = this.nodeActivationFuncs[l][i] || 'leakyrelu';
                    if (this.stats.activationFunctionCounts[func] !== undefined) {
                        this.stats.activationFunctionCounts[func]++;
                    }
                }
            }
        }
    }

    getNetworkStats() {
        this.updateActivationFunctionStats();
        
        // Calculate average reward if we have data
        const avgReward = this.stats.rewardCount > 0 
            ? this.stats.totalReward / this.stats.rewardCount 
            : 0;
        
        return {
            trainingIterations: this.stats.trainingIterations,
            lastError: this.stats.lastError,
            avgReward: avgReward.toFixed(4),
            functionDistribution: this.stats.activationFunctionCounts
        };
    }
    
    // Utility method to verify network integrity and fix any issues
    verifyNetworkIntegrity() {
        let issuesFound = false;
        
        // Check all layer values for NaN
        for (let l = 0; l < this.layers.length; l++) {
            for (let i = 0; i < this.layers[l].length; i++) {
                if (isNaN(this.layers[l][i]) || !isFinite(this.layers[l][i])) {
                    console.error(`NaN/Infinity found in layer ${l}, node ${i} - fixing`);
                    this.layers[l][i] = 0;
                    issuesFound = true;
                }
            }
        }
        
        // Check all weights for NaN
        for (let l = 0; l < this.weights.length; l++) {
            for (let i = 0; i < this.weights[l].length; i++) {
                for (let j = 0; j < this.weights[l][i].length; j++) {
                    if (isNaN(this.weights[l][i][j]) || !isFinite(this.weights[l][i][j])) {
                        console.error(`NaN/Infinity weight found from layer ${l}, node ${i} to node ${j} - fixing`);
                        this.weights[l][i][j] = Math.random() * 2 - 1;
                        issuesFound = true;
                        
                        // Also reset the connection confidence to prevent further issues
                        if (this.connectionConfidence && this.connectionConfidence[l] && 
                            this.connectionConfidence[l][i]) {
                            this.connectionConfidence[l][i][j] = 0.5;
                        }
                    }
                    
                    // Also check for extremely large values that could lead to numerical instability
                    if (Math.abs(this.weights[l][i][j]) > 10) {
                        console.warn(`Extremely large weight found in layer ${l}, node ${i} to ${j}: ${this.weights[l][i][j]} - normalizing`);
                        this.weights[l][i][j] = Math.sign(this.weights[l][i][j]) * 5;
                        issuesFound = true;
                    }
                }
            }
        }
        
        // Check all biases for NaN
        for (let l = 0; l < this.biases.length; l++) {
            if (!this.biases[l]) {
                console.error(`Missing bias array at layer ${l} - creating`);
                const nextLayerSize = l+1 < this.layers.length ? this.layers[l+1].length : 0;
                this.biases[l] = Array(nextLayerSize).fill(0).map(() => Math.random() * 0.5 - 0.25);
                issuesFound = true;
                continue;
            }
            
            for (let i = 0; i < this.biases[l].length; i++) {
                if (isNaN(this.biases[l][i]) || !isFinite(this.biases[l][i])) {
                    console.error(`NaN/Infinity bias found in layer ${l}, node ${i} - fixing`);
                    this.biases[l][i] = Math.random() * 0.5 - 0.25;
                    issuesFound = true;
                    
                    // Also reset the node confidence to prevent further issues
                    if (this.nodeConfidence && this.nodeConfidence[l+1]) {
                        this.nodeConfidence[l+1][i] = 0.5;
                    }
                }
                
                // Check for extremely large bias values
                if (Math.abs(this.biases[l][i]) > 5) {
                    console.warn(`Extremely large bias found in layer ${l}, node ${i}: ${this.biases[l][i]} - normalizing`);
                    this.biases[l][i] = Math.sign(this.biases[l][i]) * 2;
                    issuesFound = true;
                }
            }
        }
        
        // Check node confidence values
        if (this.nodeConfidence) {
            for (let l = 0; l < this.nodeConfidence.length; l++) {
                if (this.nodeConfidence[l]) {
                    for (let i = 0; i < this.nodeConfidence[l].length; i++) {
                        if (isNaN(this.nodeConfidence[l][i]) || !isFinite(this.nodeConfidence[l][i])) {
                            console.error(`NaN/Infinity node confidence found in layer ${l}, node ${i} - fixing`);
                            this.nodeConfidence[l][i] = 0.5;
                            issuesFound = true;
                        }
                    }
                }
            }
        }
        
        // Check connection confidence values
        if (this.connectionConfidence) {
            for (let l = 0; l < this.connectionConfidence.length; l++) {
                if (this.connectionConfidence[l]) {
                    for (let i = 0; i < this.connectionConfidence[l].length; i++) {
                        if (this.connectionConfidence[l][i]) {
                            for (let j = 0; j < this.connectionConfidence[l][i].length; j++) {
                                if (isNaN(this.connectionConfidence[l][i][j]) || !isFinite(this.connectionConfidence[l][i][j])) {
                                    console.error(`NaN/Infinity connection confidence found in layer ${l}, from ${i} to ${j} - fixing`);
                                    this.connectionConfidence[l][i][j] = 0.5;
                                    issuesFound = true;
                                }
                            }
                        }
                    }
                }
            }
        }
        
        return !issuesFound; // Return true if no issues were found
    }

    // Add new method for pruning connections in central layers
    pruneConnections() {
        // Calculate overall network activation percentage
        let totalNodes = 0;
        let activeNodes = 0;
        
        for (let l = 0; l < this.layers.length; l++) {
            totalNodes += this.layers[l].length;
            activeNodes += this.activations[l].filter(active => active).length;
        }
        
        const activationPercentage = (activeNodes / totalNodes) * 100;
         
        // Keep track of pruning history to monitor effectiveness
        if (!this.pruningHistory) {
            this.pruningHistory = {
                prunedConnections: 0,
                addedConnections: 0,
                lastPrunedLayer: -1,
                lastPrunedFrom: -1,
                lastPrunedTo: -1,
                lastActivationPercentage: activationPercentage
            };
        }
        
        // Prune connections when activation percentage is high (above 30%)
        if (activationPercentage > 30) {
            // Only prune central layers as specified in requirements
            let prunedAny = false;
            for (let l = 4; l < this.layers.length - 1; l++) {
                // Check if this is a central layer
                if (this.layerTypes && this.layerTypes[l] === 'central') {
                    let pruned = this.pruneLeastConfidentConnection(l);
                    if (pruned) {
                        prunedAny = true;
                        this.pruningHistory.prunedConnections++;
                        this.pruningHistory.lastPrunedLayer = l;
                        this.pruningHistory.lastPrunedFrom = pruned.from;
                        this.pruningHistory.lastPrunedTo = pruned.to;
                        
                        // Immediately verify the effect by zeroing out this connection
                        // This forces a recalculation of paths in next forward pass
                        this.weights[l][pruned.from][pruned.to] = 0;
                        
                       
                    }

                }
            }
            
            if (prunedAny) {
                // Force recalculation of active paths on next forward pass
                this.activePaths = [];
            }
        }
        // Add new random connections when activation percentage is low (below 20%)
        else if (activationPercentage < 20) {
            // Only add to central layers
            let addedAny = false;
            for (let l = 0; l < this.layers.length - 1; l++) {
                if (this.layerTypes && this.layerTypes[l] === 'central') {
                    const added = this.addRandomConnection(l);
                    if (added) {
                        addedAny = true;
                        this.pruningHistory.addedConnections++;
                        
                        // Force recalculation of paths on next forward pass
                        this.activePaths = [];
                        
                        // Break after adding one connection
                        break;
                    }
                }
            }
            
            if (addedAny) {
                console.log(`Added new connection. Activation before: ${this.pruningHistory.lastActivationPercentage.toFixed(1)}%, after: ${activationPercentage.toFixed(1)}%`);
            }
        }
        
        // Update the history
        this.pruningHistory.lastActivationPercentage = activationPercentage;
        
        return activationPercentage;
    }
    
    // Helper method to prune the least confident connection in a given layer
    pruneLeastConfidentConnection(layerIdx) {
        if (!this.connectionConfidence || !this.connectionConfidence[layerIdx]) {
            return null; // No confidence data for this layer
        }
        
        let minConfidence = 1.0;
        let minFrom = -1;
        let minTo = -1;
        
        // Only consider active connections that were actually used in recent forward passes
        const activatedConnectionsInLayer = new Set();
        for (const path of this.activePaths) {
            if (path.layer === layerIdx) {
                activatedConnectionsInLayer.add(`${path.from}_${path.to}`);
            }
        }
        
        // Find the active connection with the lowest confidence
        for (let i = 1; i < this.connectionConfidence[layerIdx].length; i++) {
            if (!this.connectionConfidence[layerIdx][i]) continue;
            
            for (let j = 0; j < this.connectionConfidence[layerIdx][i].length; j++) {
                // Skip connections that aren't active or have zero weight
                const connectionKey = `${i}_${j}`;
                if (!activatedConnectionsInLayer.has(connectionKey) || 
                    Math.abs(this.weights[layerIdx][i][j]) < 0.01) {
                    continue;
                }
                
                const confidence = this.connectionConfidence[layerIdx][i][j];
                
                // Skip connections with very high confidence to prevent breaking well-learned paths
                // And ensure the connection has a significant weight (not already effectively pruned)
                if (confidence < minConfidence && confidence < 0.85 && 
                    Math.abs(this.weights[layerIdx][i][j]) > 0.1) {
                    minConfidence = confidence;
                    minFrom = i;
                    minTo = j;
                }
            }
        }
        
        // If we found a connection to prune
        if (minFrom !== -1 && minTo !== -1) {
            // Store original weight for logging
            const originalWeight = this.weights[layerIdx][minFrom][minTo];
            
            // Set the weight to zero effectively removing the connection
            this.weights[layerIdx][minFrom][minTo] = 0;
            
            // Set connection confidence to low value to prevent it from being selected again soon
            this.connectionConfidence[layerIdx][minFrom][minTo] = 0.1;

            return { layer: layerIdx, from: minFrom, to: minTo, confidence: minConfidence };
        }
        
        return null;
    }
    
    // Helper method to add a random connection in a given layer
    addRandomConnection(layerIdx) {
        if (!this.weights[layerIdx]) {
            return null;
        }
        
        // Choose random source node, but favor nodes that are already active
        // This increases the chance that the new connection will actually be used
        let fromIdx;
        const activeSourceNodes = [];
        
        // Find active nodes in current layer to use as potential sources
        for (let i = 0; i < this.layers[layerIdx].length; i++) {
            if (this.activations[layerIdx][i]) {
                activeSourceNodes.push(i);
            }
        }
        
        // 75% chance to pick an already active node as source if available
        if (activeSourceNodes.length > 0 && Math.random() < 0.75) {
            fromIdx = activeSourceNodes[Math.floor(Math.random() * activeSourceNodes.length)];
        } else {
            // Otherwise pick any random node
            fromIdx = Math.floor(Math.random() * this.weights[layerIdx].length);
        }
        
        // Choose random target node, but prefer inactive nodes to increase activation
        let toIdx;
        const inactiveTargetNodes = [];
        
        // Find inactive nodes in the next layer to use as potential targets
        for (let j = 0; j < this.layers[layerIdx + 1].length; j++) {
            if (!this.activations[layerIdx + 1][j]) {
                inactiveTargetNodes.push(j);
            }
        }
        
        // 75% chance to connect to an inactive node if available
        if (inactiveTargetNodes.length > 0 && Math.random() < 0.75) {
            toIdx = inactiveTargetNodes[Math.floor(Math.random() * inactiveTargetNodes.length)];
        } else {
            // Otherwise pick any random target node
            toIdx = Math.floor(Math.random() * this.weights[layerIdx][0].length);
        }
        
        // Check if the connection already exists with a significant weight
        if (Math.abs(this.weights[layerIdx][fromIdx][toIdx]) > 0.1) {
            // Try boosting this connection instead of creating a duplicate
            const currentWeight = this.weights[layerIdx][fromIdx][toIdx];
            const boostFactor = 1.5;
            this.weights[layerIdx][fromIdx][toIdx] = currentWeight * boostFactor;
            
            // Also boost its confidence to ensure it stays active
            if (this.connectionConfidence && this.connectionConfidence[layerIdx] && 
                this.connectionConfidence[layerIdx][fromIdx]) {
                this.connectionConfidence[layerIdx][fromIdx][toIdx] = 
                    Math.min(this.connectionConfidence[layerIdx][fromIdx][toIdx] + 0.1, 0.9);
            }
            
            console.log(`Boosted existing connection in layer ${layerIdx} from node ${fromIdx} to ${toIdx} from ${currentWeight.toFixed(2)} to ${this.weights[layerIdx][fromIdx][toIdx].toFixed(2)}`);
            return { layer: layerIdx, from: fromIdx, to: toIdx, weight: this.weights[layerIdx][fromIdx][toIdx], type: 'boosted' };
        }
        
        // Create a new random connection with significant weight
        // Using stronger weights than before to ensure it has an effect
        const newWeight = (Math.random() * 0.8 + 0.4) * (Math.random() < 0.5 ? 1 : -1);
        this.weights[layerIdx][fromIdx][toIdx] = newWeight;
        
        // Initialize connection confidence to medium-high level to ensure it stays active
        if (this.connectionConfidence && this.connectionConfidence[layerIdx] && 
            this.connectionConfidence[layerIdx][fromIdx]) {
            this.connectionConfidence[layerIdx][fromIdx][toIdx] = 0.7;
        }
        
        // Log activity with more details
        console.log(`Added new connection in layer ${layerIdx} from node ${fromIdx} (active: ${this.activations[layerIdx][fromIdx]}) to ${toIdx} (active: ${this.activations[layerIdx+1][toIdx]}) with weight ${newWeight.toFixed(2)}`);
        
        return { layer: layerIdx, from: fromIdx, to: toIdx, weight: newWeight, type: 'new' };
    }

    // Add method to evaluate move quality and update confidence
    evaluateMove(currentDirection, foodPosition, snakeHead) {
        if (!this.movementHistory) {
            this.movementHistory = {
                lastDirection: null,
                consecutiveCorrectMoves: 0,
                distanceFromFood: [],
                lastDistanceFromFood: -1,
                correctDirections: [],
                wrongDirections: []
            };
        }
        
        // Calculate Manhattan distance to food
        const distanceToFood = Math.abs(snakeHead.x - foodPosition.x) + Math.abs(snakeHead.y - foodPosition.y);
        
        // Store distance history (keep it reasonable length)
        this.movementHistory.distanceFromFood.push(distanceToFood);
        if (this.movementHistory.distanceFromFood.length > 20) {
            this.movementHistory.distanceFromFood.shift();
        }
        
        // Calculate if we're getting closer or further from food
        let gettingCloser = false;
        let reward = 0;
        
        if (this.movementHistory.lastDistanceFromFood !== -1) {
            if (distanceToFood < this.movementHistory.lastDistanceFromFood) {
                gettingCloser = true;
                
                // Calculate how much closer we're getting (percentage improvement)
                const improvement = (this.movementHistory.lastDistanceFromFood - distanceToFood) / 
                                    this.movementHistory.lastDistanceFromFood;
                
                // Base reward on improvement percentage (0.01 to 0.1)
                reward = Math.min(0.1, Math.max(0.01, improvement * 0.5));
                
                // Track this as a correct direction
                this.movementHistory.correctDirections.push(currentDirection);
                if (this.movementHistory.correctDirections.length > 10) {
                    this.movementHistory.correctDirections.shift();
                }
                
                // Increment consecutive correct moves counter
                this.movementHistory.consecutiveCorrectMoves++;
                
                // Double reward for 2+ consecutive correct moves
                if (this.movementHistory.consecutiveCorrectMoves >= 2) {
                    reward *= 2;
                    console.log(`Double reward for ${this.movementHistory.consecutiveCorrectMoves} consecutive good moves!`);
                }
            } else {
                gettingCloser = false;
                
                // Calculate penalty based on how much further we're getting
                const penalty = (distanceToFood - this.movementHistory.lastDistanceFromFood) / distanceToFood;
                
                // Base penalty on distance increase percentage (0.01 to 0.1)
                reward = -Math.min(0.1, Math.max(0.01, penalty * 0.5));
                
                // Track this as a wrong direction
                this.movementHistory.wrongDirections.push(currentDirection);
                if (this.movementHistory.wrongDirections.length > 10) {
                    this.movementHistory.wrongDirections.shift();
                }
                
                // Reset consecutive correct moves counter
                this.movementHistory.consecutiveCorrectMoves = 0;
            }
        }
        
        // Update confidence based on reward signal
        if (reward !== 0) {
            this.updateConfidenceFromReward(reward, currentDirection);
        }
        
        // Store current direction and distance for next comparison
        this.movementHistory.lastDirection = currentDirection;
        this.movementHistory.lastDistanceFromFood = distanceToFood;
        
        // Return reward for logging/debugging
        return {
            reward,
            distanceToFood,
            gettingCloser,
            consecutiveCorrectMoves: this.movementHistory.consecutiveCorrectMoves
        };
    }

    // Method to update connection confidence based on reward signal
    updateConfidenceFromReward(reward, direction) {
        // Ensure a minimum confidence change per training iteration (0.001)
        const minConfidenceChange = 0.001;
        
        // Track fired nodes to update their confidence values
        const firedNodes = new Set();
        
        // Track paths to delete when confidence drops below 0
        const pathsToDelete = [];
        
        // Only update fired connections (paths that participated in the decision)
        for (const path of this.activePaths) {
            const layerIdx = path.layer;
            const fromIdx = path.from;
            const toIdx = path.to;
            
            // Track nodes that fired
            firedNodes.add(`${layerIdx}_${fromIdx}`);
            firedNodes.add(`${layerIdx+1}_${toIdx}`);
            
            // Skip if confidence not initialized for this connection
            if (!this.connectionConfidence[layerIdx] || 
                !this.connectionConfidence[layerIdx][fromIdx] ||
                this.connectionConfidence[layerIdx][fromIdx][toIdx] === undefined) {
                continue;
            }
            
            // Update path confidence - positive reward increases confidence, negative decreases it
            // Calculate base confidence change (ensures at least 0.001 change)
            let confidenceChange = (reward > 0) ? 
                Math.max(reward * 0.1, minConfidenceChange) : 
                Math.min(reward * 0.1, -minConfidenceChange);
            
            const currentConfidence = this.connectionConfidence[layerIdx][fromIdx][toIdx];
            
            if (reward > 0) {
                // Increase confidence, but slower as it approaches 1.0
                const remainingRoom = 1.0 - currentConfidence;
                this.connectionConfidence[layerIdx][fromIdx][toIdx] = Math.min(
                    1.0, 
                    currentConfidence + confidenceChange * remainingRoom
                );
            } else {
                // Decrease confidence, with no lower bound (can go below 0)
                this.connectionConfidence[layerIdx][fromIdx][toIdx] += confidenceChange;
                
                // Mark path for deletion if confidence drops below 0
                if (this.connectionConfidence[layerIdx][fromIdx][toIdx] < 0) {
                    pathsToDelete.push({layerIdx, fromIdx, toIdx});
                }
            }
        }
        
        // Delete paths with negative confidence
        for (const path of pathsToDelete) {
            console.log(`Deleting path at layer ${path.layerIdx} from node ${path.fromIdx} to node ${path.toIdx} due to negative confidence`);
            
            // Set weight to zero to effectively delete the path
            this.weights[path.layerIdx][path.fromIdx][path.toIdx] = 0;
            
            // Reset confidence to 0 for deleted path
            this.connectionConfidence[path.layerIdx][path.fromIdx][path.toIdx] = 0;
        }
        
        // Track nodes that need mutation due to negative confidence
        const nodesToMutate = [];
        
        // Now update confidence for all fired nodes
        for (const nodeKey of firedNodes) {
            const [layerIdx, nodeIdx] = nodeKey.split('_').map(Number);
            
            // Skip invalid nodes
            if (!this.nodeConfidence[layerIdx] || 
                this.nodeConfidence[layerIdx][nodeIdx] === undefined) {
                continue;
            }
            
            // Update node confidence based on reward signal
            // Ensure at least 0.001 change per training iteration
            let nodeConfidenceChange = (reward > 0) ? 
                Math.max(reward * 0.05, minConfidenceChange) : 
                Math.min(reward * 0.05, -minConfidenceChange);
            
            const currentNodeConfidence = this.nodeConfidence[layerIdx][nodeIdx];
            
            if (reward > 0) {
                // Increase node confidence with diminishing returns approach
                const remainingRoom = 1.0 - currentNodeConfidence;
                this.nodeConfidence[layerIdx][nodeIdx] = Math.min(
                    1.0,
                    currentNodeConfidence + nodeConfidenceChange * remainingRoom
                );
            } else {
                // Decrease node confidence with no lower bound
                this.nodeConfidence[layerIdx][nodeIdx] += nodeConfidenceChange;
                
                // Mark node for mutation if confidence drops below 0
                if (this.nodeConfidence[layerIdx][nodeIdx] < 0) {
                    nodesToMutate.push({layerIdx, nodeIdx});
                }
            }
        }
        
        // Mutate nodes with negative confidence
        for (const node of nodesToMutate) {
            console.log(`Mutating node at layer ${node.layerIdx}, index ${node.nodeIdx} due to negative confidence`);
            
            // Mutate activation function - choose a different one randomly
            const currentActivation = this.activationFunctions[node.layerIdx][node.nodeIdx];
            const availableActivations = ['relu', 'sigmoid', 'tanh', 'leakyRelu', 'swish'];
            let newActivation;
            
            do {
                newActivation = availableActivations[Math.floor(Math.random() * availableActivations.length)];
            } while (newActivation === currentActivation);
            
            // Set the new activation function
            this.activationFunctions[node.layerIdx][node.nodeIdx] = newActivation;
            
            // Reset confidence to 0.5 for the mutated node
            this.nodeConfidence[node.layerIdx][node.nodeIdx] = 0.5;
            
            // Log the mutation
            console.log(`Node mutation: ${currentActivation} -> ${newActivation}`);
        }
        
        // If this is a negative reward for a specific wrong move,
        // provide additional penalty to the output node that led to this decision
        if (reward < 0 && direction) {
            const outputLayerIdx = this.layers.length - 2; // Last weight layer
            const directionToOutputIdx = {
                'up': 0,
                'right': 1,
                'down': 2,
                'left': 3
            };
            
            // If we can identify which output node triggered this wrong move
            if (directionToOutputIdx[direction] !== undefined) {
                const outputIdx = directionToOutputIdx[direction];
                
                // Penalize connections to this specific output more heavily
                for (let i = 0; i < this.weights[outputLayerIdx].length; i++) {
                    if (Math.abs(this.weights[outputLayerIdx][i][outputIdx]) > 0.1) {
                        // More severe confidence reduction for connections contributing to wrong moves
                        // Ensure at least 0.001 reduction
                        const penaltyChange = Math.min(-minConfidenceChange * 2, -Math.abs(reward) * 0.2);
                        this.connectionConfidence[outputLayerIdx][i][outputIdx] += penaltyChange;
                        
                        // Check if this path needs to be deleted
                        if (this.connectionConfidence[outputLayerIdx][i][outputIdx] < 0) {
                            console.log(`Deleting output path from node ${i} to direction ${direction} due to negative confidence`);
                            this.weights[outputLayerIdx][i][outputIdx] = 0;
                            this.connectionConfidence[outputLayerIdx][i][outputIdx] = 0;
                        }
                        
                        // Also penalize the output node itself
                        this.nodeConfidence[outputLayerIdx + 1][outputIdx] += penaltyChange / 2;
                        
                        // Check if output node needs to be mutated
                        if (this.nodeConfidence[outputLayerIdx + 1][outputIdx] < 0) {
                            console.log(`Mutating output node for direction ${direction} due to negative confidence`);
                            // For output nodes, we simply reset confidence to 0.5 instead of changing activation
                            this.nodeConfidence[outputLayerIdx + 1][outputIdx] = 0.5;
                        }
                    }
                }
            }
        }
        
        // Log confidence update for debugging
        if (Math.abs(reward) > 0.05) {
            console.log(`Updated ${firedNodes.size} node confidences and ${this.activePaths.length} path confidences with reward ${reward.toFixed(4)}`);
            if (pathsToDelete.length > 0) {
                console.log(`Deleted ${pathsToDelete.length} paths due to negative confidence`);
            }
            if (nodesToMutate.length > 0) {
                console.log(`Mutated ${nodesToMutate.length} nodes due to negative confidence`);
            }
        }
        
        // Increment training iteration counter
        this.stats.trainingIterations++;
        
        // Track path deletions and node mutations in stats
        if (!this.stats.pathDeletions) this.stats.pathDeletions = 0;
        if (!this.stats.nodeMutations) this.stats.nodeMutations = 0;
        
        this.stats.pathDeletions += pathsToDelete.length;
        this.stats.nodeMutations += nodesToMutate.length;
    }
}

