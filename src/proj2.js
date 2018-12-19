"use strict";

var ANGLE_STEP = 45.0;

function main()
{
	var canvas = document.getElementById('webgl');
	var gl = getWebGLContext(canvas);

	gl.enable(gl.DEPTH_TEST);
	gl.clearColor(0.2,0.2,0.2,1.0);

	var V = new Matrix4();
	V.setLookAt(3, 2, 3, 0, 0, 0, 0, 0, 1);


	//fov수정
	var fov = 50;
	var P = new Matrix4();
	P.setPerspective(55, 1, 1, 200);

	//axes 삭제
	var axes = new Axes(gl);

	var chopper_shader = new Shader(gl,
		document.getElementById("SRC_VERT").text,
		document.getElementById("SRC_FRAG").text, 
		["aPosition","aColor"]);

	var grid_shader = new Shader(gl, 
		document.getElementById("SRC_VERT_GRID").text,
		document.getElementById("SRC_FRAG_GRID").text, 
		["aPosition", "aTexCoord"]);

	// var shader_tex = new Shader(gl, SRC_VERT_TEX, SRC_FRAG_TEX, ["aPosition", "aTexCoord"]);

	var body = create_body(gl);
	body.M.setTranslate(0,0,1.0);

	var rotor = create_propeller(gl);
	var terrain = create_mesh_sphere(gl,100);

	var isShift = false;

	document.getElementsByTagName("BODY")[0].onkeyup = function(ev) {
		switch(ev.key)
		{
			case 'Shift':
				isShift = false;
				break;
		}
	}
	var c_current_ty = 0.0;
	var c_current_tx = 0.0;

	document.getElementsByTagName("BODY")[0].onkeydown = function(ev) {
		console.log(ev.key);
		switch(ev.key)
		{
			case 'ArrowUp':
				if(isShift){
				}
				else{
					body.M.translate(0, .05, 0);
				}
				break;
			case 'ArrowDown':
				if(isShift){
					
				}
				else{
					body.M.translate(0, -.05, 0);
				}				
				break;
			case 'ArrowLeft':
				if(isShift){
					c_current_ty = Math.cos(10*Math.PI/180)*0.05;
    				c_current_tx = Math.sin(10*Math.PI/180)*0.05; 
    				// P.rotate(10*Math.PI/180,0,0,1);
    				P.translate(c_current_ty,c_current_tx,0);

					// P.lookAt(1, 0, 0, 0, 0, -5, 0, 1, 0);
				}
				else{
					body.M.rotate(-10, 0, 0, 1);
				}				
				break;
			case 'ArrowRight':
				if(isShift){
					c_current_ty = -Math.cos(10*Math.PI/180)*0.05;
    				c_current_tx = -Math.sin(10*Math.PI/180)*0.05; 
    				// P.rotate(-10*Math.PI/180,0,0,1);
					P.translate(c_current_ty,c_current_tx,0);
    				

					// P.lookAt(-1, 0, 0, 0, 0, -5, 0, 1, 0);
				}
				else{
					body.M.rotate(10, 0, 0, 1);
				}				
				break;
			case 'a':
				body.M.translate(0, 0, .05);
				break;
			case 'A':
				body.M.translate(0, 0, .05);
				break;
			case 'z':
				body.M.translate(0, 0, -.05);
				break;
			case 'Z':
				body.M.translate(0, 0, -.05);
				break;
			case '=':
			//확대
				// fov = Math.max(fov-5, 5);
				P.lookAt(0, 0, -0.1, 0, 0, -5, 0, 1, 0);
				break;
			case '+':
			//확대
				// fov = Math.max(fov-5, 5);
				P.lookAt(0, 0, -0.1, 0, 0, -5, 0, 1, 0);
				break;
			case '-':
			//축소
				// fov = Math.min(fov+5, 120);
				P.lookAt(0, 0, 0.1, 0, 0, -5, 0, 1, 0);
				break;
			case '_':
			//축소
				// fov = Math.min(fov+5, 120);
				P.lookAt(0, 0, 0.1, 0, 0, -5, 0, 1, 0);
				break;
			case 'Shift':
				isShift = true;
				break;

		}
	};
	//P.translate(0.01,0,0);

	var texture = gl.createTexture();
	if (!texture) {
  		console.log('Failed to create the texture object');
    	return false;
  	}
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

	var image = new Image();
	if (!image) {
	    console.log('Failed to create the image object');
	    return false;
	 }
	image.onload = function()
	{
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
	};

	image.src = 'yorkville.jpg';

	var textures = [];
	textures['uSampler'] = {texid:texture};	

	var list_lights = 
	[
		new Light
		(
			gl,
			[1.0, 1.0, 1.0, 1.0],	// position
			[0.6, 0.3, 0.1, 1.0],	// ambient
			[0.3, 0.5, 1.0, 1.0],	// diffusive
			[1.0, 1.0, 1.0, 1.0],	// specular
			false
		),
		new Light
		(
			gl,
			[0.0, 3.0, 3.0, 1.0],
			[0.5, 0.2, 0.0, 1.0],
			[0.5, 0.2, 0.0, 1.0],
			[1.0, 1.0, 1.0, 1.0],
			false
		)
	];

	var t_last = Date.now();

	var angle_rotor = 0;

	var tick = function()
	{
		var now = Date.now();
		var elapsed = now - t_last;
		t_last = now;

		angle_rotor += ( (ANGLE_STEP * elapsed) / 1000.0) % 360.0;

		// list_lights[0].M.rotate(( (ANGLE_STEP * elapsed) / 1000.0) % 360.0, 0, 0, 1);

		rotor.M.set(body.M);
		rotor.M.rotate(angle_rotor, 0, 0, 1);

		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		axes.render(gl, V, P);

		gl.useProgram(chopper_shader.h_prog);
		// gl.uniform3f(gl.getUniformLocation(chopper_shader.h_prog, "uColor"), 1, .5, .5);
		body.render(gl, chopper_shader, null, null, V, P);

		gl.useProgram(chopper_shader.h_prog);
		// gl.uniform3f(gl.getUniformLocation(chopper_shader.h_prog, "uColor"), .5, 1, .5);
		rotor.render(gl, chopper_shader, null, null, V, P);

		
		//움직이는 불빛
		// list_lights[0].turn_on(true);
		// list_lights[0].set_type(true);
		// list_lights[0].render(gl, V, P);

		// 고정된 불빛
		list_lights[1].turn_on(true);
		list_lights[1].set_type(true);
		list_lights[1].render(gl, V, P);

		gl.useProgram(grid_shader.h_prog);
		// gl.uniform3f(gl.getUniformLocation(grid_shader.h_prog, "uColor"), .5, 1, .5);
		// gl, shader, lights, material, V, P, textures
		terrain.render(gl, grid_shader, list_lights, __js_materials["bronze"], V, P,textures);

		requestAnimationFrame(tick, canvas); // Request that the browser calls tick
	};

	tick();
}



function create_propeller(gl)
{
	var body = new Float32Array([
		0.4,  0.01,  0.12,  -0.4,  0.01,  0.12,  -0.4,  0.01,  0.1,   0.4,  0.01,  0.1,  // v0-v1-v2-v3 front
      	0.4,  0.01,  0.12,   0.4,  0.01,  0.1,   0.4, -0.01,  0.1,   0.4, -0.01,  0.12,  // v0-v3-v4-v5 right
      	0.4,  0.01,  0.12,   0.4, -0.01,  0.12,  -0.4, -0.01,  0.12,  -0.4,  0.01,  0.12,  // v0-v5-v6-v1 up
    	-0.4,  0.01,  0.12,  -0.4, -0.01,  0.12,  -0.4, -0.01,  0.1,  -0.4,  0.01,  0.1,  // v1-v6-v7-v2 left
        -0.4, -0.01,  0.1,   0.4, -0.01,  0.1,   0.4,  0.01,  0.1,  -0.4,  0.01,  0.1,  // v7-v4-v3-v2 down
      	0.4, -0.01,  0.1,  -0.4, -0.01,  0.1,  -0.4, -0.01,  0.12,  0.4, -0.01,  0.12,  // v4-v7-v6-v5 back

      	0.01,  0.4,  0.12,  -0.01,  0.4,  0.12,  -0.01,  0.4,  0.1,   0.01,  0.4,  0.1,  // v0-v1-v2-v3 front
      	0.01,  0.4,  0.12,   0.01,  0.4,  0.1,   0.01, -0.4,  0.1,   0.01, -0.4,  0.12,  // v0-v3-v4-v5 right
      	0.01,  0.4,  0.12,   0.01, -0.4,  0.12,  -0.01, -0.4,  0.12,  -0.01,  0.4,  0.12,  // v0-v5-v6-v1 up
    	-0.01,  0.4,  0.12,  -0.01, -0.4,  0.12,  -0.01, -0.4,  0.1,  -0.01,  0.4,  0.1,  // v1-v6-v7-v2 left
        -0.01, -0.4,  0.1,   0.01, -0.4,  0.1,   0.01,  0.4,  0.1,  -0.01,  0.4,  0.1,  // v7-v4-v3-v2 down
      	0.01, -0.4,  0.1,  -0.01, -0.4,  0.1,  -0.01, -0.4,  0.12,  0.01, -0.4,  0.12,  // v4-v7-v6-v5 back
	]);

	var colors = new Float32Array([     // Colors

	    0.4, 0.4, 1.0,  0.4, 0.4, 1.0,  0.4, 0.4, 1.0,  0.4, 0.4, 1.0,  // v0-v1-v2-v3 front(blue)
	    0.4, 1.0, 0.4,  0.4, 1.0, 0.4,  0.4, 1.0, 0.4,  0.4, 1.0, 0.4,  // v0-v3-v4-v5 right(green)
	    1.0, 0.4, 0.4,  1.0, 0.4, 0.4,  1.0, 0.4, 0.4,  1.0, 0.4, 0.4,  // v0-v5-v6-v1 up(red)
	    1.0, 1.0, 0.4,  1.0, 1.0, 0.4,  1.0, 1.0, 0.4,  1.0, 1.0, 0.4,  // v1-v6-v7-v2 left
	    1.0, 1.0, 1.0,  1.0, 1.0, 1.0,  1.0, 1.0, 1.0,  1.0, 1.0, 1.0,  // v7-v4-v3-v2 down
	    0.4, 1.0, 1.0,  0.4, 1.0, 1.0,  0.4, 1.0, 1.0,  0.4, 1.0, 1.0,  // v4-v7-v6-v5 back

	    0.4, 0.4, 1.0,  0.4, 0.4, 1.0,  0.4, 0.4, 1.0,  0.4, 0.4, 1.0,  // v0-v1-v2-v3 front(blue)
	    0.4, 1.0, 0.4,  0.4, 1.0, 0.4,  0.4, 1.0, 0.4,  0.4, 1.0, 0.4,  // v0-v3-v4-v5 right(green)
	    1.0, 0.4, 0.4,  1.0, 0.4, 0.4,  1.0, 0.4, 0.4,  1.0, 0.4, 0.4,  // v0-v5-v6-v1 up(red)
	    1.0, 1.0, 0.4,  1.0, 1.0, 0.4,  1.0, 1.0, 0.4,  1.0, 1.0, 0.4,  // v1-v6-v7-v2 left
	    1.0, 1.0, 1.0,  1.0, 1.0, 1.0,  1.0, 1.0, 1.0,  1.0, 1.0, 1.0,  // v7-v4-v3-v2 down
	    0.4, 1.0, 1.0,  0.4, 1.0, 1.0,  0.4, 1.0, 1.0,  0.4, 1.0, 1.0,  // v4-v7-v6-v5 back

  	]);

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
    ]);

	var buf_position = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, buf_position);
	gl.bufferData(gl.ARRAY_BUFFER, body, gl.STATIC_DRAW);

	var buf_color = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, buf_color);
	gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);

	gl.bindBuffer(gl.ARRAY_BUFFER, null);

	var attribs = [];
	attribs["aPosition"] = {buffer:buf_position, size:3, type:gl.FLOAT, normalized:false, stride:0, offset:0};
	attribs["aColor"] = {buffer:buf_color, size:3, type:gl.FLOAT, normalized:false, stride:0, offset:0};

	var indexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);	
	
	return new Mesh(gl, "drawElements", gl.TRIANGLES, indices.length, attribs, indexBuffer, gl.UNSIGNED_BYTE);
}


function create_body(gl) {
    // Create a cube
    //    v6----- v5
    //   /|      /|
    //  v1------v0|
    //  | |     | |
    //  | |v7---|-|v4
    //  |/      |/
    //  v2------v3
	var body = new Float32Array([
		//헬리콥터
	    0.1, 0.1, 0.1,  -0.1, 0.1, 0.1,  -0.1,-0.1, 0.1,   0.1,-0.1, 0.1,  // v0-v1-v2-v3 front
	    0.1, 0.1, 0.1,   0.1,-0.1, 0.1,   0.1,-0.1,-0.1,   0.1, 0.1,-0.1,  // v0-v3-v4-v5 right
	    0.1, 0.1, 0.1,   0.1, 0.1,-0.1,  -0.1, 0.1,-0.1,  -0.1, 0.1, 0.1,  // v0-v5-v6-v1 up
	    -0.1, 0.1, 0.1,  -0.1, 0.1,-0.1,  -0.1,-0.1,-0.1,  -0.1,-0.1, 0.1,  // v1-v6-v7-v2 left
	    -0.1,-0.1,-0.1,   0.1,-0.1,-0.1,   0.1,-0.1, 0.1,  -0.1,-0.1, 0.1,  // v7-v4-v3-v2 down
	    0.1,-0.1,-0.1,  -0.1,-0.1,-0.1,  -0.1, 0.1,-0.1,   0.1, 0.1,-0.1,   // v4-v7-v6-v5 back 

	    //헬리콥터 앞부분
	    0.07, 0.07+0.1, 0.07,  -0.07, 0.07+0.1, 0.07,  -0.07,-0.07+0.1, 0.07,   0.07,-0.07+0.1, 0.07,  // v0-v1-v2-v07 front
	    0.07, 0.07+0.1, 0.07,   0.07,-0.07+0.1, 0.07,   0.07,-0.07+0.1,-0.07,   0.07, 0.07+0.1,-0.07,  // v0-v07-v4-v5 right
	    0.07, 0.07+0.1, 0.07,   0.07, 0.07+0.1,-0.07,  -0.07, 0.07+0.1,-0.07,  -0.07, 0.07+0.1, 0.07,  // v0-v5-v6-v1 up
	    -0.07, 0.07+0.1, 0.07,  -0.07, 0.07+0.1,-0.07,  -0.07,-0.07+0.1,-0.07,  -0.07,-0.07+0.1, 0.07,  // v1-v6-v7-v2 left
	    -0.07,-0.07+0.1,-0.07,   0.07,-0.07+0.1,-0.07,   0.07,-0.07+0.1, 0.07,  -0.07,-0.07+0.1, 0.07,  // v7-v4-v07-v2 down
	    0.07,-0.07+0.1,-0.07,  -0.07,-0.07+0.1,-0.07,  -0.07, 0.07+0.1,-0.07,   0.07, 0.07+0.1,-0.07   // v4-v7-v6-v5 back

	]);

	var colors = new Float32Array([     
		// Colors
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
	    0.4, 1.0, 1.0,  0.4, 1.0, 1.0,  0.4, 1.0, 1.0,  0.4, 1.0, 1.0   // v4-v7-v6-v5 back 
    ]);

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
    	20+24,21+24,22+24,  20+24,22+24,23+24    // back

	]); 

	var buf_position = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, buf_position);
	gl.bufferData(gl.ARRAY_BUFFER, body, gl.STATIC_DRAW);

	var buf_color = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, buf_color);
	gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);

	gl.bindBuffer(gl.ARRAY_BUFFER, null);

	var attribs = [];
	attribs["aPosition"] = {buffer:buf_position, size:3, type:gl.FLOAT, normalized:false, stride:0, offset:0};
	attribs["aColor"] = {buffer:buf_color, size:3, type:gl.FLOAT, normalized:false, stride:0, offset:0};

	var indexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);	
	
	return new Mesh(gl, "drawElements", gl.TRIANGLES, indices.length, attribs, indexBuffer, gl.UNSIGNED_BYTE);
}

function create_mesh_sphere(gl, SPHERE_DIV)
{ // Create a sphere
	var i, ai, si, ci;
	var j, aj, sj, cj;
	var p1, p2;

	var positions = [];
	var indices = [];
	var texture_position = [];
	var texture_indices = [];

	// Generate coordinates
	for (j = 0; j <= SPHERE_DIV; j++)
	{
		aj = j  / SPHERE_DIV;
		sj = aj * 4 - (4/2);
		cj = aj  - (1/2);
		for (i = 0; i <= SPHERE_DIV; i++)
		{
			ai = i  / SPHERE_DIV;
			si = ai * 4 - (4/2);
			ci = ai - (1/2);

			positions.push(sj);  // X
			positions.push(si);       // Y

			texture_position.push(cj);
			texture_position.push(ci);
			// positions.push(0);  // Z
		}
	}

	// Generate indices
	for (j = 0; j < SPHERE_DIV; j++)
	{
		for (i = 0; i < SPHERE_DIV; i++)
		{
			p1 = j * (SPHERE_DIV+1) + i;
			p2 = p1 + (SPHERE_DIV+1);

			indices.push(p1);
			indices.push(p2);
			indices.push(p1 + 1);

			indices.push(p1 + 1);
			indices.push(p2);
			indices.push(p2 + 1);
		}
	}


	var verts = new Float32Array([
		0, 0, 1, 0, 1, 1, 0, 1,
	]);

	var vbo = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texture_position), gl.STATIC_DRAW);

	var buf_position = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, buf_position);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

	var buf_normal = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, buf_normal);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

	gl.bindBuffer(gl.ARRAY_BUFFER, null);

	var attribs = [];
	var FSIZE = positions.BYTES_PER_ELEMENT;
//
	attribs["aPosition"] = {buffer:buf_position, size:2, type:gl.FLOAT, normalized:false, stride:0, offset:0};
	// attribs["aNormal"] = {buffer:buf_position, size:2, type:gl.FLOAT, normalized:false, stride:0, offset:0};
	attribs["aTexCoord"] = {buffer:vbo, size:2, type:gl.FLOAT, normalized:false, stride:0, offset:0};

	var buf_index = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buf_index);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

	return new Mesh(gl, "drawElements", gl.TRIANGLES, indices.length, attribs, buf_index, gl.UNSIGNED_SHORT);
}


function create_terrain(gl)
{
	var verts = new Float32Array([
		-2, -2, 0,  0, 0,
		 2, -2, 0,  1, 0,
		 2,  2, 0,  1, 1,
		-2,  2, 0,  0, 1,
	]);

	var vbo = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
	gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);
	var FSIZE = verts.BYTES_PER_ELEMENT;
	var attribs = [];
	attribs["aPosition"] = {buffer:vbo, size:3, type:gl.FLOAT, normalized:false, stride:FSIZE*5, offset:0};
	attribs["aTexCoord"] = {buffer:vbo, size:2, type:gl.FLOAT, normalized:false, stride:FSIZE*5, offset:FSIZE*3};
	gl.bindBuffer(gl.ARRAY_BUFFER, null);
	return new Mesh(gl, "drawArrays", gl.TRIANGLE_FAN, verts.length / 5, attribs, -1, null);

}
