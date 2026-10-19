/* Vocab quiz scoring hook: first check of each question scores; score reported when every question is checked. */
(function(){
  function hook(){
    if(typeof checkCardAnswer !== 'function' || typeof generateQuiz !== 'function'){ return setTimeout(hook, 300); }
    var first = {}, oGen = window.generateQuiz, oChk = window.checkCardAnswer;
    window.generateQuiz = function(){ first = {}; return oGen.apply(this, arguments); };
    window.checkCardAnswer = function(q){
      var wasChecked = !!(checkedQuestions && checkedQuestions[q]);
      var r = oChk.apply(this, arguments);
      if(!wasChecked && !(q in first) && checkedQuestions && checkedQuestions[q]){
        var qo = currentQuizQuestions[q], ch = selectedAnswers[q];
        first[q] = qo.options[ch].text === qo.correctText ? 1 : 0;
        var n = Object.keys(first).length, tot = currentQuizQuestions.length;
        if(n === tot){ var s = 0; for(var k in first) s += first[k]; MrSun.finish(s, tot); }
      }
      return r;
    };
  }
  hook();
})();
