(()=>{
const D=document,H=D.documentElement,$=(s,r=D)=>r.querySelector(s),$$=(s,r=D)=>[...r.querySelectorAll(s)];
if(!window.gsap||!window.ScrollTrigger||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
gsap.registerPlugin(ScrollTrigger);
H.classList.add('gs');
const E='expo.out',fine=matchMedia('(hover:hover)').matches;

/* smooth scroll */
if(window.Lenis){const lenis=new Lenis({lerp:.085,smoothWheel:true});window.__lenis=lenis;lenis.on('scroll',e=>{ScrollTrigger.update();window.__e8Ring&&Math.abs(e.velocity)>.5&&window.__e8Ring.kick(e.velocity*.6)});
  gsap.ticker.add(t=>lenis.raf(t*1000));gsap.ticker.lagSmoothing(0);
  $$('a[href^="#"]').forEach(a=>a.addEventListener('click',e=>{const id=a.getAttribute('href'),t=id.length>1&&$(id);if(!t)return;e.preventDefault();lenis.scrollTo(t,{duration:1.6,easing:x=>1-Math.pow(1-x,4)})}));}

/* split: masked words (deep — keeps <b>) */
const words=el=>{const out=[];const walk=n=>[...n.childNodes].forEach(c=>{if(c.nodeType===3){const f=D.createDocumentFragment();c.textContent.split(/(\s+)/).forEach(w=>{if(!w)return;if(/^\s+$/.test(w)){f.appendChild(D.createTextNode(w));return}const wd=D.createElement('span');wd.className='wd';const s=D.createElement('span');s.className='w';s.textContent=w;wd.appendChild(s);f.appendChild(wd);out.push(s)});c.replaceWith(f)}else if(c.nodeType===1)walk(c)});el.classList.add('split');walk(el);return out};
const scramble=(el,dur=.9)=>{const T=el.dataset.t||(el.dataset.t=el.innerHTML);const txt=el.textContent,G='abcdefghijklmnopqrstuvwxyz0123456789#_/';const o={p:0};gsap.to(o,{p:1,duration:dur,ease:'none',onUpdate:()=>{el.textContent=[...txt].map((ch,i)=>ch===' '||i<o.p*txt.length?ch:G[Math.random()*G.length|0]).join('')},onComplete:()=>{el.innerHTML=T}})};
const reveal=(sel,trig,opt={})=>gsap.from(sel,Object.assign({y:40,opacity:0,duration:1.1,ease:E,stagger:.08,scrollTrigger:{trigger:trig,start:'top 85%'}},opt));

/* ---------- intro → hero ---------- */
const intro=$('#intro'),num=$('.in-num',intro),wm=$('.h-logo'),L=$$('.h-logo .lt');
let _C=null;const C=()=>{if(!_C||!_C[3][0])_C=L.map(l=>{const b=l.getBBox();return[b.x+b.width/2,b.y+b.height/2]});return _C};
const shuf=a=>{const p=a.map((_,i)=>i);for(let i=p.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[p[i],p[j]]=[p[j],p[i]]}return p};
const R=gsap.utils.random;
const gi=3;
const gT=()=>{const r=wm.getBoundingClientRect(),k=r.width/527;const c=C();return{x:(innerWidth/2-r.left)/k-c[gi][0],y:(innerHeight/2-r.top)/k-c[gi][1]}};
const shatter=(tl,at)=>{const O=L.filter((_,i)=>i!==gi),G=L[gi];
  const PC=[[0],[1,2],[4],[5],[6],[7],[8],[9,10],[11],[12,13],[14],[15]];
  let _T=null;const T=el=>{if(!_T){_T=new Map();const c=C(),r=wm.getBoundingClientRect(),k=r.width/527,W=innerWidth,H=innerHeight,rx=Math.min(W*.36,620),ry=Math.min(H*.3,320),n=PC.length;
    PC.forEach((p,i)=>{const th=Math.PI*(1+(2*i+1)/n),sx=W/2+rx*Math.cos(th),sy=H/2+ry*Math.sin(th),a=c[p[0]],o={x:(sx-r.left)/k-a[0],y:(sy-r.top)/k-a[1],r:R(-10,10)};p.forEach(q=>_T.set(L[q],o))})}return _T.get(el)};
  tl.set(G,{x:()=>gT().x,y:()=>gT().y,rotation:0,scale:1.8,opacity:0},0)
  .to(G,{opacity:1,duration:.7,ease:E},at)
  .to(G,{rotation:90,duration:.9,ease:'expo.inOut'},at+.75)
  .set(O,{x:i=>T(O[i]).x,y:i=>T(O[i]).y+10,rotation:i=>T(O[i]).r,scale:.7,opacity:0},at+1.5)
  .to(O,{y:i=>T(O[i]).y,scale:1,opacity:1,duration:.8,ease:E,stagger:{each:.035,from:'center'}},at+1.6)
  .to(O,{y:'-=6',duration:.4,ease:'sine.inOut'},'>-.1')
  .to(O,{x:0,y:0,rotation:0,scale:1,duration:.95,ease:'expo.inOut',stagger:{each:.025,from:'edges'}},'>-.05')
  .to(G,{x:0,y:0,scale:1,rotation:0,duration:.9,ease:'expo.inOut'},'<+.25');
  return tl};
gsap.set(L,{transformOrigin:'50% 50%',opacity:0,y:18});const hn=[$('.hn-k'),...$$('.hn-l a'),$('.hn-idea')];gsap.set(hn,{opacity:0,y:24});
const cnt={v:0};
const tl=gsap.timeline({onComplete:()=>{intro.remove();ScrollTrigger.refresh()}});
const ih=[$('.ic',intro),num,$('.ib',intro)];
tl.from(ih,{opacity:0,y:-10,duration:.6,stagger:.08});
const heroEl=$('.hero');heroEl.classList.add('shat');const MIX=['#0f2257','#ff6a1a','#ff3d6b','#ffd23f'];const paint=(l,v)=>[l,...l.querySelectorAll('*')].forEach(e=>v?e.style.setProperty('fill',v,'important'):e.style.removeProperty('fill'));L.forEach((l,i)=>paint(l,MIX[i%4]));
shatter(tl,.3);
tl.call(()=>{heroEl.classList.remove('shat');L.forEach(l=>paint(l,''))});
tl.to(cnt,{v:100,duration:3.6,ease:'power2.inOut',onUpdate:()=>num.textContent=String(Math.round(cnt.v)).padStart(2,'0')},0)
  .to(ih,{opacity:0,y:-10,duration:.5,ease:'power3.in',stagger:.05},'>+.05')
  .to(hn,{opacity:1,y:0,duration:1,ease:E,stagger:.06},'<+.2');

/* hero exit parallax */
gsap.timeline({scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:.6}})
  .to(wm,{yPercent:-30,ease:'none'},0);

gsap.to('.prog',{scaleX:1,ease:'none',scrollTrigger:{start:0,end:'max',scrub:.3}});

/* section heads */
$$('.sh').forEach(s=>{gsap.fromTo(s,{clipPath:'inset(0 100% 0 0)'},{clipPath:'inset(0 0% 0 0)',duration:1.2,ease:'expo.inOut',clearProps:'clipPath',scrollTrigger:{trigger:s,start:'top 90%'}})});

/* works */
{const wp=$('.w-top p'),wpw=words(wp);gsap.fromTo(wpw,{opacity:.15},{opacity:1,stagger:.1,ease:'none',scrollTrigger:{trigger:wp,start:'top 80%',end:'bottom 50%',scrub:true}})}
gsap.fromTo('.ring',{opacity:0,scale:.75,rotateX:22,y:80},{opacity:1,scale:1,rotateX:0,y:0,duration:1.6,ease:E,scrollTrigger:{trigger:'.ring',start:'top 90%'},onStart:()=>window.__e8Ring&&window.__e8Ring.kick(38)});

/* services */
const sl=$('.s3-lead'),slw=words(sl);
gsap.fromTo(slw,{opacity:.15},{opacity:1,stagger:.1,ease:'none',scrollTrigger:{trigger:sl,start:'top 80%',end:'bottom 50%',scrub:true}});
reveal($$('.sc'),'.sc-grid',{y:60,stagger:.1});

/* studio */
const sb=$('.st-big'),sbw=words(sb);
gsap.fromTo(sbw,{opacity:.2},{opacity:1,stagger:.1,ease:'none',scrollTrigger:{trigger:sb,start:'top 80%',end:'bottom 50%',scrub:true}});
reveal($$('.steps li'),'.steps',{y:50,stagger:.12});

/* about */
gsap.fromTo('.ab-ph',{clipPath:'inset(100% 0 0 0)'},{clipPath:'inset(0% 0 0 0)',duration:1.4,ease:'expo.inOut',scrollTrigger:{trigger:'.ab-grid',start:'top 80%'}});gsap.from('.ab-ph img',{scale:1.25,duration:1.8,ease:E,scrollTrigger:{trigger:'.ab-grid',start:'top 80%'}});reveal($$('.ab-tx>*'),'.ab-grid',{y:30,stagger:.08,delay:.3});
/* contact */
gsap.from('.ct-card',{y:80,opacity:0,duration:1.3,ease:E,scrollTrigger:{trigger:'.ct-card',start:'top 88%'}});reveal($$('.ct-intro>*,.cform>*'),'.ct-card',{y:24,stagger:.06,delay:.2});
reveal($$('.sf-top>*'),'.sf',{y:30,stagger:.07});gsap.from('.sf-wm img',{yPercent:60,opacity:0,duration:1.6,ease:E,scrollTrigger:{trigger:'.sf-wm',start:'top 95%'}});

/* nav hover scramble */
$$('.nb-l a').forEach(a=>{const t=a.lastChild;if(t&&t.nodeType===3){const s=D.createElement('span');s.textContent=t.textContent;t.replaceWith(s);a.addEventListener('mouseenter',()=>scramble(s,.4))}});

/* magnetic */
if(fine)$$('.send,.nb-cta,.chip').forEach(el=>{el.classList.add('mag');const x=gsap.quickTo(el,'x',{duration:.5,ease:'power3'}),y=gsap.quickTo(el,'y',{duration:.5,ease:'power3'});
  el.addEventListener('pointermove',e=>{const r=el.getBoundingClientRect();x((e.clientX-r.left-r.width/2)*.3);y((e.clientY-r.top-r.height/2)*.3)});
  el.addEventListener('pointerleave',()=>{x(0);y(0)})});

/* cursor */
if(fine){const c=$('.cur'),lab=$('span',c),cx=gsap.quickTo(c,'x',{duration:.35,ease:'power3'}),cy=gsap.quickTo(c,'y',{duration:.35,ease:'power3'});
  addEventListener('pointermove',e=>{c.style.opacity=1;cx(e.clientX);cy(e.clientY)});
  const on=(sel,txt)=>$$(sel).forEach(el=>{el.addEventListener('pointerenter',()=>{lab.textContent=txt;c.classList.add('big')});el.addEventListener('pointerleave',()=>c.classList.remove('big'))});
  on('.ring','Glisser');
  D.addEventListener('pointerleave',()=>c.style.opacity=0)}

/* logo hover — letters ripple away from cursor */
if(fine&&wm){let live=false,q=null;const mk=()=>L.map(l=>({x:gsap.quickTo(l,'x',{duration:.6,ease:'power3'}),y:gsap.quickTo(l,'y',{duration:.6,ease:'power3'}),r:gsap.quickTo(l,'rotation',{duration:.6,ease:'power3'})}));
  wm.addEventListener('pointermove',e=>{if(D.getElementById('intro')||L.some(l=>gsap.getTweensOf(l).some(t=>t.isActive()&&!q)))return;if(!q)q=mk();live=true;const r=wm.getBoundingClientRect(),k=r.width/527,mx=(e.clientX-r.left)/k,my=(e.clientY-r.top)/k,c=C();
    L.forEach((l,i)=>{const dx=c[i][0]-mx,dy=c[i][1]-my,d=Math.hypot(dx,dy)||1,f=Math.max(0,1-d/150);q[i].x(dx/d*f*14);q[i].y(dy/d*f*14-f*6);q[i].r((dx/d)*f*4)})});
  wm.addEventListener('pointerleave',()=>{if(!live||!q)return;live=false;L.forEach((l,i)=>{q[i].x(0);q[i].y(0);q[i].r(0)})})}
addEventListener('load',()=>ScrollTrigger.refresh());
})();
