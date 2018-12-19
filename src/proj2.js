"use strict";
var SRC_VERT =
'attribute vec4	aPosition;\n'+
'uniform mat4	MVP;\n'+
'uniform mat4	MV;\n'+
'void main(){\n'+
'	gl_Position = MVP*aPosition;\n'+
'}\n'

var SRC_FRAG =
'#ifdef GL_ES\n'+
'precision mediump float;\n'+
'#endif\n'+
'uniform vec3	uColor;\n'+
'void main(){\n'+
'	gl_FragColor = vec4(uColor, 1);\n'+
'}\n'

var SRC_VERT_TEX =
'attribute vec4	aPosition;\n'+
'attribute vec2	aTexCoord;\n'+
'uniform mat4	MVP;\n'+
'uniform mat4	MV;\n'+
'varying vec2	vTexCoord;\n'+
'void main(){\n'+
'	gl_Position = MVP*aPosition;\n'+
'	vTexCoord = aTexCoord;\n'+
'}\n'

var SRC_FRAG_TEX =
'#ifdef GL_ES\n'+
'precision mediump float;\n'+
'#endif\n'+
'uniform vec3	uColor;\n'+
'varying vec2	vTexCoord;\n'+
'uniform sampler2D	uSampler;\n'+
'void main(){\n'+
'	gl_FragColor = texture2D(uSampler, vTexCoord);\n'+
'}\n'

// var SRC_VERT_GRID =
// 'attribute vec2	aPosition;\n'+
// 'attribute vec2	aTexCoord;\n'+
// 'uniform mat4	MVP;\n'+
// 'uniform mat4	MV;\n'+
// 'varying vec2	vTexCoord;\n'+
// 'void main(){\n'+
// '	gl_Position = MVP*vec4(aPosition,0,1);\n'+
// '	vTexCoord = aTexCoord;\n'+
// '}\n'


var ANGLE_STEP_ROTOR = 60.0;
var MAX_LIGHTS = 10;

function main()
{
	let canvas = document.getElementById('webgl');
	let gl = getWebGLContext(canvas);

	gl.enable(gl.DEPTH_TEST);
	gl.clearColor(0.1,0.1,0.1,1);

	let V = new Matrix4();
	V.setLookAt(3, -3, 2, 0, 0, 0, 0, 0, 1);

	let fov = 50;
	let P = new Matrix4();
	P.setPerspective(50, 1, 1, 100);

	let axes = new Axes(gl);

	let shader = new Shader(gl, SRC_VERT, SRC_FRAG, ["aPosition"]);
	let shader_grid = new Shader(gl, document.getElementById("SRC_VERT_GRID").text,
	document.getElementById("SRC_FRAG_GRID").text, ["aPosition", "aTexCoord"]);

	let shader_tex = new Shader(gl, SRC_VERT_TEX, SRC_FRAG_TEX, ["aPosition", "aTexCoord"]);

	let body = create_body(gl);
	body.M.setTranslate(0,0,1.0);

	let rotor = create_rotor(gl);

	let terrain = create_terrain(gl);

	document.getElementsByTagName("BODY")[0].onkeydown = function(ev) {
		switch(ev.key)
		{
			case 'ArrowUp':
				body.M.translate(0, .05, 0);
				break;
			case 'ArrowDown':
				body.M.translate(0, -.05, 0);
				break;
			case 'ArrowLeft':
				body.M.rotate(10, 0, 0, 1);
				break;
			case 'ArrowRight':
				body.M.rotate(-10, 0, 0, 1);
				break;
			case 'a':
			case 'A':
				body.M.translate(0, 0, .05);
				break;
			case 'z':
			case 'Z':
				body.M.translate(0, 0, -.05);
				break;
			case ' ':
				spawn_light(lights, body.M);
				break;
			case '=':
			case '+':
				fov = Math.max(fov-5, 5);
				break;
			case '-':
			case '_':
				fov = Math.min(fov+5, 120);
				break;
		}
	};

	let tex = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, tex);
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

	let img = new Image();
	img.onload = function()
	{
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
		tex_loaded = true;
	};

	// img.src = 'yorkville.jpg';
	img.src = 'sky.jpg';
	let tex_loaded = false;

	let textures = [];
	textures['u_Sampler'] = {texid:tex};

	var tick_init = function() {
		if(tex_loaded)
		{
			requestAnimationFrame(tick, canvas); // Request that the browser calls tick
		}
		else
		{
			requestAnimationFrame(tick_init, canvas); // Request that the browser calls tick
		}
	};

	let ball = create_mesh_sphere(gl,50);

	let t_last = Date.now();

	let angle_rotor = 0;

	let tick = function()
	{
		let now = Date.now();
		let elapsed = now - t_last;
		t_last = now;

		angle_rotor += ( (ANGLE_STEP_ROTOR * elapsed) / 1000.0) % 360.0;

		rotor.M.set(body.M);
		rotor.M.rotate(angle_rotor, 0, 0, 1);

		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		axes.render(gl, V, P);

		gl.useProgram(shader.h_prog);
		gl.uniform3f(gl.getUniformLocation(shader.h_prog, "uColor"), 1, .5, .5);
		body.render(gl, shader, null, null, V, P);

		gl.useProgram(shader.h_prog);
		gl.uniform3f(gl.getUniformLocation(shader.h_prog, "uColor"), .5, 1, .5);
		rotor.render(gl, shader, null, null, V, P);

		gl.useProgram(shader_grid.h_prog);
		gl.uniform3f(gl.getUniformLocation(shader_grid.h_prog, "uColor"), .5, 1, .5);
		ball.render(gl, shader_grid, null, null, V, P,textures);

		// gl.useProgram(shader.h_prog);
		// terrain.render(gl, shader_tex, null, null, V, P,textures);

		// requestAnimationFrame(tick, canvas); // Request that the browser calls tick


	};

	tick_init();
}



function create_rotor(gl)
{
	var verts = new Float32Array([
		   0,    0, .11,    0, 0, 1,
		-.05,  -.5, .11,    0, 0, 1,
		 .05,  -.5, .11,    0, 0, 1,

		   0,    0, .11,    0, 0, 1,
		 .05,   .5, .11,    0, 0, 1,
		-.05,   .5, .11,    0, 0, 1,

		   0,    0, .11,    0, 0, 1,
		 -.5,  .05, .11,    0, 0, 1,
		 -.5, -.05, .11,    0, 0, 1,

		   0,    0, .11,    0, 0, 1,
		  .5, -.05, .11,    0, 0, 1,
		  .5,  .05, .11,    0, 0, 1,
	]);

	var vbo = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
	gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);
	var FSIZE = verts.BYTES_PER_ELEMENT;
	var attribs = [];
	attribs["aPosition"] = {buffer:vbo, size:3, type:gl.FLOAT, normalized:false, stride:FSIZE*6, offset:0};
	attribs["aNormal"] = {buffer:vbo, size:3, type:gl.FLOAT, normalized:false, stride:FSIZE*6, offset:FSIZE*3};
	gl.bindBuffer(gl.ARRAY_BUFFER, null);
	return new Mesh(gl, "drawArrays", gl.TRIANGLES, verts.length / 6, attribs, -1, null);

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
	var verts = new Float32Array([
		 .1, .1, .1,    1, 0, 0,  // v0 White
		 .1,-.1, .1,    1, 0, 0,  // v3 Yellow
		 .1,-.1,-.1,    1, 0, 0,  // v4 Green

		 .1, .1, .1,    1, 0, 0,  // v0 White
		 .1,-.1,-.1,    1, 0, 0,  // v4 Green
		 .1, .1,-.1,    1, 0, 0,  // v5 Cyan

		 .1, .1, .1,    0, 1, 0,  // v0 White
		 .1, .1,-.1,    0, 1, 0,  // v5 Cyan
		-.1, .1,-.1,    0, 1, 0,  // v6 Blue

		 .1, .1, .1,    0, 1, 0,  // v0 White
		-.1, .1,-.1,    0, 1, 0,  // v6 Blue
		-.1, .1, .1,    0, 1, 0,  // v1 Magenta

		 .1, .1, .1,    0, 0, 1,  // v0 White
		-.1, .1, .1,    0, 0, 1,  // v1 Magenta
		-.1,-.1, .1,    0, 0, 1,  // v2 Red

		 .1, .1, .1,    0, 0, 1,  // v0 White
		-.1,-.1, .1,    0, 0, 1,  // v2 Red
		 .1,-.1, .1,    0, 0, 1,  // v3 Yellow

		-.1,-.1,-.1,   -1, 0, 0,  // v7 Black
		-.1,-.1, .1,   -1, 0, 0,  // v2 Red
		-.1, .1, .1,   -1, 0, 0,  // v1 Magenta

		-.1,-.1,-.1,   -1, 0, 0,  // v7 Black
		-.1, .1, .1,   -1, 0, 0,  // v1 Magenta
		-.1, .1,-.1,   -1, 0, 0,  // v6 Blue

		-.1,-.1,-.1,    0, 0,-1,  // v7 Black
		-.1, .1,-.1,    0, 0,-1,  // v6 Blue
		 .1, .1,-.1,    0, 0,-1,  // v5 Cyan

		-.1,-.1,-.1,    0, 0,-1,  // v7 Black
		 .1, .1,-.1,    0, 0,-1,  // v5 Cyan
		 .1,-.1,-.1,    0, 0,-1,  // v4 Green

		-.1,-.1,-.1,    0,-1, 0,  // v7 Black
		 .1,-.1,-.1,    0,-1, 0,  // v4 Green
		 .1,-.1, .1,    0,-1, 0,  // v3 Yellow

		-.1,-.1,-.1,    0,-1, 0,  // v7 Black
		 .1,-.1, .1,    0,-1, 0,  // v3 Yellow
		-.1,-.1, .1,    0,-1, 0,  // v2 Red

		 .05, .1-.2, .05,    1, 0, 0,  // v0 White
		 .05,-.1-.2, .05,    1, 0, 0,  // v3 Yellow
		 .05,-.1-.2,-.05,    1, 0, 0,  // v4 Green

		 .05, .1-.2, .05,    1, 0, 0,  // v0 White
		 .05,-.1-.2,-.05,    1, 0, 0,  // v4 Green
		 .05, .1-.2,-.05,    1, 0, 0,  // v5 Cyan

		 .05, .1-.2, .05,    0, 1, 0,  // v0 White
		 .05, .1-.2,-.05,    0, 1, 0,  // v5 Cyan
		-.05, .1-.2,-.05,    0, 1, 0,  // v6 Blue

		 .05, .1-.2, .05,    0, 1, 0,  // v0 White
		-.05, .1-.2,-.05,    0, 1, 0,  // v6 Blue
		-.05, .1-.2, .05,    0, 1, 0,  // v1 Magenta

		 .05, .1-.2, .05,    0, 0, 1,  // v0 White
		-.05, .1-.2, .05,    0, 0, 1,  // v1 Magenta
		-.05,-.1-.2, .05,    0, 0, 1,  // v2 Red

		 .05, .1-.2, .05,    0, 0, 1,  // v0 White
		-.05,-.1-.2, .05,    0, 0, 1,  // v2 Red
		 .05,-.1-.2, .05,    0, 0, 1,  // v3 Yellow

		-.05,-.1-.2,-.05,   -1, 0, 0,  // v7 Black
		-.05,-.1-.2, .05,   -1, 0, 0,  // v2 Red
		-.05, .1-.2, .05,   -1, 0, 0,  // v1 Magenta

		-.05,-.1-.2,-.05,   -1, 0, 0,  // v7 Black
		-.05, .1-.2, .05,   -1, 0, 0,  // v1 Magenta
		-.05, .1-.2,-.05,   -1, 0, 0,  // v6 Blue

		-.05,-.1-.2,-.05,    0, 0,-1,  // v7 Black
		-.05, .1-.2,-.05,    0, 0,-1,  // v6 Blue
		 .05, .1-.2,-.05,    0, 0,-1,  // v5 Cyan

		-.05,-.1-.2,-.05,    0, 0,-1,  // v7 Black
		 .05, .1-.2,-.05,    0, 0,-1,  // v5 Cyan
		 .05,-.1-.2,-.05,    0, 0,-1,  // v4 Green

		-.05,-.1-.2,-.05,    0,-1, 0,  // v7 Black
		 .05,-.1-.2,-.05,    0,-1, 0,  // v4 Green
		 .05,-.1-.2, .05,    0,-1, 0,  // v3 Yellow

		-.05,-.1-.2,-.05,    0,-1, 0,  // v7 Black
		 .05,-.1-.2, .05,    0,-1, 0,  // v3 Yellow
		-.05,-.1-.2, .05,    0,-1, 0,  // v2 Red

	]);

	var vbo = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
	gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);
	var FSIZE = verts.BYTES_PER_ELEMENT;
	var attribs = [];
	attribs["aPosition"] = {buffer:vbo, size:3, type:gl.FLOAT, normalized:false, stride:FSIZE*6, offset:0};
	attribs["aNormal"] = {buffer:vbo, size:3, type:gl.FLOAT, normalized:false, stride:FSIZE*6, offset:FSIZE*3};
	gl.bindBuffer(gl.ARRAY_BUFFER, null);
	return new Mesh(gl, "drawArrays", gl.TRIANGLES, 72, attribs, -1, null);
}

function create_mesh_sphere(gl, SPHERE_DIV)
{ // Create a sphere
	var i, ai, si, ci;
	var j, aj, sj, cj;
	var p1, p2;

	var positions = [];
	var indices = [];

	// Generate coordinates
	for (j = 0; j <= SPHERE_DIV; j++)
	{
		aj = j  / SPHERE_DIV;
		sj = aj * 4 - (4/2);
		cj = Math.cos(aj);
		for (i = 0; i <= SPHERE_DIV; i++)
		{
			ai = i  / SPHERE_DIV;
			si = ai * 4 - (4/2);
			ci = Math.cos(ai);

			positions.push(sj);  // X
			positions.push(si);       // Y
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
	attribs["aNormal"] = {buffer:buf_normal, size:3, type:gl.FLOAT, normalized:false, stride:0, offset:0};
	attribs["aTexCoord"] = {buffer:buf_position, size:2, type:gl.FLOAT, normalized:false, stride:0, offset:0};

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
