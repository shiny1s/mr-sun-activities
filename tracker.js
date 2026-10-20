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
    var a = document.createElement('a'); a.id = 'mrsun-nav'; a.href = 'hub.html'; a.textContent = 'GO BACK';
    a.setAttribute('style','position:fixed;left:12px;top:12px;z-index:9000;background:#d8473f;color:#fff;padding:8px 16px;border-radius:14px;font:800 15px Nunito,Segoe UI,Arial,sans-serif;text-decoration:none;opacity:.95;box-shadow:0 2px 6px rgba(0,0,0,.25)');
    document.body.appendChild(a);
  }
  /* Stop the confirming tap from also pressing whatever sits under it (e.g. a group button). */
  function guardTap(){ document.body.style.pointerEvents = 'none'; setTimeout(function(){ document.body.style.pointerEvents = ''; }, 800); }

  /* Class list by gender (3S 2026 roster). Names not listed here fall back to a neutral group. */
  var BOYS = {'Adam B':1,'Adam M':1,Ali:1,Arsen:1,Ashton:1,Carlos:1,Charlie:1,Elia:1,Emeliano:1,Georgio:1,Haydara:1,Issa:1,Kaden:1,Peter:1,Sharbel:1};
  var GIRLS = {Chelsea:1,Daniella:1,Eali:1,Elina:1,Inala:1,Indi:1,Kathy:1,Liyana:1,Mia:1,Sarah:1,Violet:1,Zainab:1};

  /* Name picker. Resolves with {id,name}. Remembers the pick for this browser tab only. */
  T.pickStudent = function(){
    return new Promise(function(resolve){
      var saved = sessionStorage.getItem('mrsun_student');
      if(saved){ try { student = JSON.parse(saved); addNav(); return resolve(student); } catch(e){} }
      var ov = el('div', {id:'mrsun-pick', style:'position:fixed;inset:0;z-index:9999;background:#1F3864;display:flex;overflow:auto;font-family:Nunito,Comic Sans MS,Segoe UI,Arial,sans-serif'});
      var box = el('div', {style:'background:#fff;border-radius:24px;padding:28px;margin:auto;max-width:620px;width:92%;text-align:center;box-shadow:0 12px 32px rgba(0,0,0,.3)'});
      ov.appendChild(box); document.body.appendChild(ov);
      function confirmPick(s){
        box.innerHTML = '<h1 style="margin:0 0 16px;color:#1F3864;font-size:30px">You picked ' + esc(s.name) + '.</h1><p style="font-size:24px;margin:0 0 24px">Is that you?</p>'
          + '<button id="mrsun-yes" style="font-size:22px;padding:12px 30px;border:0;border-radius:12px;background:#3a9d3a;color:#fff;font-weight:800;cursor:pointer;margin-right:12px">Yes, that is me</button>'
          + '<button id="mrsun-no" style="font-size:22px;padding:12px 30px;border:0;border-radius:12px;background:#d8473f;color:#fff;font-weight:800;cursor:pointer">No</button>';
        box.querySelector('#mrsun-no').onclick = function(){ step1(); };
        box.querySelector('#mrsun-yes').onclick = function(ev){
          student = s; sessionStorage.setItem('mrsun_student', JSON.stringify(s)); ev && ev.preventDefault && ev.preventDefault(); ev && ev.stopPropagation && ev.stopPropagation(); ov.remove(); guardTap(); addNav(); resolve(s);
        };
      }
      function nameButton(s, col){
        var b = el('button', {type:'button'}, esc(s.name));
        b.style.cssText = 'font-size:19px;font-weight:800;padding:10px 4px;border-radius:12px;border:3px solid ' + col + ';background:#fff;color:' + col + ';cursor:pointer;min-width:110px';
        b.onmouseover = function(){ b.style.background = col; b.style.color = '#fff'; };
        b.onmouseout = function(){ b.style.background = '#fff'; b.style.color = col; };
        b.onclick = function(){ confirmPick(s); };
        return b;
      }
      function group(title, names, col){
        var g = el('div', {style:'flex:0 0 auto'});
        g.appendChild(el('h2', {style:'margin:0 0 10px;color:' + col + ';font-size:22px'}, title));
        /* 8 rows, column flow: first 8 names in column 1, the rest in column 2. */
        var grid = el('div', {style:'display:grid;grid-template-rows:repeat(8,auto);grid-auto-flow:column;gap:8px'});
        names.forEach(function(s){ grid.appendChild(nameButton(s, col)); });
        g.appendChild(grid);
        return g;
      }
      function step1(){
        box.innerHTML = '<h1 style="margin:0 0 8px;color:#1F3864;font-size:30px">Who are you?</h1><p style="font-size:18px;margin:0 0 20px">Tap your name.</p>'
          + '<div id="mrsun-lists" style="display:flex;gap:24px;justify-content:center;align-items:flex-start;flex-wrap:wrap"></div>'
          + '<p id="mrsun-msg" style="color:#d8473f;min-height:24px;margin:12px 0 0"></p>';
        load().then(function(list){
          var byName = {}; list.forEach(function(s){ byName[s.name] = s; });
          function sorted(names){ return names.map(function(n){ return byName[n]; }).filter(Boolean).sort(function(a,b){ return a.name.localeCompare(b.name, 'en', {sensitivity:'base'}); }); }
          var boys = sorted(Object.keys(BOYS)), girls = sorted(Object.keys(GIRLS));
          var known = {}; boys.concat(girls).forEach(function(s){ known[s.id] = 1; });
          var others = list.filter(function(s){ return !known[s.id]; }).sort(function(a,b){ return a.name.localeCompare(b.name, 'en', {sensitivity:'base'}); });
          var lists = box.querySelector('#mrsun-lists');
          lists.appendChild(group('Boys', boys, '#1d5fd1'));
          lists.appendChild(group('Girls', girls, '#d8223f'));
          if(others.length) lists.appendChild(group('Class', others, '#444'));
        }, function(){ box.querySelector('#mrsun-msg').textContent = 'Could not load the class list. Check the internet and refresh the page.'; });
      }
      step1();
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
