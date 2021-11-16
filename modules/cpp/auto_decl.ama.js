'use strict';

function DeclScope(nd) {
	for (let ndi = nd; ndi; ndi = ndi.p) {
		if (ndi.node_class == N_SCOPE) {
			let nd_asgn = ndi.Owning(N_ASSIGNMENT);
			if (nd_asgn && nd_asgn.c.isAncestorOf(ndi)) {
				//hack out of destructuring
				return nd_asgn.Owning(N_SCOPE);
			}
			return ndi;
		}
		if (ndi.node_class == N_PARAMETER_LIST) {
			return ndi.p;
		}
	}
	return nd.Root();
}

function Transform(nd_root, options) {
	let all_refs = nd_root.FindAll(N_REF, null);
	//track the locally undeclared
	let scope_to_context = new Map();
	for (let nd_def of all_refs) {
		if (!(nd_def.flags & REF_DECLARED)) {continue;}
		let nd_scope = DeclScope(nd_def);
		let ctx = scope_to_context.get(nd_scope);
		if (!ctx) {
			ctx = {defs: new Set()};
			scope_to_context.set(nd_scope, ctx);
		}
		ctx.defs.add(nd_def.data);
	}
	//find the locally undeclared: then declare them or do name search
	let locally_undeclared = [];
	for (let nd_ref of all_refs) {
		if (nd_ref.flags & REF_DECLARED) {continue;}
		let declared = 0;
		for (let nd_scope = nd_ref; nd_scope; nd_scope = nd_scope.p) {
			let ctx = scope_to_context.get(nd_scope);
			if (ctx && ctx.defs.has(nd_ref.data)) {declared = 1;break;}
		}
		if (!declared) {
			locally_undeclared.push(nd_ref);
		}
	}
	//worse is better: just make each first assignment decl, then look up the never-writtens
	let owner_to_context = new Map();
	let keyword = (options || {}).keyword || 'auto';
	for (let nd_ref of locally_undeclared) {
		if (nd_ref.flags == REF_WRITTEN) {
			//check already-declared-ness
			let declared = 0;
			for (let nd_scope = nd_ref; nd_scope; nd_scope = nd_scope.p) {
				let ctx = scope_to_context.get(nd_scope);
				if (ctx && ctx.defs.has(nd_ref.data)) {declared = 1;break;}
			}
			if (declared) {continue;}
			//make it a declaration
			let nd_tmp = Node.GetPlaceHolder();
			nd_ref.ReplaceWith(nd_tmp)
			nd_tmp.ReplaceWith(nRaw(nRef(keyword).setCommentsAfter(' '), nd_ref));
			nd_ref.flags |= REF_DECLARED;
			///////////
			//add it to the declarations
			let nd_scope = DeclScope(nd_ref);
			let ctx = scope_to_context.get(nd_scope);
			if (!ctx) {
				ctx = {defs: new Set()};
				scope_to_context.set(nd_scope, ctx);
			}
			ctx.defs.add(nd_ref.data);
		}
		if (nd_ref.flags & REF_WRITTEN) {
			let nd_owner = nd_ref.Owner();
			let ctx = owner_to_context.get(nd_owner);
			if (!ctx) {
				ctx = {writtens: new Set()};
				owner_to_context.set(nd_owner, ctx);
			}
			ctx.writtens.add(nd_ref.data);
		}
	}
	//look up the never-writtens
	let keywords_class = new Set(default_options.keywords_class.split(' '));
	let all_possible_names = undefined;
	for (let nd_ref of locally_undeclared) {
		if (nd_ref.flags & (REF_WRITTEN | REF_DECLARED)) {continue;}
		let nd_owner = nd_ref.Owner();
		let ctx = owner_to_context.get(nd_owner);
		if (ctx && ctx.writtens.has(nd_ref.data)) {continue;}
		if (nd_ref.p) {
			//check a few should-not-fix cases
			if (nd_ref.p.node_class == N_KEYWORD_STATEMENT && nd_ref.p.c == nd_ref && keywords_class.has(nd_ref.p.data)) {
				//struct forward decl
				continue;
			}
		}
		if (!all_possible_names) {
			//collect names
			const depends = require('depends');
			all_possible_names = new Map();
			for (let nd_root_i of depends.ListAllDependency(nd_root, true)) {
				for (let ndi = nd_root_i; ndi; ndi = ndi.PreorderNext(nd_root_i)) {
					if (ndi.node_class == N_SCOPE && ndi.p && (ndi.p.node_class == N_FUNCTION || ndi.p.node_class == N_CLASS && ndi.p.data != 'namespace')) {
						ndi = ndi.PreorderSkip();
						continue;
					}
					if (ndi.node_class == N_PARAMETER_LIST) {
						ndi = ndi.PreorderSkip();
						continue;
					}
					if (ndi.node_class == N_REF && (ndi.flags & REF_DECLARED)) {
						let defs = all_possible_names.get(ndi.data);
						if (!defs) {
							defs = [];
							all_possible_names.set(ndi.data, defs);
							defs.push(ndi);
						}
					}
				}
			}
		}
		let defs = all_possible_names.get(nd_ref.data);
		if (defs && defs.length == 1) {
			//resolve it
			let names = [];
			let nd_def = defs[0];
			for (let ndi = nd_def; ndi; ndi = ndi.p) {
				if (ndi.node_class == N_CLASS && nd_def != ndi.c.s || ndi.node_class == N_REF) {
					names.push(ndi.GetName());
				}
			}
			let nd_ret = nRef(names.pop());
			while (names.length > 0) {
				nd_ret = nd_ret.dot(names.pop()).setFlags(DOT_CLASS);
			};
			nd_ref.ReplaceWith(nd_ret);
		}
	}
}

module.exports = Transform;
