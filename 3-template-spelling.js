
    const groups = window.__CONTENT.groups;
    function shuffleArray(arr){ 
      for(let i=arr.length-1; i>0; i--){ 
        const j = Math.floor(Math.random()*(i+1)); 
        [arr[i], arr[j]] = [arr[j], arr[i]]; 
      } 
      return arr; 
    }
    
    function esc(s){ 
      return String(s).replace(/[&<>"']/g, m => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m])); 
    }

    let voices = [];
    const synth = window.speechSynthesis || null;
    const hasTTS = !!synth;
    let muted = false;
    let sel = null;

    function loadVoices() {
      if (!hasTTS) return [];
      voices = synth.getVoices() || [];
      return voices;
    }

    function pickVoice() {
      const list = loadVoices();
      if (!list.length) return null;
      // Prefer Australian/UK friendly voices
      return (
        list.find(v => /william/i.test(v.name) && /^en[-_]AU$/i.test(v.lang)) ||
        list.find(v => /^en[-_]AU$/i.test(v.lang)) ||
        list.find(v => /australia/i.test(v.name) && /^en/i.test(v.lang)) ||
        list.find(v => /^en[-_](GB|UK)$/i.test(v.lang)) ||
        list.find(v => /^en/i.test(v.lang)) ||
        null
      );
    }

    function warmUpSpeech() {
      if (!hasTTS) return;
      loadVoices();
    }

    function speak(text){
      if (muted || !hasTTS || !text) return;
      loadVoices();
      synth.cancel();

      const u = new SpeechSynthesisUtterance(String(text));
      u.lang = 'en-AU';
      u.rate = 0.9;
      u.pitch = 1;
      u.volume = 1;

      const chosenVoice = pickVoice();
      if (chosenVoice) {
        u.voice = chosenVoice;
        u.lang = chosenVoice.lang || 'en-AU';
      }
      synth.speak(u);
    }

    if (hasTTS) {
      loadVoices();
      if ('onvoiceschanged' in synth) {
        synth.addEventListener('voiceschanged', loadVoices);
      }
      document.addEventListener('click', warmUpSpeech, { once: true });
      document.addEventListener('touchstart', warmUpSpeech, { once: true });
    }

    function renderGroup(key, group){
      const pluralList = group.plurals;
      const shuffledWords = shuffleArray(group.words.slice());
      const sortWords = shuffledWords.map(w => `<button class="chip" data-cat="${pluralList.includes(w) ? 'plural' : 'singular'}">${esc(w)}</button>`).join('');
      
      const shuffledClues = shuffleArray(group.activities.clues.slice());
      const clues = shuffledClues.map((q,i)=>`<div class="q"><span class="qnum">${i+1}.</span><button class="spk" type="button" title="Read clue" onclick='speak(${JSON.stringify(q[0])})'>🔊</button> ${esc(q[0])} <br><input type="text" class="typeit ${q[1].length>10?'wide':''}" data-ans="${esc(q[1])}"></div>`).join('');
      
      const shuffledMissing = shuffleArray(group.activities.missing.slice());
      const missing = shuffledMissing.map((q,i)=>`<div class="q"><span class="qnum">${i+1}.</span><button class="spk" type="button" title="Read sentence" onclick='speak(${JSON.stringify(q[0].replace('____', 'blank'))})'>🔊</button> ${esc(q[0])} <br><input type="text" class="typeit ${q[1].length>10?'wide':''}" data-ans="${esc(q[1])}"></div>`).join('');
      
      const shuffledMeanings = shuffleArray(group.activities.meanings.slice());
      const meanings = shuffledMeanings.map((m,i)=>`<div class="mc-q"><p><strong>${i+1}. ${esc(m[0])}</strong><button class="spk" type="button" title="Read word" onclick='speak(${JSON.stringify('What is the meaning of ' + m[0])})'>🔊</button></p><div class="multiple-choice">${shuffleArray(m[1].slice()).map(opt=>`<button class="mc-option" type="button" data-correct="${opt===m[2]}" onclick='speak(${JSON.stringify(opt)})'>${esc(opt)}</button>`).join('')}</div></div>`).join('');
      
      const wrongWord = group.activities.wrong.find(w => !group.words.includes(w));
      const wrongOpts = shuffleArray(group.activities.wrong.slice()).map(w=>`<button class="word-opt" type="button" data-correct="${w===wrongWord ? 'false':'true'}" onclick='speak(${JSON.stringify(w)})'>${esc(w)}</button>`).join('');
      
      const shuffledUnscramble = shuffleArray(group.activities.unscramble.slice());
      const unscramble = shuffledUnscramble.map((u,i)=>`<div class="q"><span class="qnum">${i+1}.</span> <button class="spk" type="button" title="Read scrambled letters" onclick='speak(${JSON.stringify('Unscramble the letters: ' + u[0].split('').join(' '))})'>🔊</button> <strong>${esc(u[0])}</strong> <br><input type="text" class="unscramble-input ${u[1].length>10?'wide':''}" data-ans="${esc(u[1])}"></div>`).join('');
      
      const shuffledBuild = shuffleArray(group.activities.build.slice());
      const build = shuffledBuild.map((b,i)=>`<div class="mc-q"><p><strong>${i+1}. ${esc(b[0])}</strong><button class="spk" type="button" title="Read question" onclick='speak(${JSON.stringify(b[0])})'>🔊</button></p><div class="multiple-choice">${shuffleArray(b[1].slice()).map(opt=>`<button class="mc-option" type="button" data-correct="${opt===b[2]}" onclick='speak(${JSON.stringify(opt)})'>${esc(opt)}</button>`).join('')}</div></div>`).join('');

      const speedWordsJson = JSON.stringify(shuffleArray(group.activities.speedWords.slice()));

      return `
      <div class="card ${group.className}" data-group-id="${key}" style="display:none">
        <button class="back-btn" type="button" onclick="backToMenu()">← Back to Menu</button>
        <div class="group-header"><div><h2>${group.title}</h2></div></div>
        <div class="noteface">
          <div>
            <p style="color:var(--dark);font-weight:900;margin:0 0 6px 0;font-size:20px;">Word List:</p>
            <p style="margin:0;font-size:17px;">${group.words.join(', ')}</p>
          </div>
          <button class="spk" type="button" style="width:50px;height:50px;font-size:24px;" title="Read words" onclick='speak(${JSON.stringify('Words. ' + group.words.join(', '))})'>🔊</button>
        </div>

        <div class="activity" data-act-id="sort">
          <h3>1. Sort: ${esc(group.sortTitle)}</h3>
          <p class="instr">${esc(group.sortInstruction)}</p>
          <div class="bank" data-bank>${sortWords}</div>
          <div class="buckets">
            <div class="bucket" data-cat="singular"><h4>${esc(group.bucket1)}</h4><div class="drop"></div></div>
            <div class="bucket" data-cat="plural"><h4>${esc(group.bucket2)}</h4><div class="drop"></div></div>
          </div>
          <button class="btn" type="button" data-check>Check</button>
          <button class="btn retry" type="button" onclick="resetActivity(this,'sort')">Retry</button>
          <p class="fb"></p>
        </div>

        <div class="activity" data-act-id="type1">
          <h3>2. Word Clues</h3>
          <p class="instr">Read or listen to the clue and type the spelling word.</p>
          ${clues}
          <button class="btn" type="button" data-check-type>Check</button>
          <button class="btn retry" type="button" onclick="resetActivity(this,'type')">Retry</button>
          <p class="fb"></p>
        </div>

        <div class="activity" data-act-id="type2">
          <h3>3. Missing Word</h3>
          <p class="instr">Type the spelling word that correctly finishes each sentence.</p>
          ${missing}
          <button class="btn" type="button" data-check-type>Check</button>
          <button class="btn retry" type="button" onclick="resetActivity(this,'type')">Retry</button>
          <p class="fb"></p>
        </div>

        <div class="activity" data-act-id="mc">
          <h3>4. Meaning Match</h3>
          <p class="instr">Click the meaning that matches the word.</p>
          ${meanings}
          <button class="btn small" type="button" onclick="checkMultiChoice(this)">Check</button>
          <button class="btn small retry" type="button" onclick="resetActivity(this,'mc')">Retry</button>
          <p class="fb"></p>
        </div>

        <div class="activity" data-act-id="err">
          <h3>5. Spot the Mistake</h3>
          <p class="instr">One word is spelled incorrectly. Click the wrong word.</p>
          <div class="word-grid">${wrongOpts}</div>
          <button class="btn small" type="button" onclick="checkError(this)">Check</button>
          <button class="btn small retry" type="button" onclick="resetActivity(this,'err')">Retry</button>
          <p class="fb"></p>
        </div>

        <div class="activity" data-act-id="unsc">
          <h3>6. Unscramble</h3>
          <p class="instr">Fix the mixed up letters to make the spelling word.</p>
          ${unscramble}
          <button class="btn" type="button" onclick="checkUnscramble(this)">Check</button>
          <button class="btn retry" type="button" onclick="resetActivity(this,'unsc')">Retry</button>
          <p class="fb"></p>
        </div>

        <div class="activity" data-act-id="mc2">
          <h3>7. Pick the Right Word</h3>
          <p class="instr">Choose the correct spelling word to match the clue.</p>
          ${build}
          <button class="btn small" type="button" onclick="checkMultiChoice(this)">Check</button>
          <button class="btn small retry" type="button" onclick="resetActivity(this,'mc')">Retry</button>
          <p class="fb"></p>
        </div>

        <div class="activity timer-activity" data-act-id="timed" data-words='${esc(speedWordsJson)}'>
          <h3>8. Timed Typing Test ⏱️</h3>
          <p class="instr">Type each word exactly. Press <strong>Enter</strong> or click Next. Can you finish before the 60 seconds are up?</p>
          <div class="timer-box">
            <div>
              <div class="timer-display" data-time>60s</div>
              <div class="typing-stats" data-progress>0 of ${group.activities.speedWords.length} words completed</div>
            </div>
            <div>
              <button class="btn start-timer-btn" type="button" onclick="startTimedTest(this)">Start Test</button>
              <button class="btn retry" type="button" onclick="resetTimedTest(this)">Reset</button>
            </div>
          </div>
          <div class="typing-line">
            <span class="typing-prompt" data-prompt>Press Start</span>
            <input type="text" class="typeit ${group.activities.speedWords.some(w=>w.length>10)?'wide':''}" data-typing-input disabled placeholder="Type here...">
            <button class="btn timed-next-btn" type="button" onclick="submitTimedWord(this)">Next</button>
          </div>
          <div class="typing-stats" data-stats>Accuracy: 0% | Correct: 0 | Attempts: 0</div>
          <div class="done-list" data-done-list></div>
          <p class="typing-result" data-result></p>
        </div>
      </div>`;
    }

    const main = document.getElementById('main-content');
    main.innerHTML = Object.entries(groups).map(([k,g])=>renderGroup(k,g)).join('');

    function showGroup(color){
      document.getElementById('front-menu').style.display = 'none';
      document.getElementById('main-header').style.display = 'block';
      document.getElementById('main-content').style.display = 'block';
      document.getElementById('scorebar').style.display = 'flex';
      
      document.querySelectorAll('.card').forEach(c => c.style.display = 'none');
      document.querySelector(`.${color}-group`).style.display = 'block';
      window.scrollTo(0,0);
      updateScore();
    }

    function backToMenu(){
      document.getElementById('front-menu').style.display = 'block';
      document.getElementById('main-header').style.display = 'none';
      document.getElementById('main-content').style.display = 'none';
      document.getElementById('scorebar').style.display = 'none';
      window.scrollTo(0,0);
    }

    document.getElementById('soundBtn').addEventListener('click', function(){
      muted = !muted;
      if (muted && synth) synth.cancel();
      this.textContent = muted ? '🔇 Sound OFF' : '🔊 Sound ON';
    });

    if (!hasTTS) {
      document.getElementById('soundBtn').style.display = 'none';
    }

    function selChip(c){
      if(c.classList.contains('ok') || c.classList.contains('no')) return;
      if(sel === c){ 
        c.classList.remove('sel'); 
        sel = null; 
      } else { 
        if(sel) sel.classList.remove('sel'); 
        sel = c; 
        c.classList.add('sel'); 
      }
    }

    document.addEventListener('click', function(e){
      const card = e.target.closest('.card');
      if(!card) return;
      
      // Ignore clicks on inner interactive elements for chip logic
      if(e.target.closest('.mc-option') || e.target.closest('button.spk') || e.target.closest('.start-timer-btn') || e.target.closest('.timed-next-btn')) return;
      
      const ch = e.target.closest('.chip');
      if(ch){ 
        selChip(ch); 
        speak(ch.textContent.trim()); 
        return; 
      }
      
      const bucket = e.target.closest('.bucket');
      const bank = e.target.closest('[data-bank]');
      
      if(sel){
        if(bucket){ 
          bucket.querySelector('.drop').appendChild(sel); 
          sel.classList.remove('sel','ok','no'); 
          sel = null; 
        } else if(bank){ 
          bank.appendChild(sel); 
          sel.classList.remove('sel','ok','no'); 
          sel = null; 
        }
      }
    });

    document.querySelectorAll('.multiple-choice').forEach(grp => {
      grp.querySelectorAll('.mc-option').forEach(opt => {
        opt.addEventListener('click', function(){
          if(grp.querySelector('.mc-option.ok') || grp.querySelector('.mc-option.no')) return;
          grp.querySelectorAll('.mc-option').forEach(o => o.classList.remove('sel'));
          opt.classList.add('sel');
        });
      });
    });

    document.querySelectorAll('.word-opt').forEach(o => o.addEventListener('click', function(){
      if(o.classList.contains('ok') || o.classList.contains('no')) return;
      const grid = o.parentElement;
      grid.querySelectorAll('.word-opt').forEach(x => x.classList.remove('sel'));
      o.classList.add('sel');
    }));

    document.querySelectorAll('[data-check], [data-check-type]').forEach(b => {
      b.addEventListener('click', function(){ runCheck(b.closest('.card'), b); });
    });

    document.querySelectorAll('[data-typing-input]').forEach(inp => {
      inp.addEventListener('keydown', function(e){
        if(e.key === 'Enter'){
          e.preventDefault();
          submitTimedWord(inp.closest('.timer-activity').querySelector('.timed-next-btn'));
        }
      });
    });

    function chkSort(card){
      const cs = card.querySelectorAll('[data-act-id="sort"] .chip'); 
      let r = 0, t = cs.length;
      cs.forEach(c => {
        c.classList.remove('ok','no');
        const parent = c.closest('.bucket');
        if(parent && parent.dataset.cat === c.dataset.cat){ 
          c.classList.add('ok'); 
          r++; 
        } else {
          c.classList.add('no');
        }
      });
      return [r, t];
    }

    function chkType(activityEl){
      const is = activityEl.querySelectorAll('.typeit'); 
      let r = 0, t = is.length;
      is.forEach(i => {
        i.classList.remove('ok','no');
        if(i.value.trim().replace(/[’‘]/g,"'").toLowerCase() === i.dataset.ans.replace(/[’‘]/g,"'").toLowerCase()){ 
          i.classList.add('ok'); 
          r++; 
        } else {
          i.classList.add('no');
        }
      });
      return [r, t];
    }

    function runCheck(card, btn){
      const activityEl = btn.closest('.activity');
      const isSort = activityEl.dataset.actId === 'sort';
      const r = isSort ? chkSort(card) : chkType(activityEl);
      const fb = activityEl.querySelector('.fb');
      
      activityEl.dataset.scoreR = r[0];
      activityEl.dataset.scoreT = r[1];
      
      fb.className = 'fb ' + (r[0] === r[1] ? 'ok' : 'no');
      fb.textContent = `${r[0]} / ${r[1]} correct`;
      updateScore();
    }

    function checkMultiChoice(btn){
      const activityEl = btn.closest('.activity');
      const groups = activityEl.querySelectorAll('.multiple-choice');
      let r = 0, t = groups.length;
      
      groups.forEach(grp => {
        grp.querySelectorAll('.mc-option').forEach(o => o.classList.remove('ok','no'));
        const chosen = grp.querySelector('.mc-option.sel');
        const correct = grp.querySelector('.mc-option[data-correct="true"]');
        
        if(chosen){
          if(chosen.dataset.correct === 'true'){ 
            chosen.classList.add('ok'); 
            r++; 
          } else {
            chosen.classList.add('no');
          }
          if(correct) correct.classList.add('ok');
        } else if(correct) {
          correct.classList.add('ok');
        }
      });
      
      const fb = activityEl.querySelector('.fb');
      fb.className = 'fb ' + (r === t ? 'ok' : 'no');
      fb.textContent = `${r} / ${t} correct`;
      
      activityEl.dataset.scoreR = r;
      activityEl.dataset.scoreT = t;
      updateScore();
    }

    function checkError(btn){
      const activityEl = btn.closest('.activity');
      const opts = activityEl.querySelectorAll('.word-opt');
      let found = false;
      
      opts.forEach(o => {
        o.classList.remove('ok','no');
        const isWrong = o.dataset.correct === 'false';
        const selected = o.classList.contains('sel');
        
        if(isWrong && selected){ 
          o.classList.add('ok'); 
          found = true; 
        }
        else if(selected && !isWrong) o.classList.add('no');
        else if(isWrong && !selected) o.classList.add('no');
      });
      
      const fb = activityEl.querySelector('.fb');
      fb.className = 'fb ' + (found ? 'ok' : 'no');
      fb.textContent = found ? 'Correct!' : 'Incorrect, try again.';
      
      activityEl.dataset.scoreR = found ? 1 : 0;
      activityEl.dataset.scoreT = 1;
      updateScore();
    }

    function checkUnscramble(btn){
      const activityEl = btn.closest('.activity');
      const is = activityEl.querySelectorAll('.unscramble-input');
      let r = 0, t = is.length;
      
      is.forEach(i => {
        i.classList.remove('ok','no');
        if(i.value.trim().replace(/[’‘]/g,"'").toLowerCase() === i.dataset.ans.replace(/[’‘]/g,"'").toLowerCase()){ 
          i.classList.add('ok'); 
          r++; 
        } else {
          i.classList.add('no');
        }
      });
      
      const fb = activityEl.querySelector('.fb');
      fb.className = 'fb ' + (r === t ? 'ok' : 'no');
      fb.textContent = `${r} / ${t} correct`;
      
      activityEl.dataset.scoreR = r;
      activityEl.dataset.scoreT = t;
      updateScore();
    }

    function resetActivity(btn, type){
      const activityEl = btn.closest('.activity');
      const fb = activityEl.querySelector('.fb');
      
      if(fb){ fb.textContent = ''; fb.className = 'fb'; }
      delete activityEl.dataset.scoreR;
      delete activityEl.dataset.scoreT;
      
      if(type === 'sort'){
        const bank = activityEl.querySelector('[data-bank]');
        activityEl.querySelectorAll('.chip').forEach(c => { 
          c.className = 'chip'; 
          bank.appendChild(c); 
        });
      }
      else if(type === 'type'){
        activityEl.querySelectorAll('.typeit').forEach(i => { 
          i.value = ''; 
          i.className = 'typeit' + (i.classList.contains('wide') ? ' wide' : ''); 
        });
      }
      else if(type === 'mc'){
        activityEl.querySelectorAll('.mc-option').forEach(o => o.className = 'mc-option');
      }
      else if(type === 'err'){
        activityEl.querySelectorAll('.word-opt').forEach(o => o.className = 'word-opt');
      }
      else if(type === 'unsc'){
        activityEl.querySelectorAll('.unscramble-input').forEach(i => { 
          i.value = ''; 
          i.className = 'unscramble-input' + (i.classList.contains('wide') ? ' wide' : ''); 
        });
      }
      
      if(sel){ sel.classList.remove('sel'); sel = null; }
      updateScore();
    }

    function startTimedTest(btn){
      const act = btn.closest('.timer-activity');
      resetTimedState(act, false);
      
      act.dataset.started = 'true';
      act.dataset.index = '0';
      act.dataset.correct = '0';
      act.dataset.attempts = '0';
      act.dataset.timeLeft = '60';
      act.dataset.elapsed = '0';
      
      const input = act.querySelector('[data-typing-input]');
      input.disabled = false;
      input.value = '';
      input.classList.remove('ok','no');
      
      setPrompt(act);
      updateTimedStats(act);
      input.focus();
      
      const interval = setInterval(() => {
        let left = parseInt(act.dataset.timeLeft, 10) - 1;
        act.dataset.timeLeft = left;
        act.querySelector('[data-time]').textContent = left + 's';
        act.dataset.elapsed = 60 - left;
        
        if(left <= 0){ finishTimedTest(act); }
      }, 1000);
      
      act._timer = interval;
      act.querySelector('[data-result]').textContent = 'Test running... go fast!';
    }

    function resetTimedState(act, clearScore=true){
      if(act._timer){ clearInterval(act._timer); act._timer = null; }
      
      act.dataset.started = 'false';
      act.querySelector('[data-time]').textContent = '60s';
      act.querySelector('[data-progress]').textContent = `0 of ${JSON.parse(act.dataset.words).length} words completed`;
      act.querySelector('[data-prompt]').textContent = 'Press Start';
      
      const input = act.querySelector('[data-typing-input]');
      input.disabled = true;
      input.value = '';
      input.classList.remove('ok','no');
      
      act.querySelector('[data-stats]').textContent = 'Accuracy: 0% | Correct: 0 | Attempts: 0';
      act.querySelector('[data-result]').textContent = '';
      act.querySelector('[data-done-list]').innerHTML = '';
      
      if(clearScore){
        delete act.dataset.scoreR;
        delete act.dataset.scoreT;
        updateScore();
      }
    }

    function resetTimedTest(btn){
      resetTimedState(btn.closest('.timer-activity'));
    }

    function setPrompt(act){
      const words = JSON.parse(act.dataset.words);
      const idx = parseInt(act.dataset.index || '0', 10);
      const prompt = act.querySelector('[data-prompt]');
      
      if(idx >= words.length){ finishTimedTest(act); return; }
      
      prompt.textContent = words[idx];
      act.querySelector('[data-progress]').textContent = `${idx} of ${words.length} words completed`;
      speak(words[idx]);
    }

    function submitTimedWord(btn){
      const act = btn.closest('.timer-activity');
      if(act.dataset.started !== 'true') return;

      const words = JSON.parse(act.dataset.words);
      let idx = parseInt(act.dataset.index || '0', 10);
      if(idx >= words.length) return finishTimedTest(act);

      const input = act.querySelector('[data-typing-input]');
      const target = words[idx];
      const guess = input.value.trim();
      let attempts = parseInt(act.dataset.attempts || '0', 10) + 1;
      act.dataset.attempts = attempts;

      if(guess.toLowerCase() === target.toLowerCase()){
        let correct = parseInt(act.dataset.correct || '0', 10) + 1;
        act.dataset.correct = correct;
        
        input.classList.remove('no');
        input.classList.add('ok');
        
        const chip = document.createElement('span');
        chip.className = 'done-word';
        chip.textContent = target;
        act.querySelector('[data-done-list]').appendChild(chip);
        
        idx++;
        act.dataset.index = idx;
        input.value = '';
        
        if(idx >= words.length){ finishTimedTest(act); return; }
        setPrompt(act);
      } else {
        input.classList.remove('ok');
        input.classList.add('no');
      }

      updateTimedStats(act);
      input.focus();
    }

    function updateTimedStats(act){
      const correct = parseInt(act.dataset.correct || '0', 10);
      const attempts = parseInt(act.dataset.attempts || '0', 10);
      const accuracy = attempts ? Math.round((correct/attempts)*100) : 0;
      act.querySelector('[data-stats]').textContent = `Accuracy: ${accuracy}% | Correct: ${correct} | Attempts: ${attempts}`;
    }

    function finishTimedTest(act){
      if(act._timer){ clearInterval(act._timer); act._timer = null; }
      
      act.dataset.started = 'false';
      const words = JSON.parse(act.dataset.words);
      const correct = parseInt(act.dataset.correct || '0', 10);
      const attempts = parseInt(act.dataset.attempts || '0', 10);
      const accuracy = attempts ? Math.round((correct/attempts)*100) : 0;
      const timeLeft = parseInt(act.dataset.timeLeft || '0', 10);
      const used = 60 - timeLeft;
      
      act.querySelector('[data-typing-input]').disabled = true;
      act.querySelector('[data-prompt]').textContent = correct === words.length ? 'Finished!' : 'Time up!';
      act.querySelector('[data-progress]').textContent = `${correct} of ${words.length} words completed`;
      act.querySelector('[data-time]').textContent = `${timeLeft}s`;
      act.querySelector('[data-result]').textContent = `Finished! Accuracy ${accuracy}%. Time used: ${used}s.`;
      
      act.dataset.scoreR = correct;
      act.dataset.scoreT = words.length;
      
      updateTimedStats(act);
      updateScore();
    }

    function updateScore(){
      let g = 0, t = 0;
      document.querySelectorAll('.activity').forEach(act => {
        if(act.dataset.scoreR !== undefined){
          g += parseInt(act.dataset.scoreR, 10);
          t += parseInt(act.dataset.scoreT, 10);
        }
      });
      document.getElementById('score').textContent = g;
      document.getElementById('total').textContent = t;
    }

    function showModal(title, msg) {
      document.getElementById('modal-title').textContent = title;
      document.getElementById('modal-msg').textContent = msg;
      document.getElementById('custom-modal').style.display = 'flex';
    }

    function closeModal() {
      document.getElementById('custom-modal').style.display = 'none';
    }

    document.getElementById('finBtn').addEventListener('click', function(){
      document.querySelectorAll('.card').forEach(c => {
        if(c.style.display === 'none') return;
        
        c.querySelectorAll('.activity').forEach(act => {
          const sortBtn = act.querySelector('[data-check]');
          const typeBtn = act.querySelector('[data-check-type]');
          const mcBtn = act.querySelector('button[onclick="checkMultiChoice(this)"]');
          const errBtn = act.querySelector('button[onclick="checkError(this)"]');
          const unBtn = act.querySelector('button[onclick="checkUnscramble(this)"]');
          
          if(sortBtn && act.dataset.scoreR === undefined) runCheck(c, sortBtn);
          if(typeBtn && act.dataset.scoreR === undefined) runCheck(c, typeBtn);
          if(mcBtn && act.dataset.scoreR === undefined) checkMultiChoice(mcBtn);
          if(errBtn && act.dataset.scoreR === undefined) checkError(errBtn);
          if(unBtn && act.dataset.scoreR === undefined) checkUnscramble(unBtn);
        });
      });

      const g = parseInt(document.getElementById('score').textContent, 10);
      const t = parseInt(document.getElementById('total').textContent, 10);
      const pct = t ? Math.round((g/t)*100) : 0;
      
      let title = "Results";
      let msg = pct >= 90 ? 'Excellent work! You are a spelling superstar!' : 
                pct >= 75 ? 'Great job! You know your spelling words well.' : 
                pct >= 50 ? 'Good effort! Keep practising to get even better.' : 
                'Let us review and try again!';
                
      speak(`You scored ${g} out of ${t}. ${msg}`);
      
      setTimeout(() => {
        showModal(
          `Final Score: ${g} / ${t} (${pct}%)`, 
          msg
        );
      }, 200);
    });
  