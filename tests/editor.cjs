const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
const elements=new Map();
const el=id=>{if(!elements.has(id))elements.set(id,{value:'',checked:false,hidden:false,disabled:false,selectionStart:0,selectionEnd:0,textContent:'',classList:{toggle(){}},setAttribute(){},addEventListener(){},focus(){},setSelectionRange(a,b){this.selectionStart=a;this.selectionEnd=b;}});return elements.get(id);};
const clipboard={readText:async()=> 'yangi'};
const ctx=vm.createContext({document:{getElementById:el},navigator:{clipboard},location:{search:''},URLSearchParams,convert:s=>s,conversionSegments:()=>[],setTimeout});
vm.runInContext(fs.readFileSync('dist/app.js','utf8'),ctx);
(async()=>{
 el('input').value='Muhim matn';el('clear').onclick();assert.equal(el('input').value,'');assert.equal(el('restore-text').hidden,false);
 el('restore-text').onclick();assert.equal(el('input').value,'Muhim matn');assert.equal(el('restore-text').hidden,true);
 el('input').selectionStart=0;el('input').selectionEnd=5;await el('paste-text').onclick();assert.equal(el('input').value,'yangi matn');
 clipboard.readText=async()=>{throw Error('denied');};await el('paste-text').onclick();assert.equal(el('input').value,'yangi matn');assert.match(el('status').textContent,/Ctrl\+V/);assert.equal(el('paste-text').disabled,false);
 let complete;clipboard.readText=()=>new Promise(r=>complete=r);const pending=el('paste-text').onclick();el('input').value='Yangidan yozildi';complete('old clipboard');await pending;assert.equal(el('input').value,'Yangidan yozildi');
 console.log('PASS clear/restore, paste selection, permission fallback, in-flight edit protection');
})().catch(e=>{console.error(e);process.exitCode=1;});
