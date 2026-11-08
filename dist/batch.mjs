import {readFile,convertFile,getZip} from './file-engine.mjs?v=13';
export function validateBatch(files){if(!files.length)throw Error('Fayl tanlang.');if(files.length>10)throw Error('Bir navbatda 10 tagacha fayl tanlang.');if(files.reduce((n,f)=>n+f.size,0)>50*1024*1024)throw Error('Navbatning umumiy hajmi 50 MB dan oshmasin.');}
export async function convertBatch(files,direction,options={},onUpdate=()=>{},cancelled=()=>false){
 validateBatch(files);const results=[];let bytes=0;
 for(let i=0;i<files.length;i++){
  if(cancelled())break;
  const file=files[i];onUpdate({index:i,state:'running',message:'Fayl ochilmoqda…'});
  try{
   const reading=(value,message)=>onUpdate({index:i,state:'running',stage:'reading',value:Math.max(0,Math.min(100,value))*0.5,message});
   const converting=(value,message)=>onUpdate({index:i,state:'running',stage:'converting',value:50+Math.max(0,Math.min(100,value))*0.5,message});
   const doc=await readFile(file,reading,options);
   converting(0,'Matn tayyorlanmoqda…');
   const out=await convertFile(doc,direction,converting);
   if(bytes+out.blob.size>80*1024*1024)throw Error('Natijalar hajmi 80 MB chegarasiga yetdi. Fayllarni kichikroq guruhlarga ajrating.');
   bytes+=out.blob.size;
   const result={index:i,name:file.name,...out,warnings:[...(doc.warnings||[]),...(out.warnings||[])]};results.push(result);onUpdate({index:i,state:'done',result});
  }catch(error){onUpdate({index:i,state:'error',message:error.message||'Fayl o‘girilmadi.'});}
 }
 return results;
}
export async function batchZip(results){const JSZip=await getZip(),zip=new JSZip();for(let i=0;i<results.length;i++){const r=results[i];const name=r.filename.replace(/[\\/\x00-\x1f]/g,'_');zip.file(String(i+1).padStart(2,'0')+'-'+name,await r.blob.arrayBuffer());}return zip.generateAsync({type:'blob',compression:'DEFLATE',compressionOptions:{level:3}});}
