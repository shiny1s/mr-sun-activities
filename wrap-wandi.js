window.__mrsunOwnFinish = true;
(function(){
  function hook(){
    if(typeof checkAnswers !== 'function'){ return setTimeout(hook, 300); }
    var done = false, oC = checkAnswers, oR = typeof resetAll === 'function' ? resetAll : null;
    window.checkAnswers = function(){
      var res = oC.apply(this, arguments);
      if(!done){ done = true; var m = /(\d+)\s*\/\s*(\d+)/.exec(document.getElementById('score').textContent); if(m) MrSun.finish(+m[1], +m[2]); }
      return res;
    };
  }
  hook();
})();
