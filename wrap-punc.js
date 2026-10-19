/* Punctuation scoring hook: tracker records the FIRST result of each activity; reported when the finish button is pressed. */
window.__mrsunOwnFinish = true;
(function(){
  function hook(){
    if(typeof recordResult !== 'function' || typeof showGroup !== 'function'){ return setTimeout(hook, 300); }
    var first = new Map(), oR = recordResult, oS = showGroup;
    window.recordResult = function(a, r, t){ if(!first.has(a)) first.set(a, {r: r, t: t}); return oR.apply(this, arguments); };
    window.showGroup = function(){ first = new Map(); return oS.apply(this, arguments); };
    var fb = document.getElementById('finBtn');
    if(fb) fb.addEventListener('click', function(){
      setTimeout(function(){ var g = 0, t = 0; first.forEach(function(x){ g += x.r; t += x.t; }); MrSun.finish(g, t); }, 450);
    });
  }
  hook();
})();
