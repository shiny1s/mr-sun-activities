/* Writing scoring hook: records each card's FIRST check; reported when Finish is pressed. */
window.__mrsunOwnFinish = true;
(function(){
  var first = new Map();
  function hook(){
    var fb = document.getElementById('finBtn');
    if(!fb){ return setTimeout(hook, 300); }
    ['showGroup','startGroup'].forEach(function(n){
      if(typeof window[n] === 'function'){
        var o = window[n];
        window[n] = function(){ first = new Map(); return o.apply(this, arguments); };
      }
    });
    document.addEventListener('click', function(e){
      var b = e.target.closest && e.target.closest('[data-check]');
      if(!b) return;
      setTimeout(function(){
        var c = b.closest('.card');
        if(c && c._done && !first.has(c)) first.set(c, {r: c._r, t: c._t});
      }, 0);
    });
    fb.addEventListener('click', function(){
      setTimeout(function(){
        var g = 0, t = 0;
        document.querySelectorAll('.card').forEach(function(c){
          var x = first.get(c) || (c._done ? {r: c._r, t: c._t} : null);
          if(x){ g += x.r; t += x.t; }
        });
        MrSun.finish(g, t);
      }, 450);
    });
  }
  hook();
})();
