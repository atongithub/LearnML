function sigmoid(x) {
    return 1 / (1 + Math.exp(-x));
}

class NeuralNetwork {
    constructor(shape, weights = null) {
        this.shape = shape;
        this.size = shape.length;
        this.weights = [];

        if (weights) {
            this.weights = weights;
        } else {
            // Initialization: np.random.rand(...) - 0.5
            for (let i = 1; i < this.size; i++) {
                let rows = this.shape[i-1];
                let cols = this.shape[i];
                let layer = [];
                for (let r = 0; r < rows; r++) {
                    let row = [];
                    for (let c = 0; c < cols; c++) {
                        row.push(Math.random() - 0.5);
                    }
                    layer.push(row);
                }
                this.weights.push(layer);
            }
        }
    }

    predict(inp) {
        let layer = [...inp];
        for (let i = 0; i < this.size - 1; i++) {
            let nextLayer = new Array(this.shape[i+1]).fill(0);
            let currentWeights = this.weights[i];
            
            for (let outNode = 0; outNode < this.shape[i+1]; outNode++) {
                let sum = 0;
                for (let inNode = 0; inNode < this.shape[i]; inNode++) {
                    sum += layer[inNode] * currentWeights[inNode][outNode];
                }
                nextLayer[outNode] = sum;
            }
            
            // Apply sigmoid activation to the layer
            for (let ind = 0; ind < nextLayer.length; ind++) {
                nextLayer[ind] = sigmoid(nextLayer[ind]);
            }
            layer = nextLayer;
        }
        return layer;
    }
}
