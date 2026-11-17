(()=>{
const D=document,$=(s,r=D)=>r.querySelector(s),$$=(s,r=D)=>[...r.querySelectorAll(s)];
const g=$('#grid'),RM=matchMedia('(prefers-reduced-motion: reduce)').matches,G=window.gsap,ST=window.ScrollTrigger;
const data=$$('.pp-c',g).map(c=>({img:$('img',c).getAttribute('src'),n:$('.pp-m b',c).textContent,s:$('.pp-s',c).textContent,y:$('.pp-y',c).textContent,t:c.dataset.t}));
const pad=i=>String(i+1).padStart(2,'0');
let filt='all';const list=()=>data.filter(d=>filt==='all'||d.t.split(' ').includes(filt));
const pop=(els,o={})=>{if(G&&!RM&&els.length)G.from(els,Object.assign({y:50,opacity:0,duration:1,ease:'expo.out',stagger:.06},o))};

/* ---- bento × accordion ---- */
const M=$('.pv-m');
const onM=()=>{const L=list();const rows=[];let i=0,r=0;const sizes=[3,2,3,2];
  while(i<L.length){const n=sizes[r%sizes.length];rows.push(L.slice(i,i+n).map((d,k)=>({d,i:i+k})));i+=n;r++}
  M.innerHTML=rows.map((row,ri)=>{let s=row.map(({d,i},k)=>`<a class="pv-m-t${row.length===2&&k===0?' w2':''}" data-i="${data.indexOf(d)}" href="#"><img src="${d.img}" alt="${d.n}"><span class="pv-m-n">${pad(i)}</span><span class="pv-m-v">${pad(i)} ${d.n}</span><span class="pv-m-c"><b>${d.n}</b><span class="d">${d.s} - ${d.y}</span></span></a>`).join('');
    if(ri===0)s='<div class="pv-m-k"><span>Sélection</span><b>'+String(L.length).padStart(2,'0')+'<br>projets</b><span>2024 - 2025</span></div>'+s;
    if(ri===2)s+='<div class="pv-m-k o"><span>Studio</span><b style="font-size:clamp(24px,2.2vw,36px)">Web<br>Contenu<br>Marque</b><span>Belgique</span></div>';
    return '<div class="pv-m-r">'+s+'</div>'}).join('');
  const ts=$$('.pv-m-t',M);ts.forEach(t=>t.addEventListener('click',e=>{e.preventDefault();if(matchMedia('(max-width:899px)').matches&&!t.classList.contains('on')){ts.forEach(x=>x.classList.toggle('on',x===t));return}window.__e8Open&&window.__e8Open(+t.dataset.i)}));
  pop($$('.pv-m-r>*',M),{scale:.94,y:30,stagger:.035})};
const offM=()=>{};

/* ---- init + filters ---- */
onM();ST&&ST.refresh();
$$('.pp-f button').forEach(b=>b.addEventListener('click',()=>{filt=b.dataset.f;onM();ST&&ST.refresh()}));
D.addEventListener('click',e=>{const a=e.target.closest('.pv a[href="#"]');if(a)e.preventDefault()});
})();
