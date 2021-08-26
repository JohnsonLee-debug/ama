Node.setFlags=function(flags){
	this.flags=flags;
	return this;
}

Node.setData=function(data){
	this.data=data;
	return this;
}

Node.setCommentsBefore=function(comments_before){
	this.comments_before=comments_before;
	return this;
}

Node.setCommentsAfter=function(comments_after){
	this.comments_after=comments_after;
	return this;
}

Node.call=function(...args){
	return nCall.apply(null,[this].concat(args));
}

Node.enclose=function(s_brackets){
	return nRaw(this).setFlags((s_brackets.charCodeAt(0)&0xff)|(s_brackets.charCodeAt(1)&0xff)<<8)
}

Node.then=function(f,...args){
	let ret=f.apply(null,[this].concat(args));
	if(ret===undefined){
		ret=this;
	}
	return ret;
}

Node.toJSON=function(){
	let children=[];
	for(let ndi=this.c;ndi;ndi=ndi.s){
		children.push(ndi);
	}
	return {
		"[node_class]":__node_class_names[this.node_class],
		data:this.data||undefined,
		flags:this.flags||undefined,
		indent_level:this.indent_level||undefined,
		comments_before:this.comments_before||undefined,
		comments_after:this.comments_after||undefined,
		"[children]":children,
	}
}

__global.c_include_paths=['/usr/include','/usr/local/include']
__global.default_options={
	symbols:'!== != && ++ -- -> ... .. :: << <= === == => >= >>> >> || <=> ** .* ->*',
	///////////
	parse_operators:1,
	binary_operators:'||\n &&\n |\n ^\n &\n == != === !==\n < <= > >= in instanceof\n <=>\n << >> >>>\n + -\n * / %\n **\n as\n',
	prefix_operators:'++ -- ! ~ + - * & typeof void delete sizeof co_await new',
	postfix_operators:'++ --',
	//void is too common in C/C++ to be treated as an operator by default
	named_operators:'typeof delete sizeof co_await new in instanceof as',
	///////////
};

//mandatory zero termination 