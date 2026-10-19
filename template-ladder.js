/* Sentence ladder template. Content comes from content-ladder-<id>.json (?a=<id>). */
(function(){
  var id = new URLSearchParams(location.search).get('a') || 'l3-nature';
  function esc(s){ return String(s).replace(/[&<>"']/g,function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m];}); }
  function norm(s){ return String(s).replace(/\s+/g,' ').trim().toLowerCase(); }
  Promise.all([fetch('content-ladder-'+id+'.json').then(function(r){return r.json();}), MrSun.pickStudent()]).then(function(r){ build(r[0]); })
  .catch(function(){ document.body.insertAdjacentHTML('afterbegin','<p style="padding:16px;background:#d8473f;color:#fff;font-weight:700">Could not load this activity. Refresh the page.</p>'); });

  function build(C){
    document.title = C.title;
    var v = C.vars||{}; Object.keys(v).forEach(function(k){ document.documentElement.style.setProperty('--'+k, v[k]); });
    document.getElementById('h1').textContent = C.h1; document.getElementById('hp').textContent = C.hp;
    var h = '<span class="tag">'+esc(C.tag)+'</span><h2>'+esc(C.h2)+'</h2><p>'+esc(C.intro)+'</p>';
    C.levels.forEach(function(L,i){
      h += '<div class="level" data-i="'+i+'"><h3>'+esc(L.label)+' <button class="btn ghost speak" data-say="'+esc(L.say)+'">🔊</button></h3>'
        + '<div class="row"><div class="sentence">'+esc(L.text)+'</div><button class="btn reveal">Reveal copy box</button></div>'
        + '<div class="row hidden" style="margin-top:10px"><input class="input" placeholder="'+esc(L.ph)+'" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"><button class="btn check">Check</button></div><div class="fb"></div></div>';
    });
    h += '<div class="level" id="buildLevel"><h3>'+esc(C.bh)+' <button class="btn ghost speak" data-say="'+esc(C.bsay)+'">🔊</button></h3><p class="small">'+esc(C.bsmall)+'</p>'
      + '<div class="sentence" id="buildLine"></div><div class="chips" id="bank"></div><div class="fb" id="buildFb"></div>'
      + '<div class="row" style="margin-top:10px"><button class="btn" id="checkBuild">Check sentence</button><button class="btn ghost" id="resetBuild">Reset</button></div></div>';
    document.getElementById('card').innerHTML = h;

    var who = document.createElement('div'); who.id='mrsun-who'; who.innerHTML='Name: <b></b><a>not you?</a>';
    who.querySelector('b').textContent = MrSun.student().name; who.querySelector('a').onclick=function(){ MrSun.changeStudent(); };
    document.body.appendChild(who);
    MrSun.begin(id);

    /* sound */
    var muted=false, tts='speechSynthesis' in window, voice=null;
    if(tts){ var iv=function(){ var vs=speechSynthesis.getVoices(); voice=vs.find(function(x){return x.name.indexOf('William')>-1;})||vs.find(function(x){return x.lang==='en-AU'||x.lang==='en_AU';})||vs[0]||null; }; speechSynthesis.onvoiceschanged=iv; iv(); }
    function speak(t){ if(muted||!tts) return; speechSynthesis.cancel(); var u=new SpeechSynthesisUtterance(t); u.lang='en-AU'; if(voice) u.voice=voice; u.rate=.9; speechSynthesis.speak(u); }
    var sb=document.getElementById('soundBtn');
    sb.onclick=function(){ muted=!muted; sb.textContent=muted?'🔇 Sound: OFF':'🔊 Sound: ON'; if(muted&&tts) speechSynthesis.cancel(); };
    document.querySelectorAll('.speak').forEach(function(b){ b.onclick=function(){ speak(b.dataset.say); }; });
    document.querySelectorAll('.reveal').forEach(function(b){ b.onclick=function(){ b.parentElement.nextElementSibling.classList.remove('hidden'); }; });

    /* scoring: each item scores on its FIRST check only; retries are allowed but don't change the score */
    var items = C.levels.length + 1, firstDone = {}, score = 0, total = 0;
    function upd(){ document.getElementById('score').textContent=score; document.getElementById('total').textContent=total; }
    function record(key, ok){ if(firstDone[key]) return; firstDone[key]=true; total++; if(ok) score++; upd(); }
    function checkLevel(el, silent){
      var i=+el.dataset.i, inp=el.querySelector('.input'), ok = norm(inp.value)===norm(C.levels[i].ans), fb=el.querySelector('.fb'), s=el.querySelector('.sentence');
      if(!silent) MrSun.attempt();
      inp.classList.remove('ok','no'); inp.classList.add(ok?'ok':'no'); s.classList.remove('ok','no'); s.classList.add(ok?'ok':'no');
      fb.className='fb '+(ok?'ok':'no'); fb.textContent = ok ? 'Correct!' : 'Not quite. Check it against the sentence and try again.';
      record('l'+i, ok);
    }
    document.querySelectorAll('.level[data-i]').forEach(function(el){
      el.querySelector('.check').onclick=function(){ checkLevel(el,false); };
      el.querySelector('.input').addEventListener('keydown',function(e){ if(e.key==='Enter') checkLevel(el,false); });
    });

    /* chip builder */
    var bank=document.getElementById('bank'), line=document.getElementById('buildLine');
    var chips = C.chips.map(function(t){ var c=document.createElement('span'); c.className='chip'; c.textContent=t; return c; });
    for(var i=chips.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)); var t=chips[i]; chips[i]=chips[j]; chips[j]=t; }
    chips.forEach(function(c){ bank.appendChild(c); c.onclick=function(){ if(c.parentNode===bank) line.appendChild(c); else bank.appendChild(c); }; });
    function checkBuild(silent){
      var val=norm([].map.call(line.querySelectorAll('.chip'),function(c){return c.textContent;}).join(' ')), ok=val===norm(C.ans), fb=document.getElementById('buildFb');
      if(!silent) MrSun.attempt();
      line.classList.remove('ok','no'); line.classList.add(ok?'ok':'no');
      fb.className='fb '+(ok?'ok':'no'); fb.textContent = ok ? 'Great sentence!' : 'Not quite yet. Keep going.';
      record('build', ok);
    }
    document.getElementById('checkBuild').onclick=function(){ checkBuild(false); };
    document.getElementById('resetBuild').onclick=function(){ [].slice.call(line.querySelectorAll('.chip')).forEach(function(c){ bank.appendChild(c); }); line.classList.remove('ok','no'); document.getElementById('buildFb').textContent=''; };

    document.getElementById('finishBtn').onclick=function(){
      /* mark anything not yet tried as a miss, without counting extra attempts */
      document.querySelectorAll('.level[data-i]').forEach(function(el){ if(!firstDone['l'+el.dataset.i]) checkLevel(el,true); });
      if(!firstDone.build) checkBuild(true);
      MrSun.finish(score,total);
      alert('⭐ You got '+score+' out of '+items+' on your first try!');
    };
  }
})();
