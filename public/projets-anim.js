(()=>{
const D=document,$=(s,r=D)=>r.querySelector(s),$$=(s,r=D)=>[...r.querySelectorAll(s)];
const g=$('#grid'),cards=$$('.pp-c',g),RM=matchMedia('(prefers-reduced-motion: reduce)').matches,fine=matchMedia('(hover:hover)').matches;
/* floating preview in list view */
const pv=$('.pp-pv'),pimg=$('img',pv);
if(fine&&window.gsap){const px=gsap.quickTo(pv,'x',{duration:.5,ease:'power3'}),py=gsap.quickTo(pv,'y',{duration:.5,ease:'power3'}),pr=gsap.quickTo(pv,'rotation',{duration:.6,ease:'power3'});let lx=0;
  addEventListener('pointermove',e=>{px(e.clientX);py(e.clientY);pr(gsap.utils.clamp(-10,10,(e.clientX-lx)*.4));lx=e.clientX});
  cards.forEach(c=>{c.addEventListener('pointerenter',()=>{if(!g.classList.contains('lst'))return;pimg.src=$('img',c).src;gsap.to(pv,{opacity:1,scale:1,xPercent:-50,yPercent:-50,duration:.45,ease:'expo.out'})});
    c.addEventListener('pointerleave',()=>gsap.to(pv,{opacity:0,scale:.6,duration:.35,ease:'power3.in'}))})}
if(!window.gsap||!window.ScrollTrigger||RM)return;
gsap.registerPlugin(ScrollTrigger);const E='expo.out';
/* smooth scroll */
let lenis=null;if(window.Lenis){lenis=new Lenis({lerp:.085});lenis.on('scroll',ScrollTrigger.update);gsap.ticker.add(t=>lenis.raf(t*1000));gsap.ticker.lagSmoothing(0)}
/* header: blur-in chars */
const h1=$('.pp-hd h1'),sup=$('sup',h1);const txt=h1.firstChild.textContent;h1.firstChild.remove();
const chs=[...txt].map(ch=>{const s=D.createElement('span');s.className='ch';s.textContent=ch;h1.insertBefore(s,sup);return s});
const tl=gsap.timeline({delay:.15});
tl.from('#nb',{yPercent:-140,duration:1,ease:E})
  .from(chs,{yPercent:90,opacity:0,filter:'blur(18px)',rotateX:-60,transformPerspective:600,duration:1.4,ease:E,stagger:.05},'-=.7')
  .from(sup,{opacity:0,y:-20,duration:.8,ease:E},'-=.9')
  .from($$('.pp-hd p,.pp-v,.pp-f button'),{opacity:0,y:20,filter:'blur(8px)',duration:.9,ease:E,stagger:.04},'-=1');
/* counter on sup */
const n={v:0},tot=parseInt(sup.textContent.replace(/\D/g,''))||0;tl.to(n,{v:tot,duration:1.2,ease:'power2.out',onUpdate:()=>sup.textContent='('+String(Math.round(n.v)).padStart(2,'0')+')'},'-=1.2');
/* header scroll-out */
gsap.to(h1,{yPercent:30,opacity:.2,ease:'none',scrollTrigger:{trigger:'.pp-hd',start:'top top',end:'bottom top',scrub:true}});
/* cards: clip reveal, img scale, parallax, velocity skew */
const PAR=[];
cards.forEach((c,i)=>{const f=$('figure',c),im=$('img',c),m=$('.pp-m',c);
  gsap.fromTo(f,{clipPath:'inset(100% 0 0 0 round 4px)'},{clipPath:'inset(0% 0 0 0 round 4px)',duration:1.4,ease:'expo.inOut',scrollTrigger:{trigger:c,start:'top 90%'}});
  gsap.fromTo(im,{scale:1.4},{scale:1.08,duration:1.8,ease:E,scrollTrigger:{trigger:c,start:'top 90%'}});
  gsap.fromTo(im,{yPercent:-5},{yPercent:5,ease:'none',scrollTrigger:{trigger:c,start:'top bottom',end:'bottom top',scrub:true}});
  gsap.from(m.children,{y:18,opacity:0,duration:.9,ease:E,stagger:.06,delay:.35,scrollTrigger:{trigger:c,start:'top 90%'}});
  PAR.push(gsap.to(c,{y:(i%3-1)*-40,ease:'none',scrollTrigger:{trigger:c,start:'top bottom',end:'bottom top',scrub:true}}));
  if(fine){const rx=gsap.quickTo(f,'rotationX',{duration:.6,ease:'power3'}),ry=gsap.quickTo(f,'rotationY',{duration:.6,ease:'power3'});gsap.set(f,{transformPerspective:1000});
    f.addEventListener('pointermove',e=>{if(g.classList.contains('lst'))return;const r=f.getBoundingClientRect();ry(((e.clientX-r.left)/r.width-.5)*7);rx(-((e.clientY-r.top)/r.height-.5)*7)});
    f.addEventListener('pointerleave',()=>{rx(0);ry(0)})}});
/* list mode: kill card parallax */
const syncPar=()=>{const L=g.classList.contains('lst');PAR.forEach(t=>{if(L){t.scrollTrigger.disable(false);gsap.set(t.targets(),{y:0})}else t.scrollTrigger.enable()});ScrollTrigger.refresh()};
new MutationObserver(syncPar).observe(g,{attributes:true,attributeFilter:['class']});
/* filter re-reveal */
$$('.pp-f button').forEach(b=>b.addEventListener('click',()=>{setTimeout(()=>ScrollTrigger.refresh(),50)}));
/* CTA lines */
const ct=$('.pp-cta-t');ct.innerHTML=ct.innerHTML.split('<br>').map(l=>'<span class="ln"><span>'+l+'</span></span>').join('');
gsap.from($$('.ln>span',ct),{yPercent:110,duration:1.2,ease:E,stagger:.1,scrollTrigger:{trigger:ct,start:'top 85%'}});
gsap.from('.pp-cta a',{scale:.6,opacity:0,duration:1,ease:'back.out(1.8)',scrollTrigger:{trigger:ct,start:'top 85%'}});
/* magnetic CTA */
if(fine)$$('.pp-cta a,.nb-cta').forEach(el=>{const x=gsap.quickTo(el,'x',{duration:.5,ease:'power3'}),y=gsap.quickTo(el,'y',{duration:.5,ease:'power3'});
  el.addEventListener('pointermove',e=>{const r=el.getBoundingClientRect();x((e.clientX-r.left-r.width/2)*.3);y((e.clientY-r.top-r.height/2)*.3)});el.addEventListener('pointerleave',()=>{x(0);y(0)})});
/* footer */
gsap.from('.sf-wm',{yPercent:40,opacity:0,ease:'none',scrollTrigger:{trigger:'.sf',start:'top bottom',end:'bottom bottom',scrub:true}});
addEventListener('load',()=>ScrollTrigger.refresh());
})();
