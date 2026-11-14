(function(){
  var root=document.documentElement, KEY='jg-theme';
  try{var s=localStorage.getItem(KEY); if(s) root.setAttribute('data-theme',s);}catch(e){}
  document.getElementById('theme').addEventListener('click',function(){
    var cur=root.getAttribute('data-theme');
    if(!cur){cur=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}
    var next=cur==='dark'?'light':'dark';
    root.setAttribute('data-theme',next);
    try{localStorage.setItem(KEY,next);}catch(e){}
  });

  // Full-height panels stacked with position:sticky. A panel rises with the scroll until it fills
  // the view, then stays put (it no longer moves with the scroll). After a short hold, the next one
  // rises over it while it fades and recedes. The fixed background follows the panel in front.
  var reduce=matchMedia('(prefers-reduced-motion: reduce)'), narrow=matchMedia('(max-width: 979px)');
  var panels=[].slice.call(document.querySelectorAll('.hero, .project'));
  var stage=document.getElementById('stage'), layers=[], current=-1, ticking=false;
  panels.forEach(function(el){
    var c=(el.getAttribute('data-bg')||'#888 #888').split(' '), l=document.createElement('div');
    l.className='layer'; l.style.setProperty('--c1',c[0]); l.style.setProperty('--c2',c[1]);
    stage.appendChild(l); layers.push(l);
  });
  // Header icons: one per project, built from the hero's list.
  var mini=document.getElementById('mini'), index=document.querySelector('.index'), top=document.querySelector('.top');
  var minis=[].slice.call(index.querySelectorAll('a')).map(function(a){
    var m=document.createElement('a'), im=a.querySelector('img'), name=a.querySelector('b').textContent;
    m.href=a.getAttribute('href'); m.title=name; m.setAttribute('aria-label',name);
    var i2=document.createElement('img'); i2.src=im.getAttribute('src'); i2.alt=''; m.appendChild(i2);
    mini.appendChild(m); return m;
  });
  var miniOn=-1;
  function header(){
    var shown=index.getBoundingClientRect().bottom<top.offsetHeight;
    document.documentElement.classList.toggle('minis',shown);
  }
  function mark(i){ // panel i is in front; the hero is panel 0
    var k=i-1; if(k===miniOn) return;
    if(miniOn>=0) minis[miniOn].classList.remove('on'), minis[miniOn].removeAttribute('aria-current');
    miniOn=k;
    if(k>=0){
      minis[k].classList.add('on'); minis[k].setAttribute('aria-current','true');
      // Where the row scrolls (phones), the one in view is always in its middle.
      var a=minis[k];
      if(mini.scrollWidth>mini.clientWidth) mini.scrollTo({left:a.offsetLeft-mini.clientWidth/2+a.offsetWidth/2,behavior:reduce.matches?'instant':'smooth'});
    }
  }
  function show(i){
    header(); mark(i);
    if(i===current) return;
    var l=layers[i], src=panels[i].getAttribute('data-bg-img');
    if(src && !l.firstChild){ var im=new Image(); im.alt=''; im.decoding='async'; im.src=src; l.appendChild(im); }
    if(current>=0) layers[current].classList.remove('on');
    l.classList.add('on'); current=i;
  }
  // Screenshots of a panel form a deck: while the panel is pinned, each one rises with the scroll
  // and settles on top of the one before. Then the panel holds a moment, and only then the next
  // panel starts rising. The margin under each panel is that pinned scroll distance.
  var footer=document.querySelector('footer');
  var decks=panels.map(function(el){
    var m=el.querySelector('.media');
    if(!m) return [];
    // The WIP ribbon goes on a box around the shots, so it stays put when they move or scroll.
    var box=document.createElement('div'); box.className='media-box'+(m.classList.contains('has-ribbon')?' has-ribbon':'');
    m.parentNode.insertBefore(box,m); box.appendChild(m);
    var rib=m.querySelector(':scope > .ribbon'); if(rib) box.appendChild(rib);
    m.classList.remove('has-ribbon');
    var cards=[].slice.call(m.children);
    if(cards.length>1) m.classList.add('multi');
    return cards;
  });
  var STEP=0.55, HOLD=0.25, OFF=14;   // per card, and how far the next panel rises (fading in) before this one fades, in viewport heights; px between stacked cards
  // Pinned panels and decks need the shots beside the text: wide screens only.
  function on(){ return !reduce.matches && !narrow.matches; }
  // The last panel can't take a margin (sticky stops a margin short of the end of <main>), so a
  // spacer after it gives it the same pinned scroll distance.
  var spacer=document.createElement('div'), gaps=[];
  spacer.setAttribute('aria-hidden','true');
  panels[panels.length-1].after(spacer);
  // Scroll snap: a stop at every state (each project once it fills the view, and each of its shots
  // once stacked), on markers placed where those states are; the margins are only the room they need.
  var mainEl=document.querySelector('main'), snaps=document.createElement('div');
  snaps.className='snaps'; snaps.setAttribute('aria-hidden','true'); mainEl.appendChild(snaps);
  // Markers are made once and only moved: removing the one the page is snapped to makes the
  // browser pick another, and the page jumps.
  var marks=[], used=0;
  function snapAt(y){
    var m=marks[used]; if(!m){ m=document.createElement('i'); snaps.appendChild(m); marks.push(m); }
    m.style.top=Math.round(y)+'px'; m.hidden=false; used++;
  }
  function layout(){
    var vh=innerHeight, deck=on(), root=document.documentElement;
    used=0;
    root.classList.toggle('deck',deck);
    root.classList.toggle('swipe',narrow.matches);
    if(!deck){
      panels.forEach(function(el,i){
        el.style.top=el.style.marginBottom=el.style.transform=el.style.opacity=el.style.pointerEvents='';
        decks[i].forEach(function(c){ c.style.transform=c.style.zIndex=c.style.visibility=''; });
      });
      spacer.style.height='0px';
      marks.forEach(function(m){ m.hidden=true; });
      return;
    }
    panels.forEach(function(el,i){
      var n=deck?Math.max(1,decks[i].length):1, last=i===panels.length-1;
      gaps[i]=deck?Math.round(vh*(n-1)*STEP):0;
      el.style.marginBottom=deck&&!last?gaps[i]+'px':(last?'0px':'');
      // A panel taller than the view sticks once its bottom reaches the bottom of the view.
      el.style.top=i?Math.min(0,vh-el.offsetHeight)+'px':'';  // the hero scrolls normally
    });
    spacer.style.height=gaps[panels.length-1]+'px';
    snapAt(-mainEl.offsetTop);                       // the top of the page
    // The hero can be taller than the view (the index under it): stops down to its bottom.
    var heroEnd=panels[0].offsetTop+panels[0].offsetHeight-vh;  // offsetTop is already within <main>
    for(var hy=-mainEl.offsetTop+vh*0.75; hy<heroEnd; hy+=vh*0.75) snapAt(hy);
    if(heroEnd>-mainEl.offsetTop+40) snapAt(heroEnd);
    panels.forEach(function(el,i){
      if(!i) return;
      var a=document.getElementById(el.getAttribute('data-id')).offsetTop, extra=Math.max(0,el.offsetHeight-vh);
      if(extra>20) snapAt(a);                       // a panel taller than the view: its top first
      for(var k=0;k<Math.max(1,decks[i].length);k++) snapAt(a+extra+k*vh*STEP);
    });
    snapAt(document.documentElement.scrollHeight-vh-mainEl.offsetTop);  // the end of the page, footer in view
    for(var u=used;u<marks.length;u++) marks[u].hidden=true;
  }
  function frame(){
    ticking=false;
    var vh=innerHeight, deck=on(), active=0;
    if(!deck){
      // Narrow screens scroll normally; a panel only fades and rises a little as it comes in.
      var soft=!reduce.matches;
      panels.forEach(function(el,i){
        var r=el.getBoundingClientRect();
        if(r.top<=vh*0.5) active=i;
        if(!soft||!i) return;
        var q=Math.min(1,Math.max(0,(vh-r.top)/(vh*0.35))), e=q*q*(3-2*q);
        el.style.opacity=e===1?'':String(0.2+0.8*e);
        el.style.transform=e===1?'':'translate3d(0,'+Math.round((1-e)*28)+'px,0)';
      });
      show(active);
      return;
    }
    panels.forEach(function(el,i){
      var r=el.getBoundingClientRect();
      if(r.top<=vh*0.5) active=i;
      var after=panels[i+1]||footer, at=after.getBoundingClientRect().top;
      var stickTop=Math.min(0,vh-el.offsetHeight);
      var pinned=stickTop+el.offsetHeight+gaps[i]-at; // scroll since it pinned
      // deck
      var cards=decks[i];
      if(cards.length>1){
        var media=el.querySelector('.media'), below=vh-media.getBoundingClientRect().top+40;
        var ts=cards.map(function(c,k){
          if(!k) return 1;
          if(!deck) return 1;
          return Math.min(1,Math.max(0,(pinned-(k-1)*vh*STEP)/(vh*STEP)));
        });
        cards.forEach(function(c,k){
          if(!deck){ c.style.transform=''; c.style.zIndex=''; return; }
          var t=ts[k], ease=1-Math.pow(1-t,3), depth=0;
          for(var j=k+1;j<cards.length;j++) depth+=ts[j];
          var y=k?(1-ease)*Math.max(below,0)+k*OFF:0;
          c.style.zIndex=String(k+1);
          c.style.transform='translate3d(0,'+y+'px,0) scale('+(1-0.05*depth)+')';
          c.style.visibility=(k&&t===0)?'hidden':'';
        });
      }
      // While the next panel rises it fades in; once it has risen HOLD, this one fades and recedes.
      var next=panels[i+1], e=0, a=1;
      if(next && deck && i>0){
        var p=Math.min(1,Math.max(0,(vh-next.getBoundingClientRect().top-vh*HOLD)/(vh*0.55)));
        e=p*p*(3-2*p);
      }
      if(i>1 && deck){
        var q=Math.min(1,Math.max(0,(vh-r.top)/(vh*0.5)));
        a=q*q*(3-2*q);
      }
      var o=a*(1-e);
      if(o===1){ el.style.opacity=''; el.style.transform=''; el.style.pointerEvents=''; return; }
      el.style.opacity=String(o);
      el.style.transform=e?'scale('+(1-0.1*e)+')':'';
      el.style.pointerEvents=e>0.5?'none':'';
    });
    show(active);
  }
  function onScroll(){ if(!ticking){ ticking=true; requestAnimationFrame(frame); } }
  addEventListener('scroll',onScroll,{passive:true});
  addEventListener('resize',function(){ layout(); onScroll(); });
  [reduce,narrow].forEach(function(q){ if(q.addEventListener) q.addEventListener('change',function(){ layout(); onScroll(); }); });
  // A link with a #project lands on it at once, with the layout settled; smooth scrolling is
  // turned on only after that, for clicks inside the page.
  function land(){
    var t=location.hash&&document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if(t) scrollTo({top:t.getBoundingClientRect().top+scrollY,behavior:'instant'});
  }
  // The other language's link lands on the project in front.
  [].slice.call(document.querySelectorAll('a.lang')).forEach(function(a){
    var base=a.getAttribute('href').split('#')[0];
    a.addEventListener('click',function(){
      var id=current>0&&panels[current].getAttribute('data-id');
      a.setAttribute('href',base+(id?'#'+id:''));
    });
  });
  land(); frame();
  addEventListener('load',function(){
    layout(); land(); frame();
    requestAnimationFrame(function(){ document.documentElement.classList.add('smooth'); });
  });
  layout(); frame();

  // Tabs in code cards: click, or the arrow keys once a tab has the focus.
  document.querySelectorAll('[data-tabs]').forEach(function(card){
    var tabs=[].slice.call(card.querySelectorAll('[role=tab]'));
    function pick(t,focus){
      tabs.forEach(function(x){
        var on=x===t; x.setAttribute('aria-selected',on); x.tabIndex=on?0:-1;
        document.getElementById(x.getAttribute('aria-controls')).hidden=!on;
      });
      if(focus) t.focus();
    }
    tabs.forEach(function(t,i){
      t.addEventListener('click',function(){ pick(t); });
      t.addEventListener('keydown',function(e){
        var d=e.key==='ArrowRight'?1:e.key==='ArrowLeft'?-1:0;
        if(d){ pick(tabs[(i+d+tabs.length)%tabs.length],true); e.preventDefault(); }
      });
    });
  });

  // Lightbox: the shots of a project side by side, scroll-snapped one per screen. Arrows (keys or
  // buttons) move between them; a drag up or down closes it.
  var lb=document.getElementById('lb'), track=document.getElementById('lb-track'), count=document.getElementById('lb-count');
  var prevB=document.getElementById('lb-prev'), nextB=document.getElementById('lb-next'), n=0;
  function visible(fig){ // a themed figure holds a light and a dark image; take the one showing
    var imgs=[].slice.call(fig.querySelectorAll('img'));
    return imgs.filter(function(im){ return getComputedStyle(im).display!=='none'; })[0]||imgs[0];
  }
  function lbAt(){ return Math.round(track.scrollLeft/Math.max(1,track.clientWidth)); }
  function update(){ count.textContent=n>1?(lbAt()+1)+' / '+n:''; }
  function go(i,smooth){ track.scrollTo({left:i*track.clientWidth,behavior:smooth&&!reduce.matches?'smooth':'instant'}); }
  function step(d){ if(n>1) go((lbAt()+d+n)%n,true); }
  function open(fig){
    var scope=fig.closest('.project')||fig.parentNode, set=[].slice.call(scope.querySelectorAll('figure.shot'));
    track.textContent=''; n=set.length;
    set.forEach(function(f){
      var im=visible(f), fc=f.querySelector('figcaption'), slide=document.createElement('figure'), i2=document.createElement('img');
      slide.className='lb-slide'; i2.src=im.currentSrc||im.src; i2.alt=im.alt; i2.draggable=false; slide.appendChild(i2);
      var c=document.createElement('figcaption'); c.textContent=fc?fc.textContent:''; slide.appendChild(c);
      track.appendChild(slide);
    });
    prevB.hidden=nextB.hidden=n<2;
    track.style.transform=''; track.style.opacity=''; lb.style.removeProperty('--lb-dim');
    if(lb.showModal) lb.showModal();
    go(Math.max(0,set.indexOf(fig)),false); update();
  }
  document.querySelectorAll('.shot img').forEach(function(el){
    el.addEventListener('click',function(){ open(el.closest('figure')); });
  });
  track.addEventListener('scroll',update,{passive:true});
  prevB.addEventListener('click',function(){ step(-1); });
  nextB.addEventListener('click',function(){ step(1); });
  lb.addEventListener('keydown',function(e){
    if(e.key==='ArrowLeft'){ step(-1); e.preventDefault(); }
    else if(e.key==='ArrowRight'){ step(1); e.preventDefault(); }
  });
  // Drag up or down to close: the shots follow the pointer and fade; far enough, the dialog closes.
  var drag=null;
  track.addEventListener('pointerdown',function(e){
    if(e.button) return;
    drag={x:e.clientX,y:e.clientY,id:e.pointerId,on:false};
  });
  track.addEventListener('pointermove',function(e){
    if(!drag||e.pointerId!==drag.id) return;
    var dx=e.clientX-drag.x, dy=e.clientY-drag.y;
    if(!drag.on){
      if(Math.abs(dy)<8||Math.abs(dy)<Math.abs(dx)*1.2) { if(Math.abs(dx)>8) drag=null; return; }
      drag.on=true; track.classList.add('dragging'); track.setPointerCapture(e.pointerId);
    }
    var f=Math.min(1,Math.abs(dy)/(innerHeight*0.4));
    track.style.transform='translate3d(0,'+dy+'px,0) scale('+(1-0.08*f)+')';
    track.style.opacity=String(1-0.5*f); lb.style.setProperty('--lb-dim',String(0.88*(1-0.7*f)));
  });
  function release(e){
    if(!drag||e.pointerId!==drag.id) return;
    var dy=e.clientY-drag.y, was=drag.on; drag=null;
    if(!was) return;
    track.classList.remove('dragging');
    if(Math.abs(dy)>Math.min(140,innerHeight*0.18)){
      track.style.transform='translate3d(0,'+(dy>0?1:-1)*innerHeight*0.6+'px,0) scale(.9)'; track.style.opacity='0';
      setTimeout(function(){ lb.close(); },reduce.matches?0:200);
    } else { track.style.transform=''; track.style.opacity=''; lb.style.removeProperty('--lb-dim'); }
  }
  track.addEventListener('pointerup',release); track.addEventListener('pointercancel',release);
  document.getElementById('lb-close').addEventListener('click',function(){lb.close();});
  lb.addEventListener('click',function(e){
    // a click outside the image (the dark margin of a slide) closes it too
    if(e.target===lb||e.target.classList.contains('lb-slide')) lb.close();
  });
})();
