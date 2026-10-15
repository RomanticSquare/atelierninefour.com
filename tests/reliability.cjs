// DOM simulation only. Never loads external assets or sends requests.
// Run: npm install --prefix /tmp/a94-test-deps jsdom
// NODE_PATH=/tmp/a94-test-deps/node_modules node --test tests/reliability.cjs
const {test} = require('node:test');
const assert = require('node:assert/strict');
const {JSDOM} = require('jsdom');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
function setup(url='https://atelierninefour.com/contact.html?interest=diagnostic', fetchImpl) {
  const dom = new JSDOM(fs.readFileSync(path.join(root,'contact.html'),'utf8'), {url,runScripts:'outside-only'});
  const w=dom.window, events=[],calls=[]; w.gtag=(...args)=>events.push(args);
  w.AbortController=AbortController;
  w.fetch=(...args)=>{calls.push(args);return fetchImpl ? fetchImpl(...args) : Promise.resolve({ok:true,json:async()=>({ok:true})});};
  w.eval(fs.readFileSync(path.join(root,'a94-site.js'),'utf8'));
  w.eval(fs.readFileSync(path.join(root,'a94-contact.js'),'utf8'));
  const f=w.document.getElementById('inquiry');
  const fill=()=>{f.elements.namedItem('name').value='QA Person';f.elements.namedItem('email').value='qa@example.com';f.elements.namedItem('message').value='Test only. No network.';};
  const submit=()=>f.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
  return {dom,w,f,events,calls,fill,submit};
}
const tick=()=>new Promise(r=>setImmediate(r));
test('empty and malformed input do not send; first error receives focus',async()=>{const x=setup();x.submit();assert.equal(x.calls.length,0);assert.equal(x.w.document.activeElement.id,'f-name');x.fill();x.f.elements.email.value='broken';x.submit();assert.equal(x.calls.length,0);assert.equal(x.w.document.activeElement.id,'f-email');x.dom.window.close();});
test('interest query is allowlisted, malicious selector input ignored',()=>{for(const [q,value] of [['diagnostic','diagnostic'],['%22%5D%5B','general'],['not-an-offer','general']]){const x=setup('https://atelierninefour.com/contact.html?interest='+q);assert.equal(x.f.elements.interest.value,value);x.dom.window.close();}});
test('successful delivery records exactly one event, no personal event fields, duplicate guarded',async()=>{let finish;const x=setup(undefined,()=>new Promise(r=>finish=r));x.fill();x.submit();x.submit();assert.equal(x.calls.length,1);assert.equal(x.f.getAttribute('aria-busy'),'true');x.f.elements.interest.value='build';finish({ok:true,json:async()=>({ok:true})});await tick();const success=x.events.filter(e=>e[1]==='inquiry_submit');assert.equal(success.length,1);assert.deepEqual(JSON.parse(JSON.stringify(success[0][2])),{interest:'diagnostic',team_size:'unspecified'});assert.equal(x.f.elements.name.value,'');assert.equal(x.f.getAttribute('aria-busy'),'false');assert.equal(x.w.document.getElementById('f-send').disabled,false);assert.ok(!JSON.stringify(x.events).includes('qa@example.com'));assert.equal(x.calls[0][1].body.get('name'),'QA Person');x.dom.window.close();});
for(const [name,result] of [['server rejection',{ok:false,json:async()=>({errors:[]})}],['rate limit',{ok:false,status:429}],['server failure',{ok:false,status:500}]]) test(name+' retains data and never records success',async()=>{const x=setup(undefined,async()=>result);x.fill();x.submit();await tick();assert.equal(x.events.filter(e=>e[1]==='inquiry_submit').length,0);assert.equal(x.f.elements.message.value,'Test only. No network.');assert.match(x.w.document.getElementById('f-status').textContent,/couldn't confirm/);assert.equal(x.w.document.getElementById('f-send').disabled,false);x.dom.window.close();});
test('timeout aborts request, unlocks form, retains message',async()=>{const x=setup(undefined,(_url,options)=>new Promise((_resolve,reject)=>options.signal.addEventListener('abort',()=>{const e=Error('abort');e.name='AbortError';reject(e);})));const callbacks=[];x.w.setTimeout=fn=>{callbacks.push(fn);return 1;};x.w.clearTimeout=()=>{};x.fill();x.submit();callbacks[0]();await tick();assert.equal(x.w.document.getElementById('f-send').disabled,false);assert.equal(x.f.elements.message.value,'Test only. No network.');assert.equal(x.events.find(e=>e[1]==='inquiry_error')[2].reason,'timeout');x.dom.window.close();});
test('select-only interaction starts funnel once',()=>{const x=setup();x.f.elements.interest.dispatchEvent(new x.w.Event('change',{bubbles:true}));x.f.elements.interest.dispatchEvent(new x.w.Event('change',{bubbles:true}));assert.equal(x.events.filter(e=>e[1]==='inquiry_start').length,1);x.dom.window.close();});
test('menu closes on Escape, restores focus; outside click closes it',()=>{const x=setup();const b=x.w.document.querySelector('.menu-btn'),n=x.w.document.getElementById('site-nav');b.click();assert.equal(b.getAttribute('aria-expanded'),'true');x.w.document.dispatchEvent(new x.w.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));assert.equal(b.getAttribute('aria-expanded'),'false');assert.equal(x.w.document.activeElement,b);b.click();x.w.document.querySelector('h1').click();assert.equal(n.classList.contains('open'),false);assert.equal(x.w.document.documentElement.classList.contains('nav-ready'),true);x.dom.window.close();});
test('native validation stays enabled when enhanced APIs unavailable',()=>{const d=new JSDOM(fs.readFileSync(path.join(root,'contact.html'),'utf8'),{runScripts:'outside-only'});d.window.eval(fs.readFileSync(path.join(root,'a94-contact.js'),'utf8'));assert.equal(d.window.document.querySelector('form').noValidate,false);d.window.close();});
