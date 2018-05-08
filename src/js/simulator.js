import {Bird} from "./bird.js"
import {Grid} from "./grid.js"

import {
    MAX_WIDTH, MAX_HEIGHT, GRID_X, GRID_Y, BIRD_DETECTION, NUM_BIRDS,
    MUTATION_RATE, START_HIDDEN_SIZE
} from "./config"

import {Neat, methods, architect, Network} from "neataptic"

export class Simulator {
    constructor(birdCount, drawer) {
        // for each nearby bird, we input relative_pos_{x, y} 
        // , relative_vel_{x, y} and whether there is an input or not
        // also include pos_{x, y} and vel_{x, y} of itself.
        this.neat = new Neat(
            BIRD_DETECTION * 5 + 4, 
            2,
            null,
            {
                mutation: methods.mutation.ALL,
                popsize: NUM_BIRDS,
                mutationRate: MUTATION_RATE, // used differently 
                elitism: 0.3, // used differently 
                // network: new architect.Random(
                //     BIRD_DETECTION * 5 + 4,
                //     START_HIDDEN_SIZE,
                //     2)
            });
        this.drawer = drawer;
        this.grid = new Grid(GRID_X, GRID_Y, MAX_HEIGHT, MAX_WIDTH);

        let generation = 1;
        for(let i = 0; i < birdCount; i++) {
            Bird.createRandomInstanceAndPush(this.neat.population[i], generation, this.grid);
        }
    }

    update(deltaTime) {
        let dead_birds = Bird.updateAllBirds(deltaTime);
        let newNetworks = [];
        for (let i = 0; i < dead_birds.length; i++){
            newNetworks.push(this.createNewNetwork());
        }
        for (let i = 0; i < dead_birds.length; i++) {
            this.neat.population[dead_birds[i]] = newNetworks[i];
            let newGeneration = Bird.birds[dead_birds[i]].generation + 1;
            console.log(newGeneration);
            let newBird = Bird.createRandomInstance(newNetworks[i], newGeneration, this.grid);
            Bird.birds[dead_birds[i]] = newBird;
            console.log("Average Fitness: ", this.getAverage())
        }
    }

    createNewNetwork() {
        let network = null;

        if (Math.random() <= this.neat.elitism) { // single offspring
            let old_network = this.neat.getParent();
            network = Network.fromJSON(old_network.toJSON()); // copies
        } else { // cross over
            network = this.neat.getOffspring();
        }

        // mutation
        if (Math.random <= this.neat.mutationRate) {
            var mutationMethod = this.neat.selectMutationMethod(network);
            network.mutate(mutationMethod);
        }

        return network;
    }

    getAverage() {
        var score = 0;
        for (var i = 0; i < this.neat.population.length; i++) {
          score += this.neat.population[i].score;
        }

        return score / this.neat.population.length;
    }

    draw() {
        Bird.drawAllBirds(this.drawer);
    }

}