window.__mrsunOwnFinish = true;
(function(){
  function hook(){
    if(typeof checkAll !== 'function' || typeof openGroup !== 'function'){ return setTimeout(hook, 300); }
    var done = false, oC = checkAll, oO = openGroup;
    window.openGroup = function(){ done = false; return oO.apply(this, arguments); };
    window.checkAll = function(){
      var res = oC.apply(this, arguments);
      if(!done){ done = true; var m = /(\d+)\s*\/\s*(\d+)/.exec(document.getElementById('score').textContent); if(m) MrSun.finish(+m[1], +m[2]); }
      return res;
    };
  }
  hook();
})();
