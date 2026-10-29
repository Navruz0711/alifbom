const scripts=new Map();
function library(path,name){if(globalThis[name])return Promise.resolve(globalThis[name]);if(!scripts.has(name))scripts.set(name,new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=new URL(path,import.meta.url).href;s.onload=()=>resolve(globalThis[name]);s.onerror=()=>{scripts.delete(name);s.remove();reject(new Error('PDF yaratish moduli yuklanmadi. Sahifani yangilab qayta urinib ko‘ring.'));};document.head.append(s);}));return scripts.get(name);}
// Exported separately for deterministic pagination and Unicode regression tests.
export async function layoutPdf(PDFLib,fontkit,fontBytes,pageTexts,progress=()=>{}){
 const pdf=await PDFLib.PDFDocument.create();pdf.registerFontkit(fontkit);
 const font=await pdf.embedFont(fontBytes,{subset:true,features:{liga:false,clig:false}});
 const supported=new Set(font.getCharacterSet()),missing=new Set();
 const width=595.28,height=841.89,margin=48,size=11,lineHeight=17,maxWidth=width-margin*2;
 let page,y;
 function nextPage(){page=pdf.addPage([width,height]);y=height-margin-size;}
 function draw(line){if(y<margin+lineHeight)nextPage();if(line)page.drawText(line,{x:margin,y,size,font,color:PDFLib.rgb(.12,.16,.14)});y-=lineHeight;}
 function clean(text){return Array.from(text.normalize('NFC').replace(/\t/g,'    ').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,'')).map(c=>{if(c==='\n'||c==='\r'||supported.has(c.codePointAt(0)))return c;missing.add(c);return '?';}).join('');}
 const measure=text=>font.widthOfTextAtSize(text,size);
 function wrap(line){
  if(!line.trim()){draw('');return;}
  let current='';
  for(const word of line.trim().split(/\s+/)){
   const candidate=current?current+' '+word:word;
   if(measure(candidate)<=maxWidth){current=candidate;continue;}
   if(current){draw(current);current='';}
   // Long URLs and identifiers must wrap too, without clipping.
   if(measure(word)>maxWidth){for(const char of Array.from(word)){if(current&&measure(current+char)>maxWidth){draw(current);current='';}current+=char;}}
   else current=word;
  }
  if(current)draw(current);
 }
 for(let i=0;i<pageTexts.length;i++){
  nextPage();for(const line of clean(pageTexts[i]).split(/\r?\n/))wrap(line);
  progress(Math.round((i+1)/pageTexts.length*90),'PDF sahifalari yaratilmoqda…');
  await new Promise(resolve=>setTimeout(resolve,0));
 }
 pdf.setCreator('Alifbo');pdf.setProducer('Alifbo / pdf-lib');
 progress(95,'PDF saqlanmoqda…');const bytes=await pdf.save();
 return {blob:new Blob([bytes],{type:'application/pdf'}),pages:pdf.getPageCount(),warnings:missing.size?[`Shriftda mavjud bo‘lmagan ${missing.size} xil belgi PDF’da “?” bilan almashtirildi. Asl matnni ko‘rish yoki TXT nusxasini olish mumkin.`]:[]};
}
export async function createPdf(pageTexts,progress){
 const [PDFLib,fontkit,response]=await Promise.all([library('./vendor/pdf-lib.min.js','PDFLib'),library('./vendor/fontkit.min.js','fontkit'),fetch(new URL('./vendor/NotoSans-Regular.ttf',import.meta.url))]);
 if(!response.ok)throw new Error('PDF shrifti yuklanmadi. Qayta urinib ko‘ring.');
 return layoutPdf(PDFLib,fontkit,new Uint8Array(await response.arrayBuffer()),pageTexts,progress);
}
