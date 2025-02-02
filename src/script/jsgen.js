'use strict'
const path = require('path');

function Generate(version,nd_root) {
	let nd_node_jch = undefined;
	let code_func = [];
	let code = [];
	require('class');
	nd_node_jch=require('depends').LoadFile(path.resolve(__dirname, '../ast/node.hpp'));
	code_func.push('namespace ama{\n');
	let class_name = 'Node';
	let class_full_name = 'ama::Node';
	let classid = 'ama::g_node_classid';
	let proto = 'ama::g_node_proto';
	function ClassifyType(nd_type) {
		let s_src = nd_type.toSource();
		if( s_src.indexOf('Node') >= 0 ) {
			if( s_src.indexOf('[') >= 0||s_src.indexOf('vector<') >= 0 ) {
				return 'Node[]';
			} else {
				return 'Node';
			}
		} else if( s_src.indexOf('unique_string') >= 0 ) {
			return 'string^';
		} else if( s_src.indexOf('gcstring') >= 0 ) {
			return 'string';
		} else if( s_src.indexOf('std::string') >= 0 || s_src.indexOf('std::span<char') >= 0 || s_src.indexOf('array_base<char') >= 0 ) {
			return 'string';
		} else if( s_src.indexOf('char[') >= 0 ) {
			if( s_src.indexOf('^') >= 0 || s_src.indexOf('[|]') >= 0 ) {
				return 'string^';
			} else {
				return 'string';
			}
		} else if( s_src.indexOf('char*') >= 0 ) {
			return 'charptr';
		} else if( s_src.indexOf('void*') >= 0 ) {
			return 'void*';
		} else if( s_src.indexOf('JSValue') >= 0 ) {
			return 'JSValue';
		} else if( s_src.indexOf('float') >= 0 || s_src.indexOf('double') >= 0 ) {
			return 'float';
		} else {
			return 'int';
		}
	}
	function WrapValue(nd_type, jc_expr) {
		let s_type = ClassifyType(nd_type);
		if( s_type === 'Node' ) {
			return ['ama::WrapNode(', jc_expr, ')'].join('');
		} else if( s_type === 'void*' ) {
			return ['ama::WrapPointer(', jc_expr, ')'].join('');
		} else if( s_type === 'Node[]' ) {
			return ['ama::WrapNodeArray(', jc_expr, ')'].join('');
		} else if( s_type === 'string' ) {
			return ['ama::WrapString(', jc_expr, ')'].join('');
		} else if( s_type === 'string^' ) {
			return ['ama::WrapStringNullable(', jc_expr, ')'].join('');
		} else if( s_type === 'charptr' ) {
			return ['JS_NewString(jsctx,', jc_expr, ')'].join('');
		} else if( s_type === 'int' ) {
			//we don't have i64 in Node
			return ['JS_NewInt32(jsctx,', jc_expr, ')'].join('');
		} else if( s_type === 'float' ) {
			return ['JS_NewFloat64(jsctx,', jc_expr, ')'].join('');
		} else if( s_type === 'JSValue' ) {
			return jc_expr;
		} else {
			throw new Error('bad type ' + s_type);
		}
	}
	let res_counter = 0;
	function UnwrapValue(nd_type, js_value) {
		let ret = {
			validation: '',
			jc_expr: ''
		};
		let s_type = ClassifyType(nd_type);
		if( s_type === 'Node' ) {
			//we don't validate here: if it's not a node, we DO want a null
			ret.jc_expr = ['ama::UnwrapNode(', js_value, ')'].join('');
		} else if( s_type === 'void*' ) {
			ret.jc_expr = ['ama::UnwrapPointer(', js_value, ')'].join('');
		} else if( s_type === 'Node[]' ) {
			ret.validation = [
				'if(!JS_IsArray(', js_value, ')){return JS_ThrowTypeError(jsctx, "array expected for `', js_value, '`");}'
			].join('');
			ret.jc_expr = ['ama::UnwrapNodeArray(', js_value, ')'].join('');
		} else if( s_type === 'string' || s_type === 'string^' ) {
			ret.validation = [
				'if(!JS_IsString(', js_value, ')){return JS_ThrowTypeError(jsctx, "string expected for `', js_value, '`");}'
			].join('');
			//TODO: replace UnwrapString with sth cheaper
			ret.jc_expr = [nd_type.toSource().indexOf('[+]') >= 0 ? 'ama::UnwrapStringResizable(' : 'ama::UnwrapString(', js_value, ')'].join('');
		} else if( s_type === 'charptr' ) {
			ret.validation = [
				'if(!JS_IsString(', js_value, ')){return JS_ThrowTypeError(jsctx, "string expected for `', js_value, '`");}'
			].join('');
			ret.jc_expr = ['JS_ToCString(jsctx, ', js_value, ')'].join('');
		} else if( s_type === 'JSValue' ) {
			ret.validation = '';
			ret.jc_expr = js_value;
		} else if( s_type === 'int' ) {
			//we don't have i64 in Node
			ret.validation = [
				'int32_t res', res_counter, '=0;',
				'if(JS_ToInt32(jsctx, &res', res_counter, ', ', js_value, ')<0){return JS_ThrowTypeError(jsctx, "int expected for `', js_value, '`");}'
			].join('');
			ret.jc_expr = 'res' + res_counter.toString();
			res_counter += 1;
		} else if( s_type === 'float' ) {
			//we don't have i64 in Node
			ret.validation = [
				'double res', res_counter, '=0.0;',
				'if(JS_ToFloat64(jsctx, &res', res_counter, ', ', js_value, ')<0){return JS_ThrowTypeError(jsctx, "float expected for `', js_value, '`");}'
			].join('');
			ret.jc_expr = 'res' + res_counter.toString();
			res_counter += 1;
		} else {
			throw new Error('bad type ' + s_type);
		}
		return ret;
	}
	let properties=[];
	let methods=[];
	//console.log(JSON.stringify(nd_node_jch,null,1))
	const typing=require('cpp/typing');
	let class_desc = nd_node_jch.Find(N_CLASS,'Node').ParseClass();
	for(let ppt of class_desc.properties){
		if(ppt.enumerable){
			let nd_ref=ppt.node;
			properties.push({
				name:nd_ref.data,
				type:typing.ComputeType(nd_ref)
			})
		}
		if(ppt.kind==='method'){
			if( ppt.name === 'CloneEx' || ppt.name === 'CloneCB' || ppt.name === 'forEach' ) {
				continue;
			}
			let nd_func=ppt.node;
			methods.push({
				name:nd_func.data,
				paramlist:nd_func.c.s,
				return_type:typing.ComputeReturnType(nd_func)
			});
		}
	}
	for(let ppt of properties){
		let nd_type = ppt.type;
		let unwrap_code = UnwrapValue(nd_type, 'val');
		//all fields are nullable
		//nd_type.toSource().indexOf('?')>=0
		if( unwrap_code.validation && ClassifyType(nd_type) !== 'int' && ClassifyType(nd_type) !== 'float' ) {
			//it's nullable, hack the null case
			unwrap_code.validation = [
				'if(JS_IsNull(val)||JS_IsUndefined(val)){',
				(
					'nd->' + ppt.name
				),
				'="";',
				'}else{',
				unwrap_code.validation
			].join('');
			unwrap_code.jc_expr = unwrap_code.jc_expr + ';}';
		}
		code_func.push(
			'auto ', class_name, 'Get_', ppt.name, '(JSContext*+ jsctx, JSValueConst this_val){',
			'auto nd=(', class_full_name, '*)(JS_GetOpaque(this_val, ', classid, '));',
			'return ', WrapValue(nd_type, 'nd->' + ppt.name), ';',
			'}',
			'auto ', class_name, 'Set_', ppt.name, '(JSContext*+ jsctx, JSValueConst this_val, JSValueConst val){',
			'auto nd=(', class_full_name, '*)(JS_GetOpaque(this_val, ', classid, '));',
			unwrap_code.validation
		);
		if( ppt.name === 'sys_flags' || ppt.name === 'node_class' ) {
			code_func.push(
				'nd->' + ppt.name, '=(', nd_type.toSource(), ')(', unwrap_code.jc_expr, ')', ';'
			);
		} else {
			code_func.push(
				'nd->' + ppt.name, '=', unwrap_code.jc_expr, ';'
			);
		}
		code_func.push(
			'return JS_UNDEFINED;',
			'}'
		);
		code.push(
			'JS_DefinePropertyGetSet(jsctx,',
			proto, ',',
			//we don't plan to free these atoms
			'JS_NewAtom(jsctx,', JSON.stringify(ppt.name), '),',
			'JS_NewCFunction2(jsctx,(JSCFunction*+)(', class_name, 'Get_', ppt.name, '),"get_', ppt.name, '",0,JS_CFUNC_getter,0),',
			'JS_NewCFunction2(jsctx,(JSCFunction*+)(', class_name, 'Set_', ppt.name, '),"set_', ppt.name, '",1,JS_CFUNC_setter,0),',
			'JS_PROP_C_W_E',
			');\n'
		);
	}
	for(let method_i of methods){
		if( method_i.name === 'CloneEx' || method_i.name === 'CloneCB' ) {
			continue;
		}
		if( method_i.name === '__init__' || method_i.name === '__done__' ) {
			continue;
		}
		let nd_ret_type = method_i.return_type;
		code_func.push(
			'JSValue ', class_name, 'Call_', method_i.name, '(JSContext*+ jsctx, JSValueConst this_val, int argc, JSValueConst*+ argv){',
			class_full_name, '*+ nd=(', class_full_name, '*+)(JS_GetOpaque(this_val, ', classid, '));'
		);
		if( class_name === 'Node' ) {
			if( method_i.name === 'Insert' ) {
				code_func.push('if(nd==NULL){return JS_ThrowTypeError(jsctx, "cannot insert at a null node");}');
				code_func.push('if(JS_IsNull(argv[1])||JS_IsUndefined(argv[1])){return JS_ThrowTypeError(jsctx, "cannot insert a null node");}');
			}
		}
		let nd_paramlist = method_i.paramlist;
		let code_call = ['nd->', method_i.name, '('];
		//translate argv, skip the JC this
		let i = 0;
		for(let ndi = nd_paramlist.c; ndi; ndi = ndi.s) {
			let nd_def = ndi.c;
			nd_def=nd_def.FindAll(N_REF,null).filter(nd=>nd.flags&REF_DECLARED)[0];
			if( nd_def.GetName() === 'this' ) {
				continue;
			}
			let nd_type=undefined;
			const typing=require('cpp/typing');
			nd_type=typing.ComputeType(nd_def);
			//if(version!=='jc'){
			//	console.log(ClassifyType(nd_type),nd_type.toSource(),nd_def.data);
			//}
			let unwrap_code = UnwrapValue(nd_type, '(' + i.toString() + '<argc?argv[' + i.toString() + 'L]:JS_UNDEFINED)');
			if( ClassifyType(nd_type) !== 'int' && ClassifyType(nd_type) !== 'float' && unwrap_code.validation ) {
				//it's nullable, hack the null case
				code_func.push(
					'if(argc>', i.toString(), '&&!JS_IsNull(argv[', i.toString(), 'L])){',
					unwrap_code.validation,
					'}'
				);
				unwrap_code.jc_expr = ['argc>', i.toString(), '&&!JS_IsNull(argv[', i.toString(), 'L])?', unwrap_code.jc_expr, ':""'].join('');
			} else {
				code_func.push(unwrap_code.validation);
			}
			if( i ) {
				code_call.push(',');
			}
			code_call.push(unwrap_code.jc_expr);
			i += 1;
		}
		code_call.push(')');
		let s_call = code_call.join('');
		//wrap the return value 
		let nd_ret_type_stripped=nd_ret_type;
		if( nd_ret_type && !(new Set(['auto', 'void'])).has(nd_ret_type_stripped.toSource()) ) {
			code_func.push('return ', WrapValue(nd_ret_type, s_call), ';');
		} else {
			code_func.push(s_call, '; return JS_UNDEFINED;');
		}
		code_func.push(
			'}'
		);
		code.push(
			'JS_SetPropertyStr(jsctx,', proto, ',', JSON.stringify(method_i.name), ',',
			'JS_NewCFunction(jsctx,(', class_name, 'Call_', method_i.name, '),', JSON.stringify(class_name + '.' + method_i.name), ',', i.toString(), ')',
			');'
		);
	};
	let node_constants = [];
	class_desc=undefined;
	for(let nd_class of nd_node_jch.FindAll(N_CLASS, 'ama')){
		let class_desc_i = nd_class.ParseClass();
		if(!class_desc||class_desc.properties.length<class_desc_i.properties.length){
			class_desc=class_desc_i;
		}
	}
	for(let ppt of class_desc.properties){
		if(ppt.kind==='variable'){
			let nd_asgn = ppt.node.Owning(N_ASSIGNMENT);
			if(!nd_asgn){
				continue;
			}
			node_constants.push({
				nd_def:ppt.node,
				nd_value:nd_asgn.c.s
			});
		}
	}
	let p_placeholder=code.length;
	code.push(
		'',
		'JSValueConst global = JS_GetGlobalObject(ama::jsctx);'
	);
	//JS global constants
	let n_largest = 0;
	for(let cns of node_constants) {
		let nd = cns.nd_def;
		let nd_value = cns.nd_value;
		if( nd.data.startsWith('N_') ) {
			function toCamelCase(s) {
				if( s === 'N' ) { return 'n'; }
				return s.substr(0, 1) + s.substr(1).toLowerCase();
			}
			if( nd_value.node_class === N_NUMBER ) {
				n_largest = parseInt(nd_value.data);
			}
			let builder_name = nd.data.split('_').map(toCamelCase).join('');
			code.push(
				'ama::g_node_class_names[',nd.data,'] = ',JSON.stringify(nd.data),';',
				'ama::g_builder_names[',nd.data,'] = ',JSON.stringify(builder_name),';'
			);
		} else if( nd_value.node_class !== N_FUNCTION ) {
			code.push(
				'JS_SetPropertyStr(ama::jsctx, global, ',JSON.stringify(nd.data),', JS_NewInt32(ama::jsctx, ',nd.data,'));'
			);
		}
	}
	n_largest += 1;
	code[p_placeholder] = [
		'ama::g_node_class_names.resize(',n_largest.toString(),');',
		'ama::g_builder_names.resize(',n_largest.toString(),');'
	].join('');
	//JS node builders are created in JS
	nd_root.Find(N_CALL,'gen').c.data='gen_begin';
	//////////
	code_func.push('std::vector<char const*> g_builtin_modules{');
	try{
		const fs = require('fs');
		const fsext = require('fsext');
		const auto_paren=require('auto_paren');
		const auto_semicolon=require('auto_semicolon');
		let dir_modules=path.resolve(__dirname,'../../modules');
		let module_files=[];
		for (let fn of fsext.FindAllFiles(dir_modules).sort()) {
			if (!fn.endsWith('.js')) {continue;}
			let fn_rel=path.relative(dir_modules,fn).replace(/\\/g,'/').replace(/[.].*/,'');
			let code=fs.readFileSync(fn).toString();
			if(fn.endsWith('.ama.js')){
				let nd_root=ParseCode(code);
				if(nd_root){
					nd_root.data=fn;
					for(let nd of nd_root.FindAll(N_BINOP,'!==')){
						nd.data='!=';
					}
					for(let nd of nd_root.FindAll(N_BINOP,'===')){
						nd.data='==';
					}
					code=nd_root.then(auto_paren).then(auto_semicolon).NodeofToASTExpression().toSource();
				}
			}
			code_func.push('\n\t',JSON.stringify(fn_rel),', ');
			for(let ofs=0;ofs<code.length;ofs+=1024){
				code_func.push(JSON.stringify(code.substr(ofs,1024)))
			}
			code_func.push(',');
		}
	}catch(err){
		if(err){
			console.error(err.stack);
		}
	}
	code_func.push('\n\tNULL, NULL');
	code_func.push('\n};\n');
	//////////
	code_func.push(
		'void GeneratedJSBindings(){\n',
		code.join(''),
		'}\n',
		//for namespace ama
		'}'
	);
	nd_root.Insert(POS_BACK,ParseCode(code_func.join('').replace(/\*\+/g,'*')).AutoFormat().c.setCommentsAfter(''));
	nd_root.Insert(POS_BACK,ParseCode('#pragma gen_end(js_bindings)').setCommentsBefore('\n'));
	return nd_root;
};

module.exports=Generate;
