#include <stdio.h>
#include "./test_sanetypes.h"

/*
@ama
const path=require('path');
const sane_types=require('cpp/sane_types');
const sane_init=require('cpp/sane_init');
const sane_export=require('cpp/sane_export');
const move_operator=require('cpp/move_operator');
const jsism=require('cpp/jsism');
let nd_root=ParseCurrentFile({parse_indent_as_scope:1})
	.Save('.indent.audit.cpp')
	.AutoSemicolon()
	.Save('.mid.audit.cpp')
	.then(sane_types.FixArrayTypes)
	.then(require('cpp/typing').DeduceAuto)
	.then(sane_types,{view:{to:.(JC::array_base<.(Node.MatchAny('TElement'))>)}})
	.then(sane_init)
	.then(sane_export)
	.then(move_operator)
	.then(jsism.EnableJSLambdaSyntax)
	.then(require('cpp/auto_decl'))
	.then(require('cpp/auto_paren'))
	.then(require('cpp/auto_header'),{audit:path.join(__dirname,'test_sanetypes.header.audit.cpp')})
	.Save('.audit.cpp');
//console.log(JSON.stringify(nd_root,null,1));
nd_root
	.then(jsism.EnableJSLambdaSyntax.inverse)
	.then(move_operator.inverse)
	.then(sane_export.inverse)
	.then(sane_init.inverse)
	.then(sane_types.inverse,{view:{to:.(JC::array_base<.(Node.MatchAny('TElement'))>)}})
	.Save('.aba.audit.cpp')
*/

int[] test(char[:] a,uint32_t[]*[:]& b){
	int[] a;
	float[9]! b;
	Map<char[],double> c;
	return 0;
}

ama::ExecNode*[] ama::ExecSession::ComputeReachableSet(ama::ExecNode*[:] entries, int32_t dir) {
	ama::ExecNode*[] Q{};
	Map<ama::ExecNode*, intptr_t> inQ{};
	for ( ama::ExecNode*& ed: entries ) {
		Q.push_back(ed)
		JC::map_set(inQ, ed, 1)
	}
	for (int qi = 0; qi < Q.size(); qi += 1) {
		if ( dir & ama::REACH_FORWARD ) {
			for (ama::ExecNodeExtraLink* link = Q[qi]->next.more; link; link = link->x) {
				ama::ExecNode* edi = link->target;
				if ( !JC::map_get(inQ, edi) ) {
					JC::push(Q, edi)
					JC::map_set(inQ, edi, 1);
				}
			}
		}
		if ( dir & ama::REACH_BACKWARD )
			for (ama::ExecNodeExtraLink* link = Q[qi]->prev.more; link; link = link->x)
				ama::ExecNode* edi = link->target;
				if ( !JC::map_get(inQ, edi) )
					JC::push(Q, edi);
					JC::map_set(inQ, edi, 1);
	}
	ama::CodeGenerator gctx{{}, nullptr, nullptr, nullptr, nullptr, intptr_t(0L), intptr_t(0L), 4, 1};
	JC::sortby(addressed_labels, (auto nd) => { return intptr_t(nd); });
	console.log(REACH_FORWARD);
	if (1)+(true):{
		new_var=3;
		console.log(new_var);
	}else{
		new_var+=4;
		console.log(new_var);
	}
	auto aa=test(foo,bar)[3];
	float* q=NULL;
	auto* pp=NULL;
	pp=q;
	return <<Q;
}

public void CodeGenerator::NewMethod(Node* nd_name)
	if nd_name && nd_name.node_class != N_REF && nd_name.node_class != N_DOT: {
		return undefined
	}

public int ama::NewAMAFunction()
	return 0

public void NewNamespace::NewThing(Node* nd_name,int x)
	//nothing
	x++
