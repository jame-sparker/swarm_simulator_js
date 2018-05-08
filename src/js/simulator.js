import {Bird} from "./bird.js"
import {Grid} from "./grid.js"

import {
    MAX_WIDTH, MAX_HEIGHT, GRID_X, GRID_Y, BIRD_DETECTION, NUM_BIRDS,
    MUTATION_RATE, START_HIDDEN_SIZE
} from "./config"

import {Neat, methods, architect} from "neataptic"

export class Simulator {
    constructor(birdCount, drawer) {
        // for each nearby bird, we input relative_pos_{x, y} 
        // , relative_vel_{x, y} and whether there is an input or not
        this.neat = new Neat(
            BIRD_DETECTION * 5, 
            2,
            null,
            {
                mutation: methods.mutation.ALL,
                popsize: NUM_BIRDS,
                mutationRate: MUTATION_RATE,
                elitism: 0.1 * NUM_BIRDS, // delete in the future
                network: new architect.Random(
                    BIRD_DETECTION * 5,
                    START_HIDDEN_SIZE,
                    2)
            });
        this.drawer = drawer;
        this.grid = new Grid(GRID_X, GRID_Y, MAX_WIDTH, MAX_HEIGHT);

        for(let i = 0; i < birdCount; i++) {
            Bird.createRandomInstance(this.neat.population[i], this.grid);
        }
    }

    update(deltaTime) {
        Bird.updateAllBirds(deltaTime);
    }

    draw() {
        Bird.drawAllBirds(this.drawer);
    }

}