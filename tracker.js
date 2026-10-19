/* Mr Sun activity tracker. Honour-system name pick + usage log to a private Google Sheet.
   Config: window.MRSUN_CONFIG = {endpoint, classCode}. Indicators only, not proof. */
(function(){
  var C = window.MRSUN_CONFIG || {};
  var T = window.MrSun = {};
  var student = null, cur = null, roster = null;
  var IDLE_MS = 60000;
  var lastAct = Date.now();
  ['pointerdown','keydown','touchstart','scroll'].forEach(function(ev){
    document.addEventListener(ev, function(){ lastAct = Date.now(); }, {passive:true, capture:true});
  });
  function uid(){ return 's' + Math.random().toString(36).slice(2,10) + Date.now().toString(36).slice(-4); }
  function send(type, extra){
    if(!student || !cur) return;
    var d = {code:C.classCode, type:type, ts:new Date().toISOString(), session:cur.session, studentId:student.id,
      activity:cur.activity, secondsActive:Math.round(cur.secs), attempts:cur.attempts||0, score:cur.score||0, total:cur.total||0, visit:cur.visit};
    if(!C.endpoint){ var q = JSON.parse(localStorage.getItem('mrsun_dry')||'[]'); q.push(d); localStorage.setItem('mrsun_dry', JSON.stringify(q)); return; }
    try { fetch(C.endpoint, {method:'POST', mode:'no-cors', keepalive:true, headers:{'Content-Type':'text/plain'}, body:JSON.stringify(d)}); } catch(e){}
  }
  /* active-time ticker: counts only while tab visible and user touched something in the last minute */
  setInterval(function(){
    if(!cur) return;
    if(!document.hidden && Date.now() - lastAct < IDLE_MS){ cur.secs += 1; cur.idleSent = false; }
    else if(!cur.idleSent){ cur.idleSent = true; send('pause'); }
  }, 1000);
  document.addEventListener('visibilitychange', function(){ if(document.hidden) send('pause'); });
  window.addEventListener('pagehide', function(){ T.end(); });

  function el(tag, attrs, html){ var e = document.createElement(tag); for(var k in (attrs||{})) e.setAttribute(k, attrs[k]); if(html!=null) e.innerHTML = html; return e; }
  function esc(s){ return String(s).replace(/[&<>"']/g, function(m){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]; }); }


  /* Always-visible way back to the activity hub. */
  function addNav(){
    if(document.getElementById('mrsun-nav')) return;
    var a = document.createElement('a'); a.id = 'mrsun-nav'; a.href = 'hub.html'; a.textContent = '\u2190 All activities';
    a.setAttribute('style','position:fixed;left:12px;bottom:64px;z-index:9000;background:#1F3864;color:#fff;padding:7px 14px;border-radius:14px;font:700 15px Nunito,Segoe UI,Arial,sans-serif;text-decoration:none;opacity:.95;box-shadow:0 2px 6px rgba(0,0,0,.25)');
    document.body.appendChild(a);
  }
  /* Stop the confirming tap from also pressing whatever sits under it (e.g. a group button). */
  function guardTap(){ document.body.style.pointerEvents = 'none'; setTimeout(function(){ document.body.style.pointerEvents = ''; }, 800); }

  /* Name picker. Resolves with {id,name}. Remembers the pick for this browser tab only. */
  T.pickStudent = function(){
    return new Promise(function(resolve){
      var saved = sessionStorage.getItem('mrsun_student');
      if(saved){ try { student = JSON.parse(saved); addNav(); return resolve(student); } catch(e){} }
      var ov = el('div', {id:'mrsun-pick', style:'position:fixed;inset:0;z-index:9999;background:#1F3864;display:flex;align-items:center;justify-content:center;font-family:Nunito,Comic Sans MS,Segoe UI,Arial,sans-serif'});
      var box = el('div', {style:'background:#fff;border-radius:24px;padding:40px;max-width:520px;width:92%;text-align:center;box-shadow:0 12px 32px rgba(0,0,0,.3)'});
      ov.appendChild(box); document.body.appendChild(ov);
      function step1(msg){
        box.innerHTML = '<h1 style="margin:0 0 8px;color:#1F3864;font-size:30px">Who are you?</h1><p style="font-size:18px;margin:0 0 20px">Pick your name from the list.</p>'
          + '<select id="mrsun-sel" style="font-size:22px;padding:12px;width:100%;border-radius:12px;border:2px solid #2E75B6"><option value="">Choose your name...</option></select>'
          + '<p id="mrsun-msg" style="color:#d8473f;min-height:24px;margin:12px 0 0">' + (msg||'') + '</p>'
          + '<button id="mrsun-next" style="margin-top:8px;font-size:20px;padding:12px 28px;border:0;border-radius:12px;background:#2E75B6;color:#fff;font-weight:800;cursor:pointer">Next</button>';
        var sel = box.querySelector('#mrsun-sel');
        load().then(function(list){
          list.forEach(function(s){ sel.appendChild(el('option', {value:s.id}, esc(s.name))); });
        }, function(){ box.querySelector('#mrsun-msg').textContent = 'Could not load the class list. Check the internet and refresh the page.'; });
        box.querySelector('#mrsun-next').onclick = function(){
          var id = sel.value; if(!id){ box.querySelector('#mrsun-msg').textContent = 'Pick your name first.'; return; }
          var s = roster.filter(function(r){ return r.id === id; })[0];
          box.innerHTML = '<h1 style="margin:0 0 16px;color:#1F3864;font-size:30px">You picked ' + esc(s.name) + '.</h1><p style="font-size:24px;margin:0 0 24px">Is that you?</p>'
            + '<button id="mrsun-yes" style="font-size:22px;padding:12px 30px;border:0;border-radius:12px;background:#3a9d3a;color:#fff;font-weight:800;cursor:pointer;margin-right:12px">Yes, that is me</button>'
            + '<button id="mrsun-no" style="font-size:22px;padding:12px 30px;border:0;border-radius:12px;background:#d8473f;color:#fff;font-weight:800;cursor:pointer">No</button>';
          box.querySelector('#mrsun-no').onclick = function(){ step1(''); };
          box.querySelector('#mrsun-yes').onclick = function(ev){
            student = s; sessionStorage.setItem('mrsun_student', JSON.stringify(s)); ev && ev.preventDefault && ev.preventDefault(); ev && ev.stopPropagation && ev.stopPropagation(); ov.remove(); guardTap(); addNav(); resolve(s);
          };
        };
      }
      step1('');
    });
  };
  function load(){
    if(roster) return Promise.resolve(roster);
    if(!C.endpoint) { roster = [{id:'s00',name:'Test student'}]; return Promise.resolve(roster); }
    return fetch(C.endpoint + '?action=roster&code=' + encodeURIComponent(C.classCode)).then(function(r){ return r.json(); }).then(function(j){
      if(!Array.isArray(j) || !j.length) throw new Error('bad roster'); roster = j; return j; });
  }
  T.student = function(){ return student; };
  T.changeStudent = function(){ T.end(); sessionStorage.removeItem('mrsun_student'); location.reload(); };

  /* One session per activity open. */
  T.begin = function(activity){
    T.end();
    var key = 'mrsun_visits_' + (student ? student.id : '') + '_' + activity;
    var v = (parseInt(localStorage.getItem(key)||'0',10)) + 1; localStorage.setItem(key, v);
    cur = {session:uid(), activity:activity, secs:0, attempts:0, score:0, total:0, visit:v, finished:false};
    send('start');
  };
  T.attempt = function(){ if(cur) cur.attempts++; };
  T.finish = function(score, total){
    if(!cur) return; cur.score = score; cur.total = total;
    send(cur.finished ? 'refinish' : 'finish'); cur.finished = true;
  };
  T.end = function(){ if(cur){ send('leave'); cur = null; } };
})();
