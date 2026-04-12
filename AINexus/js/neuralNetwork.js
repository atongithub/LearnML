/**
 * Simple Neural Network built from scratch suitable for Genetic Algorithms
 */

// Math Helper for activation function
function sigmoid(x) {
    return 1 / (1 + Math.exp(-x));
}

class NeuralNetwork {
    constructor(inputs, hiddens, outputs) {
        this.input_nodes = inputs;
        this.hidden_nodes = hiddens;
        this.output_nodes = outputs;

        // Weights
        this.weights_ih = new Matrix(this.hidden_nodes, this.input_nodes);
        this.weights_ho = new Matrix(this.output_nodes, this.hidden_nodes);
        
        // Randomize initial weights
        this.weights_ih.randomize();
        this.weights_ho.randomize();

        // Biases
        this.bias_h = new Matrix(this.hidden_nodes, 1);
        this.bias_o = new Matrix(this.output_nodes, 1);
        this.bias_h.randomize();
        this.bias_o.randomize();
    }

    // Feed forward to get prediction
    predict(input_array) {
        // Generating the Hidden Outputs
        let inputs = Matrix.fromArray(input_array);
        let hidden = Matrix.multiply(this.weights_ih, inputs);
        hidden.add(this.bias_h);
        hidden.map(sigmoid);

        // Generating the output's output
        let output = Matrix.multiply(this.weights_ho, hidden);
        output.add(this.bias_o);
        output.map(sigmoid);

        return output.toArray();
    }

    // Clone the network for making offspring
    copy() {
        let clone = new NeuralNetwork(this.input_nodes, this.hidden_nodes, this.output_nodes);
        clone.weights_ih = this.weights_ih.copy();
        clone.weights_ho = this.weights_ho.copy();
        clone.bias_h = this.bias_h.copy();
        clone.bias_o = this.bias_o.copy();
        return clone;
    }

    // Mutate the network's weights
    mutate(rate) {
        const mutateFunc = (val) => {
            if (Math.random() < rate) {
                // Return a new random value or slightly offset current
                return val + (Math.random() * 2 - 1) * 0.5;
            } else {
                return val;
            }
        };

        this.weights_ih.map(mutateFunc);
        this.weights_ho.map(mutateFunc);
        this.bias_h.map(mutateFunc);
        this.bias_o.map(mutateFunc);
    }
}

/**
 * Basic Matrix class for NN operations
 */
class Matrix {
    constructor(rows, cols) {
        this.rows = rows;
        this.cols = cols;
        this.data = Array(this.rows).fill().map(() => Array(this.cols).fill(0));
    }

    copy() {
        let m = new Matrix(this.rows, this.cols);
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                m.data[i][j] = this.data[i][j];
            }
        }
        return m;
    }

    static fromArray(arr) {
        let m = new Matrix(arr.length, 1);
        for (let i = 0; i < arr.length; i++) {
            m.data[i][0] = arr[i];
        }
        return m;
    }

    toArray() {
        let arr = [];
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                arr.push(this.data[i][j]);
            }
        }
        return arr;
    }

    randomize() {
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                this.data[i][j] = Math.random() * 2 - 1; // -1 to 1
            }
        }
    }

    add(n) {
        if (n instanceof Matrix) {
            for (let i = 0; i < this.rows; i++) {
                for (let j = 0; j < this.cols; j++) {
                    this.data[i][j] += n.data[i][j];
                }
            }
        } else {
            for (let i = 0; i < this.rows; i++) {
                for (let j = 0; j < this.cols; j++) {
                    this.data[i][j] += n;
                }
            }
        }
    }

    static multiply(a, b) {
        if (a.cols !== b.rows) {
            console.error('Columns of A must match rows of B');
            return undefined;
        }
        let result = new Matrix(a.rows, b.cols);
        for (let i = 0; i < result.rows; i++) {
            for (let j = 0; j < result.cols; j++) {
                let sum = 0;
                for (let k = 0; k < a.cols; k++) {
                    sum += a.data[i][k] * b.data[k][j];
                }
                result.data[i][j] = sum;
            }
        }
        return result;
    }

    map(func) {
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                let val = this.data[i][j];
                this.data[i][j] = func(val, i, j);
            }
        }
    }
}
