// Each browser-test server gets its own project root and Astro-generated files.
import { mkdtempSync, cpSync, mkdirSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
const [mode, port] = process.argv.slice(2);
if (!['empty','populated'].includes(mode) || !/^\d+$/.test(port)) throw new Error('Expected mode and port');
const source = resolve('.');
const root = mkdtempSync(join(tmpdir(),'llibres-browser-'));
try {
  for (const path of ['src','public','astro.config.mjs','tsconfig.json','package.json']) cpSync(join(source,path),join(root,path),{recursive:true});
  symlinkSync(join(source,'node_modules'),join(root,'node_modules'),'dir');
  rmSync(join(root,'src/content/notices'),{recursive:true,force:true});
  mkdirSync(join(root,'src/content/notices'),{recursive:true});
  if (mode==='populated') cpSync(join(source,'tests/fixtures/notices'),join(root,'src/content/notices'),{recursive:true});
  rmSync(join(root,'src/content/translations'),{recursive:true,force:true});
  mkdirSync(join(root,'src/content/translations'),{recursive:true});
  if (mode==='populated') cpSync(join(source,'tests/fixtures/translations'),join(root,'src/content/translations'),{recursive:true});
  const cli=join(source,'node_modules/.bin/astro');
  const build=spawnSync(process.execPath,[cli,'build'],{cwd:root,stdio:'inherit'});
  if(build.status!==0) throw new Error('Fixture build failed');
  const child=spawn(process.execPath,[cli,'preview','--host','127.0.0.1','--port',port,'--ignore-lock'],{cwd:root,stdio:'inherit'});
  process.on('SIGTERM',()=>child.kill('SIGTERM'));
  process.on('SIGINT',()=>child.kill('SIGINT'));
  await new Promise((resolve,reject)=>{child.on('exit',resolve);child.on('error',reject)});
} finally { rmSync(root,{recursive:true,force:true}); }
