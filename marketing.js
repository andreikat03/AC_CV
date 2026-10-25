/* THE APPLICATION.exe — Etapa 3 / Marketing Lab
   Entirely local simulations. No network, analytics, or personal data collection. */
(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const STORAGE_KEY = 'the_application_exe_stage3_lab_v1';
  const campaignIds = ['secret', 'play', 'circle'];
  const views = ['hub','secret','play','arcade','quiz','circle'];
  // Each visual advertising material carries one embedded, locally simulated clue.
  const clues = {
    flyer: { letter:'I', label:'Flyer' },
    story: { letter:'D', label:'Instagram Story' },
    post: { letter:'E', label:'Facebook Post' },
    landing: { letter:'E', label:'Landing Page' }
  };
  const discoveredClues=new Set();
  const quizQuestions = [
    { text: 'Cât timp îți place să dedici rutinei zilnice?', options: ['2–3 minute, cât mai simplu', '5–10 minute', 'Îmi place să descopăr produse noi'] },
    { text: 'Ce tip de senzație preferi după aplicarea unui produs?', options: ['Textură foarte lejeră', 'O senzație confortabilă și bogată', 'Nu am o preferință'] },
    { text: 'Care e prioritatea ta când alegi un produs?', options: ['Ușurința de utilizare', 'Hidratarea și confortul', 'Să înțeleg ce conține'] },
    { text: 'Cum descoperi de obicei produse noi?', options: ['O recomandare în magazin', 'Citesc etichete și ghiduri', 'Din recomandările comunității'] },
    { text: 'Care moment ți se pare cel mai potrivit pentru un produs nou?', options: ['Dimineața', 'Seara', 'Doar când am nevoie'] }
  ];
  const scenarios = [
    { name:'Mara', avatar:'M', message:'Bună! Mai aveți serul Glow? Am trecut azi și nu l-am găsit.', context:'Produsul este indisponibil. Ce ai răspunde fără să inventezi un termen de reaprovizionare?', best:0, choices:[
      { text:'„Verificăm stocul și revenim când avem informații confirmate. Între timp, îți putem arăta o alternativă dacă dorești.”', feedback:'Alegere potrivită: transparență și o alternativă oferită fără presiune; nu promiți ce nu poți verifica.' },
      { text:'„A revenit cererea pentru el. Poți întreba în magazin peste câteva zile.”', feedback:'Răspuns plauzibil, dar pasează responsabilitatea clientului și nu oferă un pas clar de verificare.' },
      { text:'„Vine sigur mâine, îți păstrăm unul!”', feedback:'Promisiune neverificată, cu risc de dezamăgire și pierdere a încrederii.' }
    ]},
    { name:'Alex', avatar:'A', message:'Am folosit o cremă și pielea s-a înroșit. Ce să fac?', context:'Un membru descrie o reacție neplăcută. Grupul nu oferă diagnostic.', best:2, choices:[
      { text:'„Probabil e normal. Mai încearcă de două ori.”', feedback:'Nesigur: minimizează o reacție care nu poate fi evaluată aici.' },
      { text:'„Îmi pare rău să aud. Îți trimitem ingredientele și poți verifica dacă ai o sensibilitate.”', feedback:'Empatic și informativ, dar insuficient: nu recomandă oprirea folosirii și sprijin profesionist când este necesar.' },
      { text:'„Oprește folosirea produsului suspect. Un medic sau farmacist te poate îndruma; pentru simptome severe, caută ajutor medical urgent. Nu e nevoie să trimiți poze în grup.”', feedback:'Alegere prudentă: siguranța și confidențialitatea sunt prioritare, fără un diagnostic sau cerere de date sensibile.' }
    ]},
    { name:'Diana', avatar:'D', message:'Mi-ar plăcea un atelier despre rutine! Putem organiza unul?', context:'Există interes pentru un eveniment, dar nimic nu a fost aprobat.', best:1, choices:[
      { text:'„Sigur, facem unul sâmbăta viitoare!”', feedback:'Entuziasm bun, dar promiți data înainte să verifici costurile și disponibilitatea.' },
      { text:'„Dați un vot pentru teme și perioade. Dacă avem interes suficient, verificăm locația, bugetul și un specialist invitat.”', feedback:'Bun: testezi interesul înainte de a angaja resurse și implici comunitatea în alegere.' },
      { text:'„Este o idee bună; vom ține cont de ea.”', feedback:'Respectuos, dar vag: nu creează niciun pas următor și poate stinge inițiativa.' }
    ]},
    { name:'Radu', avatar:'R', message:'Ce activitate am putea face luna viitoare? Și ce produse ați recomanda pentru o rutină simplă?', context:'Doi pași deodată: participare comunitară și descoperire responsabilă de produse.', best:0, choices:[
      { text:'„Alegem prin sondaj între un Q&A și un mini-workshop. Pentru o rutină simplă putem explora curățare, hidratare și protecție solară, în funcție de preferințe.”', feedback:'Echilibrat: implici membrii și oferi direcții generale, fără să pretinzi că există un produs universal.' },
      { text:'„Putem discuta despre produse, iar activitățile le anunțăm în curând.”', feedback:'Parțial util, dar nu răspunde cu adevărat la propunerea membrului și nu implică grupul.' },
      { text:'„Luați setul complet, e potrivit pentru toți!”', feedback:'Recomandare universală nejustificată, care ignoră preferințele individuale.' }
    ]}
  ];
  function safeLoad() {
    const fallback = { explored:[], puzzleSolved:false, puzzleVersion:'IDEE', arcadePlayed:false, quizFinished:false, circleFinished:false };
    try {
      const raw=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');
      if (!raw || typeof raw!=='object') return fallback;
      return {
        explored: Array.isArray(raw.explored) ? [...new Set(raw.explored.filter(x=>campaignIds.includes(x)))] : [],
        puzzleSolved: raw.puzzleSolved===true && raw.puzzleVersion==='IDEE', puzzleVersion:'IDEE', arcadePlayed:raw.arcadePlayed===true,
        quizFinished:raw.quizFinished===true, circleFinished:raw.circleFinished===true
      };
    } catch (_) { return fallback; }
  }
  let state = safeLoad();
  let currentView = 'hub';
  let openedClue = null;
  let sessionSolved = false;
  // One state machine + a single target lifetime timer. Never replace a target from
  // competing periodic and click handlers; this caused the fast 850 ms jumping bug.
  let arcade = { active:false, phase:'ready', score:0, target:-1, endsAt:0,
    clock:null, targetTimer:null, nextTimer:null, round:0 };
  let quizIndex = 0, quizAnswers=Array(quizQuestions.length).fill(null);
  let circleIndex=0, circleAwaiting=false, circleHistory=[];
  let appBridge = null;
  function persist() { try {localStorage.setItem(STORAGE_KEY, JSON.stringify(state));}catch(_){ /* in-memory fallback */ } }
  function markExplored(campaign) {
    if (state.explored.includes(campaign)) return;
    state.explored.push(campaign);persist();renderProgress();
  }
  function achieve(id) { if(appBridge) appBridge.earn(id); }
  function renderProgress() {
    const count=state.explored.length;
    $('labProgressCount').textContent=`${count} / 3`;
    document.querySelectorAll('#labProgressTrack i').forEach((node,i)=>node.classList.toggle('filled',i<count));
    for(const key of campaignIds) {
      const node=$(`labStatus${key[0].toUpperCase()}${key.slice(1)}`);
      node.textContent=state.explored.includes(key)?'EXPLORATĂ':'NEEXPLORATĂ';
      node.classList.toggle('seen',state.explored.includes(key));
      if (key === 'play') document.querySelectorAll('[data-lab-play-status]').forEach(extra => {
        extra.textContent = node.textContent;
        extra.classList.toggle('seen',state.explored.includes(key));
      });
    }
  }
  function showView(id) {
    // V0.5: story stays in the document at all times. Interactive experiences
    // expand inline below their corresponding act rather than replacing the story.
    currentView=views.includes(id)?id:'hub';
    $('lab-hub').hidden=false;
    for(const view of views.filter(v=>v!=='hub')) $('lab-'+view).hidden=view!==currentView;
    if(currentView!=='hub') {
      const firstHeading=$('lab-'+currentView).querySelector('h2,h3');
      if(firstHeading)firstHeading.setAttribute('tabindex','-1');
    }
    renderProgress();
  }
  function stopArcade() {
    clearInterval(arcade.clock);
    clearTimeout(arcade.targetTimer);
    clearTimeout(arcade.nextTimer);
    arcade.clock=null;arcade.targetTimer=null;arcade.nextTimer=null;
    arcade.active=false;
    for(const cell of $('arcadeBoard').children) cell.disabled=true;
  }
  function enter(route, bridge) {
    appBridge=bridge;
    const part=route==='marketing'?'hub':route.split('/')[1];
    if(currentView==='arcade' && part!=='arcade') stopArcade();
    showView(part);
    const campaign=part==='secret'?'secret':(['play','arcade','quiz'].includes(part)?'play':part==='circle'?'circle':null);
    if(campaign) markExplored(campaign);
    if(part==='secret') renderSecret();
    if(part==='arcade') prepareArcade();
    if(part==='quiz') renderQuiz();
    if(part==='circle') renderCircle();
  }
  function reset(){
    stopArcade();
    state={explored:[],puzzleSolved:false,puzzleVersion:'IDEE',arcadePlayed:false,quizFinished:false,circleFinished:false};
    openedClue=null;sessionSolved=false;quizIndex=0;quizAnswers=Array(quizQuestions.length).fill(null);
    circleIndex=0;circleAwaiting=false;circleHistory=[];
    persist();renderProgress();resetSecretUI();prepareArcade();renderQuiz();renderCircle();
  }
  function renderClueTrack(){
    const spans=Array.from($('cluePreview').querySelectorAll('span'));
    Object.keys(clues).forEach((key,index)=>{
      if(!spans[index])return;
      const found=discoveredClues.has(key);
      spans[index].textContent=found?clues[key].letter:'—';
      spans[index].classList.toggle('found',found);
      spans[index].setAttribute('aria-label',`${clues[key].label}: ${found?'indiciu '+clues[key].letter:'nedescoperit'}`);
    });
  }
  function resetSecretUI(){
    discoveredClues.clear();openedClue=null;
    $('secretCode').value='';$('codeFeedback').textContent='Indiciile sunt în cele patru materiale de mai sus.';
    $('codeFeedback').className='lab-inline-status';
    $('rewardPanel').hidden=true;$('rewardChoice').textContent='';
    document.querySelectorAll('[data-reward]').forEach(node=>node.classList.remove('is-selected'));
    document.querySelectorAll('[data-clue]').forEach(node=>{
      node.classList.remove('is-open');node.setAttribute('aria-expanded','false');
      node.innerHTML='Descoperă indiciul <span aria-hidden="true">↗</span>';
    });
    for(const key of Object.keys(clues)){
      const label=$('clue-'+key);label.textContent='Indiciu nedescoperit';
      label.closest('.campaign-material')?.classList.remove('is-revealed');
    }
    renderClueTrack();
    const feedback=$('landingDemoFeedback');if(feedback)feedback.textContent='';
    ['secret','play','circle'].forEach(key=>{$('strategy-'+key).hidden=true;});
  }
  function renderSecret(){
    if(state.puzzleSolved || sessionSolved){
      $('rewardPanel').hidden=false;
      $('codeFeedback').textContent='Cod recunoscut. Ai deblocat o recompensă demonstrativă.';
      $('codeFeedback').className='lab-inline-status is-success';
    }
  }
  function inspectClue(key){
    const clue=clues[key];if(!clue)return;
    openedClue=key;discoveredClues.add(key);
    const node=document.querySelector(`[data-clue="${key}"]`);
    node.classList.add('is-open');node.setAttribute('aria-expanded','true');
    node.innerHTML='Indiciu descoperit <span aria-hidden="true">✓</span>';
    $('clue-'+key).textContent='Litera: '+clue.letter;
    node.closest('.campaign-material')?.classList.add('is-revealed');
    renderClueTrack();
  }
  function submitCode(event){
    event.preventDefault();
    const value=$('secretCode').value.trim().toLocaleUpperCase('ro-RO');
    if(value==='IDEE'){
      state.puzzleSolved=true;state.puzzleVersion='IDEE';sessionSolved=true;persist();
      $('codeFeedback').textContent='Cod recunoscut. Ai deblocat o recompensă demonstrativă.';
      $('codeFeedback').className='lab-inline-status is-success';
      $('rewardPanel').hidden=false;
      achieve('secret_solver');
    } else {
      $('codeFeedback').textContent='Nu este codul corect. Urmărește literele de pe Flyer → Story → Postare → Landing page.';
      $('codeFeedback').className='lab-inline-status is-warning';
      $('rewardPanel').hidden=true;
    }
  }
  function toggleStrategy(key, open=true) {
    const node=$('strategy-'+key);if(!node)return;
    const reveal=()=>{node.hidden=!open;if(open){node.scrollIntoView({block:'start',behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});node.querySelector('h3')?.setAttribute('tabindex','-1');node.querySelector('h3')?.focus({preventScroll:true});}};
    if(key==='play' && ['arcade','quiz'].includes(currentView) && open && appBridge){appBridge.go('marketing/play');reveal();}
    else reveal();
  }
  function initArcadeCells(){
    const board=$('arcadeBoard');board.replaceChildren();
    for(let i=0;i<12;i++){
      const cell=document.createElement('button');cell.type='button';cell.className='arcade-cell';cell.dataset.cell=String(i);
      cell.setAttribute('aria-label',`Celula ${i+1}, neutră`);cell.textContent='·';cell.disabled=true;
      cell.addEventListener('click',()=>hitArcade(i));board.appendChild(cell);
    }
  }
  function refreshArcade(){
    $('arcadeScore').textContent=String(arcade.score).padStart(3,'0');
    const seconds=arcade.active ? Math.max(0,Math.ceil((arcade.endsAt-Date.now())/1000)) : 25;
    $('arcadeTimer').textContent=seconds+'s';
    $('arcadeTrackFill').style.width=Math.min(100,arcade.score/90*100)+'%';
  }
  function updateArcadeBoard(){
    Array.from($('arcadeBoard').children).forEach((node,i)=>{
      const active=arcade.active && arcade.phase==='playing' && arcade.target===i;
      node.classList.toggle('glow-target',active);
      node.textContent=active?'✦':'·';
      node.setAttribute('aria-label',`Celula ${i+1}, ${active?'țintă luminoasă':'neutră'}`);
      node.disabled=!arcade.active || arcade.phase!=='playing';
    });
  }
  function spawnArcadeTarget(){
    if(!arcade.active || Date.now()>=arcade.endsAt){finishArcade();return;}
    const old=arcade.target;
    let next=Math.floor(Math.random()*12);
    if(next===old)next=(next+1+Math.floor(Math.random()*11))%12;
    arcade.target=next;
    arcade.phase='playing';
    $('arcadeFeedback').textContent='Ținta ✦ este activă 2,8 secunde. Apas-o pentru +10 puncte.';
    updateArcadeBoard();
    clearTimeout(arcade.targetTimer);
    const round=arcade.round;
    // Timeout can expire once per target, never in parallel with an old hit timer.
    arcade.targetTimer=setTimeout(()=>{
      if(!arcade.active || arcade.phase!=='playing' || round!==arcade.round)return;
      shiftArcadeTarget('Timpul țintei a expirat. Următoarea apare imediat.');
    },2800);
  }
  function shiftArcadeTarget(message){
    if(!arcade.active)return;
    clearTimeout(arcade.targetTimer);arcade.targetTimer=null;
    arcade.phase='feedback';
    $('arcadeFeedback').textContent=message;
    updateArcadeBoard();
    const round=arcade.round;
    arcade.nextTimer=setTimeout(()=>{
      if(arcade.active && round===arcade.round)spawnArcadeTarget();
    },300);
  }
  function prepareArcade(){
    stopArcade();
    arcade.score=0;arcade.target=-1;arcade.endsAt=0;arcade.phase='ready';arcade.round++;
    $('arcadeResult').hidden=true;$('demoCoupon').hidden=true;$('arcadeMessage').hidden=false;
    $('arcadeStart').disabled=false;
    $('arcadeFeedback').textContent='Pregătit? 9 ținte corecte pentru premiul demonstrativ.';
    updateArcadeBoard();refreshArcade();
  }
  function startArcade(){
    prepareArcade();
    arcade.active=true;arcade.endsAt=Date.now()+25000;
    $('arcadeMessage').hidden=true;
    $('arcadeFeedback').textContent='GO! Atinge ținta ✦.';
    spawnArcadeTarget();refreshArcade();
    arcade.clock=setInterval(()=>{
      if(Date.now()>=arcade.endsAt)finishArcade();
      else refreshArcade();
    },100);
  }
  function hitArcade(index){
    if(!arcade.active || arcade.phase!=='playing')return;
    if(Date.now()>=arcade.endsAt){finishArcade();return;}
    if(index!==arcade.target){
      $('arcadeFeedback').textContent='Nu este ținta. Caută ✦; aceasta rămâne pe loc.';
      return;
    }
    arcade.score+=10;
    refreshArcade();
    shiftArcadeTarget('+10 puncte! Următoarea țintă apare în scurt timp.');
  }
  function finishArcade(){
    if(!arcade.active)return;
    const score=arcade.score;
    stopArcade();arcade.phase='results';
    updateArcadeBoard();
    $('arcadeFeedback').textContent='Runda s-a încheiat. Poți rejuca sau vedea strategia.';
    $('arcadeTimer').textContent='0s';
    $('arcadeScore').textContent=String(score).padStart(3,'0');
    state.arcadePlayed=true;persist();achieve('arcade_player');
    const won=score>=90;
    $('arcadeResultLabel').textContent=won?'TARGET ACHIEVED · SIMULATION':'ROUND FINISHED · SIMULATION';
    $('arcadeResultTitle').textContent=won?'Great reflexes!':'One more round?';
    $('arcadeResultText').textContent=won?`Ai obținut ${score} puncte. Într-o activare reală, pragul poate debloca un cupon verificabil.`:`Ai obținut ${score} puncte. Pragul era de 90 — poți încerca din nou sau explora strategia.`;
    $('demoCoupon').hidden=!won;$('arcadeResult').hidden=false;
  }
  function renderQuiz(){
    const finished=quizIndex>=quizQuestions.length;
    $('quizQuestion').hidden=finished;$('quizResult').hidden=!finished;
    $('quizProgressLabel').textContent=finished?'DISCOVERY FINISHED':`QUESTION ${String(quizIndex+1).padStart(2,'0')} / 05`;
    document.querySelectorAll('#quizMeter span').forEach((node,i)=>node.classList.toggle('filled',i<=quizIndex));
    if(finished){renderQuizResult();return;}
    const q=quizQuestions[quizIndex];$('quizQuestionText').textContent=q.text;
    const parent=$('quizOptions');parent.replaceChildren();
    q.options.forEach((option,i)=>{
      const button=document.createElement('button');button.type='button';button.className='quiz-option';button.setAttribute('role','radio');
      const selected=quizAnswers[quizIndex]===i;
      button.setAttribute('aria-checked',String(selected));button.textContent=option;
      // One tab stop in a radio group; arrows select and move the focus.
      button.tabIndex=(selected || (quizAnswers[quizIndex]===null && i===0)) ? 0 : -1;
      const choose=(target)=>{
        quizAnswers[quizIndex]=target;renderQuiz();
        $('quizOptions').children[target]?.focus({preventScroll:true});
      };
      button.addEventListener('click',()=>choose(i));
      button.addEventListener('keydown',e=>{
        const count=q.options.length;
        const forward=['ArrowRight','ArrowDown'].includes(e.key);
        const backward=['ArrowLeft','ArrowUp'].includes(e.key);
        if(!forward && !backward && e.key!=='Home' && e.key!=='End')return;
        e.preventDefault();
        choose(e.key==='Home'?0:e.key==='End'?count-1:(i+(forward?1:-1)+count)%count);
      });
      parent.appendChild(button);
    });
    $('quizBack').disabled=quizIndex===0;
    $('quizNext').disabled=quizAnswers[quizIndex]===null;
    $('quizNext').textContent=quizIndex===4?'Vezi recomandările →':'Următoarea →';
  }
  function moveQuiz(delta){
    if(delta===1 && quizAnswers[quizIndex]===null)return;
    quizIndex=Math.min(quizQuestions.length,Math.max(0,quizIndex+delta));
    if(quizIndex===quizQuestions.length){state.quizFinished=true;persist();}
    renderQuiz();
  }
  function renderQuizResult(){
    // All selections are fictional retail suggestions from stated preferences,
    // not assessment of skin type, symptoms, or medical suitability.
    const [time,texture,priority,discovery,moment]=quizAnswers;
    const simple=time===0 || priority===0;
    const comfort=texture===1 || priority===1;
    const ingredients=priority===2 || discovery===1;
    const exploratory=time===2 || discovery===2;
    $('quizResultTitle').textContent=simple?'O rutină simplă, aleasă de tine.':(comfort?'Confort în prim-plan.':'Produse de descoperit, pe gustul tău.');
    $('quizResultSummary').textContent='Din răspunsurile tale, am selectat trei concepte de produse NOCTIS fictive. Sunt exemple pentru o discuție în magazin, nu recomandări dermatologice.';
    const products=[];
    if(simple || priority===0) {
      products.push({name:'NOCTIS Soft Clean',type:'Gel de curățare blând',benefit:'Curățare delicată în rutina cosmetică.',why:'Ai ales o rutină simplă sau ușurința de utilizare.'});
    } else if (ingredients) {
      products.push({name:'NOCTIS Clear Notes',type:'Gel de curățare · concept cu etichetă explicată',benefit:'Un punct de plecare pentru compararea formulelor.',why:'Ai spus că îți place să citești ingredientele și ghidurile.'});
    } else {
      products.push({name:'NOCTIS Soft Clean',type:'Gel de curățare blând',benefit:'Un prim pas cosmetic ușor de explorat.',why:'Poate completa rutina pe care vrei să o descoperi.'});
    }
    if(comfort || texture===1) {
      products.push({name:'NOCTIS Daily Comfort',type:'Cremă hidratantă cu textură bogată',benefit:'Senzație cosmetică de confort.',why:'Ai ales o textură bogată sau ai prioritizat confortul.'});
    } else if(texture===0) {
      products.push({name:'NOCTIS Air Touch',type:'Cremă-gel hidratantă lejeră',benefit:'Textură ușoară, pentru cei care o preferă.',why:'Ai selectat o senzație foarte lejeră.'});
    } else {
      products.push({name:'NOCTIS Daily Comfort',type:'Cremă hidratantă · concept demonstrativ',benefit:'O categorie pe care o poți compara la raft.',why:'Nu ai indicat o preferință strictă de textură.'});
    }
    if(moment===0) {
      products.push({name:'NOCTIS Daily Shield SPF',type:'Produs cu protecție solară · concept necertificat',benefit:'Exemplu de categorie pentru dimineață, fără afirmații despre factorul real de protecție.',why:'Ai ales dimineața; orice SPF real ar necesita formulare și testare corespunzătoare.'});
    } else if(exploratory || moment===1) {
      products.push({name:'NOCTIS Glow Drop',type:'Ser cosmetic pentru aspect luminos',benefit:'O categorie de ser de explorat, fără rezultate garantate.',why:moment===1?'Ai preferat un moment de îngrijire seara.':'Îți place să descoperi produse sau recomandări noi.'});
    } else {
      products.push({name:'NOCTIS One Step',type:'Balsam cosmetic multifuncțional · concept',benefit:'Un singur produs conceptual pentru o rutină simplificată.',why:'Preferi să introduci un produs doar când simți nevoia.'});
    }
    const container=$('quizRecommendations');container.replaceChildren();
    for(const product of products.slice(0,3)){
      const card=document.createElement('article');card.className='product-recommendation';
      const brand=document.createElement('small');brand.textContent='NOCTIS · CONCEPT FICTIV';
      const name=document.createElement('b');name.textContent=product.name;
      const type=document.createElement('span');type.className='product-type';type.textContent=product.type;
      const benefit=document.createElement('p');benefit.textContent=product.benefit;
      const why=document.createElement('p');why.className='product-reason';why.textContent='DE CE: '+product.why;
      card.append(brand,name,type,benefit,why);container.append(card);
    }
  }
  function resetQuiz(){quizIndex=0;quizAnswers=Array(quizQuestions.length).fill(null);renderQuiz();}
  function chatBubble(author,text,me=false){
    const el=document.createElement('div');el.className='chat-bubble'+(me?' me':'');
    const name=document.createElement('strong');name.textContent=author;
    const p=document.createElement('p');p.textContent=text;
    const stamp=document.createElement('small');stamp.textContent=me?'SIMULATED RESPONSE':'FICTIONAL MEMBER';
    el.append(name,p,stamp);return el;
  }
  function renderCircle(){
    const done=circleIndex>=scenarios.length;
    $('circleStepLabel').textContent=done?'SIMULATION ENDED':`SCENARIO ${String(circleIndex+1).padStart(2,'0')} / 04`;
    $('circlePrompt').hidden=done;$('circleContext').hidden=done;
    $('circleChoices').hidden=done;$('circleFinish').hidden=!done;
    $('circleFeedback').hidden=!circleAwaiting;
    const chat=$('chatWindow');chat.replaceChildren();
    chat.append(chatBubble('Community Admin','Bine ai venit în The Beauty Circle! Aici discutăm, învățăm și testăm idei împreună.'));
    const priorChoices = circleAwaiting ? circleHistory.slice(0,-1) : circleHistory;
    for(const history of priorChoices){chat.append(chatBubble(history.scenario.name,history.scenario.message));chat.append(chatBubble('You · Moderator',history.choice.text,true));}
    if(done){chat.append(chatBubble('Community Admin','Mulțumim pentru idei! Feedbackul grupului ne ajută să planificăm următoarea activitate.'));return;}
    const scenario=scenarios[circleIndex];chat.append(chatBubble(scenario.name,scenario.message));
    $('circlePrompt').textContent='Cum ai răspunde?';$('circleContext').textContent=scenario.context;
    const container=$('circleChoices');container.replaceChildren();
    for(const [i,choice] of scenario.choices.entries()){
      const button=document.createElement('button');button.type='button';button.className='circle-choice';
      button.textContent=`${i+1}. ${choice.text}`;button.disabled=circleAwaiting;
      button.addEventListener('click',()=>pickCircle(i));container.append(button);
    }
    if(circleAwaiting){
      const choiceIndex=circleHistory.at(-1).choiceIndex;
      $('circleFeedbackLabel').textContent=choiceIndex===scenario.best?'IMPACT / DECIZIE RESPONSABILĂ':'IMPACT / O ALEGERE DE REVIZUIT';
      $('circleFeedbackText').textContent=scenario.choices[choiceIndex].feedback;
      $('circleNext').textContent=circleIndex===scenarios.length-1?'Vezi concluzia →':'Next scenario →';
      chat.append(chatBubble('You · Moderator',scenario.choices[choiceIndex].text,true));
    }
  }
  function pickCircle(index){
    if(circleAwaiting || circleIndex>=scenarios.length)return;
    const s=scenarios[circleIndex];circleHistory.push({scenario:s,choice:s.choices[index],choiceIndex:index});
    circleAwaiting=true;renderCircle();
  }
  function nextCircle(){
    if(!circleAwaiting)return;
    circleAwaiting=false;circleIndex+=1;
    if(circleIndex===scenarios.length){state.circleFinished=true;persist();achieve('circle_moderator');}
    renderCircle();
  }
  function resetCircle(){circleIndex=0;circleAwaiting=false;circleHistory=[];renderCircle();}
  function bindEvents(){
    $('secretForm').addEventListener('submit',submitCode);
    $('landingDemoButton')?.addEventListener('click',()=>{
      $('landingDemoFeedback').textContent='Concept demonstrativ: detaliile ofertei și produsele eligibile ar fi afișate aici după aprobarea campaniei. Nu există comandă sau reducere reală.';
    });
    document.querySelectorAll('[data-clue]').forEach(b=>b.addEventListener('click',()=>inspectClue(b.dataset.clue)));
    document.querySelectorAll('[data-reward]').forEach(b=>b.addEventListener('click',()=>{
      document.querySelectorAll('[data-reward]').forEach(node=>node.classList.toggle('is-selected',node===b));
      $('rewardChoice').textContent=b.dataset.reward==='gift'?'Opțiune conceptuală: mini-produs cadou, doar dacă există stoc și buget aprobate.':'Opțiune conceptuală: discount suplimentar, doar dacă marja și regulamentul îl permit.';
    }));
    document.querySelectorAll('[data-lab-strategy]').forEach(b=>b.addEventListener('click',()=>toggleStrategy(b.dataset.labStrategy,true)));
    document.querySelectorAll('[data-strategy-entry]').forEach(b=>b.addEventListener('click',()=>{
      const key=b.dataset.strategyEntry;
      // Open the strategy in the correct campaign view without requiring a game.
      const route=key==='play'?'marketing/play':`marketing/${key}`;
      appBridge?.go(route);
      toggleStrategy(key,true);
    }));
    document.querySelectorAll('[data-close-strategy]').forEach(b=>b.addEventListener('click',()=>toggleStrategy(b.dataset.closeStrategy,false)));
    $('arcadeStart').addEventListener('click',startArcade);$('arcadeReplay').addEventListener('click',startArcade);
    $('quizBack').addEventListener('click',()=>moveQuiz(-1));$('quizNext').addEventListener('click',()=>moveQuiz(1));$('quizRestart').addEventListener('click',resetQuiz);
    $('circleNext').addEventListener('click',nextCircle);$('circleRestart').addEventListener('click',resetCircle);
  }
  initArcadeCells();bindEvents();resetSecretUI();renderProgress();renderQuiz();renderCircle();prepareArcade();
  window.MarketingLab={enter,leave:stopArcade,reset,getState:()=>({...state}),getView:()=>currentView};
})();
