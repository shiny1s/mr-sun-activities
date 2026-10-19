/* Mr Sun generic activity wrapper. Adds name pick + visit/time/attempt tracking to an existing activity page.
   Time, visits and check attempts are logged for every activity. Score is logged only when the page shows one. */
(function(){
  var slug = (window.MRSUN_ACTIVITY || 'unknown');
  var rootStyle = document.createElement('style');
  rootStyle.textContent = '#mrsun-who{position:fixed;right:10px;bottom:10px;z-index:9000;background:#1F3864;color:#fff;padding:6px 12px;border-radius:14px;font:600 14px Nunito,Segoe UI,Arial,sans-serif;opacity:.92}#mrsun-who a{margin-left:10px;color:#ffd24a;cursor:pointer;text-decoration:underline}';
  document.head.appendChild(rootStyle);
  function start(){
    MrSun.pickStudent().then(function(s){
      var who = document.createElement('div'); who.id = 'mrsun-who';
      who.innerHTML = 'Name: <b></b><a>not you?</a>'; who.querySelector('b').textContent = s.name;
      who.querySelector('a').onclick = function(){ MrSun.changeStudent(); };
      document.body.appendChild(who);
      wire();
      document.documentElement.setAttribute('data-mrsun', 'ready');
    }).catch(function(){
      document.body.insertAdjacentHTML('afterbegin','<p style="padding:16px;margin:0;background:#d8473f;color:#fff;font:700 18px Arial">Could not load your class list. Refresh the page.</p>');
    });
  }
  function readScore(){
    var t = document.body.innerText || '', m, best = null, re = /(\d+)\s*(?:\/|out of)\s*(\d+)/gi;
    var sc = t.match(/score[^0-9\n]{0,20}(\d+)\s*(?:\/|out of)\s*(\d+)/gi);
    if(sc && sc.length){ m = /(\d+)\s*(?:\/|out of)\s*(\d+)/i.exec(sc[sc.length-1]); if(m) return [parseInt(m[1],10), parseInt(m[2],10)]; }
    return null;
  }
  function wire(){
    var colour = null;
    if(typeof window.showGroup === 'function'){
      var oS = window.showGroup, oB = window.backToMenu;
      window.showGroup = function(c){ var r = oS.apply(this, arguments); colour = c; MrSun.begin(slug + ':' + c); return r; };
      if(typeof oB === 'function') window.backToMenu = function(){ var r = oB.apply(this, arguments); MrSun.end(); colour = null; return r; };
    } else { MrSun.begin(slug); colour = 'all'; }
    document.addEventListener('click', function(e){
      var b = e.target.closest('button, input[type=button], input[type=submit], [role=button]'); if(!b || !colour) return;
      var oc = (b.getAttribute('onclick') || '') + ' ' + (b.id || '') + ' ' + (b.className || '') + ' ' + (b.textContent || '');
      if(/check|submit|answer/i.test(oc)) MrSun.attempt();
      if(/finish|score all|results/i.test(oc)) setTimeout(function(){ var s = readScore(); if(s) MrSun.finish(s[0], s[1]); }, 400);
    }, true);
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
