const WORD='http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const DRAW='http://schemas.openxmlformats.org/drawingml/2006/main';
const MAX_FILE=20*1024*1024, MAX_EXPANDED=80*1024*1024, MAX_TEXT=1000000;
const fail=message=>{throw new Error(message)};
function xml(source){if(/<!DOCTYPE/i.test(source))fail('Hujjat XML tuzilishi qo‘llab-quvvatlanmaydi.');const doc=new DOMParser().parseFromString(source,'application/xml');if(doc.getElementsByTagName('parsererror').length)fail('Hujjatdagi matn tuzilishi buzilgan.');return doc;}
function checkZip(buffer){
 const bytes=new DataView(buffer);let end=-1;
 for(let i=bytes.byteLength-22;i>=Math.max(0,bytes.byteLength-65557);i--){if(bytes.getUint32(i,true)===0x06054b50){end=i;break;}}
 if(end<0)fail('Fayl buzilgan yoki parol bilan himoyalangan.');
 const count=bytes.getUint16(end+10,true);let pos=bytes.getUint32(end+16,true),size=0;
 if(count>10000||count===65535)fail('Hujjat juda murakkab. Kichikroq fayl tanlang.');
 for(let i=0;i<count;i++){
  if(pos+46>bytes.byteLength||bytes.getUint32(pos,true)!==0x02014b50)fail('Hujjat arxivi noto‘g‘ri.');
  if(bytes.getUint16(pos+8,true)&1)fail('Parolli hujjatni parolsiz saqlab qayta yuklang.');
  size+=bytes.getUint32(pos+24,true);if(size>MAX_EXPANDED)fail('Hujjatning ochilgan hajmi juda katta (80 MB dan ortiq).');
  pos+=46+bytes.getUint16(pos+28,true)+bytes.getUint16(pos+30,true)+bytes.getUint16(pos+32,true);
 }
}
function nearestParagraph(node){for(let p=node.parentElement;p;p=p.parentElement)if(p.localName==='p'&&(p.namespaceURI===WORD||p.namespaceURI===DRAW))return p;return null;}
// Breaks and tabs separate runs; digraphs may span runs but never paragraphs or breaks.
function groups(doc){const output=[];for(const p of doc.getElementsByTagName('*')){
 if(p.localName!=='p'||![WORD,DRAW].includes(p.namespaceURI))continue;
 const parts=[];for(const n of p.getElementsByTagName('*')){
  if(nearestParagraph(n)!==p)continue;
  if(n.localName==='t'&&[WORD,DRAW].includes(n.namespaceURI))parts.push({node:n,text:n.textContent});
  else if(['br','cr','tab'].includes(n.localName)&&[WORD,DRAW].includes(n.namespaceURI))parts.push({node:null,text:n.localName==='tab'?'\t':'\n'});
 }if(parts.length)output.push(parts);
 }return output;}
export function convertParts(parts,reverse){
 const source=parts.map(x=>x.text).join('');const owners=[];parts.forEach((p,i)=>{for(let j=0;j<p.text.length;j++)owners.push(i)});
 const result=parts.map(()=>'');
 for(const part of globalThis.conversionSegments(source,reverse)){
  if(part.changed)result[owners[part.start]]+=part.text;
  else for(let i=part.start;i<part.end;i++)result[owners[i]]+=source[i];
 }
 return result;
}
let zipLoad;
async function getZip(){if(globalThis.JSZip)return globalThis.JSZip;if(!zipLoad)zipLoad=new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='vendor/jszip.min.js';s.onload=()=>resolve(globalThis.JSZip);s.onerror=()=>{zipLoad=null;s.remove();reject(new Error('Hujjat moduli yuklanmadi. Sahifani yangilab qayta urinib ko‘ring.'));};document.head.append(s);});return zipLoad;}
export async function readFile(file,progress=()=>{},options={}){
 const ext=file.name.split('.').pop().toLowerCase();if(!['pdf','docx','pptx','txt'].includes(ext))fail('PDF, DOCX, PPTX yoki TXT fayl tanlang. Eski DOC/PPT faylini avval DOCX/PPTX qilib saqlang.');
 if(!file.size)fail('Fayl bo‘sh. Boshqa hujjat tanlang.');if(file.size>MAX_FILE)fail('Fayl 20 MB dan katta. Kichikroq fayl tanlang.');
 const buffer=await file.arrayBuffer();progress(10,'Fayl o‘qilmoqda…');
 if(ext==='txt'){const text=new TextDecoder('utf-8',{fatal:true}).decode(buffer);if(!text.trim())fail('Faylda matn topilmadi.');if(text.length>MAX_TEXT)fail('Matn juda uzun. Faylni qismlarga ajrating.');return {ext,name:file.name,text,warnings:[]};}
 if(ext==='pdf'){
  const pdfjs=await import('./vendor/pdfjs/pdf.min.mjs');pdfjs.GlobalWorkerOptions.workerSrc=new URL('./vendor/pdfjs/pdf.worker.min.mjs',import.meta.url).href;
  let pdf,loading;try{loading=pdfjs.getDocument({data:new Uint8Array(buffer),isEvalSupported:false,cMapUrl:new URL('./vendor/pdfjs/cmaps/',import.meta.url).href,cMapPacked:true,standardFontDataUrl:new URL('./vendor/pdfjs/standard_fonts/',import.meta.url).href,wasmUrl:new URL('./vendor/pdfjs/wasm/',import.meta.url).href});pdf=await loading.promise;}catch(e){if(loading)await loading.destroy();if(e.name==='PasswordException')fail('PDF parol bilan himoyalangan. Parolsiz nusxasini yuklang.');fail('PDF ochilmadi. Fayl to‘g‘riligini tekshiring.');}
  try{
   if(pdf.numPages>300)fail('PDF 300 sahifadan katta. Uni qismlarga ajrating.');
   const pages=[];let blank=0,total=0,ocrCount=0;let ocr;
   try {
   for(let i=1;i<=pdf.numPages;i++){
    progress(10+Math.round(i/pdf.numPages*70),`${i} / ${pdf.numPages} sahifa o‘qilmoqda`);
    const page=await pdf.getPage(i),content=await page.getTextContent();let text='',last;
    for(const item of content.items){if(!('str'in item))continue;const y=item.transform[5],x=item.transform[4];
     if(last&&Math.abs(y-last.y)>Math.max(2,item.height*.45)&&!text.endsWith('\n'))text+='\n';
     else if(last&&x-last.end>Math.max(1,item.height*.15)&&!/[\s]$/.test(text))text+=' ';
     text+=item.str;if(item.hasEOL)text+='\n';last={y,end:x+item.width};
    }
    text=text.trim();
    if(!text&&options.ocr){
     if(++ocrCount>10)fail('OCR bir faylda 10 ta skanerlangan sahifagacha ishlaydi. PDF’ni qismlarga ajrating.');
     if(!ocr){const {createOcr}=await import('./ocr.mjs');ocr=await createOcr(options.ocrLanguage||'uzb',progress);}
     const natural=page.getViewport({scale:1});const scale=Math.min(2,2200/Math.max(natural.width,natural.height));
     const viewport=page.getViewport({scale}),canvas=document.createElement('canvas');canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);
     try{await page.render({canvasContext:canvas.getContext('2d'),viewport}).promise;progress(15,`${i}-sahifa: rasmdagi matn o‘qilmoqda…`);text=await ocr.recognize(canvas);}finally{canvas.width=canvas.height=1;}
    }
    if(!text)blank++;pages.push(text);total+=text.length;if(total>MAX_TEXT)fail('PDF matni juda uzun. Uni qismlarga ajrating.');page.cleanup();
   }
   const text=pages.join('\n\n');if(!text.trim())fail('PDF’da o‘qiladigan matn topilmadi. Skanerlangan PDF uchun OCR’ni yoqing va faylni qayta tanlang.');
   return {ext,name:file.name,text,pageTexts:pages,pages:pdf.numPages,warnings:[...(blank?[`${blank} ta sahifada matn topilmadi; ular skanerlangan yoki bo‘sh bo‘lishi mumkin.`]:[]),...(ocrCount?[`${ocrCount} ta sahifa OCR orqali o‘qildi. Harflar, raqamlar va ismlarni tekshiring.`]:[])]};
   }finally{if(ocr)await ocr.close();}
  }finally{await loading.destroy();}
 }
 checkZip(buffer);const JSZip=await getZip();let zip;try{zip=await JSZip.loadAsync(buffer);}catch{fail('Hujjat ochilmadi. Fayl buzilgan yoki parol bilan himoyalangan.');}
 const main=ext==='docx'?'word/document.xml':'ppt/presentation.xml';if(!zip.file(main))fail('Fayl ichidagi format uning kengaytmasiga mos emas.');
 const paths=Object.keys(zip.files).filter(p=>ext==='docx'?/^word\/(document|header\d+|footer\d+|footnotes|endnotes|comments)\.xml$/.test(p):/^ppt\/(slides\/slide\d+|notesSlides\/notesSlide\d+|slideLayouts\/slideLayout\d+|slideMasters\/slideMaster\d+)\.xml$/.test(p)).sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));
 // Presentation order comes from relationships, not slide filename order.
 let previewPaths=ext==='docx'?['word/document.xml']:paths.filter(p=>/^ppt\/slides\/slide\d+\.xml$/.test(p));
 if(ext==='pptx'&&zip.file('ppt/_rels/presentation.xml.rels')){
  const rels=xml(await zip.file('ppt/_rels/presentation.xml.rels').async('string'));const relMap=new Map(Array.from(rels.getElementsByTagName('*')).filter(n=>n.localName==='Relationship').map(n=>[n.getAttribute('Id'),new URL(n.getAttribute('Target'),'https://local/ppt/presentation.xml').pathname.slice(1)]));
  const pres=xml(await zip.file(main).async('string'));const ids=Array.from(pres.getElementsByTagName('*')).filter(n=>n.localName==='sldId');const ordered=ids.map(n=>relMap.get(n.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships','id'))).filter(p=>previewPaths.includes(p));if(ordered.length===previewPaths.length)previewPaths=ordered;
 }
 const parts=[];let total=0;
 for(let i=0;i<paths.length;i++){const path=paths[i],source=await zip.file(path).async('string');total+=source.length;if(total>20*1024*1024)fail('Hujjatdagi matn tuzilishi juda katta.');const doc=xml(source);const text=groups(doc).map(g=>g.map(p=>p.text).join('')).join('\n');parts.push({path,source,text});progress(15+Math.round(i/paths.length*60),'Hujjat matni ajratilmoqda…');}
 const text=previewPaths.map(path=>parts.find(p=>p.path===path)?.text||'').join('\n\n');if(!text.trim())fail('Hujjatning asosiy qismida matn topilmadi. Rasmlar ichidagi matn o‘girilmaydi.');if(text.length>MAX_TEXT)fail('Matn juda uzun. Hujjatni qismlarga ajrating.');
 return {ext,name:file.name,text,zip,parts,pages:ext==='pptx'?previewPaths.length:undefined,warnings:[]};
}
export async function convertFile(document,reverse,progress=()=>{}){
 const text=globalThis.convert(document.text,reverse),base=document.name.replace(/\.[^.]+$/,'');
 if(document.ext==='pdf'){const {createPdf}=await import('./pdf-export.mjs?v=7');const pages=(document.pageTexts||[document.text]).map(page=>globalThis.convert(page,reverse));const result=await createPdf(pages,progress);return {...result,text,filename:base+'-alifbo.pdf'};}
 if(!document.zip)return {text,blob:new Blob([text],{type:'text/plain;charset=utf-8'}),filename:base+'-alifbo.txt'};
 const zip=document.zip.clone();
 for(let i=0;i<document.parts.length;i++){
  const part=document.parts[i],doc=xml(part.source);let changed=false;
  for(const g of groups(doc)){const values=convertParts(g,reverse);g.forEach((p,j)=>{if(p.node&&p.text!==values[j]){p.node.textContent=values[j];if(p.node.namespaceURI===WORD)p.node.setAttributeNS('http://www.w3.org/XML/1998/namespace','xml:space','preserve');changed=true;}});}
  if(changed)zip.file(part.path,new XMLSerializer().serializeToString(doc));
  progress(Math.round((i+1)/document.parts.length*70),'Matnlar o‘girilmoqda…');
 }
 const mime=document.ext==='docx'?'application/vnd.openxmlformats-officedocument.wordprocessingml.document':'application/vnd.openxmlformats-officedocument.presentationml.presentation';
 const blob=await zip.generateAsync({type:'blob',mimeType:mime,compression:'DEFLATE',compressionOptions:{level:6}},meta=>progress(70+Math.round(meta.percent*.3),'Yuklab olish uchun tayyorlanmoqda…'));
 return {text,blob,filename:base+'-alifbo.'+document.ext};
}
