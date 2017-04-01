//3456789_123456789_123456789_123456789_123456789_123456789_123456789_123456789_
// (JT: why the numbers? counts columns, helps me keep 80-char-wide listings)
//
// Chapter 5: ColoredTriangle.js (c) 2012 matsuda  AND
// Chapter 4: RotatingTriangle_withButtons.js (c) 2012 matsuda
// became:
//
// ColoredMultiObject.js  MODIFIED for EECS 351-1,
//									Northwestern Univ. Jack Tumblin
//		--converted from 2D to 4D (x,y,z,w) vertices
//		--demonstrate how to keep & use MULTIPLE colored shapes in just one
//			Vertex Buffer Object(VBO).
//		--demonstrate 'nodes' vs. 'vertices'; geometric corner locations where
//				OpenGL/WebGL requires multiple co-located vertices to implement the
//				meeting point of multiple diverse faces.
//
// Vertex shader program----------------------------------
var VSHADER_SOURCE =
  'uniform mat4 u_ModelMatrix;\n' +
  'attribute vec4 a_Position;\n' +
  'attribute vec4 a_Color;\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_Position = u_ModelMatrix * a_Position;\n' +
  '  gl_PointSize = 10.0;\n' +
  '  v_Color = a_Color;\n' +
  '}\n';

// Fragment shader program----------------------------------
var FSHADER_SOURCE =
//  '#ifdef GL_ES\n' +
  'precision mediump float;\n' +
//  '#endif GL_ES\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_FragColor = v_Color;\n' +
  '}\n';

// Global Variable -- Rotation angle rate (degrees/second)
var isRun = 1;

// canvas color control
var wr = 0.0;
var wg = 0.0;
var wb = 1.0;
var op = 0.5;
var clr_step = 1;
var wr_max = 1.0;
var wr_min = 0.0;

var wg_max = 0.8;
var wg_min = 0.2;

// Control Five Scale
var scl_1 = 1.0;
var scl_2 = 1.0;
var scl_step = 2;

var scl_max = 1.6;
var scl_min = 0.4;



var ANGLE_STEP = 45.0;
var ang_step=45.0;
var floatsPerVertex=7;
var Tx = 0.0;
var Ty = 0.0;


// FiveStar location
var drawFive = 0;
var drawFive_2 = 0;

// star location
var diamond_locx=0.6;
var diamond_locy=0.7;
// drag star
//var isDrag = false;
var isDown = 0;
var isMove = 0;

var xMdragTot = 0.0;
var yMdragTot = 0.0;
var xMclick = 0.0;
var yMclikc = 0.0;

var Tx_star = 0.0;
var Ty_star = 0.0;



// Move white bird
var elep_locx = 0;
var elep_locy = -0.6;
var leg_mov = false;

// Control flying bird
var bird_locx = -0.5;
var dir = 1;



function main() {
//==============================================================================
  // Retrieve <canvas> element
  var canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  var gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  //
  var n = initVertexBuffer(gl);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 1.0, 0.5);

	// NEW!! Enable 3D depth-test when drawing: don't over-draw at any pixel
	// unless the new Z value is closer to the eye than the old one..
//	gl.depthFunc(gl.LESS);
	gl.enable(gl.DEPTH_TEST);

  // Get handle to graphics system's storage location of u_ModelMatrix
  var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if (!u_ModelMatrix) {
    console.log('Failed to get the storage location of u_ModelMatrix');
    return;
  }
  // Create a local version of our model matrix in JavaScript
  var modelMatrix = new Matrix4();

  // Create, init current rotation angle value in JavaScript
  var currentAngle = 0.0;
  var tt_angle = 0.0;

//-----------------
/*
  // add canvas event
  canvas.addEventListener("click",function(ev){
    if(isMove == 1) return;
    isDown = 0;
    var dx = 0.3;
    var dy = 0.3;
    var rect = ev.target.getBoundingClientRect(); // get canvas corners in pixels
    var xp = ev.clientX - rect.left;                  // x==0 at canvas left edge
    var yp = canvas.height - (ev.clientY - rect.top); // y==0 at canvas bottom edge
    //  console.log('myMouseUp  (pixel coords): xp,yp=\t',xp,',\t',yp);

    // Convert to Canonical View Volume (CVV) coordinates too:
    var x = (xp - canvas.width/2)  /    // move origin to center of canvas and
                 (canvas.width/2);      // normalize canvas to -1 <= x < +1,
    var y = (yp - canvas.height/2) /    //                     -1 <= y < +1.
                 (canvas.height/2);
    console.log('mouseClick  (CVV coords  ):  x, y=\t',x,',\t',y);

    if(x>diamond_locx && y>diamond_locy) drawFive = 1 - drawFive;
    if(x<diamond_locx && y<diamond_locy && Math.abs(x-diamond_locx)<dx && Math.abs(y-diamond_locy)<dy) drawFive_2 = 1 - drawFive_2;
  });*/

  canvas.onmousedown = function(ev){myMouseDown(ev, gl, canvas)};
  canvas.onmousemove = function(ev){myMouseMove(ev, gl, canvas)};
  canvas.onmouseup = function(ev){myMouseUp(ev, gl, canvas)};


  // Start drawing: create 'tick' variable whose value is this function:
  var tick = function() {
    initVertexBuffer(gl);
    animate_color();
    gl.clearColor(wr, wg, wb, op);
    currentAngle = animate(currentAngle);  // Update the rotation angle
    tt_angle = tt_animate(tt_angle);
    animatefly();
    animate_scale();
    draw(gl, n, currentAngle, tt_angle, Tx, Ty, modelMatrix, u_ModelMatrix);   // Draw shapes
    console.log('currentAngle=',currentAngle,'tt_angle=',tt_angle);
    requestAnimationFrame(tick, canvas);
    									// Request that the browser re-draw the webpage
  };
  tick();							// start (and continue) animation: draw current image

}

function myMouseDown(ev, gl, canvas) {
//==============================================================================
// Called when user PRESSES down any mouse button;
//    ev.clientX, ev.clientY == mouse pointer location, but measured in webpage
//    pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)

// Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
  isDown = 1;
  //isMove = 0;

  var rect = ev.target.getBoundingClientRect(); // get canvas corners in pixels
  var xp = ev.clientX - rect.left;                  // x==0 at canvas left edge
  var yp = canvas.height - (ev.clientY - rect.top); // y==0 at canvas bottom edge
  console.log('myMouseDown(pixel coords): xp,yp=\t',xp,',\t',yp);

  // Convert to Canonical View Volume (CVV) coordinates too:
  var x = (xp - canvas.width/2)  /    // move origin to center of canvas and
               (canvas.width/2);      // normalize canvas to -1 <= x < +1,
  var y = (yp - canvas.height/2) /    //                     -1 <= y < +1.
               (canvas.height/2);
  console.log('myMouseDown(CVV coords):  x, y=\t',x,',\t',y);

//  isDrag = true;                      // set our mouse-dragging flag
  xMclik = x;                         // record where mouse-dragging began
  yMclik = y;
  xMclick2 = x;
  yMclick2 = y;
};


function myMouseMove(ev, gl, canvas) {
//==============================================================================
// Called when user MOVES the mouse with a button already pressed down.
//                  (Which button?   console.log('ev.button='+ev.button);    )
//    ev.clientX, ev.clientY == mouse pointer location, but measured in webpage
//    pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)
  if(isDown == 0) return;
  isMove = 1;

  //if(isDrag==false) return;       // IGNORE all mouse-moves except 'dragging'

  // Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
  var rect = ev.target.getBoundingClientRect(); // get canvas corners in pixels
  var xp = ev.clientX - rect.left;                  // x==0 at canvas left edge
  var yp = canvas.height - (ev.clientY - rect.top); // y==0 at canvas bottom edge
  console.log('myMouseMove(pixel coords): xp,yp=\t',xp,',\t',yp);

  // Convert to Canonical View Volume (CVV) coordinates too:
  var x = (xp - canvas.width/2)  /    // move origin to center of canvas and
               (canvas.width/2);      // normalize canvas to -1 <= x < +1,
  var y = (yp - canvas.height/2) /    //                     -1 <= y < +1.
               (canvas.height/2);
  console.log('myMouseMove(CVV coords  ):  x, y=\t',x,',\t',y);

  // find how far we dragged the mouse:
  xMdragTot += (x - xMclik);          // Accumulate change-in-mouse-position,&
  yMdragTot += (y - yMclik);
  xMclick = x;
  yMclick = y;

  Tx_star = xMdragTot;
  Ty_star = yMdragTot;
};

function myMouseUp(ev, gl, canvas) {
//==============================================================================
// Called when user RELEASES mouse button pressed previously.
//                  (Which button?   console.log('ev.button='+ev.button);    )
//    ev.clientX, ev.clientY == mouse pointer location, but measured in webpage
//    pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)

// Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
   isDown = 0;
   //isDrag = false;

   var dx = 0.3;
   var dy = 0.3;
   var rect = ev.target.getBoundingClientRect(); // get canvas corners in pixels
   var xp = ev.clientX - rect.left;                  // x==0 at canvas left edge
   var yp = canvas.height - (ev.clientY - rect.top); // y==0 at canvas bottom edge
   //  console.log('myMouseUp  (pixel coords): xp,yp=\t',xp,',\t',yp);

   // Convert to Canonical View Volume (CVV) coordinates too:
   var x = (xp - canvas.width/2)  /    // move origin to center of canvas and
                (canvas.width/2);      // normalize canvas to -1 <= x < +1,
   var y = (yp - canvas.height/2) /    //                     -1 <= y < +1.
                (canvas.height/2);
   console.log('mouseClick  (CVV coords  ):  x, y=\t',x,',\t',y);

   if(isMove == 1) {
     isMove = 0;
     return ;
   }
   if(x>diamond_locx && y>diamond_locy) drawFive = 1 - drawFive;
   if(x<diamond_locx && y<diamond_locy && Math.abs(x-diamond_locx)<dx && Math.abs(y-diamond_locy)<dy) drawFive_2 = 1 - drawFive_2;
}


 function makeStar(){
   le = 1;
   se = 0.25;

   // colors
   // front center
   fcr = 244/255;
   fcg = 66/255;
   fcb = 158/255;

   // back center
   bcr = 1.0;
   bcg = 1.0;
   bcb = 1.0;

   // right
   rr = 1.0;
   rg = 1.0;
   rb = 0.0;

   //up
   ur = 1.0;
   ug = 1.0;
   ub = 0.0;

   // left
   lr = 1.0;
   lg = 1.0;
   lb = 0.0;

   // down
   dr = 1.0;
   dg = 1.0;
   db = 0.0;

   starVerts = new Float32Array([

     0.0,	 0.0,  se,   1.0,		  fcr, fcg, fcb,	// Node 0
     le,	 0.0,  0.0,  1.0,		  rr,  rg,  rb,	// Node 0
     se,   se,   0.0,  1.0,		  rr,  rg,  rb,	// Node 0

     0.0,	 0.0,  se,   1.0,		  fcr, fcg, fcb,	// Node 0
     se,  -se,   0.0,  1.0,		  rr,  rg,  rb,	// Node 0
     le,	 0.0,  0.0,  1.0,		  rr,  rg,  rb,	// Node 0

     0.0,	 0.0,  se,   1.0,		  fcr, fcg, fcb,	// Node 0
     0.0,	 le,  0.0,   1.0,		  ur,  ug,  ub,	// Node 0
    -se,   se,   0.0,  1.0,		  ur,  ug,  ub,	// Node 0

     0.0,	 0.0,  se,   1.0,		  fcr, fcg, fcb,	// Node 0
     0.0,	 le,  0.0,   1.0,		  ur,  ug,  ub,	// Node 0
     se,   se,   0.0,  1.0,		  ur,  ug,  ub,	// Node 0


     0.0,	 0.0,  se,   1.0,		  fcr, fcg, fcb,	// Node 0
    -le,	 0.0,  0.0,  1.0,		  lr,  lg,  lb,	// Node 0
    -se,   se,   0.0,  1.0,		  lr,  lg,  lb,	// Node 0

     0.0,	 0.0,  se,   1.0,		  fcr, fcg, fcb,	// Node 0
    -le,	 0.0,  0.0,  1.0,		  lr,  lg,  lb,	// Node 0
    -se,   -se,   0.0, 1.0,		  lr,  lg,  lb,	// Node 0

     0.0,	 0.0,  se,   1.0,		  fcr, fcg, fcb,	// Node 0
     0.0,	-le,  0.0,   1.0,		  dr,  dg,  db,	// Node 0
    -se,  -se,   0.0,  1.0,		  dr,  dg,  db,	// Node 0

     0.0,	 0.0,  se,   1.0,		  fcr, fcg, fcb,	// Node 0
     0.0,	-le,  0.0,   1.0,		  dr,  dg,  db,	// Node 0
     se,  -se,   0.0,  1.0,		  dr,  dg,  db,	// Node 0

     // back
     0.0,	 0.0, -se,   1.0,		  fcr, fcg, fcb,	// Node 0
     le,	 0.0,  0.0,  1.0,		  rr,  rg,  rb,	// Node 0
     se,   se,   0.0,  1.0,		  rr,  rg,  rb,	// Node 0

     0.0,	 0.0, -se,   1.0,		  fcr, fcg, fcb,	// Node 0
     se,  -se,   0.0,  1.0,		  rr,  rg,  rb,	// Node 0
     le,	 0.0,  0.0,  1.0,		  rr,  rg,  rb,	// Node 0

     0.0,	 0.0, -se,   1.0,		  fcr, fcg, fcb,	// Node 0
     0.0,	 le,  0.0,   1.0,		  ur,  ug,  ub,	// Node 0
    -se,   se,   0.0,  1.0,		  ur,  ug,  ub,	// Node 0

     0.0,	 0.0, -se,   1.0,		  fcr, fcg, fcb,	// Node 0
     0.0,	 le,  0.0,   1.0,		  ur,  ug,  ub,	// Node 0
     se,   se,   0.0,  1.0,		  ur,  ug,  ub,	// Node 0


     0.0,	 0.0, -se,   1.0,		  fcr, fcg, fcb,	// Node 0
    -le,	 0.0,  0.0,  1.0,		  lr,  lg,  lb,	// Node 0
    -se,   se,   0.0,  1.0,		  lr,  lg,  lb,	// Node 0

     0.0,	 0.0, -se,   1.0,		  fcr, fcg, fcb,	// Node 0
    -le,	 0.0,  0.0,  1.0,		  lr,  lg,  lb,	// Node 0
    -se,   -se,   0.0, 1.0,		  lr,  lg,  lb,	// Node 0

     0.0,	 0.0, -se,   1.0,		  fcr, fcg, fcb,	// Node 0
     0.0,	-le,  0.0,   1.0,		  dr,  dg,  db,	// Node 0
    -se,  -se,   0.0,  1.0,		  dr,  dg,  db,	// Node 0

     0.0,	 0.0, -se,   1.0,		  fcr, fcg, fcb,	// Node 0
     0.0,	-le,  0.0,   1.0,		  dr,  dg,  db,	// Node 0
     se,  -se,   0.0,  1.0,		  dr,  dg,  db,	// Node 0
   ])
 }

 function makeFive(){
   var r = 0.1;
   fiveVerts = new Float32Array([
     +0.0, +1.0, +1.0*r, +1.0, +1.0, +0.9, +0.8,
     +0.4, +0.0, +1.0*r, +1.0, +0.9, +0.8, +0.7,
     +1.5, +0.0, +1.0*r, +1.0, +0.8, +0.7, +0.6,
     +0.8, -0.8, +1.0*r, +1.0, +0.7, +0.6, +0.5,
     +1.0, -1.8, +1.0*r, +1.0, +0.6, +0.5, +0.4,
     +0.0, -1.0, +1.0*r, +1.0, +0.5, +0.4, +0.3,
     -1.0, -1.8, +1.0*r, +1.0, +0.4, +0.3, +0.2,
     -0.8, -0.8, +1.0*r, +1.0, +0.3, +0.2, +0.1,
     -1.5, +0.0, +1.0*r, +1.0, +0.2, +0.1, +0.0,
     -0.4, +0.0, +1.0*r, +1.0, +0.1, +0.0, +1.0,

     +0.0, +1.0, -1.0*r, +1.0, +1.0, +0.9, +0.8,
     +0.4, +0.0, -1.0*r, +1.0, +0.9, +0.8, +0.7,
     +1.5, +0.0, -1.0*r, +1.0, +0.8, +0.7, +0.6,
     +0.8, -0.8, -1.0*r, +1.0, +0.7, +0.6, +0.5,
     +1.0, -1.8, -1.0*r, +1.0, +0.6, +0.5, +0.4,
     +0.0, -1.0, -1.0*r, +1.0, +0.5, +0.4, +0.3,
     -1.0, -1.8, -1.0*r, +1.0, +0.4, +0.3, +0.2,
     -0.8, -0.8, -1.0*r, +1.0, +0.3, +0.2, +0.1,
     -1.5, +0.0, -1.0*r, +1.0, +0.2, +0.1, +0.0,
     -0.4, +0.0, -1.0*r, +1.0, +0.1, +0.0, +1.0,

     +0.0, +1.0, +1.0*r, +1.0, +1.0, +0.0, +1.0,
     +0.0, +1.0, -1.0*r, +1.0, +0.9, +0.9, +0.0,
     +0.4, +0.0, +1.0*r, +1.0, +0.8, +0.8, +0.1,
     +0.4, +0.0, -1.0*r, +1.0, +0.0, +0.7, +0.7,
     +1.5, +0.0, +1.0*r, +1.0, +0.6, +0.1, +1.0,
     +1.5, +0.0, -1.0*r, +1.0, +0.0, +0.9, +0.5,
     +0.8, -0.8, +1.0*r, +1.0, +0.4, +0.1, +0.9,
     +0.8, -0.8, -1.0*r, +1.0, +0.0, +0.6, +0.5,
     +1.0, -1.8, +1.0*r, +1.0, +0.1, +0.5, +0.9,
     +1.0, -1.8, -1.0*r, +1.0, +0.6, +0.0, +0.4,
     +0.0, -1.0, +1.0*r, +1.0, +0.5, +0.3, +0.3,
     +0.0, -1.0, -1.0*r, +1.0, +0.9, +0.4, +0.1,
     -1.0, -1.8, +1.0*r, +1.0, +0.3, +0.3, +0.8,
     -1.0, -1.8, -1.0*r, +1.0, +0.6, +0.2, +0.2,
     -0.8, -0.8, +1.0*r, +1.0, +0.2, +0.2, +0.8,
     -0.8, -0.8, -1.0*r, +1.0, +0.3, +0.9, +0.9,
     -1.5, +0.0, +1.0*r, +1.0, +0.4, +0.8, +0.0,
     -1.5, +0.0, -1.0*r, +1.0, +0.7, +0.1, +0.8,
     -0.4, +0.0, +1.0*r, +1.0, +0.2, +0.1, +1.0,
     -0.4, +0.0, -1.0*r, +1.0, +0.5, +0.9, +0.0,
     +0.0, +1.0, +1.0*r, +1.0, +1.0, +0.9, +0.3,
     +0.0, +1.0, -1.0*r, +1.0, +1.0, +0.0, +0.8,

   ]);
 }

 function makeCube(){
   cubeVerts = new Float32Array([
		// +x face: RED
     1.0, -1.0, -1.0, 1.0,		1.0, 0.0, 0.0,	// Node 3
     1.0,  1.0, -1.0, 1.0,		1.0, 0.0, 0.0,	// Node 2
     1.0,  1.0,  1.0, 1.0,	  1.0, 0.0, 0.0,  // Node 4

     1.0,  1.0,  1.0, 1.0,	  1.0, 0.0, 1.0,	// Node 4
     1.0, -1.0,  1.0, 1.0,	  1.0, 0.0, 1.0,	// Node 7
     1.0, -1.0, -1.0, 1.0,	  1.0, 0.0, 1.0,	// Node 3

		// +y face: GREEN
    -1.0,  1.0, -1.0, 1.0,	  0.0, 1.0, 0.0,	// Node 1
    -1.0,  1.0,  1.0, 1.0,	  0.0, 1.0, 0.0,	// Node 5
     1.0,  1.0,  1.0, 1.0,	  0.0, 1.0, 0.0,	// Node 4

     1.0,  1.0,  1.0, 1.0,	  0.1, 1.0, 0.1,	// Node 4
     1.0,  1.0, -1.0, 1.0,	  0.1, 1.0, 0.1,	// Node 2
    -1.0,  1.0, -1.0, 1.0,	  0.1, 1.0, 0.1,	// Node 1

		// +z face: BLUE
    -1.0,  1.0,  1.0, 1.0,	  0.0, 0.0, 1.0,	// Node 5
    -1.0, -1.0,  1.0, 1.0,	  1.0, 0.0, 0.0,	// Node 6
     1.0, -1.0,  1.0, 1.0,	  1.0, 1.0, 1.0,	// Node 7

     1.0, -1.0,  1.0, 1.0,	  0.0, 1.0, 0.0,	// Node 7
     1.0,  1.0,  1.0, 1.0,	  1.0, 0.0, 0.0,	// Node 4
    -1.0,  1.0,  1.0, 1.0,	  0.0, 0.0, 1.0,	// Node 5

		// -x face: CYAN
    -1.0, -1.0,  1.0, 1.0,	  0.0, 1.0, 1.0,	// Node 6
    -1.0,  1.0,  1.0, 1.0,	  0.0, 1.0, 1.0,	// Node 5
    -1.0,  1.0, -1.0, 1.0,	  0.0, 1.0, 1.0,	// Node 1

    -1.0,  1.0, -1.0, 1.0,	  0.1, 1.0, 1.0,	// Node 1
    -1.0, -1.0, -1.0, 1.0,	  0.1, 1.0, 1.0,	// Node 0
    -1.0, -1.0,  1.0, 1.0,	  0.1, 1.0, 1.0,	// Node 6

		// -y face: MAGENTA
     1.0, -1.0, -1.0, 1.0,	  1.0, 0.0, 1.0,	// Node 3
     1.0, -1.0,  1.0, 1.0,	  1.0, 0.0, 1.0,	// Node 7
    -1.0, -1.0,  1.0, 1.0,	  1.0, 0.0, 1.0,	// Node 6

    -1.0, -1.0,  1.0, 1.0,	  1.0, 0.1, 1.0,	// Node 6
    -1.0, -1.0, -1.0, 1.0,	  1.0, 0.1, 1.0,	// Node 0
     1.0, -1.0, -1.0, 1.0,	  1.0, 0.1, 1.0,	// Node 3

     // -z face: YELLOW
     1.0,  1.0, -1.0, 1.0,	  1.0, 1.0, 0.0,	// Node 2
     1.0, -1.0, -1.0, 1.0,	  1.0, 1.0, 0.0,	// Node 3
    -1.0, -1.0, -1.0, 1.0,	  1.0, 1.0, 0.0,	// Node 0

    -1.0, -1.0, -1.0, 1.0,	  1.0, 1.0, 0.1,	// Node 0
    -1.0,  1.0, -1.0, 1.0,	  1.0, 1.0, 0.1,	// Node 1
     1.0,  1.0, -1.0, 1.0,	  1.0, 1.0, 0.1,	// Node 2
   ]);
 }

function makeSwing(){
  swingVerts = new Float32Array([
     0.25, 0.0,  0.0, 1.0,	  1.0, 0.0, 0.0,
    -0.25, 0.0,  0.0, 1.0,	  0.0, 0.0, 1.0,
     0.0,  0.0,  1.0, 1.0,	  0.0, 0.0, 1.0,
   ]);
 }

 function makeSwing_inner(){
   swginnerVerts = new Float32Array([
     0.25, 0.0,  0.0, 1.0,	  1.0, 0.0, 0.0,
    -0.25, 0.0,  0.0, 1.0,	  0.0, 0.0, 1.0,
    -0.25, 0.0, -1.0, 1.0,	  0.0, 0.0, 1.0,
  ]);
}

function makeMouth(){
  mouthVerts = new Float32Array([
    0.0,   0.0,  0.0, 1.0,	  1.0, 0.0, 0.0,
   -0.5,   0.0,  1.0, 1.0,	  1.0, 0.0, 0.0,
   -0.25, -1.0,  0.0, 1.0,	  1.0, 0.0, 0.0,

   0.0,   0.0,  0.0, 1.0,	  1.0, 1.0, 1.0,
  -0.5,   0.0,  -1.0, 1.0,	  1.0, 1.0, 1.0,
  -0.25, -1.0,  0.0, 1.0,	  1.0, 1.0, 1.0,

   ]);
 }

function makeRectangle(){
   rectVerts = new Float32Array([
     // Rectangles
     0.0,  0.0,  0.0, 1.0,     0.0, 0.0, 0.0,
     0.5,  0.0,  0.0, 1.0,     0.0, 0.0, 0.0,
     0.5,  0.1,  0.0, 1.0,     0.0, 0.0, 0.0,

     0.0,  0.0,  0.0, 1.0,     0.0, 0.0, 0.0,
     0.5,  0.1,  0.0, 1.0,     0.0, 0.0, 0.0,
     0.0,  0.1,  0.0, 1.0,     0.0, 0.0, 0.0,
  ]);
}


function makeSphere() {
//==============================================================================
// Make a sphere from one OpenGL TRIANGLE_STRIP primitive.   Make ring-like
// equal-lattitude 'slices' of the sphere (bounded by planes of constant z),
// and connect them as a 'stepped spiral' design (see makeCylinder) to build the
// sphere from one triangle strip.
  var slices = 13;		// # of slices of the sphere along the z axis. >=3 req'd
											// (choose odd # or prime# to avoid accidental symmetry)
  var sliceVerts	= 27;	// # of vertices around the top edge of the slice
											// (same number of vertices on bottom of slice, too)
  var topColr = new Float32Array([0.5, 0.5, 0.5]);	// North Pole: light gray
  var equColr = new Float32Array([1.0, 1.0, 1.0]);	// Equator:    bright green
  var botColr = new Float32Array([1.0, 1.0, 1.0]);	// South Pole: brightest gray.
  var sliceAngle = Math.PI/slices;	// lattitude angle spanned by one slice.

	// Create a (global) array to hold this sphere's vertices:
  sphVerts = new Float32Array(  ((slices * 2* sliceVerts) -2) * floatsPerVertex);
										// # of vertices * # of elements needed to store them.
										// each slice requires 2*sliceVerts vertices except 1st and
										// last ones, which require only 2*sliceVerts-1.

	// Create dome-shaped top slice of sphere at z=+1
	// s counts slices; v counts vertices;
	// j counts array elements (vertices * elements per vertex)
	var cos0 = 0.0;					// sines,cosines of slice's top, bottom edge.
	var sin0 = 0.0;
	var cos1 = 0.0;
	var sin1 = 0.0;
	var j = 0;							// initialize our array index
	var isLast = 0;
	var isFirst = 1;
	for(s=0; s<slices; s++) {	// for each slice of the sphere,
		// find sines & cosines for top and bottom of this slice
		if(s==0) {
			isFirst = 1;	// skip 1st vertex of 1st slice.
			cos0 = 1.0; 	// initialize: start at north pole.
			sin0 = 0.0;
		}
		else {					// otherwise, new top edge == old bottom edge
			isFirst = 0;
			cos0 = cos1;
			sin0 = sin1;
		}								// & compute sine,cosine for new bottom edge.
		cos1 = Math.cos((s+1)*sliceAngle);
		sin1 = Math.sin((s+1)*sliceAngle);
		// go around the entire slice, generating TRIANGLE_STRIP verts
		// (Note we don't initialize j; grows with each new attrib,vertex, and slice)
		if(s==slices-1) isLast=1;	// skip last vertex of last slice.
		for(v=isFirst; v< 2*sliceVerts-isLast; v++, j+=floatsPerVertex) {
			if(v%2==0)
			{				// put even# vertices at the the slice's top edge
							// (why PI and not 2*PI? because 0 <= v < 2*sliceVerts
							// and thus we can simplify cos(2*PI(v/2*sliceVerts))
				sphVerts[j  ] = sin0 * Math.cos(Math.PI*(v)/sliceVerts);
				sphVerts[j+1] = sin0 * Math.sin(Math.PI*(v)/sliceVerts);
				sphVerts[j+2] = cos0;
				sphVerts[j+3] = 1.0;
			}
			else { 	// put odd# vertices around the slice's lower edge;
							// x,y,z,w == cos(theta),sin(theta), 1.0, 1.0
							// 					theta = 2*PI*((v-1)/2)/capVerts = PI*(v-1)/capVerts
				sphVerts[j  ] = sin1 * Math.cos(Math.PI*(v-1)/sliceVerts);		// x
				sphVerts[j+1] = sin1 * Math.sin(Math.PI*(v-1)/sliceVerts);		// y
				sphVerts[j+2] = cos1;																				// z
				sphVerts[j+3] = 1.0;																				// w.
			}
			if(s==0) {	// finally, set some interesting colors for vertices:
				sphVerts[j+4]=topColr[0];
				sphVerts[j+5]=topColr[1];
				sphVerts[j+6]=topColr[2];
				}
			else if(s==slices-1) {
				sphVerts[j+4]=botColr[0];
				sphVerts[j+5]=botColr[1];
				sphVerts[j+6]=botColr[2];
			}
			else {
					sphVerts[j+4]=1;// equColr[0];
					sphVerts[j+5]=1;// equColr[1];
					sphVerts[j+6]=1;// equColr[2];
			}
		}
  }
}

function makeTriangle(){
  triVerts = new Float32Array([
    -1.0, -1.0,  0.0, 1.0,	  1.0, 0.0, 0.0,
     1.0, -1.0,  0.0, 1.0,	  1.0, 0.0, 0.0,
     0.0,  0.0,  0.0, 1.0,	  1.0, 0.0, 0.0,
  ]);
}

function makeTorus() {

var rbend = 1.0;										// Radius of circle formed by torus' bent bar
var rbar = 0.5;											// radius of the bar we bent to form torus
var barSlices = 23;									// # of bar-segments in the torus: >=3 req'd;
																		// more segments for more-circular torus
var barSides = 13;										// # of sides of the bar (and thus the
 torVerts = new Float32Array(floatsPerVertex*(2*barSides*barSlices +2));
var phi=0, theta=0;										// begin torus at angles 0,0
var thetaStep = 2*Math.PI/barSlices;	// theta angle between each bar segment
var phiHalfStep = Math.PI/barSides;		// half-phi angle between each side of bar
	for(s=0,j=0; s<barSlices; s++) {		// for each 'slice' or 'ring' of the torus:
		for(v=0; v< 2*barSides; v++, j+=7) {		// for each vertex in this slice:
			if(v%2==0)	{	// even #'d vertices at bottom of slice,
				torVerts[j  ] = (rbend + rbar*Math.cos((v)*phiHalfStep)) *
																						 Math.cos((s)*thetaStep);
							  //	x = (rbend + rbar*cos(phi)) * cos(theta)
				torVerts[j+1] = (rbend + rbar*Math.cos((v)*phiHalfStep)) *
																						 Math.sin((s)*thetaStep);
								//  y = (rbend + rbar*cos(phi)) * sin(theta)
				torVerts[j+2] = -rbar*Math.sin((v)*phiHalfStep);
								//  z = -rbar  *   sin(phi)
				torVerts[j+3] = 1.0;		// w
			}
			else {				// odd #'d vertices at top of slice (s+1);
										// at same phi used at bottom of slice (v-1)
				torVerts[j  ] = (rbend + rbar*Math.cos((v-1)*phiHalfStep)) *
																						 Math.cos((s+1)*thetaStep);
							  //	x = (rbend + rbar*cos(phi)) * cos(theta)
				torVerts[j+1] = (rbend + rbar*Math.cos((v-1)*phiHalfStep)) *
																						 Math.sin((s+1)*thetaStep);
								//  y = (rbend + rbar*cos(phi)) * sin(theta)
				torVerts[j+2] = -rbar*Math.sin((v-1)*phiHalfStep);
								//  z = -rbar  *   sin(phi)
				torVerts[j+3] = 1.0;		// w
			}
			torVerts[j+4] = 0+wr;		// random color 0.0 <= R < 1.0
			torVerts[j+5] = 1;		// random color 0.0 <= G < 1.0
			torVerts[j+6] = 0;		// random color 0.0 <= B < 1.0
		}
	}
	// Repeat the 1st 2 vertices of the triangle strip to complete the torus:
			torVerts[j  ] = rbend + rbar;	// copy vertex zero;
						  //	x = (rbend + rbar*cos(phi==0)) * cos(theta==0)
			torVerts[j+1] = 0.0;
							//  y = (rbend + rbar*cos(phi==0)) * sin(theta==0)
			torVerts[j+2] = 0.0;
							//  z = -rbar  *   sin(phi==0)
			torVerts[j+3] = 1.0;		// w
			torVerts[j+4] = 0+wr;		// random color 0.0 <= R < 1.0
			torVerts[j+5] = 1;		// random color 0.0 <= G < 1.0
			torVerts[j+6] = 0;		// random color 0.0 <= B < 1.0
			j+=7; // go to next vertex:
			torVerts[j  ] = (rbend + rbar) * Math.cos(thetaStep);
						  //	x = (rbend + rbar*cos(phi==0)) * cos(theta==thetaStep)
			torVerts[j+1] = (rbend + rbar) * Math.sin(thetaStep);
							//  y = (rbend + rbar*cos(phi==0)) * sin(theta==thetaStep)
			torVerts[j+2] = 0.0;
							//  z = -rbar  *   sin(phi==0)
			torVerts[j+3] = 1.0;		// w
			torVerts[j+4] = 0+wr;		// random color 0.0 <= R < 1.0
			torVerts[j+5] = 1;		// random color 0.0 <= G < 1.0
			torVerts[j+6] = 0;		// random color 0.0 <= B < 1.0
}

function initVertexBuffer(gl) {
//==============================================================================
  makeStar();
  makeFive();
  makeCube();
  makeSwing();
  makeSwing_inner();
  makeMouth();
  makeRectangle();

  //makeColorShapes();
  makeSphere();
  makeTriangle();
  makeTorus();
  var mySiz = starVerts.length + fiveVerts.length + cubeVerts.length + swingVerts.length + swginnerVerts.length +mouthVerts.length + rectVerts.length + sphVerts.length + triVerts.length + torVerts.length;		// 12 tetrahedron vertices; 36 cube verts (6 per side*6 sides)
  var nn = mySiz/floatsPerVertex;


  // Create a buffer object
  var vArray = new Float32Array(mySiz);
  //colorShapes_start = 0;
  //i=0;
  /*
  for (j=0;j<colorShapes.length;i++,j++){
    vArray[i] = colorShapes[j];
  } */
  star_start = 0;
  for(i=0,j=0;j<starVerts.length;i++,j++){
    vArray[i] = starVerts[j];
  }

  five_start = i;
  for(j=0;j<fiveVerts.length;i++,j++){
    vArray[i] = fiveVerts[j];
  }


  cube_start = i;
  for(j=0;j<cubeVerts.length;i++,j++){
    vArray[i] = cubeVerts[j];
  }

  swing_start = i;
  for(j=0;j<swingVerts.length;i++,j++){
    vArray[i] = swingVerts[j];
  }

  swginner_start = i;
  for (j=0;j<swginnerVerts.length;i++,j++){
    vArray[i] = swginnerVerts[j];
  }

  mouth_start = i;
  for(j=0;j<mouthVerts.length;i++,j++){
    vArray[i] = mouthVerts[j];
  }

  rect_start = i;
  for(j=0;j<rectVerts.length;i++,j++){
    vArray[i] = rectVerts[j];
  }

  sphere_start = i;
  for(j=0;j<sphVerts.length;i++,j++){
    vArray[i] = sphVerts[j];
  }

  tri_start = i;
  for(j=0;j<triVerts.length;i++,j++){
    vArray[i] = triVerts[j];
  }

  tor_start = i;
  for(j=0;j<torVerts.length;i++,j++){
    vArray[i] = torVerts[j];
  }


  var shapeBufferHandle = gl.createBuffer();
  if (!shapeBufferHandle) {
    console.log('Failed to create the shape buffer object');
    return false;
  }

  // Bind the the buffer object to target:
  gl.bindBuffer(gl.ARRAY_BUFFER, shapeBufferHandle);
  // Transfer data from Javascript array colorShapes to Graphics system VBO
  // (Use sparingly--may be slow if you transfer large shapes stored in files)
  gl.bufferData(gl.ARRAY_BUFFER, vArray, gl.STATIC_DRAW);

  var FSIZE = vArray.BYTES_PER_ELEMENT; // how many bytes per stored value?

  //Get graphics system's handle for our Vertex Shader's position-input variable:
  var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return -1;
  }
  // Use handle to specify how to retrieve position data from our VBO:
  gl.vertexAttribPointer(
  		a_Position, 	// choose Vertex Shader attribute to fill with data
  		4, 						// how many values? 1,2,3 or 4.  (we're using x,y,z,w)
  		gl.FLOAT, 		// data type for each value: usually gl.FLOAT
  		false, 				// did we supply fixed-point data AND it needs normalizing?
  		FSIZE * 7, 		// Stride -- how many bytes used to store each vertex?
  									// (x,y,z,w, r,g,b) * bytes/value
  		0);						// Offset -- now many bytes from START of buffer to the
  									// value we will actually use?
  gl.enableVertexAttribArray(a_Position);
  									// Enable assignment of vertex buffer object's position data

  // Get graphics system's handle for our Vertex Shader's color-input variable;
  var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
  if(a_Color < 0) {
    console.log('Failed to get the storage location of a_Color');
    return -1;
  }
  // Use handle to specify how to retrieve color data from our VBO:
  gl.vertexAttribPointer(
  	a_Color, 				// choose Vertex Shader attribute to fill with data
  	3, 							// how many values? 1,2,3 or 4. (we're using R,G,B)
  	gl.FLOAT, 			// data type for each value: usually gl.FLOAT
  	false, 					// did we supply fixed-point data AND it needs normalizing?
  	FSIZE * 7, 			// Stride -- how many bytes used to store each vertex?
  									// (x,y,z,w, r,g,b) * bytes/value
  	FSIZE * 4);			// Offset -- how many bytes from START of buffer to the
  									// value we will actually use?  Need to skip over x,y,z,w

  gl.enableVertexAttribArray(a_Color);
  									// Enable assignment of vertex buffer object's position data

	//--------------------------------DONE!
  // Unbind the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  return nn;
}

function draw(gl, n, currentAngle, tt_angle, Tx, Ty, modelMatrix, u_ModelMatrix) {
//==============================================================================
  // Clear <canvas>  colors AND the depth buffer
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


  //-------Draw Star

  modelMatrix.setTranslate(diamond_locx,diamond_locy, 0.0);  // 'set' means DISCARD old matrix,
  //modelMatrix.scale(1,1,-1);							// convert to left-handed coord sys
  modelMatrix.scale(0.2, 0.2, 0.2);
  //modelMatrix.rotate(currentAngle, 0, 1, 0);  // Make new drawing axes that
  modelMatrix.rotate(Tx_star*-15, 0, 1, 0);
  modelMatrix.rotate(Ty_star*15, 1, 0, 0);
  modelMatrix.scale(scl_1, scl_2, 1);
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.drawArrays(gl.TRIANGLES, star_start/floatsPerVertex, starVerts.length/floatsPerVertex);

  //-------Draw Five_Star
  if (drawFive){
    modelMatrix.setTranslate(diamond_locx,diamond_locy, 0.0);  // 'set' means DISCARD old matrix,
    modelMatrix.scale(0.05, 0.05, 0.1);							// convert to left-handed coord sys
    //modelMatrix.scale(0.2, 0.2, 0.2);
    modelMatrix.rotate(currentAngle*3, 1, 1, 0);  // Make new drawing axes that
    modelMatrix.translate(4.0, 4.0, 0);
    modelMatrix.rotate(currentAngle*1.5, 0, 0, 1);
    //modelMatrix.scale(scl_1, scl_2, 1);
    //modelMatrix.translate(1.0, 0.0, 0.0);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    gl.drawArrays(gl.LINE_LOOP, five_start/floatsPerVertex, 10);
    gl.drawArrays(gl.LINE_LOOP, five_start/floatsPerVertex+10, 10);
    gl.drawArrays(gl.TRIANGLE_STRIP, five_start/floatsPerVertex+20, 22);
  }

  if (drawFive_2){
    modelMatrix.setTranslate(diamond_locx,diamond_locy, 0.0);  // 'set' means DISCARD old matrix,
    //modelMatrix.scale(0.2, 0.2, 0.2);
    modelMatrix.rotate(currentAngle*2, 1, 1, 0);  // Make new drawing axes that
    modelMatrix.translate(-0.2, -0.2, 0);
    modelMatrix.scale(0.03, 0.05, 0.1);							// convert to left-handed coord sys
    modelMatrix.rotate(currentAngle*1.5, 0, 0, 1);
    //modelMatrix.translate(1.0, 0.0, 0.0);
    //modelMatrix.scale(scl_2, scl_1, 1);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    gl.drawArrays(gl.LINE_LOOP, five_start/floatsPerVertex, 10);
    gl.drawArrays(gl.LINE_LOOP, five_start/floatsPerVertex+10, 10);
    gl.drawArrays(gl.TRIANGLE_STRIP, five_start/floatsPerVertex+20, 22);
  }


  // NEXT, create bird body
  var bird_locy = 0.3 + Ty;
  modelMatrix.setTranslate(bird_locx, bird_locy, 0.0);  // 'set' means DISCARD old matrix,
  //modelMatrix.translate(0.0, 0.5, 0);
  modelMatrix.scale(1*dir,1,-1);							// convert to left-handed coord sys
  																				// to match WebGL display canvas.
  modelMatrix.scale(0.25, 0.02, 0.02);
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.drawArrays(gl.TRIANGLES, cube_start/floatsPerVertex, cubeVerts.length/floatsPerVertex);

  // NEXT, create bird wing
  modelMatrix.setTranslate(bird_locx, bird_locy, 0.0);  // 'set' means DISCARD old matrix,
  modelMatrix.scale(0.5*dir,0.5,-0.5);							// convert to left-handed coord sys
  modelMatrix.rotate(tt_angle, 1, 0, 0);  // Spin on XY diagonal axis
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.drawArrays(gl.TRIANGLES, swing_start/floatsPerVertex, swingVerts.length/floatsPerVertex);

  // NEXT, create another wing
  modelMatrix.setTranslate(bird_locx, bird_locy, 0.0);  // 'set' means DISCARD old matrix,
  modelMatrix.scale(0.5*dir,0.5,-0.5);							// convert to left-handed coord sys
  modelMatrix.rotate(-tt_angle, 1, 0, 0);  // Spin on XY diagonal axis
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.drawArrays(gl.TRIANGLES, swginner_start/floatsPerVertex, swginnerVerts.length/floatsPerVertex);

  // Draw bird_neck
  modelMatrix.setTranslate(bird_locx+0.25*dir, bird_locy, 0.0);  // 'set' means DISCARD old matrix,
  modelMatrix.rotate(dir*45+0.5*tt_angle, 0, 0, 1);
  modelMatrix.scale(0.1*dir, 0.02, 0.02);
  modelMatrix.translate(1.0, 1.0, 0);
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.drawArrays(gl.TRIANGLES, cube_start/floatsPerVertex, cubeVerts.length/floatsPerVertex);

  // Draw bird_mouth
  modelMatrix.translate(1.0, 0.0, 0.0);
  modelMatrix.scale(1.0, 6.0, -1);
  modelMatrix.rotate(tt_angle*0.6, 0, 0, 1);
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.drawArrays(gl.TRIANGLES, mouth_start/floatsPerVertex, mouthVerts.length/floatsPerVertex);

  // Draw white bird
  // Draw neck_lower
  modelMatrix.setTranslate(elep_locx,elep_locy,0);
  pushMatrix(modelMatrix);
  modelMatrix.rotate(75+tt_angle*0.5, 0, 0, 1);
  modelMatrix.scale(0.3, 0.2, 1);
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.drawArrays(gl.TRIANGLES, rect_start/floatsPerVertex, rectVerts.length/floatsPerVertex);
  //Draw neck_mid
  modelMatrix.translate(0.5, 0, 0);
  modelMatrix.rotate(-tt_angle, 0, 0, 1);
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.drawArrays(gl.TRIANGLES, rect_start/floatsPerVertex, rectVerts.length/floatsPerVertex);
  // Draw neck_upper
  modelMatrix.translate(0.5, 0, 0);
  modelMatrix.rotate(tt_angle*0.7-15, 0, 0, 1);
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.drawArrays(gl.TRIANGLES, rect_start/floatsPerVertex, rectVerts.length/floatsPerVertex);
  // Draw mouth
  modelMatrix.translate(0.5, 0, 0);
  modelMatrix.rotate(tt_angle*0.5, 0, 0, 1);
  modelMatrix.scale(0.5, 0.8, 0.5);
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.drawArrays(gl.TRIANGLES, mouth_start/floatsPerVertex, mouthVerts.length/floatsPerVertex);

  //--------Draw Spinning Sphere
  //modelMatrix.setTranslate( -0.4, -0.4, 0.0); // 'set' means DISCARD old matrix,
  modelMatrix = popMatrix();
  modelMatrix.scale(0.3, 0.1,-1);							// convert to left-handed coord sys
  pushMatrix(modelMatrix);
  //modelMatrix.rotate(90, 1, 0, 0);
  modelMatrix.rotate(tt_angle*0.3,1, 0, 0);
  modelMatrix.translate(-1, 0 ,0);

  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.drawArrays(gl.TRIANGLE_STRIP,				// use this drawing primitive, and
  							sphere_start/floatsPerVertex,	// start at this vertex number, and
  							sphVerts.length/floatsPerVertex);	// draw this many vertices.

  //draw left_foot
  modelMatrix = popMatrix();
  pushMatrix(modelMatrix);
  modelMatrix.translate(-0.8, -0.9, 0.5);
  // draw leg
  modelMatrix.scale(1.5, 1, 1);
  modelMatrix.rotate(-100, 0, 0, 1);
  if(leg_mov){
    modelMatrix.rotate(tt_angle*0.50, 0, 0, 1);
  }
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.drawArrays(gl.TRIANGLES, rect_start/floatsPerVertex, rectVerts.length/floatsPerVertex);
  // Draw foot
  modelMatrix.translate(0.5, 0.0, 0.0);
  modelMatrix.scale(0.08, 0.3, 1);
  modelMatrix.rotate(180, 0, 0, 1);
  if(leg_mov){
    modelMatrix.rotate(tt_angle*0.60, 0, 0, 1);
  }
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.drawArrays(gl.TRIANGLES, tri_start/floatsPerVertex, triVerts.length/floatsPerVertex);

  //draw right_foot
  modelMatrix = popMatrix();
  pushMatrix(modelMatrix);
  modelMatrix.translate(-0.8, -0.9, -0.5);
  // draw leg
  modelMatrix.scale(1.5, 1, 1);
  modelMatrix.rotate(-100, 0, 0, 1);
  if(leg_mov){
    modelMatrix.rotate(-tt_angle*0.50, 0, 0, 1);
  }

  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.drawArrays(gl.TRIANGLES, rect_start/floatsPerVertex, rectVerts.length/floatsPerVertex);
  // Draw foot
  modelMatrix.translate(0.5, 0.0, 0.0);
  modelMatrix.scale(0.08, 0.3, 1);
  modelMatrix.rotate(180, 0, 0, 1);
  if(leg_mov){
    modelMatrix.rotate(tt_angle*0.60, 0, 0, 1);
  }

  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.drawArrays(gl.TRIANGLES, tri_start/floatsPerVertex, triVerts.length/floatsPerVertex);

/*
  //draw right_foot
  modelMatrix = popMatrix();
  pushMatrix(modelMatrix);
  modelMatrix.translate(-0.8, -0.75, 0);
  modelMatrix.rotate(-tt_angle*0.5, 0, 0, 1);

  modelMatrix.scale(0.1, 0.5, 1);
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.drawArrays(gl.TRIANGLES, tri_start/floatsPerVertex, triVerts.length/floatsPerVertex);
*/
  // Draw tail
  modelMatrix.setTranslate(elep_locx-0.55,elep_locy+0.05,0);
  modelMatrix.rotate(30-tt_angle*0.3, 0, 0, 1);
  //modelMatrix.translate(-1.6, 0.4, 0);
  modelMatrix.scale(0.03, 0.1, 1);
  modelMatrix.translate(0, 1, 0);
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.drawArrays(gl.TRIANGLES, tri_start/floatsPerVertex, triVerts.length/floatsPerVertex);

  // Draw the grassland
  sea_locx = -0.9;
  sea_locy = -1.0;
  x_step = 0.15;
  y_step = 0.1;
  for(i=0;i<2;i++){
    locy = sea_locy + i*y_step;
    for(j=0;j<15;j++){
      locx = sea_locx + j* x_step;
      modelMatrix.setTranslate(locx,locy,0);
      modelMatrix.rotate(2*currentAngle, 0.8, 0.8, 0.6);
      modelMatrix.scale(0.1, 0.1, 0.1);
      //modelMatrix.translate(0, 1, 0);
      gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
      gl.drawArrays(gl.TRIANGLES, tor_start/floatsPerVertex, torVerts.length/floatsPerVertex);

      modelMatrix.setTranslate(locx,locy,0);
      modelMatrix.rotate(60-3*currentAngle, 0.5, 0.8, 1);
      modelMatrix.scale(0.1, 0.1, 0.1);
      //modelMatrix.translate(0, 1, 0);
      gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
      gl.drawArrays(gl.TRIANGLES, tor_start/floatsPerVertex, torVerts.length/floatsPerVertex);

    }
  }
}

var c_last = Date.now();
function animate_color(){
  var now = Date.now();
  var elapsed = now - c_last;
  c_last = now;

  if(wr > wr_max && clr_step == 1) clr_step = -clr_step;
  if(wr < wr_min && clr_step == -1) clr_step = -clr_step;

  wr += (wr_max - wr_min)*elapsed*clr_step/10000;
  wg -= (wg_max - wg_min)*elapsed*clr_step/10000;
}

var s_last = Date.now();
function animate_scale(){
  var now = Date.now();
  var elapsed = now - s_last;
  s_last = now;

  if(scl_1 > scl_max && scl_step > 0) scl_step = -scl_step;
  if(scl_1 < scl_min && scl_step < 0) scl_step = -scl_step;

  scl_1 += (scl_max - scl_min)*elapsed*scl_step/5000;
  scl_2 -= (scl_max - scl_min)*elapsed*scl_step/5000;
}

// Last time that this function was called:  (used for animation timing)
var g_last = Date.now();
function animate(angle) {
//==============================================================================
  // Calculate the elapsed time
  var now = Date.now();
  var elapsed = now - g_last;
  g_last = now;

  // Update the current rotation angle (adjusted by the elapsed time)
  //  limit the angle to move smoothly between +20 and -85 degrees:
//  if(angle >  120.0 && ANGLE_STEP > 0) ANGLE_STEP = -ANGLE_STEP;
//  if(angle < -120.0 && ANGLE_STEP < 0) ANGLE_STEP = -ANGLE_STEP;

  var newAngle = angle + (ANGLE_STEP * elapsed) / 1000.0;
  return newAngle %= 360;
}

var t_last = Date.now();
function tt_animate(angle) {
//==============================================================================
  // Calculate the elapsed time
  var now = Date.now();
  var elapsed = now - t_last;
  t_last = now;

  // Update the current rotation angle (adjusted by the elapsed time)
  //  limit the angle to move smoothly between +20 and -85 degrees:
  if(angle >   45.0 && ang_step > 0) ang_step = -ang_step;
  if(angle <  -45.0 && ang_step < 0) ang_step = -ang_step;

  var newAngle = angle + (ang_step * elapsed) / 1000.0;
  return newAngle %= 360;
}

var barrier = 0.6;
var fly_v = 0.3;
var f_last = Date.now();
function animatefly(){
  // Calculate the elapsed time
  var now = Date.now();
  var elapsed = now - f_last;
  f_last = now;

  // Update the current rotation angle (adjusted by the elapsed time)
  //  limit the angle to move smoothly between +20 and -85 degrees:

  if(bird_locx > barrier && dir == 1) {
    fly_v = -fly_v;
    dir = -1;
  }
  if(bird_locx < -barrier && dir == -1){
    fly_v = -fly_v;
    dir = 1;
  }

  bird_locx = bird_locx + fly_v * elapsed/1000;
  return;
}


//==================HTML Button Callbacks
function speedUp() {
  if (!isRun) return;
  if (ANGLE_STEP!=0){
    ANGLE_STEP += 25;
  }
  if (ang_step>0) {
    ang_step += 10;
  }
  else if(ang_step<0){
    ang_step -= 10;
  }
  if (fly_v>0) {
    fly_v += 0.1;
  }
  else if(fly_v<0){
    fly_v -= 0.1;
  }

  if (scl_step>=0) {
    scl_step += 1;
  }
  else if(scl_step<0){
    scl_step -= 1;
  }


}

function speedDown() {
  if(!isRun) return;
 if(ANGLE_STEP!=0) {
   ANGLE_STEP -= 25;
 }
 if (ang_step>0) {
     ang_step -= 10;
   }
   else if (ang_step<0){
     ang_step += 10;
   }
   if (fly_v>0) {
     fly_v -= 0.1;
   }
   else if(fly_v<0){
     fly_v += 0.1;
   }

   if (scl_step>0) {
     scl_step -= 1;
   }
   else if(scl_step<0){
     scl_step += 1;
   }


}
function runStop() {
  if(isRun == 1) {
    myTmp = ANGLE_STEP;
    myTmp2 = ang_step;
    myfly_v = fly_v;
    my_scl_step = scl_step;
    my_clr_step = clr_step;
    ANGLE_STEP = 0;
    ang_step = 0;
    fly_v = 0;
    scl_step = 0;
    clr_step = 0;
    isRun = 0;
  }
  else {
  	ANGLE_STEP = myTmp;
    ang_step = myTmp2;
    fly_v = myfly_v;
    scl_step = my_scl_step;
    clr_step = my_clr_step;
    isRun = 1;
  }
}

window.addEventListener("keydown",
                        function(ev){
                          if (isRun == 1){
                          // Modify translate distance
                            switch(ev.keyCode) {
                              case 37:  // left-arrow key
                                elep_locx -= 0.01;
                                leg_mov = true;
                                break;
                              case 38:  // up-arrow key
                                Ty += 0.01;
                                break;
                              case 39:  // right-arrow key
                                elep_locx += 0.01;
                                leg_mov = true;
                                break;
                              case 40:  // down-arrow key
                                Ty -= 0.01;
                                break;
                              default:
                                break;
                            }
                          }
                        },
                        false);

window.addEventListener("keyup",
                        function(ev){
                          // Modify translate distance
                          if(ev.keyCode == 37 || ev.keyCode == 39) {
                            leg_mov = false;
                          }
                        },
                        false);


window.addEventListener("resize",
                        function(ev){
                          // Modify translate distance
                          op = window.innerHeight*window.innerWidth/(screen.height*screen.width);
                        },
                        true);
