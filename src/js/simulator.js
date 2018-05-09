import {Bird} from "./bird.js"
import {Grid} from "./grid.js"
import {uniformRand} from "./utils.js"
import $ from "jquery"

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
            BIRD_DETECTION * 6 + 2, 
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
        this.total_time = 0;
        this.alive_gen = {};
        this.alive_gen[1] = NUM_BIRDS;

        let generation = 1;
        for(let i = 0; i < birdCount; i++) {
            Bird.createRandomInstanceAndPush(
                this.neat.population[i], 
                generation, 
                this.grid,
                MUTATION_RATE);
        }
    }

    updateGeneration(old_generation, new_generation) {
        if (!this.alive_gen[new_generation]) {
            this.alive_gen[new_generation] = 1;
        } else {
            this.alive_gen[new_generation] += 1;
        }
        this.alive_gen[old_generation] -= 1;
        if (this.alive_gen[old_generation] === 0) {
            delete this.alive_gen[old_generation];
        }
    }

    updateHtml() {
        $("#performance").text("Average Fitness: " + this.getAverage());
        $("#best").text("Best Fitness: " + this.neat.getFittest().score);
        $("#generations").text("Alive generations: " + JSON.stringify(this.alive_gen));
    }

    update(deltaTime) {
        if (deltaTime > 1) return; // do not simulate anything when there is too much gap
        this.neat.population[0].best = false;

        this.total_time += deltaTime;
        let dead_birds = Bird.updateAllBirds(deltaTime);
        let newNetworks = [];

        for (let i = 0; i < dead_birds.length; i++){
            let dead_bird = Bird.birds[dead_birds[i]];
            newNetworks.push(this.createNewNetwork(dead_bird.mutation_rate));
        }

        for (let i = 0; i < dead_birds.length; i++) {
            let dead_bird = Bird.birds[dead_birds[i]];
            this.neat.population[dead_bird.net.index] = newNetworks[i];

            let new_generation = newNetworks[i].gen;
            this.updateGeneration(dead_bird.generation , new_generation);
            let new_mutation_rate = dead_bird.mutation_rate * uniformRand(1 / 1.2, 1.2);
            new_mutation_rate = Math.min(new_mutation_rate, 1);

            let newBird = Bird.createRandomInstance(
                newNetworks[i], 
                new_generation, 
                this.grid,
                new_mutation_rate);

            Bird.birds[dead_birds[i]] = newBird;
        }

        this.sortWithIndex();

        this.updateHtml();
    }

    sortWithIndex() {
        this.neat.population[0].best = false;
        this.neat.sort();
        for(let i = 0; i < this.neat.population.length; i++){
            this.neat.population[i].index = i;
        }
        this.neat.population[0].best = true;
    }

    createNewNetwork(mutation_rate) {
        let network = null;

        if (Math.random() <= this.neat.elitism) { // single offspring
            let old_network = this.neat.getParent();
            network = Network.fromJSON(old_network.toJSON()); // copies
            network.gen = old_network.owner.generation + 1;
        } else { // cross over
            network = this.getOffspring();
        }


        // mutation
        if (Math.random <= mutation_rate) {
            var mutationMethod = this.neat.selectMutationMethod(network);
            network.mutate(mutationMethod);
        }

        return network;
    }

    getOffspring() {
        var parent1 = this.neat.getParent();
        var parent2 = this.neat.getParent();
        let new_gen = Math.max(parent1.owner.generation, parent2.owner.generation) + 1

        let new_net = Network.crossOver(parent1, parent2, this.neat.equal);
        new_net.gen = new_gen;
        return new_net;
    }

    getAverage() {
        let score = 0;
        let count = 0; 
        for (var i = 0; i < this.neat.population.length; i++) {
          score += this.neat.population[i].score;
          if (this.neat.population[i].score > 0) count++;
        }

        return score / count;
    }

    draw() {
        Bird.drawAllBirds(this.drawer);
    }

}