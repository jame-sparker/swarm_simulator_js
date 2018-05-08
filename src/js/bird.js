import {vec2} from "gl-matrix";
import {uniformRand} from "./utils";

const C = 0.1 // drag coefficient
const BIRD_SIZE = 0.05;
const INIT_VEL_RANGE = 0.55;
const INIT_POS_RANGE = 1;

const MAX_WIDTH = 8.25;
const MAX_HEIGHT = MAX_WIDTH / 2;

export class Bird{
    // static birds = [];
    // static count = 0;

    /*Creates a random instance*/
    static createRandomInstance() {
        let r = Math.random;
        let vel = vec2.fromValues(
            uniformRand(-INIT_POS_RANGE, INIT_POS_RANGE), 
            uniformRand(-INIT_POS_RANGE, INIT_POS_RANGE))
        let pos = vec2.fromValues(
            uniformRand(-INIT_VEL_RANGE, INIT_VEL_RANGE), 
            uniformRand(-INIT_VEL_RANGE, INIT_VEL_RANGE))
        let new_bird = new Bird(pos, vel);
        Bird.birds.push(new_bird);
    }

    static updateAllBirds(dt) {
        for (let b of Bird.birds) {
            b.update(dt)
        }
    }

    static drawAllBirds(drawer) {
        for (let b of Bird.birds) {
            b.draw(drawer);
        }
    }
    
    constructor(pos, vel){
        this.pos = pos;
        this.vel = vel;
        this.acc = vec2.fromValues(0, 0); // the size of acceleration is limited
        this.selected = false;
        this.id = Bird.count;

        Bird.count += 1;
    }

    update(dt) {
        let delta_pos = vec2.create();
        let delta_vel = vec2.create();
        let vel_len = vec2.len(this.vel);

        vec2.scale(delta_pos, this.vel, dt);
        vec2.add(this.pos, this.pos, delta_pos);
        if (this.pos[0] > MAX_WIDTH) {
            this.pos[0] -= 2 * MAX_WIDTH;
        } 

        if (this.pos[0] < -MAX_WIDTH) {
            this.pos[0] += 2 * MAX_WIDTH;
        } 

        if (this.pos[1] > MAX_HEIGHT) {
            this.pos[1] -= 2 * MAX_HEIGHT;
        } 

        if (this.pos[1] < -MAX_HEIGHT) {
            this.pos[1] += 2 * MAX_HEIGHT;
        } 

        // calculate drag
        vec2.scale(delta_vel, this.vel, -C * dt * vel_len); 
        vec2.add(this.vel, this.vel, delta_vel);

        vec2.scale(delta_vel, this.acc, dt);
        vec2.add(this.vel, this.vel, delta_vel);
    }

    draw(drawer){
        if (this.selected) {
            let light_blue = [0.7, 0.9, 1, 1];
            drawer.setColor(...light_blue);
        } else {
            let light_gray = [0.8, 0.8, 0.8, 1]
            drawer.setColor(...light_gray);
        }
        drawer.drawCircle(this.pos[0], this.pos[1], BIRD_SIZE);
    }

}

Bird.birds = [];
Bird.count = 0;
