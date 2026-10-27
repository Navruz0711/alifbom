(function(root){
function convert(text,reverse=false){
 text=text.normalize('NFC');
 if(reverse){const map={'ğ':'g‘','Ğ':'G‘','ö':'o‘','Ö':'O‘','ş':'sh','ç':'ch'};return text.replace(/[ğĞöÖşŞçÇ]/g,(c,i)=>{if(c==='Ş'||c==='Ç'){const word=text.slice(i).match(/^\p{L}+/u)?.[0]||c;const upper=word.length>1&&word===word.toUpperCase();return c==='Ş'?(upper?'SH':'Sh'):(upper?'CH':'Ch');}return map[c];});}
 return text.replace(/[gGoO]['‘’ʻʼ`´ʹ＇]/g,s=>({g:'ğ',G:'Ğ',o:'ö',O:'Ö'})[s[0]]).replace(/sh|ch/gi,s=>s[0]==='s'?'ş':s[0]==='S'?'Ş':s[0]==='c'?'ç':'Ç');
}
root.convert=convert;
})(typeof module!=='undefined'?module.exports:window);
