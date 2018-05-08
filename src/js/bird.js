import {vec2} from "gl-matrix";
import {uniformRand} from "./utils";
import {
    MAX_WIDTH, MAX_HEIGHT, C, CUTOFF_RADIUS, BIRD_DETECTION, 
    SHOW_CONNECTION_LINES, OPT_MIN_DISTANCE, OPT_MAX_DISTANCE,
    MAX_DISTANCE_ERROR, QUAD_DIST_A, QUAD_DIST_B, QUAD_DIST_C,
    BIRD_REQUIRED, ERROR_SCALAR, INIT_VEL_RANGE, NUM_BIRDS
} from "./config"

const BIRD_SIZE = 0.05;

const LIGHT_BLUE = [0.7, 0.9, 1, 1];
const LIGHT_GRAY = [0.8, 0.8, 0.8, 1];
const DARK_BLUE = [0.074, 0.164, 0.964, 0.5];
const RED_A2 = [1, 0, 0, 0.2]; // alpha = 0.2
const YELLOW_A2 = [1, 0, 1, 0.2]; // alpha = 0.2

export class Bird{
    // static birds = [];
    // static count = 0;

    /*Creates a random instance*/
    static createRandomInstanceAndPush(net, generation, grid) {
        Bird.birds.push(Bird.createRandomInstance(net, generation, grid));
    }

    static createRandomInstance(net, generation, grid) {
        let r = Math.random;
        
        let pos = vec2.fromValues(
            uniformRand(0, MAX_WIDTH), 
            uniformRand(0, MAX_HEIGHT))
        let vel = vec2.fromValues(
            uniformRand(-INIT_VEL_RANGE, INIT_VEL_RANGE), 
            uniformRand(-INIT_VEL_RANGE, INIT_VEL_RANGE))

        return new Bird(pos, vel, net, generation, grid);
        
    }

    static updateAllBirds(dt) {
        /*Update nearest bird relations before updating positions*/
        for (let b of Bird.birds) {
            b.nearestBirdsUpdate();
        }

        let dead_indices = []

        for (let i = 0; i < Bird.birds.length; i++) {
            let b = Bird.birds[i];
            let alive = b.update(dt);
            if (!alive) dead_indices.push(i);
        }
        return dead_indices;
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
        this.net.score = 0;
        this.generation = generation;
        this.grid = grid;
        this.grid.push(this.pos, this);

        this.accum_vel = vec2.create();
        this.survival_time = 0;
        this.fitness = 1;
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
        let inputs = [
            this.pos[0] / MAX_WIDTH, 
            this.pos[1] / MAX_HEIGHT, 
            this.vel[0],
            this.vel[1]];
        for(let pos_obj of this.closest_birds) {
            let bird_obj = pos_obj[1];
            let pos = bird_obj.prev_pos;
            let vel = bird_obj.prev_vel;
            inputs.push(0, 
                (this.modScalar(pos[0], this.pos[0], MAX_WIDTH)) / CUTOFF_RADIUS,
                (this.modScalar(pos[1], this.pos[1], MAX_HEIGHT)) / CUTOFF_RADIUS,
                vel[0] - this.vel[0],
                vel[1] - this.vel[1]);
        }
        for (let i = 0; i < BIRD_DETECTION - this.closest_birds; i++) {
            inputs.push(1, 0, 0, 0, 0); // add five elements for each missing bird
        }
        return inputs;
    }

    modVec(v1, v2) {
        return [this.modScalar(v1[0], v2[0], MAX_WIDTH), 
                this.modScalar(v1[1], v2[1], MAX_HEIGHT)]
    }

    /*returns x1 - x2 in mod space.*/
    modScalar(x1, x2, mod) {
        let dist1 = x1 - x2;
        let dist2 = x1 - x2 - mod;
        let dist3 = x1 - x2 + mod;
        let dists = [dist1, dist2, dist3];
        let minDist = Math.abs(dist1);

        for(let i = 0; i < dists.length; i++) {
            minDist = Math.min(minDist, Math.abs(dists[i]));
        }

        for(let i = 0; i < dists.length; i++) {
            if (minDist === Math.abs(dists[i])) return dists[i];
        }
    }

    // error function 
    // maximum error is 1
    error() {
        let distance_error = 0;
        for (let i = 0; i < BIRD_REQUIRED; i++) {
            let pos_obj = this.closest_birds[i];
            if (!pos_obj) {
                distance_error += MAX_DISTANCE_ERROR;
                continue;
            }

            let target_pos = pos_obj[0];
            let d = vec2.length(this.modVec(target_pos, this.pos));

            if (d < OPT_MIN_DISTANCE) {
                distance_error += Math.min(Math.log(0.2 / d), MAX_DISTANCE_ERROR);

            } else if (d > OPT_MAX_DISTANCE) {
                // quadratic function with f(OPT_MAX_DISTANCE) = 0, f(2) = MAX_DISTANCE_ERROR
                // and f'(OPT_MAX_DISTANCE) = 0
                distance_error += Math.min(MAX_DISTANCE_ERROR, 
                    QUAD_DIST_A * d ** 2 + QUAD_DIST_B * d + QUAD_DIST_C);
            }

        }
        let veclocity_error = 0;

        vec2.scaleAndAdd(this.accum_vel, this.accum_vel, this.vel, 0.001);
        veclocity_error = vec2.dot(this.accum_vel, this.vel);
        if (veclocity_error < 0.5) veclocity_error = 0;
        
        return distance_error + veclocity_error;
    }

    update(dt) {
        this.survival_time += dt;
        this.grid.remove(this.pos, this);
        this.acc = this.net.activate(this.getNetworkInputs());
        if(this.survival_time > 5){
            this.fitness -= dt * this.error() * ERROR_SCALAR;
        }
        if(this.survival_time > 6) {
            // seconds per loss
            // taking more time to loose the same amout of fitness is better
            this.net.score =  (this.survival_time - 5) / (1.001 - this.fitness); 
        }

        // normalize to values between -1 and 1
        this.acc[0] = this.acc[0] * 2 - 1; 
        this.acc[1] = this.acc[1] * 2 - 1;
        // console.log(this.acc)

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

        if (this.fitness > 0) this.grid.push(this.pos, this);

        return this.fitness > 0;
    }

    draw(drawer){

        if (this.id % NUM_BIRDS === 1){
            drawer.setColor(...RED_A2);
            drawer.drawCircle(this.pos[0], this.pos[1], OPT_MAX_DISTANCE);
            drawer.setColor(...YELLOW_A2);
            drawer.drawCircle(this.pos[0], this.pos[1], OPT_MIN_DISTANCE);
        }

        if (this.id % NUM_BIRDS === 1) {
            let line_thickness = 0.05;
            drawer.setColor(...DARK_BLUE);
            for (let n of this.closest_birds) {
                let target_pos = n[0];
                if (vec2.dist(target_pos, this.pos) < CUTOFF_RADIUS) {
                    drawer.drawLine(
                        this.pos[0], this.pos[1], 
                        target_pos[0], target_pos[1], 
                        line_thickness);
                } else {
                    let direction = this.modVec(target_pos, this.pos);
                    drawer.drawLine(
                        this.pos[0], this.pos[1], 
                        this.pos[0] + direction[0], this.pos[1] + direction[1], 
                        line_thickness);
                    drawer.drawLine(
                        target_pos[0], target_pos[1], 
                        target_pos[0] - direction[0], target_pos[1] - direction[1], 
                        line_thickness);
                }
            }
        }


        let color = [1 -this.fitness, 0, this.fitness, 1];
        drawer.setColor(...color);
        drawer.drawCircle(this.pos[0], this.pos[1], BIRD_SIZE);


    }

}

Bird.birds = [];
Bird.count = 0;
