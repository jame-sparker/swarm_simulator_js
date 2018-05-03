import {mat2, mat3, mat4, glMatrix} from "gl-matrix";
import $ from "jquery";

$(document).ready(() => {
    webGLStart();
});

function initGL(canvas) {
    let gl;
    try {
        gl = canvas.getContext("experimental-webgl");
        gl.viewportWidth = canvas.width;
        gl.viewportHeight = canvas.height;
    } catch (e) {
    }
    if (!gl) {
        alert("Could not initialise WebGL, sorry :-(");
    }
    return gl;
}

/*Returns shaper program from html document*/
function getShader(gl, id) {
    var shaderScript = document.getElementById(id);
    if (!shaderScript) {
        return null;
    }

    var str = "";
    var k = shaderScript.firstChild;
    while (k) {
        if (k.nodeType == 3) {
            str += k.textContent;
        }
        k = k.nextSibling;
    }

    var shader;
    if (shaderScript.type == "x-shader/x-fragment") {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (shaderScript.type == "x-shader/x-vertex") {
        shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
        return null;
    }

    gl.shaderSource(shader, str);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }
    return shader;
}

/*Attach shaders with shaderpogram and create attributes*/
function initShaders(gl) {
    let shaderProgram;

    var vertexShader = getShader(gl, "shader-vs");
    var fragmentShader = getShader(gl, "shader-fs");

    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert("Could not initialise shaders");
    }

    gl.useProgram(shaderProgram);

    const programInfo = {
        program: shaderProgram,
        attribLocations: {
            vertexPosition: gl.getAttribLocation(shaderProgram, "aVertexPosition"),
        },
        uniformLocations: {
            vertexColor: gl.getUniformLocation(shaderProgram, "uColor"),
            projectionMatrix: gl.getUniformLocation(shaderProgram, "uPMatrix"),
            modelViewMatrix: gl.getUniformLocation(shaderProgram, "uMVMatrix")
        }
    };

    return programInfo;
}

function copyMat4(mat) {
    var copy = mat4.create();
    mat4.set(copy, mat);
    return copy;
}


function getCircleVertices(radius, precision) {
    let array = []
    for (let i = 0; i <= precision; i++) {
        let angle = glMatrix.toRadian(i * 360 / precision);
        let x = Math.cos(angle) * radius;
        let y = Math.sin(angle) * radius;
        array.push(x);
        array.push(y);
    }
    return array;
}

let PRECISION = 20;
function initBuffers(gl) {


    // Setting position Buffer

    const vertices = getCircleVertices(1, PRECISION);
    
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    positionBuffer.itemSize = 2;
    positionBuffer.numItems = PRECISION;

    // // Setting color buffer
    // var colors = [
    //     1.0, 1.0, 1.0, 1.0,
    //     1.0, 0.0, 0.0, 1.0,
    //     0.0, 1.0, 0.0, 1.0,
    //     0.0, 0.0, 1.0, 1.0,
    // ];

    // const colorBuffer = gl.createBuffer();
    // gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    // gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    // colorBuffer.itemSize = 4;
    // colorBuffer.numItems = 4;

    return {
        position: positionBuffer,
        // color: colorBuffer
    };
}


var effectiveFPMS = 60 / 1000;



function drawScene(gl, programInfo, buffers) {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


    const pMatrix = mat4.create();
    const fieldOfView = glMatrix.toRadian(45);
    const aspect = gl.viewportWidth / gl.viewportHeight;
    const zNear = 0.1;
    const zFar = 100.0;

    mat4.perspective(pMatrix,
                     fieldOfView,
                     aspect, 
                     zNear,
                     zFar);

    const mvMatrix = mat4.create();
    mat4.translate(mvMatrix,
                   mvMatrix,
                   [-0.0, 0.0, -6.0]);

    {
        const numComponents = 2;
        const type = gl.FLOAT;
        const normalize = false;
        const stride = 0;
        const offset = 0;
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
        gl.vertexAttribPointer(
            programInfo.attribLocations.vertexPosition,
            numComponents,
            type,
            normalize,
            stride,
            offset);
        gl.enableVertexAttribArray(
            programInfo.attribLocations.vertexPosition);
    }


    // {
    //     const numComponents = 4;
    //     const type = gl.FLOAT;
    //     const normalize = false;
    //     const stride = 0;
    //     const offset = 0;
    //     gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
    //     gl.vertexAttribPointer(
    //         programInfo.attribLocations.vertexColor,
    //         numComponents,
    //         type,
    //         normalize,
    //         stride,
    //         offset);
    //     gl.enableVertexAttribArray(
    //         programInfo.attribLocations.vertexColor);
    // }

    gl.useProgram(programInfo.program);

    let color = [1.0, 0.0, 0.0, 1.0];
    gl.uniform4fv(
        programInfo.uniformLocations.vertexColor,
        color);

    gl.uniformMatrix4fv(
        programInfo.uniformLocations.projectionMatrix,
        false,
        pMatrix
        );


    gl.uniformMatrix4fv(
        programInfo.uniformLocations.modelViewMatrix,
        false,
        mvMatrix);


    {
        const offset = 0;
        const vertexCount = 20;
        gl.drawArrays(gl.TRIANGLE_FAN, offset, vertexCount);
    }
}

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



function webGLStart() {
    var canvas = document.getElementById("canvas");
    let gl = initGL(canvas);
    let programInfo = initShaders(gl);
    let buffers = initBuffers(gl);

    drawScene(gl, programInfo, buffers);


    // tick();
}