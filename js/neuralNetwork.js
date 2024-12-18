class NeuralNetwork {
    constructor(inputNodes, hiddenNodes, outputNodes) {
        this.inputNodes = inputNodes;
        this.hiddenNodes = hiddenNodes;
        this.outputNodes = outputNodes;
        
        this.weightsIH = new Matrix(this.hiddenNodes, this.inputNodes);
        this.weightsHO = new Matrix(this.outputNodes, this.hiddenNodes);
        this.weightsIH.randomize();
        this.weightsHO.randomize();
        
        this.fitness = 0;
    }

    predict(inputArray) {
        // Convert input array to matrix
        let inputs = Matrix.fromArray(inputArray);
        
        // Calculate hidden layer
        let hidden = Matrix.multiply(this.weightsIH, inputs);
        hidden = Matrix.map(hidden, x => this.sigmoid(x));
        
        // Calculate output layer
        let output = Matrix.multiply(this.weightsHO, hidden);
        output = Matrix.map(output, x => this.sigmoid(x));
        
        // Convert back to array
        return output.toArray();
    }

    copy() {
        let clone = new NeuralNetwork(this.inputNodes, this.hiddenNodes, this.outputNodes);
        clone.weightsIH = this.weightsIH;
        clone.weightsHO = this.weightsHO;
        return clone;
    }

    sigmoid(x) {
        return 1 / (1 + Math.exp(-x));
    }

    setPreTrainedWeights() {
        // Simplified pre-trained weights
        const weightsIH = [];
        const weightsHO = [];

        // Initialize hidden layer weights
        for (let i = 0; i < this.hiddenNodes; i++) {
            weightsIH[i] = [];
            for (let j = 0; j < this.inputNodes; j++) {
                weightsIH[i][j] = Math.random() * 2 - 1;
            }
        }

        // Initialize output layer weights
        for (let i = 0; i < this.outputNodes; i++) {
            weightsHO[i] = [];
            for (let j = 0; j < this.hiddenNodes; j++) {
                weightsHO[i][j] = Math.random() * 2 - 1;
            }
        }

        this.weightsIH.data = weightsIH;
        this.weightsHO.data = weightsHO;
    }
} 