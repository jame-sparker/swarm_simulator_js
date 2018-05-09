import {Drawer} from "./drawer.js"
import {Simulator} from "./simulator.js"
import {NUM_BIRDS} from "./config.js"

import $ from "jquery";

$(document).ready(() => {
    webGLStart();
});

let simulator;

function drawScene(drawer){
    drawer.setBackgroundColor(1, 1, 1, 1);
    drawer.clearCanvas();
    simulator.draw();
}

function webGLStart() {
    var canvas = document.getElementById("canvas");
    let drawer = Drawer.getInstance(canvas);
    simulator = new Simulator(NUM_BIRDS, drawer);

    let then = 0;

    function render(now) {
        now *= 0.001;
        const deltaTime = now - then;
        then = now;
        
        simulator.update(deltaTime);

        drawScene(drawer);
        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
}
