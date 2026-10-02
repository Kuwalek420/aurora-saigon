const sharp=require('sharp'),fs=require('fs');
const GROUND=[244,240,235];
const rows=JSON.parse(JSON.parse(fs.readFileSync('audit/results.json','utf8')));
const lum=(r,g,b)=>0.299*r+0.587*g+0.114*b;
(async()=>{
 const out=[];
 for(const r of rows){
  const {data,info}=await sharp(r.file).removeAlpha().raw().toBuffer({resolveWithObject:true});
  const W=info.width,H=info.height;const px=(x,y)=>{const k=(Math.min(H-1,Math.max(0,y))*W+Math.min(W-1,Math.max(0,x)))*3;return [data[k],data[k+1],data[k+2]]};
  const [L,T,SW,SH]=r.rect;
  // (a) left margin vs right panel vs modal ground
  const left=px(24,H-120), right=px(W-30,H-60);
  const gdiff=Math.max(...left.map((v,i)=>Math.abs(v-GROUND[i])),...right.map((v,i)=>Math.abs(v-GROUND[i])));
  // (b) photo backdrop (brighter 40% of the band 11-16% inside the stage) vs ground
  const band=[];
  for(let y=T;y<T+SH;y++)for(let x=L;x<L+SW;x++){const e=Math.min(x-L,y-T,L+SW-1-x,T+SH-1-y)/SW;if(e>=0.11&&e<=0.16){const p=px(x,y);band.push([...p,lum(...p)])}}
  band.sort((a,b)=>b[3]-a[3]);const top=band.slice(0,Math.floor(band.length*0.4));
  const bd=[0,1,2].map(c=>top.reduce((s,q)=>s+q[c],0)/top.length);
  const bdiff=Math.max(...bd.map((v,i)=>Math.abs(v-GROUND[i])));
  // (c) hard edge test: pixels 2px inside the stage boundary vs 2px outside, all four sides
  let ed=0,en=0;
  for(let t=0;t<SW;t+=3){for(const [x1,y1,x2,y2] of [[L+t,T+2,L+t,T-3],[L+t,T+SH-3,L+t,T+SH+2],[L+2,T+t,L-3,T+t],[L+SW-3,T+t,L+SW+2,T+t]]){const a=px(x1,y1),b=px(x2,y2);ed+=Math.max(...a.map((v,i)=>Math.abs(v-b[i])));en++}}
  // (d) darkest 12% top strip vs ground (shadow band visibility)
  let tl=0,tn=0;for(let y=T+Math.round(SH*0.11);y<T+Math.round(SH*0.2);y+=2)for(let x=L+Math.round(SW*0.2);x<L+Math.round(SW*0.8);x+=4){const p=px(x,y);tl+=lum(...p);tn++}
  out.push({metal:r.metal,view:r.tab,groundΔ:gdiff,backdropΔ:+bdiff.toFixed(1),hardEdge:+(ed/en).toFixed(2),topStripΔlum:+(GROUND.reduce((a,v,i)=>a+v*[.299,.587,.114][i],0)-tl/tn).toFixed(1),gain:r.gain.join('/'),fade:r.topFade.includes('36%')?'long':'std',layers:r.layers,zoom:r.transform,stageBg:r.stageBg,border:r.stageBorder});
 }
 console.table(out.map(o=>({metal:o.metal,view:o.view,'ground Δ':o.groundΔ,'backdrop Δ':o.backdropΔ,'edge step':o.hardEdge,'top strip Δlum':o.topStripΔlum,fade:o.fade,layers:o.layers,zoom:o.zoom})));
 const worst=a=>Math.max(...out.map(o=>o[a]));
 console.log('worst: ground',worst('groundΔ'),'| backdrop',worst('backdropΔ'),'| hard edge',worst('hardEdge'));
 console.log('stage bg/border:',[...new Set(out.map(o=>o.stageBg+' / '+o.border))].join(' ; '));
})()
