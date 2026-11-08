const $=id=>document.getElementById(id);
let kind='proposal';
let reverse=false,mode='text',manualText='',loadedFile=null,fileResult=null,operation=0,busy=false;
let batchResults=[],stopBatch=false;
let clearedText='',pastePending=false;
const count=s=>Array.from(s).length;
const fileEngine=()=>import('./file-engine.mjs?v=13');
function update(){const value=$('input').value;$('restore-text').hidden=mode!=='text'||!!value||!clearedText;$('clear').disabled=!value;$('output').value=convert(value,conversionMode());$('input-count').textContent=`${count(value)} belgi · ${value.trim()?value.trim().split(/\s+/).length:0} so‘z`;$('output-count').textContent=`${count($('output').value)} belgi`;$('copy').disabled=$('download').disabled=!value;$('status').textContent=value?'Tayyor · Matn o‘girildi':'Yozishni boshlang';renderChanges();$('swap-text').disabled=mode!=='text'||busy||!value;}
function conversionMode(){return kind==='proposal'?reverse:(reverse?'lat-cyr':'cyr-lat');}
const directionArrow='<svg class="icon icon-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>';
function labels(){
 const source=kind==='proposal'?(reverse?'Yangi yozuv':'Amaldagi yozuv'):(reverse?'Lotin yozuvi':'Kirill yozuvi');
 const target=kind==='proposal'?(reverse?'Amaldagi yozuv':'Yangi yozuv'):(reverse?'Kirill yozuvi':'Lotin yozuvi');
 $('input-label').textContent=source;$('output-label').textContent=target;
 $('output').placeholder=target+'dagi matningiz shu yerda ko‘rinadi…';
 $('input').placeholder=mode==='file'?'Hujjatingizdagi matn shu yerda ko‘rinadi…':source+'dagi matningizni yozing yoki joylashtiring…';
 $('forward').innerHTML=kind==='proposal'?'Amaldagi '+directionArrow+' Yangi':'Kirill '+directionArrow+' Lotin';
 $('reverse').innerHTML=kind==='proposal'?'Yangi '+directionArrow+' Amaldagi':'Lotin '+directionArrow+' Kirill';
 $('conversion-note').textContent=kind==='proposal'?'Yangi alifbo: G‘ → Ğ, O‘ → Ö, Sh → Ş, Ch → Ç. Kuchga kirish sanasi: 22.04.2027.':'Kirill–lotin: e/ye, ts va chet tilidagi ismlar bir ma’noli bo‘lmasligi mumkin. Natijani tekshiring.';
}
function renderChanges(){
 const enabled=$('show-changes').checked;$('changes-panel').hidden=!enabled;
 if(!enabled)return;
 const source=$('input').value.normalize('NFC');
 if(source.length>30000){$('changes-preview').replaceChildren();$('changes-summary').textContent='Uzun matn uchun rangli ko‘rinish o‘chirilgan (30 000 belgigacha). Konvertatsiya to‘liq bajariladi.';return;}
 const pieces=conversionSegments(source,conversionMode()),frag=document.createDocumentFragment();let changed=0;
 for(const part of pieces){if(part.changed){changed++;const mark=document.createElement('mark');mark.textContent=part.text||'∅';mark.title=source.slice(part.start,part.end)+' → '+(part.text||'olib tashlandi');frag.append(mark);}else frag.append(document.createTextNode(part.text));}
 $('changes-preview').replaceChildren(frag);$('changes-summary').textContent=changed+' ta qism o‘girildi';
}
function setMode(value){if(value===mode)return;if(mode==='text')manualText=$('input').value;mode=value;$('converter').classList.toggle('file-mode',mode==='file');$('file-workspace').hidden=mode!=='file';for(const id of ['text','file']){$(id+'-mode').classList.toggle('selected',mode===id);$(id+'-mode').setAttribute('aria-pressed',String(mode===id));}$('input').readOnly=mode==='file';$('input').value=mode==='file'?(loadedFile?.text||''):manualText;labels();update();}
function editorView(output){$('converter').classList.toggle('show-result',output);$('view-input').setAttribute('aria-pressed',String(!output));$('view-output').setAttribute('aria-pressed',String(output));}
$('view-input').onclick=()=>editorView(false);$('view-output').onclick=()=>editorView(true);
function progress(value,message){$('file-progress').value=value;$('file-status').textContent=message;}
function setBusy(value){busy=value;$('swap-text').disabled=value||mode!=='text'||!$('input').value;$('choose-file').disabled=$('remove-file').disabled=value;$('save-file').disabled=value||!fileResult;$('forward').disabled=$('reverse').disabled=$('conversion-kind').disabled=$('ocr-enabled').disabled=$('ocr-language').disabled=value;$('file-workspace').setAttribute('aria-busy',String(value));}
function resetFile(){operation++;loadedFile=null;fileResult=null;setBusy(false);$('file-input').value='';$('file-state').hidden=$('file-ready').hidden=$('file-error').hidden=$('file-warning').hidden=true;if(mode==='file'){$('input').value='';update();}}
function showError(e){$('file-error').textContent=e instanceof TypeError?'Faylni o‘qib bo‘lmadi. Formatini tekshiring yoki sahifani yangilab qayta urinib ko‘ring.':(e.message||'Faylni qayta ishlashda xatolik yuz berdi.');$('file-error').hidden=false;}
async function renderFile(token=++operation){if(!loadedFile)return;fileResult=null;$('file-error').hidden=true;$('file-ready').hidden=true;setBusy(true);progress(0,'Matn o‘girilmoqda…');try{const engine=await fileEngine();const result=await engine.convertFile(loadedFile,conversionMode(),(n,m)=>{if(token===operation)progress(n,m);});if(token!==operation)return;fileResult=result;const warnings=[...(loadedFile.warnings||[]),...(result.warnings||[])];$('file-warning').textContent=warnings.join(' ');$('file-warning').hidden=!warnings.length;if(mode==='file'){$('input').value=loadedFile.text;update();}$('save-file-label').textContent=`${loadedFile.ext.toUpperCase()} yuklab olish`;$('file-result-description').textContent=loadedFile.ext==='pdf'?`PDF tayyor · ${result.pages} sahifa. Matn yangi maketga joylandi; asl rasmlar va jadvallar maketi saqlanmaydi.`:loadedFile.zip?'Hujjatdagi matn o‘girildi. Quyida asosiy matn ko‘rsatilgan.':'Matn o‘girildi. Natija TXT shaklida yuklab olinadi.';$('file-ready').hidden=false;progress(100,'Tayyor · Hujjat o‘girildi');}catch(e){if(token===operation){showError(e);progress(0,'O‘girish tugallanmadi');}}finally{if(token===operation)setBusy(false);}}
async function chooseFile(file){if(!file)return;setMode('file');resetFile();const token=++operation;$('file-state').hidden=false;$('file-name').textContent=file.name;$('file-meta').textContent=`${(file.size/1024/1024).toFixed(2)} MB · Faqat qurilmangizda`;setBusy(true);progress(0,'Fayl ochilmoqda…');try{const engine=await fileEngine();const doc=await engine.readFile(file,(n,m)=>{if(token===operation)progress(n,m);},{ocr:$('ocr-enabled').checked,ocrLanguage:$('ocr-language').value});if(token!==operation)return;loadedFile=doc;$('file-meta').textContent=`${doc.ext.toUpperCase()} · ${(file.size/1024/1024).toFixed(2)} MB${doc.pages?' · '+doc.pages+(doc.ext==='pptx'?' slayd':' sahifa'):''}`;if(doc.warnings.length){$('file-warning').textContent=doc.warnings.join(' ');$('file-warning').hidden=false;}await renderFile(token);}catch(e){if(token===operation){showError(e);progress(0,'Fayl o‘qilmadi');setBusy(false);}}}
function direction(value){reverse=value;for(const [id,on] of [['forward',!value],['reverse',value]]){$(id).classList.toggle('active',on);$(id).setAttribute('aria-pressed',String(on));}labels();update();if(loadedFile)renderFile();}
function download(blob,name){const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);}
$('input').addEventListener('input',()=>{if(mode==='text')manualText=$('input').value;update();});$('forward').onclick=()=>direction(false);$('reverse').onclick=()=>direction(true);$('text-mode').onclick=()=>setMode('text');$('file-mode').onclick=()=>setMode('file');
$('clear').onclick=()=>{if(mode!=='text'||!$('input').value)return;clearedText=$('input').value;$('input').value='';manualText='';update();$('status').textContent='Matn tozalandi. Uni qaytarishingiz mumkin.';$('input').focus();};$('example').onclick=()=>{const sample='O‘zbekiston — go‘zal o‘lka. Shaharlar, bog‘lar va ochiq ko‘ngilli insonlar.\nHar bir o‘zgarish yangi imkoniyat!';$('input').value=kind==='cyrillic'?(reverse?sample:convert(sample,'lat-cyr')):(reverse?convert(sample):sample);manualText=$('input').value;update();};
$('copy').onclick=async()=>{try{await navigator.clipboard.writeText($('output').value);$('status').textContent='Nusxa olindi!';}catch{$('output').focus();$('output').select();$('status').textContent='Nusxa olish uchun Ctrl+C yoki ⌘C bosing.';}};$('download').onclick=()=>{download(new Blob([$('output').value],{type:'text/plain;charset=utf-8'}),'alifbom-matn.txt');$('status').textContent='TXT fayl tayyor';};
$('choose-file').onclick=()=>$('file-input').click();$('file-input').onchange=e=>{chooseFiles(Array.from(e.target.files));e.target.value='';};$('remove-file').onclick=resetFile;$('save-file').onclick=()=>{if(fileResult&&!busy)download(fileResult.blob,fileResult.filename);};
let dragDepth=0;$('dropzone').addEventListener('dragenter',e=>{e.preventDefault();dragDepth++;if(!busy)$('dropzone').classList.add('dragging');});$('dropzone').addEventListener('dragover',e=>e.preventDefault());$('dropzone').addEventListener('dragleave',()=>{if(--dragDepth<=0){dragDepth=0;$('dropzone').classList.remove('dragging');}});$('dropzone').addEventListener('drop',e=>{e.preventDefault();dragDepth=0;$('dropzone').classList.remove('dragging');if(!busy)chooseFiles(Array.from(e.dataTransfer.files));});
$('conversion-kind').onchange=()=>{kind=$('conversion-kind').value;direction(false);};
$('show-changes').onchange=renderChanges;
if(new URLSearchParams(location.search).get('mode')==='cyrillic'){kind='cyrillic';$('conversion-kind').value=kind;}
labels();update();



$('swap-text').onclick=()=>{if(mode!=='text'||busy||!$('output').value)return;manualText=$('output').value;$('input').value=manualText;direction(!reverse);editorView(false);$('input').focus();};
async function chooseFiles(files){
 if(busy||!files.length)return;
 if(files.length===1){$('batch-panel').hidden=true;batchResults=[];return chooseFile(files[0]);}
 setBusy(true);
 let batch;try{batch=await import('./batch.mjs?v=2');batch.validateBatch(files);}catch(e){setBusy(false);setMode('file');showError(e);return;}
 setMode('file');resetFile();stopBatch=false;batchResults=[];$('batch-panel').hidden=false;$('batch-download').disabled=true;$('batch-stop').hidden=false;$('batch-stop').disabled=false;
 const current=conversionMode();$('batch-direction').textContent=kind==='proposal'?(reverse?'Yangi → Amaldagi':'Amaldagi → Yangi'):(reverse?'Lotin → Kirill':'Kirill → Lotin');
 $('batch-list').replaceChildren();const rows=files.map(file=>{const li=document.createElement('li'),name=document.createElement('strong'),status=document.createElement('span'),actions=document.createElement('div');const meter=document.createElement('progress');meter.max=100;meter.value=0;meter.setAttribute('aria-label',file.name+' jarayoni');name.textContent=file.name;status.textContent='Navbatda';li.append(name,status,meter,actions);$('batch-list').append(li);return {li,status,meter,actions};});
 setBusy(true);let done=0,failed=0;
 try{batchResults=await batch.convertBatch(files,current,{ocr:$('ocr-enabled').checked,ocrLanguage:$('ocr-language').value},event=>{
  const row=rows[event.index];row.li.dataset.state=event.state;row.meter.value=event.state==='done'?100:(event.value??row.meter.value);if(event.state==='error')row.meter.hidden=true;
  if(event.state==='done'){done++;row.status.textContent=event.result.warnings.length?'Tayyor · '+event.result.warnings.join(' '):'Tayyor';const button=document.createElement('button');button.type='button';button.className='text-button';button.textContent='Yuklab olish';button.onclick=()=>download(event.result.blob,event.result.filename);row.actions.append(button);}
  else if(event.state==='error'){failed++;row.status.textContent=event.message;}
  else row.status.textContent=(event.stage==='converting'?'O‘girilmoqda · ':'O‘qilmoqda · ')+event.message;
  $('batch-status').textContent=`${done} tayyor · ${failed} xato · ${files.length} fayl`;
 },()=>stopBatch);
 if(stopBatch)for(const row of rows)if(!row.li.dataset.state){row.status.textContent='O‘tkazib yuborildi';row.meter.hidden=true;}
 $('batch-status').textContent=`${stopBatch?'Navbat to‘xtatildi':'Navbat tugadi'}: ${done} tayyor, ${failed} xato.`;
 }catch(e){showError(e);}finally{setBusy(false);$('batch-stop').hidden=true;$('batch-download').disabled=!batchResults.length;}
}
$('batch-stop').onclick=()=>{stopBatch=true;$('batch-stop').disabled=true;$('batch-status').textContent='Joriy fayl tugagach navbat to‘xtaydi…';};
$('batch-download').onclick=async()=>{if(!batchResults.length||busy)return;setBusy(true);$('batch-download').disabled=true;try{const {batchZip}=await import('./batch.mjs?v=2');download(await batchZip(batchResults),'alifbom-hujjatlar.zip');$('batch-status').textContent='ZIP tayyor — '+batchResults.length+' ta hujjat.';}catch(e){showError(e);}finally{setBusy(false);$('batch-download').disabled=!batchResults.length;}};

$('restore-text').onclick=()=>{if(mode!=='text'||$('input').value||!clearedText)return;$('input').value=manualText=clearedText;clearedText='';update();$('input').focus();$('status').textContent='Matn qaytarildi.';};
$('paste-text').onclick=async()=>{
 if(mode!=='text'||pastePending)return;
 const input=$('input'),original=input.value,start=input.selectionStart,end=input.selectionEnd;
 pastePending=true;$('paste-text').disabled=true;
 try{
  const text=await navigator.clipboard.readText();
  if(mode!=='text'||input.value!==original)return;
  if(!text){$('status').textContent='Nusxalash buferida matn yo‘q.';return;}
  input.value=original.slice(0,start)+text+original.slice(end);manualText=input.value;
  update();input.focus();input.setSelectionRange(start+text.length,start+text.length);
 }catch{if(mode==='text'){input.focus();$('status').textContent='Joylashtirish uchun Ctrl+V yoki ⌘V bosing. Telefonda matn maydonini bosib turing.';}}
 finally{pastePending=false;$('paste-text').disabled=false;}
};
