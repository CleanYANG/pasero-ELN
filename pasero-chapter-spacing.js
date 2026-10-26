/* Match the visible content gap on either side of the feature explorer. */
(function(){
 'use strict';
 var desktop=document.getElementById('desktop-explorer');
 var explorer=desktop||document.getElementById('explorer');
 if(!explorer)return;
 var hero=document.querySelector(desktop?'.hero':'.mobile-hero');
 var heroParts=[].slice.call(hero.querySelectorAll(desktop?'.copy,.stage':'.mobile-hero-layout>div'));
 var first=explorer.querySelector(desktop?'.section-kicker':'.eyebrow');
 var last=explorer.querySelector(desktop?'.explorer-footer':'.explorer-layout');
 var next=document.querySelector(desktop?'#mobile-story .mobile-kicker':'.sync-chapter .eyebrow');
 var pending=false;
 function align(){
  pending=false;
  if(!explorer.getBoundingClientRect().width)return;
  var heroBottom=Math.max.apply(null,heroParts.map(function(el){return el.getBoundingClientRect().bottom;}));
  var target=first.getBoundingClientRect().top-heroBottom;
  var current=next.getBoundingClientRect().top-last.getBoundingClientRect().bottom;
  var padding=parseFloat(getComputedStyle(explorer).paddingBottom)||0;
  var adjusted=Math.max(0,Math.round((padding+target-current)*100)/100);
  if(Math.abs(adjusted-padding)>.5)explorer.style.setProperty('--workspace-tail-space',adjusted+'px');
 }
 function schedule(){if(!pending){pending=true;requestAnimationFrame(align);}}
 var observer=new ResizeObserver(schedule);
 [hero,first,last,next.parentElement].concat(heroParts).forEach(function(el){observer.observe(el);});
 window.addEventListener('resize',schedule);
 window.addEventListener('load',schedule);
 if(document.fonts)document.fonts.ready.then(schedule);
 schedule();
})();
