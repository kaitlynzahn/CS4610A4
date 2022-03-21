"use strict";

var positions = [];
var colors = [];

var keys = {};

function KeyIsPressed(code) {
    var pressed = keys[code];
    if (typeof pressed !== "undefined" && pressed) {
        return true;
    }
    return false;
}

function cube() {
    quad(1, 0, 3, 2);
    quad(2, 3, 7, 6);
    quad(3, 0, 4, 7);
    quad(6, 5, 1, 2);
    quad(4, 5, 6, 7);
    quad(5, 4, 0, 1);
}

function quad(a, b, c, d) {
    var vertices = [
        vec4(-0.5, -0.5, 0.5, 1.0),
        vec4(-0.5, 0.5, 0.5, 1.0),
        vec4(0.5, 0.5, 0.5, 1.0),
        vec4(0.5, -0.5, 0.5, 1.0),
        vec4(-0.5, -0.5, -0.5, 1.0),
        vec4(-0.5, 0.5, -0.5, 1.0),
        vec4(0.5, 0.5, -0.5, 1.0),
        vec4(0.5, -0.5, -0.5, 1.0)
    ];

    var vertexColors = [
        vec4(0.0, 0.0, 0.0, 1.0),  // black
        vec4(1.0, 0.0, 0.0, 1.0),  // red
        vec4(1.0, 1.0, 0.0, 1.0),  // yellow
        vec4(0.0, 1.0, 0.0, 1.0),  // green
        vec4(0.0, 0.0, 1.0, 1.0),  // blue
        vec4(1.0, 0.0, 1.0, 1.0),  // magenta
        vec4(0.0, 1.0, 1.0, 1.0),  // cyan
        vec4(1.0, 1.0, 1.0, 1.0)   // white
    ];

    // We need to parition the quad into two triangles in order for
    // WebGL to be able to render it.  In this case, we create two
    // triangles from the quad indices

    var indices = [a, b, c, a, c, d];

    for (var i = 0; i < indices.length; ++i) {
        positions.push(vertices[indices[i]]);
        colors.push(vertexColors[a]);
    }
}



window.onload = function init() {
    var canvas = document.getElementById("gl-canvas");
    canvas.requestPointerLock = canvas.requestPointerLock || canvas.mozRequestPointerLock;

    var gl = canvas.getContext('webgl2');
    if (!gl) alert("WebGL 2.0 isn't available");

    //add vertices to positions to create a cube
    cube();

    //setup the canvas
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 1);
    gl.enable(gl.DEPTH_TEST);

    //setup the shader program
    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    //setup vertex buffer
    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(positions), gl.STATIC_DRAW);

    // positions
    var positionLoc = gl.getAttribLocation(program, "aPosition");
    gl.vertexAttribPointer(positionLoc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLoc);

    //setup colors
    var cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);

    // colors
    var colorLoc = gl.getAttribLocation(program, "aColor");
    gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(colorLoc);


    //setup model matrix
    var model = translate(0, 0, -2);

    //send model matrix to shader
    var modelLoc = gl.getUniformLocation(program, "uModel");
    gl.uniformMatrix4fv(modelLoc, false, flatten(model));


    // set up projection matrix
    // takes the angle, the ratio of wdith & height, and nearest and farthest thing you're able to see
    var projection = perspective(90, canvas.width / canvas.height, 0.01, 1000);

    // send projection matrix to shader
    var projectionLoc = gl.getUniformLocation(program, "uProjection");
    gl.uniformMatrix4fv(projectionLoc, false, flatten(projection));

    var rotation = mat4();
    var cameraPosition = mat4();
    var cameraRotation = mat4();

    // set up view matrix
    var view = mult(cameraPosition, cameraRotation);
    view = inverse(view);

    // send view matrix to shader
    var viewLoc = gl.getUniformLocation(program, "uView");
    gl.uniformMatrix4fv(viewLoc, false, flatten(view));



    // function to render
    function render() {;
        var right = mult(rotation, vec4(.1, 0, 0, 1));
        right = vec3(right[0], right[1], right[2]);

        var forward = mult(rotation, vec4(0, 0, .1, 1));
        forward = vec3(forward[0], forward[1], forward[2]);

        var up = mult(rotation, vec4(0, .1, 0, 1));
        up = vec3(up[0], up[1], up[2]);

        // move forward using W
        if(KeyIsPressed("KeyW")) {
            console.log("W");
            cameraPosition = mult(translate(forward[0], 0, forward[2]), cameraPosition);
        }
        // move left using A
        if(KeyIsPressed("KeyA")) {
            console.log("A");
            cameraPosition = mult(cameraPosition, translate(right[0], right[1], right[2]));
        }
        // move back using S
        if(KeyIsPressed("KeyS")) {
            console.log("S");
            cameraPosition = mult(translate(-forward[0], 0, -forward[2]), cameraPosition);
        }
        // move right using D
        if(KeyIsPressed("KeyD")) {
            console.log("D");
            cameraPosition = mult(cameraPosition, translate(-right[0], -right[1], -right[2]));
        }
        // move up using space
        if(KeyIsPressed("Space")) {
            console.log("Space");
            cameraPosition = mult(translate(0, 0.02, 0), cameraPosition);
        }
        // move down using left shift
        if(KeyIsPressed("ShiftLeft")) {
            console.log("Shift Left");
            cameraPosition = mult(translate(0, -0.02, 0), cameraPosition);
        }

        // set up view matrix
        var view = mult(cameraPosition, cameraRotation);
        view = inverse(view);

        // send view matrix to shader
        var viewLoc = gl.getUniformLocation(program, "uView");
        gl.uniformMatrix4fv(viewLoc, false, flatten(view));

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, positions.length);

        requestAnimationFrame(render);
    }
    // render
    render();



    // create variable for the slider and text
    var slider = document.getElementById("FOVSlider");
    var fovText = document.getElementById("FOVText");



    // change the text when the slider is moved
    slider.addEventListener("input", function (event) {
        var fov = slider.value;

        fovText.innerHTML = "FOV: " + fov;

        var projection = perspective(fov, canvas.width / canvas.height, 0.01, 1000);

        // send projection matrix to shader
        var projectionLoc = gl.getUniformLocation(program, "uProjection");
        gl.uniformMatrix4fv(projectionLoc, false, flatten(projection));
    });




    window.addEventListener("keydown", function (event) {
        keys[event.code] = true;
    });

    window.addEventListener("keyup", function (event) {
        keys[event.code] = false;
    });



    // mousemove event listener
    canvas.addEventListener("mousemove", function(event) {
        if(document.pointerLockElement === canvas || document.mozPointerLockElement === canvas) {
            if(event.buttons == 1) {
                console.log(event.movementX + " " + event.movementY);
                cameraRotation = mult(rotateY(-event.movementX), cameraRotation); 
                cameraRotation = mult(rotateX(-event.movementY), cameraRotation);
                
            }
        }
    })

    canvas.addEventListener("mousedown", function(event) {
        canvas.requestPointerLock();
    })

    canvas.addEventListener("mouseup", function(event) {
        document.exitPointerLock();
    })
}