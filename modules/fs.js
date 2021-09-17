'use strict'
let fs=module.exports;

let Buffer={
	toString:__buffer_toString
};
Buffer.__proto__=ArrayBuffer;

fs.readFileSync=function(fn){
	let ret=__readFileSync(fn);
	if(ret){
		ret.__proto__=Buffer;
	}
	return ret;
}
fs.existsSync=__existsSync;
