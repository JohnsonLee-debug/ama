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
	enable_hash_comment:0,
	symbols:'!== != && ++ -- -> ... .. :: << <= === == => >= >>> >> || <=> ** .* ->*',
	///////////
	parse_operators:1,
	parse_pointed_brackets:1,
	parse_scoped_statements:1,
	parse_colon_statements:1,
	parse_cpp11_lambda:1,
	parse_variable_declarations:1,
	parse_c_conditional:1,
	parse_labels:1,
	parse_air_object:1,
	parse_indent_as_scope:0,
	parse_c_forward_declarations:1,
	struct_can_be_type_prefix:1,
	///////////
	binary_operators:'||\n &&\n |\n ^\n &\n == != === !==\n < <= > >= in instanceof\n <=>\n << >> >>>\n + -\n * / %\n **\n as\n',
	prefix_operators:'++ -- ! ~ + - * & typeof void delete sizeof co_await new',
	postfix_operators:'++ --',
	//void is too common in C/C++ to be treated as an operator by default
	named_operators:'typeof delete sizeof co_await new in instanceof as',
	ambiguous_type_suffix:'* ** ^ & &&',
	///////////
	keywords_class:'class struct union namespace interface impl trait',
	keywords_statement:'enum if for while do try switch #if',
	keywords_extension_clause:'until else elif except catch finally while #elif #else',
	keywords_function:'extern function fn def',
	keywords_after_class_name:': extends implements for where',
	keywords_after_prototype:': -> => throw const noexcept override',
	keywords_not_a_function:'#define return',
	///////////
};

__global.extension_specific_options={
	'.py':Object.assign(Object.create(__global.default_options),{
		enable_hash_comment:1,
		parse_indent_as_scope:1
	})
}

__global.__PrepareOptions=function(filename,options){
	let pdot=filename.lastIndexOf('.');
	let proto=__global.extension_specific_options[filename.substr(pdot).toLowerCase()];
	if(proto){
		let ret=Object.create(proto);
		if(options){
			for(let key in options){
				ret[key]=options[key];
			}
		}
		return ret;
	}
	return options;
}

//mandatory zero termination, don't remove, don't add newline after this, don't remove the trailing nul byte 