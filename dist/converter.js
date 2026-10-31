(function(root){
const apostrophes="'‘’ʻʼ`´ʹ＇";
const cyr={а:'a',б:'b',в:'v',г:'g',д:'d',ж:'j',з:'z',и:'i',й:'y',к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'x',ч:'ch',ш:'sh',щ:'sh',э:'e',ю:'yu',я:'ya',ё:'yo',ў:'o‘',қ:'q',ғ:'g‘',ҳ:'h',ъ:'’',ь:'',ы:'i'};
const lat={a:'а',b:'б',d:'д',f:'ф',g:'г',h:'ҳ',i:'и',j:'ж',k:'к',l:'л',m:'м',n:'н',o:'о',p:'п',q:'қ',r:'р',s:'с',t:'т',u:'у',v:'в',x:'х',y:'й',z:'з',sh:'ш',ch:'ч',yo:'ё',yu:'ю',ya:'я',ye:'е',ts:'ц'};
function caseLike(value,source,upper){if(source[0]===source[0].toLowerCase())return value;return upper?value.toUpperCase():value.charAt(0).toUpperCase()+value.slice(1);}
function segments(text,mode=false){
 const pattern=mode==='cyr-lat'?/[А-Яа-яЁёЎўҚқҒғҲҳ]/g:mode==='lat-cyr'?/[yY][oO]['‘’ʻʼ`´ʹ＇]|[gGoO]['‘’ʻʼ`´ʹ＇]|sh|ch|yo|yu|ya|ye|ts|[a-zA-Z]|['‘’ʻʼ`´ʹ＇]/gi:mode===true?/[ğĞöÖşŞçÇ]/g:/[gGoO]['‘’ʻʼ`´ʹ＇]|sh|ch/gi;
 const ranges=Array.from(text.matchAll(/[\p{L}‘’ʻʼ']+/gu),m=>({start:m.index,end:m.index+m[0].length,upper:m[0].length>1&&m[0]===m[0].toUpperCase()}));
 const parts=[];let cursor=0,wordIndex=0;
 for(const m of text.matchAll(pattern)){
  if(m.index>cursor)parts.push({start:cursor,end:m.index,text:text.slice(cursor,m.index),changed:false});
  while(wordIndex<ranges.length&&ranges[wordIndex].end<=m.index)wordIndex++;
  const upper=!!(ranges[wordIndex]?.start<=m.index&&ranges[wordIndex].upper);
  const s=m[0],low=s.toLowerCase(),prev=text[m.index-1]||'';let out=s;
  if(mode==='cyr-lat'){
   let value=cyr[low];
   if(low==='с'&&text[m.index+1]?.toLowerCase()==='ҳ')value='s’';
   if(low==='е')value=!prev||!/[\p{L}]/u.test(prev)||/[аеёиоуыэюяўъь]/i.test(prev)?'ye':'e';
   if(low==='ц')value=/[аеёиоуыэюяў]/i.test(prev)?'ts':'s';
   out=caseLike(value??s,s,upper);
  }else if(mode==='lat-cyr'){
   let value=lat[low];
   if(low.startsWith('yo')&&apostrophes.includes(low[2]))value='йў';
   else if(low.length===2&&apostrophes.includes(low[1]))value=low[0]==='g'?'ғ':'ў';
   if(apostrophes.includes(low))value='ъ';
   if(low==='e')value=!prev||!/[a-z‘’ʻʼ']/i.test(prev)||/[aeiou]/i.test(prev)?'э':'е';
   if(low==='ye'&&prev&&/[a-z]/i.test(prev)&&!/[aeiou]/i.test(prev))value='ъе';
   out=caseLike(value??s,s,upper);
  }else if(mode===true){
   const map={'ğ':'g‘','Ğ':'G‘','ö':'o‘','Ö':'O‘','ş':'sh','ç':'ch'};
   out=s==='Ş'||s==='Ç'?caseLike(s==='Ş'?'sh':'ch',s,upper):map[s];
  }else out=low==='sh'?(s[0]==='S'?'Ş':'ş'):low==='ch'?(s[0]==='C'?'Ç':'ç'):({g:'ğ',G:'Ğ',o:'ö',O:'Ö'})[s[0]];
  parts.push({start:m.index,end:m.index+s.length,text:out,changed:out!==s});cursor=m.index+s.length;
 }
 if(cursor<text.length)parts.push({start:cursor,end:text.length,text:text.slice(cursor),changed:false});
 return parts;
}
root.conversionSegments=segments;
root.convert=(text,mode=false)=>segments(text.normalize('NFC'),mode).map(p=>p.text).join('');
})(typeof module!=='undefined'?module.exports:window);
