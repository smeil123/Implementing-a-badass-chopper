var ANGLE_STEP = 45.0;
var bodyAngle = 0.0;
var current_ty = 0.0;
var current_tz = 0.0;
var change_angle = false;
var change_trans_y = false;
var change_trans_z = false;

var c_current_ty = 0.0;
var c_current_tz = 0.0;

var eye_x = 0;
var eye_y = 20;
var eye_z = -5;

var look_x = 0;
var look_y = -40;
var look_z = 6;

// 카메라 MVP
var C_MVP = new Matrix4();

function main()
{
    var canvas = document.getElementById('webgl');
    var gl = getWebGLContext(canvas);
    initShaders(gl, document.getElementById("shader-vert").text, document.getElementById("shader-frag").text);

    gl.clearColor(0.0, 0.0, 0.0, 1.0);

	  gl.enable(gl.DEPTH_TEST);
	  init_vbo(gl);

  	var	w = canvas.width;
  	var	h = canvas.height;
  	var currentAngle = 0.0;

    var loc_MVP = gl.getUniformLocation(gl.program, 'uMVP');
    // 헬리콥터 MVP
    var	MVP = new Matrix4();
    // angle = 30, near = 1, far = 100
    MVP.setPerspective(30, w/(2*h), 1, 100);
    MVP.lookAt(eye_x, eye_y, eye_z, look_x, look_y, look_z, 0, 1, 0);
    MVP.translate(0,0,-2);

    // angle = 30, near = 1, far = 100
    C_MVP.setPerspective(30, w/(2*h), 1, 100);
    C_MVP.lookAt(0, 0, 9, 0, 0, -5, 0, 1, 0);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    canvas.onmousedown = function(ev){ click(ev, gl,n, currentAngle, modelMatrix,u_ModelMatrix); };
    window.onkeydown = handleKeyDown;

  	// 주기적으로 호출하는 부분
  	var tick = function(){
  	    currentAngle = animate(currentAngle); // angle값 계산
  	    handleKeys(); // 키입력값으로 angle,transpose값을 계산
  	    MVP = draw(gl,w,h,currentAngle,MVP,loc_MVP);
  	    // 웹브라우저가 1초에 60번정도 호출해준다(단, 현재페이지가 보이지 않는경우에는 호출되지 않는다)
  	    requestAnimationFrame(tick,canvas); // tick을 주기적으로 호출
  	};
  	tick();

}
var presskey = {};
function handleKeyDown(ev) {
  console.log("keydown");
  // draw(gl,n,currentAngle,-0.01,modelMatrix,u_ModelMatrix);
  presskey[ev.keyCode] = true;
  console.log(ev.keyCode);
  console.log(String.fromCharCode(ev.keyCode));
  if (String.fromCharCode(ev.keyCode) == "F") {
    filter += 1;
    if (filter == 3) {
      filter = 0;
    }
  }
}
function handleKeys() {
  if (presskey[37]) {
    // Left cursor key
    // 시계방향으로 10도 회전
    console.log("bodyAngle= ",bodyAngle);
    change_angle = true;
    bodyAngle = 10.0;
    presskey[37] = false;
  }
  if (presskey[39]) {
    // Right cursor key
    // 반시계 방향으로 10도 회전
    console.log("bodyAngle= ",bodyAngle);
    change_angle = true;
    bodyAngle = -10.0;
    presskey[39] = false;
  }
  if (presskey[38]) {
    // Up cursor key
    // y축으로 0.05만큼 앞으로
    change_trans_y = true;
    current_ty = 0.1;
    presskey[38] = false;
    c_current_ty +=0.05;
  }
  if (presskey[40]) {
    // Down cursor key
    // y축으로 0.05만큼 뒤로
    change_trans_y = true;
    current_ty = -0.05;
    c_current_ty -=0.1;
    presskey[40] = false;
  }
  if (presskey[83]) {
    // Move downward
    // 0.05만큼 앞으로
    change_trans_z = true;
    current_tz = -0.05;
    c_current_tz -=0.1;

    presskey[83] = false;
  }
  if (presskey[87]) {
    // Move upward
    // 0.05만큼 뒤로
    change_trans_z = true;
    current_tz = 0.05;
    c_current_tz +=0.1;

    presskey[87] = false;
  }
}

function init_vbo(gl)
{
  	// Create a cube
    //    v6----- v5
    //   /|      /|
    //  v1------v0|
    //  | |     | |
    //  | |v7---|-|v4
    //  |/      |/
    //  v2------v3
    var attribs = new Float32Array([
		   0.7,  0.7,  0.7,     1.0,  1.0,  1.0,  // v0 White
	    -0.7,  0.7,  0.7,     1.0,  0.0,  1.0,  // v1 Magenta
	    -0.7, -0.7,  0.7,     1.0,  0.0,  0.0,  // v2 Red
	     0.7, -0.7,  0.7,     1.0,  1.0,  0.0,  // v3 Yellow
	     0.7, -0.7, -0.7,     0.0,  1.0,  0.0,  // v4 Green
	     0.7,  0.7, -0.7,     0.0,  1.0,  1.0,  // v5 Cyan
	    -0.7,  0.7, -0.7,     0.0,  0.0,  1.0,  // v6 Blue
	    -0.7, -0.7, -0.7,     0.0,  0.0,  0.0,   // v7 Black
	    // 프로펠러
      2.0, 0.4, 1.0,       0.0, 0.0, 1.0,	//v0
		-2.0,0.4,  1.0,       1.0, 1.0, 1.0,	//v1
		-2.0, 0.4, 0.7,       1.0, 0.0, 0.0,	//v2
		 2.0,0.4,    0.7,     0.0, 0.0, 1.0,	//v3
		 2.0, -0.4,  0.7,     0.0, 1.0, 0.0,	//v4
		 2.0, -0.4,  1.0,     0.0, 1.0, 0.0,	//v5
		-2.0, -0.4,  1.0,     1.0, 0.0, 0.0,	//v6
		-2.0,-0.4,     0.7,   1.0, 0.0, 0.0,	//v7
		// 바닥
	    -5.0, -4.0, -5.0,     1.0, 0.0, 0.0,
		 5.0,  -4.0, -5.0,     0.0, 1.0, 0.0,
		 5.0,  4.0,  -5.0,     0.0, 0.0, 1.0,
		-5.0,  4.0,  -5.0,     1.0, 1.0, 1.0,
	]);

	//  v2------v3
	// Indices of the vertices
	// 12개의 triangle을 정의
	var indices = new Uint8Array([
	    0, 1, 2,   0, 2, 3,    // front
	    0, 3, 4,   0, 4, 5,    // right
	    0, 5, 6,   0, 6, 1,    // up
	    1, 6, 7,   1, 7, 2,    // left
	    7, 4, 3,   7, 3, 2,    // down
	    4, 7, 6,   4, 6, 5,     // back

	    0+8, 1+8, 2+8,   0+8, 2+8, 3+8,    // front
	    0+8, 3+8, 4+8,   0+8, 4+8, 5+8,    // right
	    0+8, 5+8, 6+8,   0+8, 6+8, 1+8,    // up
	    1+8, 6+8, 7+8,   1+8, 7+8, 2+8,    // left
	    7+8, 4+8, 3+8,   7+8, 3+8, 2+8,    // down
	    4+8, 7+8, 6+8,   4+8, 6+8, 5+8,     // back
	 ]);

  	// Create a buffer object
    var vbo = gl.createBuffer();
  	var indexBuffer = gl.createBuffer();
  	if (!vbo || !indexBuffer) {
  	  return -1;
  	}

    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, attribs, gl.STATIC_DRAW);

    FSIZE = attribs.BYTES_PER_ELEMENT;

    var loc_Position = gl.getAttribLocation(gl.program, 'aPosition');
  	gl.vertexAttribPointer(loc_Position, 3, gl.FLOAT, false, FSIZE*6, 0);
  	gl.enableVertexAttribArray(loc_Position);

    var loc_Color = gl.getAttribLocation(gl.program, 'aColor');
  	gl.vertexAttribPointer(loc_Color, 3, gl.FLOAT, false, FSIZE*6, FSIZE*3);
  	gl.enableVertexAttribArray(loc_Color);

  	// Write the indices to the buffer object
  	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  	return;
}
var FSIZE;
function draw(gl,w,h,currentAngle,MVP,loc_MVP){
    //z축을 기준으로 currentAngle만큼 회전
  	gl.clear(gl.COLOR_BUFFER_BIT);

  	//왼쪽 viewport
  	gl.viewport(0, 0, w/2, h);

    var modelMatrix = new Matrix4();

    if(change_trans_z){
      modelMatrix.setTranslate(0,0,current_tz);
      MVP.multiply(modelMatrix);
      modelMatrix.setTranslate(0,0,-current_tz*3);
      modelMatrix = C_MVP.multiply(modelMatrix);
      change_trans_z = false;
    }else{
      if(change_angle){
        modelMatrix.setRotate(bodyAngle,0,0,1);
        change_angle = false;
      }else if(change_trans_y){
        modelMatrix.setTranslate(0,current_ty,0);
        change_trans_y = false;
      }
      MVP.multiply(modelMatrix);
      modelMatrix = C_MVP.multiply(modelMatrix);
    }

  	gl.uniformMatrix4fv(loc_MVP, false, MVP.elements);
  	//몸통
  	gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_BYTE, 0);
  	// 프로펠러
  	var p_modelMatrix = new Matrix4();
  	p_modelMatrix.set(MVP);
  	p_modelMatrix.rotate(currentAngle,0,0,1);
  	gl.uniformMatrix4fv(loc_MVP,false,p_modelMatrix.elements);
	   //gl.drawArrays(gl.TRIANGLE_FAN,12,4);
  	gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_BYTE, 36);

  	// 바닥
  	p_modelMatrix.setPerspective(30, w/(2*h), 1, 100);
  	p_modelMatrix.lookAt(eye_x, eye_y, eye_z, look_x, look_y, look_z, 0, 1, 0);
    p_modelMatrix.translate(0,0,-1);

  	gl.uniformMatrix4fv(loc_MVP, false, p_modelMatrix.elements);
  	gl.drawArrays(gl.TRIANGLE_FAN, 16, 4);

  	//오른쪽 viewport ---------------
  	gl.viewport(w/2, 0, w/2, h);

  	gl.uniformMatrix4fv(loc_MVP, false, modelMatrix.elements);
  	gl.drawArrays(gl.TRIANGLE_FAN, 16, 4);

  	return MVP;
}

var g_last = Date.now();

function animate(angle){
    var now = Date.now();
    var elapsed = now - g_last; //바로 직전에 그린때와 시간차이를 구해서 angle을 계산
    g_last = now;
    var newAngle = angle + (ANGLE_STEP * elapsed) / 100.0;
    return newAngle %= 360;
}
