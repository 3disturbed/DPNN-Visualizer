# DPNN: A New Path in Neural Networks
### By Ben Darlington

---

## Abstract
This paper introduces a novel neural network architecture, the Diamond Pathed Neural Network (DPNN), which employs explicit path-based propagation rather than traditional matrix-based operations. This unique approach incorporates switching logic, positive and negative value routing, confidence-based adaptive training, and targeted training based on active pathways, offering distinct advantages and challenges.

---

## Introduction
Traditional neural networks typically rely on matrix multiplications and activation functions applied uniformly across all nodes. The DPNN model proposes a fundamental shift by explicitly routing inputs based on the sign of activations. Nodes and connections (paths) are dynamically selected during forward propagation, offering a structured, conditional computation flow with confidence-based adaptive adjustments.

---

## Architecture Overview

### Network Structure
The network forms a diamond-like topology:
- **Input Layer:** Contains `I` nodes. (4)
- **Expansion Layers:** 3 (4-8-16) Subsequent layers double the number of nodes, creating Odd-Even pairs from the input length up to the maximum hidden layer size.
- **Central Hidden Layers:** size 16 neurons, 4 deep, Multiple central layers receive inputs index-to-index from the final expansion layer. These layers feature cross-connections between all nodes, employing high-pass, low-pass filters, and bias adjustments.
- **Contraction Layers:** 3 (16-8-4) Outputs from central layers undergo pairwise averaging through contraction layers, reducing node counts progressively until matching the desired output length. The final output layer receives values index-to-index from the last contraction layer.
- **Output Layer:** Contains `I` nodes. (4)

### Path Switching Logic
- Nodes route activations based on activation sign:
  - **Positive activation:** Routes to even-indexed nodes.
  - **Negative activation:** Routes to odd-indexed nodes.
- Central layers handle complex cross-connections, with each connection employing trained filters and biases.

### Confidence-Based Training
Each node and connection maintains a confidence rating, influencing learning rates dynamically:
- Confidence ratings are adjusted based on reward (correct predictions) or punishment (incorrect predictions).
- Higher confidence leads to smaller, stable learning adjustments; lower confidence leads to more aggressive corrections.

---

## Node and Path Activation Tracking
- At initialization, all nodes and paths are set:
  ```
  Fired = False
  ```
- Upon participating in forward propagation, nodes and paths are flagged:
  ```
  Fired = True
  ```
- This ensures targeted training, as only active elements are adjusted during backpropagation.

---

## Training Methodology

### Positive Training
- Correct predictions reward and reinforce all active nodes and paths by incrementally increasing their confidence ratings.

### Negative Retraining
- Incorrect predictions penalize active nodes and paths by reducing their confidence ratings, guiding adaptive training adjustments.

### Weight and Bias Updates
- Updates apply only to nodes and paths marked as `Fired = True`, using individualized learning rates based on their confidence ratings.

---

## Implementation of Key Features

### Path Exploration Encouragement
To avoid path dominance and ensure robust exploration:
- **Regularization Techniques:** Employ dropout, temporarily disabling certain paths or nodes to encourage diverse path utilization.
- **Stochastic Switching Thresholds:** Introduce probabilistic path selection to maintain balanced exploration across available routes.

### Adaptive Learning Rates
Adaptive methods stabilize training:
- Use algorithms like Adam or RMSprop that dynamically adjust learning rates per node and path, considering their respective confidence ratings.

### Monitoring and Visualization Tools
- Develop visualization tools tracking path utilization frequencies, node activation distributions, and confidence levels, significantly enhancing debugging and network tuning.

---

## Pros of the DPNN Model
- **Computational Efficiency:** Reduced computational load by focusing exclusively on active nodes and paths.
- **Dynamic Adaptability:** Actively adjusts learning parameters via confidence-based adaptive rates.
- **Enhanced Interpretability:** Transparent decision-making facilitated by explicit path tracking.
- **Overfitting Mitigation:** Targeted training and adaptive confidence adjustments inherently limit overfitting.

---

## Cons and Potential Pitfalls
- **Implementation Complexity:** Dynamic structure and adaptive training methods increase complexity.
- **Potential Path Saturation:** Dominant paths may inadvertently restrict network exploration.
- **Gradient Stability:** Sparse activations and selective updates can cause unstable gradients during training.

---

## Recommendations for Avoiding Pitfalls
- Incorporate stochastic switching and dropout mechanisms to maintain balanced path exploration.
- Use adaptive gradient methods (Adam, RMSprop) to stabilize gradient updates.
- Regularly monitor and visualize path and node utilization to promptly address imbalances and saturation.

---

## Conclusion
The Diamond Pathed Neural Network (DPNN) offers a revolutionary approach to neural network architecture, explicitly emphasizing dynamic pathways and adaptive, confidence-based learning. Despite introducing complexities in implementation, the DPNN model demonstrates significant promise in computational efficiency, interpretability, adaptability, and generalization potential, making it highly suitable for diverse machine learning applications.

---

