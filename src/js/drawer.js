import {vec2, mat4, glMatrix} from "gl-matrix";
import {Stack} from "./utils.js";
import {
    MAX_WIDTH, MAX_HEIGHT
} from "./config"

function copyMat4(mat) {
    var copy = mat4.create();
    mat4.copy(copy, mat);
    return copy;
}

/*Highlevel 2D drawing class utilizing WebGL. It is not designed to draw with 
gradation. Gradation can be easily implemented if anyone asks.*/

export class Drawer{

    constructor(gl, programInfo, buffers){
        this.gl = gl;
        this.programInfo = programInfo;
        this.buffers = buffers;
        this.pMatrix = mat4.create();
        this.mvMatrix = mat4.create();
        this.mvStack = new Stack();

        const fieldOfView = glMatrix.toRadian(45);
        const aspect = gl.viewportWidth / gl.viewportHeight;
        const zNear = 0.1;
        const zFar = 100.0;
        const Z_PLANE = -10.0;

        mat4.perspective(this.pMatrix,
                         fieldOfView,
                         aspect, 
                         zNear,
                         zFar);
        mat4.translate(
            this.mvMatrix,
            this.mvMatrix,
            [-MAX_WIDTH / 2, -MAX_HEIGHT / 2, Z_PLANE]);

        this.gl.useProgram(this.programInfo.program);
    }

    setBackgroundColor(r, g, b, alpha) {
        this.gl.clearColor(r, g, b, alpha);
        this.gl.clearDepth(1.0);
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.depthFunc(this.gl.LEQUAL);
    }

    clearCanvas() {
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    }

    setColor(r, g, b, alpha) {
        this.gl.uniform4f(
            this.programInfo.uniformLocations.vertexColor,
            r, g, b, alpha);
    }

    setVertexBuffer(vertices) {
        const numComponents = 2;
        const type = this.gl.FLOAT;
        const normalize = false;
        const stride = 0;
        const offset = 0;
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.position);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertices), this.gl.STATIC_DRAW);
        this.gl.vertexAttribPointer(
            this.programInfo.attribLocations.vertexPosition,
            numComponents,
            type,
            normalize,
            stride,
            offset);
        this.gl.enableVertexAttribArray(
            this.programInfo.attribLocations.vertexPosition);
    }

    setPMvMatrix(){
        this.gl.uniformMatrix4fv(
            this.programInfo.uniformLocations.projectionMatrix,
            false,
            this.pMatrix
        );


        this.gl.uniformMatrix4fv(
            this.programInfo.uniformLocations.modelViewMatrix,
            false,
            this.mvMatrix);
    }

    pushMVMatrix(){
        this.mvStack.push(this.mvMatrix);
        this.mvMatrix = copyMat4(this.mvMatrix);
    }

    popMVMatrix(){
        this.mvMatrix = this.mvStack.pop();
    }

    getCircleVertices(radius, precision) {
        let vertices = []
        for (let i = 0; i < precision; i++) {
            let angle = glMatrix.toRadian(i * 360 / precision);
            let x = Math.cos(angle) * radius;
            let y = Math.sin(angle) * radius;
            vertices.push(x);
            vertices.push(y);
        }
        return vertices;
    }

    /*drawLine*/

    drawLine(x1, y1, x2, y2, thickness) {
        let inv = vec2.fromValues(y2 - y1, -(x2 - x1)); 
        let norm = vec2.create();
        vec2.normalize(norm, inv);
        let p1 = vec2.fromValues(x1, y1);
        let p2 = vec2.fromValues(x2, y2);
        let p1a = vec2.create();
        let p1b = vec2.create();
        let p2a = vec2.create();
        let p2b = vec2.create();
        vec2.scaleAndAdd(p1a, p1, norm, thickness / 2);
        vec2.scaleAndAdd(p1b, p1, norm, -thickness / 2);
        vec2.scaleAndAdd(p2a, p2, norm, thickness / 2);
        vec2.scaleAndAdd(p2b, p2, norm, -thickness / 2);
        let vertices = [
            p1a[0], p1a[1],
            p1b[0], p1b[1],
            p2a[0], p2a[1],
            p2b[0], p2b[1],
            ]
        const offset = 0;

        this.setVertexBuffer(vertices);
        this.setPMvMatrix();
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, offset, 4);
    }

    /*Draws a rectangle at position (x, y) with some height and width*/
    drawRectangle(x, y, height, width) {
        let vertices = 
            [x, y, 
            x + width, y,
            x, y + height,
            x + width, y + height];
        const offset = 0;

        this.setVertexBuffer(vertices);
        this.setPMvMatrix();
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, offset, 4);
    }

    /*Draws a circle at position (x,y) with radius r
    buffer: if it is true, it stores vertices of circle internally for some radius
    */
    drawCircle(x, y, r, buffer=true){
        let precision = 50; // number of vertices to represent circle.

        if (buffer && !this.circleBuffer){
            this.circleBuffer = {};
        }

        let vertices;
        if (buffer) {
            if (!this.circleBuffer[r]) {
                vertices = this.getCircleVertices(r, precision);
                this.circleBuffer[r] = vertices;
            } else {
                vertices = this.circleBuffer[r];
            }
        } else {
            vertices = getCircleVertices(r, precision);
        }

        const offset = 0;

        this.pushMVMatrix();

        mat4.translate(
            this.mvMatrix,
            this.mvMatrix,
            [x, y, 0]);
        this.setVertexBuffer(vertices);
        this.setPMvMatrix();
        this.gl.drawArrays(this.gl.TRIANGLE_FAN, offset, precision);

        this.popMVMatrix();
    }

    /*----------------------------------*/
    /*  Beginning of static methods     */
    /*----------------------------------*/

    /*Initializes drawer class using webgl and returns that instance*/
    static getInstance(canvas){
        let gl = Drawer.initGL(canvas);
        let programInfo = Drawer.initShaders(gl);
        let buffers = Drawer.initBuffers(gl);
        return new Drawer(gl, programInfo, buffers);
    }


    static initGL(canvas) {
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

    /*Attach shaders with shaderpogram and create attributes*/
    static initShaders(gl) {
        let shaderProgram;

        var vertexShader = Drawer.getShader(gl, "shader-vs");
        var fragmentShader = Drawer.getShader(gl, "shader-fs");

        shaderProgram = gl.createProgram();
        gl.attachShader(shaderProgram, vertexShader);
        gl.attachShader(shaderProgram, fragmentShader);
        gl.linkProgram(shaderProgram);

        if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
            alert("Could not initialise shaders");
        }

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

    /*Returns shaper program from html document*/
    static getShader(gl, id) {
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

    static initBuffers(gl) {

        // Setting position Buffer
        const positionBuffer = gl.createBuffer();

        return {
            position: positionBuffer,
        };
    }
}