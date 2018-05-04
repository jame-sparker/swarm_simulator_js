import {Drawer} from "./drawer.js"
import $ from "jquery";

$(document).ready(() => {
    webGLStart();
});

var effectiveFPMS = 60 / 1000;
var lastTime = 0;

function animate() {
    var timeNow = new Date().getTime();
    if (lastTime != 0) {
        var elapsed = timeNow - lastTime;

        for (var i in stars) {
            stars[i].animate(elapsed);
        }
    }
    lastTime = timeNow;
}


function tick() {
    requestAnimFrame(tick);
    handleKeys();
    drawScene();
    animate();
}

function drawScene(drawer){
    drawer.setBackgroundColor(1, 1, 1, 1);
    drawer.clearCanvas();
    drawer.setColor(1, 0, 0, 1);
    drawer.drawCircle(2, 0, 1);
    drawer.setColor(0, 1, 0, 1);
    drawer.drawRectangle(0, 0, 1, 1);
    drawer.drawRectangle(0, 1.1, 1, 1);
}


function webGLStart() {
    var canvas = document.getElementById("canvas");
    let drawer = Drawer.getInstance(canvas);

    drawScene(drawer);


    // tick();
}