const assert=require('node:assert/strict');const {convert,conversionSegments}=require('../dist/converter.js');
const cases=[
 ['Ўзбекистон, шаҳар, ғоя, қуёш','cyr-lat','O‘zbekiston, shahar, g‘oya, quyosh'],
 ['O‘zbekiston, shahar, g‘oya, quyosh','lat-cyr','Ўзбекистон, шаҳар, ғоя, қуёш'],
 ['ШАҲАР ЧИРОЙ ЎЗБЕК ҒАЙРАТ','cyr-lat','SHAHAR CHIROY O‘ZBEK G‘AYRAT'],
 ['Ер, поезд, Эшик','cyr-lat','Yer, poyezd, Eshik'],
 ['Yer, poyezd, Eshik','lat-cyr','Ер, поезд, Эшик'],
 ['Is’hoq ma’no','lat-cyr','Исъҳоқ маъно'],
 ['O\'zbekiston SHAHAR chiroy',false,'Özbekiston ŞAHAR çiroy'],
 ['ŞAHAR ÇIROY',true,'SHAHAR CHIROY'],
 ['<img src=x> 123\nЎзбек','cyr-lat','<img src=x> 123\nO‘zbek'],
 ['😀 Ў, Қ, Ғ, Ҳ','cyr-lat','😀 O‘, Q, G‘, H'],
 ['Yo‘l, yo‘q, yo‘nalish, bo‘yoq, yosh','lat-cyr','Йўл, йўқ, йўналиш, бўёқ, ёш'],
 ['YO‘L, YO‘Q, YO‘NALISH','lat-cyr','ЙЎЛ, ЙЎҚ, ЙЎНАЛИШ'],
 ['Исҳоқ, мусҳаф, асҳоб','cyr-lat','Is’hoq, mus’haf, as’hob'],
 ['obyekt, subyekt','lat-cyr','объект, субъект']
];for(const [input,mode,expected] of cases)assert.equal(convert(input,mode),expected);
for(const [input,mode] of cases){const pieces=conversionSegments(input,mode);assert.equal(pieces.map(p=>input.slice(p.start,p.end)).join(''),input);assert.equal(pieces.map(p=>p.text).join(''),convert(input,mode));}
console.log(`PASS ${cases.length} transliteration cases and lossless segment coverage`);
