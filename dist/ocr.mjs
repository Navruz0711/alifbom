let library;
async function load(){if(globalThis.Tesseract)return globalThis.Tesseract;if(!library)library=new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=new URL('./vendor/ocr/tesseract.min.js',import.meta.url).href;s.onload=()=>resolve(globalThis.Tesseract);s.onerror=()=>{library=null;s.remove();reject(new Error('OCR moduli yuklanmadi. Internetni tekshirib, qayta urinib ko‘ring.'));};document.head.append(s);});return library;}
export async function createOcr(language,progress){
 const Tesseract=await load();progress(10,'OCR moduli yuklanmoqda (birinchi marta biroz vaqt oladi)…');
 const worker=await Tesseract.createWorker(language==='uzb_cyrl'?'uzb_cyrl':'uzb',1,{workerPath:new URL('./vendor/ocr/worker.min.js',import.meta.url).href,corePath:new URL('./vendor/ocr/core/',import.meta.url).href,langPath:new URL('./vendor/ocr/lang',import.meta.url).href,gzip:false,logger:m=>{if(m.status==='recognizing text')progress(15+Math.round(m.progress*60),'OCR: '+Math.round(m.progress*100)+'%');}});
 await worker.setParameters({preserve_interword_spaces:'1'});
 return {recognize:async canvas=>{const result=await worker.recognize(canvas);return result.data.text.trim();},close:()=>worker.terminate()};
}
