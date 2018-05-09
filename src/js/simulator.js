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
        this.last_mutation_rate = 0;

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
        $("#mutation").text("Last mutation rate: " + this.last_mutation_rate);
    }

    update(deltaTime) {
        if (deltaTime > 1) return; // do not simulate anything when there is too much gap

        this.total_time += deltaTime;
        let dead_birds = Bird.updateAllBirds(deltaTime);
        let newNetworks = [];
        this.neat.population[0].best = false;

        for (let i = 0; i < dead_birds.length; i++){
            let dead_bird = Bird.birds[dead_birds[i]];
            newNetworks.push(this.createNewNetwork());
        }

        for (let i = 0; i < dead_birds.length; i++) {
            let dead_bird = Bird.birds[dead_birds[i]];
            this.neat.population[dead_bird.net.index] = newNetworks[i];

            let new_generation = newNetworks[i].gen;
            this.updateGeneration(dead_bird.generation, new_generation);
            
            let new_mutation_rate = newNetworks[i].mut + uniformRand(-0.02, 0.02);
            this.last_mutation_rate = new_mutation_rate;
            new_mutation_rate = Math.min(new_mutation_rate, 1);

            let newBird = Bird.createRandomInstance(
                newNetworks[i], 
                new_generation, 
                this.grid,
                new_mutation_rate);

            Bird.birds[dead_birds[i]] = newBird;
        }

        this.sortWithIndex();

        this.updateHtml(deltaTime);
    }

    sortWithIndex() {
        this.neat.population[0].best = false;
        this.neat.sort();
        for(let i = 0; i < this.neat.population.length; i++){
            this.neat.population[i].index = i;
        }
        this.neat.population[0].best = true;
    }

    createNewNetwork() {
        let network = null;
        let mutation_rate = null;

        if (Math.random() <= this.neat.elitism) { // single offspring
            let old_network = this.neat.getParent();
            network = Network.fromJSON(old_network.toJSON()); // copies
            network.gen = old_network.owner.generation + 1;
            network.mut = old_network.owner.mutation_rate;
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
        let new_gen = Math.max(parent1.owner.generation, parent2.owner.generation) + 1;
        let new_mutation_rate = (parent1.owner.mutation_rate + parent2.owner.mutation_rate) / 2;

        let new_net = Network.crossOver(parent1, parent2, this.neat.equal);
        new_net.gen = new_gen;
        new_net.mut = new_mutation_rate;
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