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
    writeFileSync(join(fake,'node'),'#!/bin/bash\nif [ "$1" = --version ]; then printf "%s\\n" "${FAKE_NODE_VERSION:-v24.15.0}"; else printf "node %s\\n" "$*" >> "$CALL_LOG"; fi\n',{mode:0o755});
    writeFileSync(join(fake,'tailscale'),'#!/bin/bash\nprintf "%s\\n" "${FAKE_TAILSCALE_IP:-100.113.216.23}"\nexit "${FAKE_TAILSCALE_STATUS:-0}"\n',{mode:0o755});
    const invoke=(script,args=[],extra={},cwd=root)=>spawnSync('/bin/bash',[join(root,'bin',script),...args],{cwd,encoding:'utf8',env:{...process.env,PATH:fake+':/usr/bin:/bin',CALL_LOG:log,...extra}});
    run(invoke,()=>readFileSync(log,'utf8'),root);
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
test('menus reads the pictures folder from where it was run, then hands over to the menus script',()=>sandbox((run,log,root)=>{
  mkdirSync(join(root,'Downloads/email'),{recursive:true});
  const result=run('menus',['email','2026-10'],{},join(root,'Downloads'));
  assert.equal(result.status,0,result.stderr);
  assert.match(log(),/^node scripts\/menus\.mjs \/\S+\/Downloads\/email 2026-10$/m);
}));
test('mismatching Node reexecutes under mise',()=>sandbox((run,log)=>{
  assert.equal(run('dev',['--port','4999'],{FAKE_NODE_VERSION:'v0.0.0'}).status,0);
  assert.match(log(),/mise exec -- .*\/bin\/dev --port 4999/);assert.doesNotMatch(log(),/npm run dev/);
}));
test('phone preview binds only to the Tailscale address on the fixed port',()=>sandbox((run,log)=>{
  const result=run('dev',['--tailscale']);
  assert.equal(result.status,0);
  assert.match(result.stdout,/http:\/\/100\.113\.216\.23:4321\//);
  assert.match(log(),/npm run dev -- --host 100\.113\.216\.23 --port 4321/);
}));
test('phone preview refuses disconnected Tailscale and non-tailnet addresses',()=>sandbox((run)=>{
  for(const extra of [{FAKE_TAILSCALE_STATUS:'1'},{FAKE_TAILSCALE_IP:'127.0.0.1'},{FAKE_TAILSCALE_IP:'0.0.0.0'}]){
    const result=run('dev',['--tailscale'],extra);
    assert.notEqual(result.status,0);
    assert.match(result.stderr,/Connect Tailscale/);
  }
  assert.notEqual(run('dev',['--tailscale','--host','0.0.0.0']).status,0);
}));
