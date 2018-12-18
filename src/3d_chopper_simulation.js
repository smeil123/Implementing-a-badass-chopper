var ANGLE_STEP = 45.0;
var bodyAngle = 0.0;
var current_ty = 0.0;
var current_tz = 0.0;
var change_angle = false;
var change_trans_y = false;
var change_trans_z = false;

//카메라 위치 조정
var c_bodyAngle = 0.0;
var c_current_ty = 0.0;
var c_current_tx = 0.0;
var c_current_tz = 0.0;
 

//lookAt 변수
var eye_x = 0;
var eye_y = 20;
var eye_z = -5;

var look_x = 0;
var look_y = -40;
var look_z = 5;

function main()
{
    var canvas = document.getElementById('webgl');
    var gl = getWebGLContext(canvas);
    initShaders(gl, document.getElementById("shader-vert").text, document.getElementById("shader-frag").text);

    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    gl.enable(gl.DEPTH_TEST);
    init_vbo(gl);

    var w = canvas.width;
    var h = canvas.height;
    var currentAngle = 0.0;

    var loc_MVP = gl.getUniformLocation(gl.program, 'uMVP');

    // 헬리콥터 MVP
    var MVP = new Matrix4();
    // angle = 30, near = 1, far = 100
    MVP.setPerspective(30, w/(2*h), 1, 100);
    MVP.lookAt(eye_x, eye_y, eye_z, look_x, look_y, look_z, 0, 1, 0);
    MVP.translate(0,0,-2); 

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
    change_angle = true;
    bodyAngle = -10.0;
    c_bodyAngle += 10.0;
 
    presskey[37] = false;
  }
  if (presskey[39]) {
    // Right cursor key
    // 반시계 방향으로 10도 회전
    change_angle = true;
    bodyAngle = 10.0;
    c_bodyAngle -= 10.0;
 
    presskey[39] = false;
  }
  if (presskey[38]) {
    // Up cursor key
    // y축으로 0.05만큼 앞으로
    change_trans_y = true;
    current_ty = 0.05; 

    //카메라 위치 계산
    c_current_ty -= Math.cos(c_bodyAngle*Math.PI/180)*0.05;
    c_current_tx -= Math.sin(c_bodyAngle*Math.PI/180)*0.05; 

    presskey[38] = false;
  }
  if (presskey[40]) {
    // Down cursor key
    // y축으로 0.05만큼 뒤로
    change_trans_y = true;
    current_ty = -0.05;

    //카메라 위치 계산
    c_current_ty += Math.cos(c_bodyAngle*Math.PI/180)*0.05;
    c_current_tx += Math.sin(c_bodyAngle*Math.PI/180)*0.05; 

    presskey[40] = false;  
  }
  if (presskey[83]) {
    // Move downward
    // 0.05만큼 앞으로
    change_trans_z = true;
    current_tz = -0.05;
    c_current_tz += 0.05; 

    presskey[83] = false;
  }
  if (presskey[87]) {
    // Move upward
    // 0.05만큼 뒤로
    change_trans_z = true;
    current_tz = 0.05;
    c_current_tz -= 0.05; 

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
      //헬리콥터
      0.7, 0.7, 0.7,  -0.7, 0.7, 0.7,  -0.7,-0.7, 0.7,   0.7,-0.7, 0.7,  // v0-v1-v2-v3 front
      0.7, 0.7, 0.7,   0.7,-0.7, 0.7,   0.7,-0.7,-0.7,   0.7, 0.7,-0.7,  // v0-v3-v4-v5 right
      0.7, 0.7, 0.7,   0.7, 0.7,-0.7,  -0.7, 0.7,-0.7,  -0.7, 0.7, 0.7,  // v0-v5-v6-v1 up
     -0.7, 0.7, 0.7,  -0.7, 0.7,-0.7,  -0.7,-0.7,-0.7,  -0.7,-0.7, 0.7,  // v1-v6-v7-v2 left
     -0.7,-0.7,-0.7,   0.7,-0.7,-0.7,   0.7,-0.7, 0.7,  -0.7,-0.7, 0.7,  // v7-v4-v3-v2 down
      0.7,-0.7,-0.7,  -0.7,-0.7,-0.7,  -0.7, 0.7,-0.7,   0.7, 0.7,-0.7,   // v4-v7-v6-v5 back 

      //헬리콥터 앞부분
      0.3, 0.3+0.7, 0.3,  -0.3, 0.3+0.7, 0.3,  -0.3,-0.3+0.7, 0.3,   0.3,-0.3+0.7, 0.3,  // v0-v1-v2-v3 front
      0.3, 0.3+0.7, 0.3,   0.3,-0.3+0.7, 0.3,   0.3,-0.3+0.7,-0.3,   0.3, 0.3+0.7,-0.3,  // v0-v3-v4-v5 right
      0.3, 0.3+0.7, 0.3,   0.3, 0.3+0.7,-0.3,  -0.3, 0.3+0.7,-0.3,  -0.3, 0.3+0.7, 0.3,  // v0-v5-v6-v1 up
     -0.3, 0.3+0.7, 0.3,  -0.3, 0.3+0.7,-0.3,  -0.3,-0.3+0.7,-0.3,  -0.3,-0.3+0.7, 0.3,  // v1-v6-v7-v2 left
     -0.3,-0.3+0.7,-0.3,   0.3,-0.3+0.7,-0.3,   0.3,-0.3+0.7, 0.3,  -0.3,-0.3+0.7, 0.3,  // v7-v4-v3-v2 down
      0.3,-0.3+0.7,-0.3,  -0.3,-0.3+0.7,-0.3,  -0.3, 0.3+0.7,-0.3,   0.3, 0.3+0.7,-0.3,   // v4-v7-v6-v5 back

      // 프로펠러
      2.0,  0.4,  1.0,  -2.0,  0.4,  1.0,  -2.0,  0.4,  0.7,   2.0,  0.4,  0.7,  // v0-v1-v2-v3 front
      2.0,  0.4,  1.0,   2.0,  0.4,  0.7,   2.0, -0.4,  0.7,   2.0, -0.4,  1.0,  // v0-v3-v4-v5 right
      2.0,  0.4,  1.0,   2.0, -0.4,  1.0,  -2.0, -0.4,  1.0,  -2.0,  0.4,  1.0,  // v0-v5-v6-v1 up
     -2.0,  0.4,  1.0,  -2.0, -0.4,  1.0,  -2.0, -0.4,  0.7,  -2.0,  0.4,  0.7,  // v1-v6-v7-v2 left
     -2.0, -0.4,  0.7,   2.0, -0.4,  0.7,   2.0,  0.4,  0.7,  -2.0,  0.4,  0.7,  // v7-v4-v3-v2 down
      2.0, -0.4,  0.7,  -2.0, -0.4,  0.7,  -2.0, -0.4,  1.0,  2.0, -0.4,  1.0,  // v4-v7-v6-v5 back

      // 바닥
      -5.0,  -5.0,  -5.0,
       5.0,  -5.0,  -5.0,
       5.0,   5.0,  -5.0,
      -5.0,   5.0,  -5.0,
  ]);

  var colors = new Float32Array([     // Colors
    0.4, 0.4, 1.0,  0.4, 0.4, 1.0,  0.4, 0.4, 1.0,  0.4, 0.4, 1.0,  // v0-v1-v2-v3 front(blue)
    0.4, 1.0, 0.4,  0.4, 1.0, 0.4,  0.4, 1.0, 0.4,  0.4, 1.0, 0.4,  // v0-v3-v4-v5 right(green)
    1.0, 0.4, 0.4,  1.0, 0.4, 0.4,  1.0, 0.4, 0.4,  1.0, 0.4, 0.4,  // v0-v5-v6-v1 up(red)
    1.0, 1.0, 0.4,  1.0, 1.0, 0.4,  1.0, 1.0, 0.4,  1.0, 1.0, 0.4,  // v1-v6-v7-v2 left
    1.0, 1.0, 1.0,  1.0, 1.0, 1.0,  1.0, 1.0, 1.0,  1.0, 1.0, 1.0,  // v7-v4-v3-v2 down
    0.4, 1.0, 1.0,  0.4, 1.0, 1.0,  0.4, 1.0, 1.0,  0.4, 1.0, 1.0,   // v4-v7-v6-v5 back 

    0.4, 0.4, 1.0,  0.4, 0.4, 1.0,  0.4, 0.4, 1.0,  0.4, 0.4, 1.0,  // v0-v1-v2-v3 front(blue)
    0.4, 1.0, 0.4,  0.4, 1.0, 0.4,  0.4, 1.0, 0.4,  0.4, 1.0, 0.4,  // v0-v3-v4-v5 right(green)
    0.0, 0.4, 0.4,  0.0, 0.4, 0.4,  0.0, 0.4, 0.4,  0.0, 0.4, 0.4,  // v0-v5-v6-v1 up(red)
    1.0, 1.0, 0.4,  1.0, 1.0, 0.4,  1.0, 1.0, 0.4,  1.0, 1.0, 0.4,  // v1-v6-v7-v2 left
    1.0, 1.0, 1.0,  1.0, 1.0, 1.0,  1.0, 1.0, 1.0,  1.0, 1.0, 1.0,  // v7-v4-v3-v2 down
    0.4, 1.0, 1.0,  0.4, 1.0, 1.0,  0.4, 1.0, 1.0,  0.4, 1.0, 1.0,   // v4-v7-v6-v5 back
 
    0.4, 0.4, 1.0,  0.4, 0.4, 1.0,  0.4, 0.4, 1.0,  0.4, 0.4, 1.0,  // v0-v1-v2-v3 front(blue)
    0.4, 1.0, 0.4,  0.4, 1.0, 0.4,  0.4, 1.0, 0.4,  0.4, 1.0, 0.4,  // v0-v3-v4-v5 right(green)
    1.0, 0.4, 0.4,  1.0, 0.4, 0.4,  1.0, 0.4, 0.4,  1.0, 0.4, 0.4,  // v0-v5-v6-v1 up(red)
    1.0, 1.0, 0.4,  1.0, 1.0, 0.4,  1.0, 1.0, 0.4,  1.0, 1.0, 0.4,  // v1-v6-v7-v2 left
    1.0, 1.0, 1.0,  1.0, 1.0, 1.0,  1.0, 1.0, 1.0,  1.0, 1.0, 1.0,  // v7-v4-v3-v2 down
    0.4, 1.0, 1.0,  0.4, 1.0, 1.0,  0.4, 1.0, 1.0,  0.4, 1.0, 1.0,  // v4-v7-v6-v5 back

    1.0, 0.0, 0.0,  1.0, 0.0, 2.0,  1.0, 1.0, 0.0,  0.0, 0.0, 1.0,
    1.0, 1.0, 1.0
  ]);

  // Indices of the vertices
  // 12개의 triangle을 정의
  var indices = new Uint8Array([
     0, 1, 2,   0, 2, 3,    // front
     4, 5, 6,   4, 6, 7,    // right
     8, 9,10,   8,10,11,    // up
    12,13,14,  12,14,15,    // left
    16,17,18,  16,18,19,    // down
    20,21,22,  20,22,23,     // back
 
     0+24, 1+24, 2+24,   0+24, 2+24, 3+24,    // front
     4+24, 5+24, 6+24,   4+24, 6+24, 7+24,    // right
     8+24, 9+24,10+24,   8+24,10+24,11+24,    // up
    12+24,13+24,14+24,  12+24,14+24,15+24,    // left
    16+24,17+24,18+24,  16+24,18+24,19+24,    // down
    20+24,21+24,22+24,  20+24,22+24,23+24,    // back

     0+48, 1+48, 2+48,   0+48, 2+48, 3+48,    // front
     4+48, 5+48, 6+48,   4+48, 6+48, 7+48,    // right
     8+48, 9+48,10+48,   8+48,10+48,11+48,    // up
    12+48,13+48,14+48,  12+48,14+48,15+48,    // left
    16+48,17+48,18+48,  16+48,18+48,19+48,    // down
    20+48,21+48,22+48,  20+48,22+48,23+48     // back
   ]); 

    var indexBuffer = gl.createBuffer();
    if (!indexBuffer) 
      return -1; 

    // Write the vertex coordinates and color to the buffer object
    if (!initArrayBuffer(gl, attribs, 3, gl.FLOAT, 'aPosition'))
      return -1; 

    if (!initArrayBuffer(gl, colors, 3, gl.FLOAT, 'aColor'))
      return -1;

    // Write the indices to the buffer object
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    return;
}

function initArrayBuffer(gl, data, num, type, attribute) {
    var buffer = gl.createBuffer();   // Create a buffer object
    if (!buffer) {
      console.log('Failed to create the buffer object');
      return false;
    }

    // Write date into the buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

    // Assign the buffer object to the attribute variable
    var a_attribute = gl.getAttribLocation(gl.program, attribute);
    if (a_attribute < 0) {
      console.log('Failed to get the storage location of ' + attribute);
      return false;
    }

    gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
    // Enable the assignment of the buffer object to the attribute variable
    gl.enableVertexAttribArray(a_attribute); 

    return true;
} 

function draw(gl,w,h,currentAngle,MVP,loc_MVP){
    //z축을 기준으로 currentAngle만큼 회전
    gl.clear(gl.COLOR_BUFFER_BIT); 

    //왼쪽 viewport
    gl.viewport(0, 0, w/2, h);

    // 움직이는 이벤트가 있을때만 그 값을 update해준다 
    if(change_trans_z){
      MVP.translate(0,0,current_tz);
      change_trans_z = false;
    }
    if(change_angle){
      MVP.rotate(bodyAngle,0,0,1);
      change_angle = false;      
    }
    if(change_trans_y){
      MVP.translate(0,current_ty,0);
      change_trans_y = false;
    } 

    gl.uniformMatrix4fv(loc_MVP, false, MVP.elements);

    //몸통
    gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_BYTE, 0);
    gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_BYTE, 36);

    // 프로펠러
    var p_modelMatrix = new Matrix4();
    p_modelMatrix.set(MVP);
    p_modelMatrix.rotate(currentAngle,0,0,1);
    gl.uniformMatrix4fv(loc_MVP,false,p_modelMatrix.elements);
    gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_BYTE, 72);

    // 바닥
    p_modelMatrix.setPerspective(30, w/(2*h), 1, 100);
    p_modelMatrix.lookAt(eye_x, eye_y, eye_z, look_x, look_y, look_z, 0, 1, 0);
    p_modelMatrix.translate(0,0,-1); 

    gl.uniformMatrix4fv(loc_MVP, false, p_modelMatrix.elements);
    gl.drawArrays(gl.TRIANGLE_FAN, 24*3, 4);
 

    //오른쪽 viewport ---------------
    gl.viewport(w/2, 0, w/2, h); 

    // 카메라는 object의 반대방향으로 계산 
    var camera = new Matrix4();
    camera.setPerspective(30, w/(2*h), 1, 100);
    camera.lookAt(0, 0, 13-c_current_tz, 0, 0, -5, 0, 1, 0);
    camera.rotate(c_bodyAngle,0,0,1);
    camera.translate(c_current_tx,c_current_ty,0); 

    gl.uniformMatrix4fv(loc_MVP, false, camera.elements);
    gl.drawArrays(gl.TRIANGLE_FAN, 24*3, 4); 

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