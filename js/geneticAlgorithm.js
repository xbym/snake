class GeneticAlgorithm {
    constructor(populationSize) {
        this.populationSize = populationSize;
        this.population = [];
        this.generation = 0;
    }

    createPopulation() {
        for (let i = 0; i < this.populationSize; i++) {
            this.population.push(new NeuralNetwork(24, 16, 4));
        }
    }

    selection() {
        // 实现自然选择
        this.population.sort((a, b) => b.fitness - a.fitness);
        this.population = this.population.slice(0, this.populationSize / 2);
    }

    crossover() {
        // 实现交叉繁殖
        const newPopulation = [];
        for (let i = 0; i < this.populationSize; i++) {
            const parentA = this.population[Math.floor(Math.random() * this.population.length)];
            const parentB = this.population[Math.floor(Math.random() * this.population.length)];
            newPopulation.push(this.crossoverParents(parentA, parentB));
        }
        this.population = newPopulation;
    }

    crossoverParents(parentA, parentB) {
        let child = new NeuralNetwork(24, 16, 4);
        
        // 交叉权重
        for (let i = 0; i < parentA.weightsIH.rows; i++) {
            for (let j = 0; j < parentA.weightsIH.cols; j++) {
                child.weightsIH.data[i][j] = Math.random() < 0.5 ? 
                    parentA.weightsIH.data[i][j] : 
                    parentB.weightsIH.data[i][j];
            }
        }

        // 添加变异
        this.mutate(child);
        return child;
    }

    mutate(network) {
        const mutationRate = 0.1;
        
        for (let i = 0; i < network.weightsIH.rows; i++) {
            for (let j = 0; j < network.weightsIH.cols; j++) {
                if (Math.random() < mutationRate) {
                    network.weightsIH.data[i][j] += (Math.random() * 2 - 1) * 0.5;
                }
            }
        }
    }
} 