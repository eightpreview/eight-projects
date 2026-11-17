(()=>{
const D=document,H=D.documentElement,$=(s,r=D)=>r.querySelector(s),$$=(s,r=D)=>[...r.querySelectorAll(s)];
const RM=matchMedia('(prefers-reduced-motion: reduce)').matches;

/* curved carousel */
const ring=$('.ring'),cards=ring?$$('.card',ring):[];
if(ring&&cards.length){
  let off=0,vel=RM?0:.35,drag=null,hover=false,last=performance.now(),boost=0;window.__e8Ring={kick:v=>{boost=Math.max(-40,Math.min(40,v))}};
  const layout=()=>{const W=ring.clientWidth,cw=cards[0].offsetWidth,step=cw*1.06,total=step*cards.length,half=W/2+cw;
    cards.forEach((c,i)=>{let x=((i*step+off)%total+total)%total-total/2;const n=Math.max(-1.25,Math.min(1.25,x/(W/2)));
      const z=Math.pow(Math.abs(n),2)*Math.min(260,W*.18),r=-n*34;
      c.style.transform=`translate3d(${x}px,0,${z}px) rotateY(${r}deg)`;c.style.zIndex=Math.round(z);c.style.visibility=Math.abs(x)>half+cw?'hidden':'visible'})};
  const tick=t=>{const dt=Math.min(50,t-last);last=t;boost*=.94;if(!drag)off-=((hover?vel*.25:vel)+boost)*dt/16;layout();requestAnimationFrame(tick)};
  ring.addEventListener('pointerdown',e=>{drag={x:e.clientX,o:off};ring.classList.add('drag');ring.setPointerCapture(e.pointerId)});
  ring.addEventListener('pointermove',e=>{if(drag)off=drag.o+(e.clientX-drag.x)*1.2});
  const end=()=>{drag=null;ring.classList.remove('drag')};ring.addEventListener('pointerup',end);ring.addEventListener('pointercancel',end);
  ring.addEventListener('pointerenter',()=>hover=true);ring.addEventListener('pointerleave',()=>hover=false);
  addEventListener('resize',layout);layout();requestAnimationFrame(tick);
}

/* hero tile — cycles through projects */
const tile=$('.h-tile');
if(tile){const im=$$('.h-img img',tile),nm=$('.h-name',tile),ix=$('.h-ix',tile),N=im.length;let k=0,paused=false;
  const show=i=>{k=(i+N)%N;im.forEach((x,j)=>x.classList.toggle('on',j===k));nm.textContent=im[k].dataset.n;ix.textContent=String(k+1).padStart(2,'0')+' / '+String(N).padStart(2,'0')};
  tile.addEventListener('pointerenter',()=>paused=true);tile.addEventListener('pointerleave',()=>paused=false);
  if(!RM)setInterval(()=>{if(!paused)show(k+1)},2600)}

/* menu (mobile) */
const mb=$('.nb-m');
const setMenu=o=>{H.classList.toggle('mopen',o);mb.setAttribute('aria-expanded',o);mb.textContent=o?'Fermer':'Menu';D.body.style.overflow=o?'hidden':''};
if(mb){mb.addEventListener('click',()=>setMenu(!H.classList.contains('mopen')));
  $$('.menu a').forEach(a=>a.addEventListener('click',()=>setMenu(false)));
  D.addEventListener('keydown',e=>{if(e.key==='Escape')setMenu(false)})}


/* contact form */
const f=$('.cform');if(f){const err=$('.cf-err',f);
  $$('.chip',f).forEach(c=>c.addEventListener('click',()=>c.setAttribute('aria-pressed',c.getAttribute('aria-pressed')!=='true')));
  f.addEventListener('submit',e=>{e.preventDefault();const em=f.email,ms=f.message,bad=[];
    [em,ms].forEach(x=>x.closest('.cf').classList.remove('bad'));
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em.value.trim()))bad.push(em);
    if(ms.value.trim().length<3)bad.push(ms);
    if(bad.length){bad.forEach(x=>x.closest('.cf').classList.add('bad'));err.textContent=bad[0]===em?'Merci d’indiquer une adresse e-mail valide.':'Écrivez-nous quelques mots.';bad[0].focus();return}
    err.textContent='';
    const btn=$('.send',f);btn.disabled=true;
    fetch('/api/contact',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({
      email:em.value.trim(),message:ms.value.trim(),website:(f.website&&f.website.value)||'',
      needs:$$('.chip[aria-pressed="true"]',f).map(c=>c.textContent.trim())})})
    .then(r=>r.json().catch(()=>({})).then(d=>{if(!r.ok)throw new Error(d.error||'Erreur');f.classList.add('sent')}))
    .catch(x=>{err.textContent=x.message==='Failed to fetch'?'Connexion impossible, réessayez.':x.message;btn.disabled=false})})}

/* nav: background after hero, hide on scroll down, active link */
const nb=$('#nb'),hero=$('.hero'),links=$$('.nb-l a');let ly=0;
const onS=()=>{const y=scrollY;nb.classList.toggle('nb-on',y>hero.offsetHeight*.55);ly=y;
  let cur=null;links.forEach(a=>{const t=$(a.getAttribute('href'));if(t&&t.getBoundingClientRect().top<innerHeight*.4)cur=a});links.forEach(a=>a.classList.toggle('act',a===cur));const ind=$('.nb-ind');if(ind){if(cur){ind.parentNode.dataset.a=links.indexOf(cur);ind.style.opacity=1;ind.style.width=cur.offsetWidth+'px';ind.style.transform='translateX('+cur.offsetLeft+'px)'}else ind.style.opacity=0}};
addEventListener('scroll',onS,{passive:true});onS();
})();



