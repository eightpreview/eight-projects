(()=>{const D=document,$=(s,r=D)=>r.querySelector(s),$$=(s,r=D)=>[...r.querySelectorAll(s)];
const ring=$('.ring');if(!ring)return;const cards=$$('.card',ring);if(!cards.length)return;
const esc=s=>String(s||'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const slug=s=>s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const items=cards.map(c=>{const m=$('img,video',c),alt=m.alt||m.getAttribute('aria-label')||'',d=c.dataset;const t=alt.split(/[•–-]\s/)[0].trim();
  return{src:m.currentSrc||m.src,vid:m.tagName==='VIDEO',t,id:slug(t)||'p',client:d.client||t,services:d.services||(alt.split(/[•–-]\s/)[1]||'').trim(),year:d.year||'',link:d.link||'',desc:d.desc||''}});
const tv=D.createElement('div');tv.className='tv';tv.setAttribute('role','dialog');tv.setAttribute('aria-modal','true');tv.setAttribute('aria-label','Projet');
tv.innerHTML='<div class="tv-scr"><div class="pj" data-lenis-prevent></div><button class="pj-x" type="button" aria-label="Fermer">Fermer <span>✕</span></button><div class="pj-bar" aria-hidden="true"><i></i></div><div class="tv-lines" aria-hidden="true"></div><div class="tv-flash" aria-hidden="true"></div></div>';
D.body.appendChild(tv);
const scr=$('.tv-scr',tv),flash=$('.tv-flash',tv),lines=$('.tv-lines',tv),pj=$('.pj',tv),bar=$('.pj-bar i',tv),G=window.gsap;let cur=0,open=false,busy=false;
const pad=n=>String(n).padStart(2,'0');
const media=(it,cls)=>it.vid?'<video class="'+cls+'" src="'+esc(it.src)+'" autoplay muted loop playsinline></video>':'<img class="'+cls+'" src="'+esc(it.src)+'" alt="'+esc(it.t)+'">';
const row=(k,v)=>'<div class="pj-m"><dt>'+k+'</dt><dd'+(v?'':' class="pj-ph"')+'>'+(v?esc(v):'À compléter')+'</dd></div>';
/* dominant colour → page tint */
const tint=it=>{const done=(r,g,b)=>{const L=(.2126*r+.7152*g+.0722*b)/255;tv.style.setProperty('--pj-bg','rgb('+r+','+g+','+b+')');tv.style.setProperty('--pj-fg',L>.58?'#0a0f2c':'#fff');tv.style.setProperty('--pj-mute',L>.58?'rgba(10,15,44,.6)':'rgba(255,255,255,.65)');tv.style.setProperty('--pj-line',L>.58?'rgba(10,15,44,.18)':'rgba(255,255,255,.22)')};
  if(it.vid){done(15,34,87);return}const im=new Image();im.onload=()=>{try{const c=D.createElement('canvas');c.width=c.height=24;const x=c.getContext('2d');x.drawImage(im,0,0,24,24);const d=x.getImageData(0,0,24,24).data;let r=0,g=0,b=0,n=0;for(let i=0;i<d.length;i+=4){if(d[i+3]<128)continue;const mx=Math.max(d[i],d[i+1],d[i+2]),mn=Math.min(d[i],d[i+1],d[i+2]);const w=1+(mx-mn)/40;r+=d[i]*w;g+=d[i+1]*w;b+=d[i+2]*w;n+=w}n=n||1;done(Math.round(r/n),Math.round(g/n),Math.round(b/n))}catch(e){done(15,34,87)}};im.onerror=()=>done(15,34,87);im.src=it.src};
const fill=i=>{cur=(i+items.length)%items.length;const it=items[cur],nx=items[(cur+1)%items.length],pv=items[(cur-1+items.length)%items.length];tint(it);
  pj.innerHTML=
  '<aside class="pj-side">'
  +'<h2 class="pj-t">'+esc(it.t)+'</h2>'
  +'<p class="pj-d'+(it.desc?'':' pj-ph')+'">'+(it.desc?esc(it.desc):'Le contexte, la demande du client et la réponse apportée - en deux ou trois phrases.')+'</p>'
  +'<dl class="pj-meta">'+row('Client',it.client)+row('Services',it.services)+row('Année',it.year)+(it.link?'<div class="pj-m"><dt>Lien</dt><dd><a href="'+esc(it.link)+'" target="_blank" rel="noopener">Voir le site ↗</a></dd></div>':'')+'</dl>'
  +'<nav class="pj-pn"><button type="button" data-d="-1"><span>←</span>'+esc(pv.t)+'</button><button type="button" data-d="1">'+esc(nx.t)+'<span>→</span></button></nav></aside>'
  +'<div class="pj-flow"><figure class="pj-cover">'+media(it,'')+'</figure>'
  +'<div class="pj-s pj-s1"><image-slot id="pj-'+it.id+'-1" placeholder="Visuel 1"></image-slot></div>'
  +'<div class="pj-s pj-s2"><image-slot id="pj-'+it.id+'-2" placeholder="Visuel 2"></image-slot></div>'
  +'<div class="pj-s pj-s3"><image-slot id="pj-'+it.id+'-3" placeholder="Visuel large"></image-slot></div>'
  +'<button type="button" class="pj-next" data-d="1"><span class="pj-nimg">'+media(nx,'')+'</span><span class="pj-nk">Continuez à défiler - projet suivant</span><span class="pj-nt">'+esc(nx.t)+'</span><span class="pj-fill"><i></i></span></button></div>';
  $$('[data-d]',pj).forEach(b=>b.addEventListener('click',()=>zap(+b.dataset.d)));
  pj.scrollTop=0;bar.style.transform='scaleX(0)';
  if(G){G.from($$('.pj-side>*',pj),{y:30,opacity:0,duration:.9,ease:'expo.out',stagger:.06,delay:.05});G.from($('.pj-cover',pj),{clipPath:'inset(0 0 100% 0)',duration:1.1,ease:'expo.inOut'})}};
/* scroll: progress, cover parallax, pull-to-next */
let armed=true;pj.addEventListener('scroll',()=>{const m=pj.scrollHeight-pj.clientHeight,p=m>0?pj.scrollTop/m:0;bar.style.transform='scaleX('+p+')';
  const cv=$('.pj-cover>*',pj);if(cv)cv.style.transform='scale('+(1.08-Math.min(pj.scrollTop/pj.clientHeight,1)*.08)+')';
  const nx=$('.pj-next',pj);if(nx){const r=nx.getBoundingClientRect(),q=Math.max(0,Math.min(1,(pj.clientHeight-r.top)/r.height));$('.pj-fill i',nx).style.transform='scaleX('+q+')';
    if(q>=.995&&armed&&!busy){armed=false;zap(1)}if(q<.9)armed=true}},{passive:true});
const show=i=>{fill(i);if(open)return;open=true;tv.classList.add('on');D.documentElement.style.overflow='hidden';window.__lenis&&window.__lenis.stop();
  if(!G)return;
  G.killTweensOf([scr,flash,pj,lines]);
  G.timeline().set(scr,{scaleX:0,scaleY:.004,filter:'brightness(4)'}).set(flash,{opacity:1}).set(lines,{opacity:.55})
   .to(scr,{scaleX:1,duration:.28,ease:'power3.out'})
   .to(scr,{scaleY:1,duration:.42,ease:'expo.out'},'>-.02')
   .to(scr,{filter:'brightness(1)',duration:.5,ease:'power2.out'},'<')
   .to(flash,{opacity:0,duration:.5,ease:'power2.out'},'<+.05')
   .fromTo(pj,{opacity:0},{opacity:1,duration:.1,repeat:4,yoyo:true,ease:'steps(1)'},'<').set(pj,{opacity:1})
   .to(lines,{opacity:0,duration:.6,ease:'power2.out'},'>-.1')
   .add(()=>{scr.style.filter=''})};
const zap=d=>{if(busy)return;busy=true;if(!G){fill(cur+d);busy=false;return}
  G.timeline({onComplete:()=>busy=false}).to(pj,{opacity:0,y:d*-40,duration:.35,ease:'power3.in'}).add(()=>fill(cur+d)).set(pj,{y:d*60}).to(pj,{opacity:1,y:0,duration:.7,ease:'expo.out'})};
const hide=()=>{if(!open)return;open=false;const done=()=>{tv.classList.remove('on');D.documentElement.style.overflow='';window.__lenis&&window.__lenis.start();pj.innerHTML=''};
  if(!G){done();return}
  G.timeline({onComplete:done}).set(lines,{opacity:.55}).to(flash,{opacity:1,duration:.1}).to(scr,{scaleY:.004,filter:'brightness(4)',duration:.26,ease:'power3.in'},0).to(scr,{scaleX:0,duration:.22,ease:'power3.in'}).to(flash,{opacity:0,duration:.1})};
let pd=null;ring.addEventListener('pointerdown',e=>{const c=e.target.closest('.card');pd=c?{c,x:e.clientX,y:e.clientY}:null},true);
ring.addEventListener('pointerup',e=>{if(pd&&Math.hypot(e.clientX-pd.x,e.clientY-pd.y)<6)show(cards.indexOf(pd.c));pd=null});
$('.pj-x',tv).addEventListener('click',hide);
D.addEventListener('keydown',e=>{if(!open)return;if(e.key==='Escape')hide();if(e.key==='ArrowRight')zap(1);if(e.key==='ArrowLeft')zap(-1)});
cards.forEach(c=>c.style.cursor='pointer');window.__e8Open=i=>show(i);})();
