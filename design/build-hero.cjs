const path=require('node:path');
const fs=require('node:fs');
const esbuild=require('esbuild');
const root=path.resolve(__dirname,'..');
esbuild.buildSync({entryPoints:[path.join(__dirname,'hero-scene.mjs')],outfile:path.join(root,'assets/js/hero-scene.js'),bundle:true,minify:true,format:'iife',target:['es2020'],legalComments:'linked'});
fs.mkdirSync(path.join(root,'assets/js/vendor'),{recursive:true});
fs.copyFileSync(path.join(root,'node_modules/three/LICENSE'),path.join(root,'assets/js/vendor/THREE-LICENSE.txt'));
