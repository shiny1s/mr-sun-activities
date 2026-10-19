window.__mrsunOwnFinish = true;
(function(){
  function hook(){
    if(typeof checkAnswers !== 'function' || typeof showGroup !== 'function'){ return setTimeout(hook, 300); }
    var done = {}, oC = checkAnswers, oS = showGroup;
    window.showGroup = function(){ done = {}; return oS.apply(this, arguments); };
    window.checkAnswers = function(g){
      var res = oC.apply(this, arguments);
      if(!done[g]){ done[g] = true; var el = document.getElementById('score-' + g); var m = el && /(\d+)\s*(?:\/|out of)\s*(\d+)/.exec(el.textContent); if(m) MrSun.finish(+m[1], +m[2]); }
      return res;
    };
  }
  hook();
})();
