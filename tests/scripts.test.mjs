import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,cpSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
function sandbox(run) {
  const root=mkdtempSync(join(tmpdir(),'noticeboard-scripts-'));
  try {
    cpSync('bin',join(root,'bin'),{recursive:true});cpSync('.mise.toml',join(root,'.mise.toml'));
    const fake=join(root,'fake');mkdirSync(fake);
    const log=join(root,'calls');
    for(const name of ['mise','npm','gum'])writeFileSync(join(fake,name),`#!/bin/bash\nprintf '%s\\n' "${name} $*" >> "$CALL_LOG"\n`,{mode:0o755});
    writeFileSync(join(fake,'node'),'#!/bin/bash\nprintf "%s\\n" "${FAKE_NODE_VERSION:-v24.15.0}"\n',{mode:0o755});
    const invoke=(script,args=[],extra={})=>spawnSync('/bin/bash',[join(root,'bin',script),...args],{cwd:root,encoding:'utf8',env:{...process.env,PATH:fake+':/usr/bin:/bin',CALL_LOG:log,...extra}});
    run(invoke,()=>readFileSync(log,'utf8'));
  }finally{rmSync(root,{recursive:true,force:true})}
}
test('setup installs tools and browser through mise, with fake external commands',()=>sandbox((run,log)=>{
  assert.equal(run('setup').status,0);
  assert.match(log(),/mise install --yes/);assert.match(log(),/mise exec -- npm ci/);assert.match(log(),/mise exec -- npx playwright install chromium/);
}));
test('CI sequences check, build and tests and dev forwards arguments',()=>sandbox((run,log)=>{
  assert.equal(run('ci').status,0);assert.match(log(),/npm run check[\s\S]*npm run build[\s\S]*npm test/);
  assert.equal(run('dev',['--port','4999']).status,0);assert.match(log(),/npm run dev -- --port 4999/);
}));
test('mismatching Node reexecutes under mise',()=>sandbox((run,log)=>{
  assert.equal(run('dev',['--port','4999'],{FAKE_NODE_VERSION:'v0.0.0'}).status,0);
  assert.match(log(),/mise exec -- .*\/bin\/dev --port 4999/);assert.doesNotMatch(log(),/npm run dev/);
}));
