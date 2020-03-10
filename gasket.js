"use strict";

var gl;
var timeLoc;
var bufferId;
var colorLoc;

var points;

var redrawTime = 0;
var redrawInterval;
var rescaleFactor;
var counter;


var vertices;

var rangeValue;
var colorValue;

var statusElem;

function initProgramDefaults()
{
    redrawInterval = 1;
    redrawTime = redrawInterval;
    rescaleFactor = 1.5;
    counter = 0;

    vertices = [
        vec2( -0.1, -0.1 ),
        vec2(  0,  0.1 ),
        vec2(  0.1, -0.1 )
    ];

    var u = add( vertices[0], vertices[1] );
    var v = add( vertices[0], vertices[2] );
    var p = scale( 0.25, add( u, v ) );

    // And, add our initial point into our array of points

    points = [ p ];
    calculateNewPoints(rangeValue * 1000);
    updateGLBuffer();

}

function calculateNewPoints(numPoints)
{
    var p;

    if(points.length > numPoints)
    {
        while(points.length > numPoints) points.pop();

    }
    else
    {
        for ( var i = points.length - 1; i < numPoints - 1; ++i ) {
            var j = Math.floor(Math.random() * 3);
            p = add( points[i], vertices[j] );
            p = scale( 0.5, p );
            points.push( p );
        }
    }

}

function updateGLBuffer()
{
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );

}

function scaleGasket()
{    
    for(var i = 0; i < points.length; i++)
    {
        if(i < vertices.length)
        {
            vertices[i] = scale(rescaleFactor, vertices[i]);
        }

        points[i] = scale(rescaleFactor, points[i]);
    }
}

//Code borrowed from stackoverflow https://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb

function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}
  

window.onload = function init()
{
    var rangeInput = document.getElementById("myRange");
    rangeValue = parseInt(rangeInput.value);

    rangeInput.oninput = function() {
        rangeValue = parseInt(this.value);
        calculateNewPoints(rangeValue * 1000);
    };

    var colorSelector = document.getElementById("colorSelector");
    colorValue = hexToRgb(colorSelector.value);

    colorSelector.oninput = function() {
        colorValue = hexToRgb(this.value);
    }

    statusElem = document.getElementById("statusMessage");
    statusElem.innerHTML = "Scaling up";

    var canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }
    //
    //  Configure WebGL
    //
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );

    //  Load shaders and initialize attribute buffers

    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );


    bufferId = gl.createBuffer();

    initProgramDefaults();
    // Associate out shader variables with our data buffer

    var vPosition = gl.getAttribLocation( program, "vPosition" );

    colorLoc = gl.getUniformLocation( program, "u_color");
    timeLoc = gl.getUniformLocation(program, "u_time");


    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    

    render();
};



function render(timestamp) {
    gl.clear( gl.COLOR_BUFFER_BIT );
    
    var time = timestamp/1000.0;

    gl.uniform1f(timeLoc, time);
    gl.uniform4f(colorLoc, colorValue.r/255.0, colorValue.g/255.0, colorValue.b/255.0, 1.0);

    if(counter <= 10)
    {
        if(time >= redrawTime)
        {
            if(counter != 0 && counter % 5 == 0)
            {
                rescaleFactor = 1.0/rescaleFactor;
                statusElem.innerHTML = (rescaleFactor < 1) ? "Scaling down" : "Scaling up";
            }

            scaleGasket();
            updateGLBuffer();

            redrawTime = time + redrawInterval;
            counter++;
        }
    }
    else
    {
        initProgramDefaults();
    }

    
    gl.drawArrays( gl.POINTS, 0, points.length );

    window.requestAnimFrame(render);
}