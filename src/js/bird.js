import {vec2} from "gl-matrix";
import {uniformRand} from "./utils";
import {
    MAX_WIDTH, MAX_HEIGHT, C, CUTOFF_RADIUS, BIRD_DETECTION, 
    SHOW_CONNECTION_LINES
} from "./config"

const BIRD_SIZE = 0.05;
const INIT_VEL_RANGE = 0.55;

const LIGHT_BLUE = [0.7, 0.9, 1, 1];
const LIGHT_GRAY = [0.8, 0.8, 0.8, 1];
const DARK_BLUE = [0.074, 0.164, 0.964, 1];

export class Bird{
    // static birds = [];
    // static count = 0;

    /*Creates a random instance*/
    static createRandomInstance(net, grid) {
        let r = Math.random;
        
        let vel = vec2.fromValues(
            uniformRand(0, MAX_WIDTH), 
            uniformRand(0, MAX_HEIGHT))
        let pos = vec2.fromValues(
            uniformRand(-INIT_VEL_RANGE, INIT_VEL_RANGE), 
            uniformRand(-INIT_VEL_RANGE, INIT_VEL_RANGE))

        let new_bird = new Bird(pos, vel, net, 1, grid);
        Bird.birds.push(new_bird);
    }

    static updateAllBirds(dt) {
        /*Update nearest bird relations before updating positions*/
        for (let b of Bird.birds) {
            b.nearestBirdsUpdate();
        }

        for (let b of Bird.birds) {
            b.update(dt);
        }
    }

    static drawAllBirds(drawer) {
        for (let b of Bird.birds) {
            b.draw(drawer);
        }
    }
    
    constructor(pos, vel, net, generation, grid){
        this.pos = pos;
        this.prev_pos = vec2.create();
        vec2.copy(this.prev_pos, this.pos);

        this.vel = vel;
        this.prev_vel = vec2.create();
        vec2.copy(this.prev_vel, this.vel);

        // we limit the acceleration by applying tanh
        this.acc = vec2.fromValues(0, 0); 
        this.net = net;
        this.generation = generation;
        this.grid = grid;
        this.grid.push(this.pos, this);

        this.survival_time = 0;
        this.fitness = 1;
        this.life = 1;
        this.id = Bird.count;
        this.selected = this.id == 1;
        this.closest_birds = []
        Bird.count += 1;
    }

    nearestBirdsUpdate() {
        vec2.copy(this.prev_pos, this.pos);
        vec2.copy(this.prev_vel, this.vel);
        this.closest_birds = this.grid.getNearestXRadius(this.pos, CUTOFF_RADIUS, BIRD_DETECTION);
    }

    getNetworkInputs() {
        let inputs = [];
        for(let posObj of this.closest_birds) {
            let birdObj = posObj[1];
            let pos = birdObj.prev_pos;
            let vel = birdObj.prev_vel;
            inputs.push(0, 
                (pos[0] - this.pos[0]) / CUTOFF_RADIUS,
                (pos[1] - this.pos[1]) / CUTOFF_RADIUS,
                (vel[0] - this.vel[0]) / CUTOFF_RADIUS,
                vel[1] - this.vel[1]);
        }
        for (let i = 0; i < BIRD_DETECTION - this.closest_birds; i++) {
            inputs.push(1, 0, 0, 0, 0); // add five elements for each missing bird
        }
        return inputs;
    }

    update(dt) {
        this.survival_time += dt;
        this.grid.remove(this.pos, this);
        // this.acc = this.net.activate(this.getNetworkInputs());

        // normalize to values between -1 and 1
        this.acc[0] = Math.tanh(this.acc[0]); 
        this.acc[1] = Math.tanh(this.acc[1]);

        let delta_pos = vec2.create();
        let delta_vel = vec2.create();
        let vel_len = vec2.len(this.vel);

        vec2.scale(delta_pos, this.vel, dt);
        vec2.add(this.pos, this.pos, delta_pos);
        this.pos[0] = (this.pos[0] + MAX_WIDTH) % MAX_WIDTH
        this.pos[1] = (this.pos[1] + MAX_HEIGHT) % MAX_HEIGHT

        // calculate drag
        vec2.scale(delta_vel, this.vel, -C * dt * vel_len); 
        vec2.add(this.vel, this.vel, delta_vel);

        vec2.scale(delta_vel, this.acc, dt);
        vec2.add(this.vel, this.vel, delta_vel);

        this.grid.push(this.pos, this);
    }

    draw(drawer){

        if (SHOW_CONNECTION_LINES) {
            let line_thickness = 0.02;
            drawer.setColor(...DARK_BLUE);
            for (let n of this.closest_birds) {
                let target_pos = n[0];
                drawer.drawLine(
                    this.pos[0], this.pos[1], 
                    target_pos[0], target_pos[1], 
                    line_thickness)
            }
        }

        let color = this.selected ? LIGHT_BLUE : LIGHT_GRAY;
        drawer.setColor(...color);
        drawer.drawCircle(this.pos[0], this.pos[1], BIRD_SIZE);
    }

}

Bird.birds = [];
Bird.count = 0;
