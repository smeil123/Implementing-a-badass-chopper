class Shader{
	constructor(gl, src_vert, src_frag, attrib_names)
	{
		this.init(gl, src_vert, src_frag, attrib_names);
	}
	init(gl, src_vert, src_frag, attrib_names)
	{
		initShaders(gl, src_vert, src_frag);
		this.h_prog = gl.program;
		this.attribs = {};
		for(let attrib of attrib_names)
		{
			console.log(attrib)
			this.attribs[attrib] = gl.getAttribLocation(this.h_prog, attrib);
			console.log(this.attribs[attrib])
		}
	}
}


