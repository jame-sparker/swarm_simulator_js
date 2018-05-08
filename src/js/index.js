import {Drawer} from "./drawer.js"
import {Bird} from "./bird.js"
import $ from "jquery";

$(document).ready(() => {
    webGLStart();
});

const NUM_BIRDS = 20;

var lastTime = 0;

function drawScene(drawer, deltaTime){
    drawer.setBackgroundColor(1, 1, 1, 1);
    drawer.clearCanvas();
    drawer.setColor(0, 0, 1, 1);

    Bird.updateAllBirds(deltaTime);
    Bird.drawAllBirds(drawer);
}

function initializeWorld(){
    for(let i = 0; i < NUM_BIRDS; i++) {
        Bird.createRandomInstance();
    }
}

function webGLStart() {
    var canvas = document.getElementById("canvas");
    let drawer = Drawer.getInstance(canvas);

    initializeWorld();

    let then = 0;

    function render(now) {
        now *= 0.001;
        const deltaTime = now - then;
        then = now;

        drawScene(drawer, deltaTime);
        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
}
