// ===================== AI Detection Games - game.js =====================
// Works with index.html, style.css, questions.js, and an <script type="application/json" id="images-manifest"> in index.html
// If you open index.html via file://, EMBED the images JSON inside the page (not as a separate file).

// ---------- tiny helpers ----------
const $ = s => document.querySelector(s);
const stage  = $("#stage");
const scoreEl = $("#score");
const bar = $("#bar");

let score = 0;
let current = 0;
let allQuestions = [];

// Fisher-Yates shuffle
function shuffled(arr){
  const a = [...arr];
  for(let i=a.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---------- image rounds from embedded JSON ----------
async function buildImageRounds(){
  const node = document.getElementById("images-manifest");
  if(!node){ return []; }

  // If the JSON is embedded in the tag, parse its textContent.
  // (If you served images.json separately, you can fetch() it instead when using http:// or https://)
  let data;
  try { data = JSON.parse(node.textContent); }
  catch { return []; }

  const ai   = Array.isArray(data.ai)   ? [...data.ai]   : [];
  const real = Array.isArray(data.real) ? [...data.real] : [];
  const numRounds = Math.max(0, (data.config && data.config.numImageRounds) || 6);
  const choices   = Math.max(2, (data.config && data.config.choicesPerImageRound) || 2);

  if(ai.length === 0 || real.length < (choices - 1)) return [];

  const rounds = [];
  for(let r=0; r<numRounds; r++){
    if(ai.length===0 || real.length < (choices-1)) break;

    // pick 1 AI
    const aiIdx = Math.floor(Math.random()*ai.length);
    const aiPick = ai.splice(aiIdx,1)[0];

    // pick (choices-1) real
    const realPicks = [];
    for(let k=0;k<choices-1;k++){
      if(real.length===0) break;
      const ri = Math.floor(Math.random()*real.length);
      realPicks.push(real.splice(ri,1)[0]);
    }
    if(realPicks.length < (choices-1)) break;

    // shuffle positions
    const options = shuffled([{kind:"AI", url:aiPick}, ...realPicks.map(u=>({kind:"REAL", url:u}))]);
    const answer = options.findIndex(o => o.kind === "AI");

    rounds.push({
      type: "image",
      q: "Which image is AI-generated?",
      options: options.map(o => o.url),
      answer,
      diff: "Image"
    });
  }
  return rounds;
}

// ---------- build the full quiz (text + optional image rounds) ----------
async function buildQuiz(){
  const textQs = (window.TEXT_QUESTIONS || []).slice(0, 15);
  const imageQs = await buildImageRounds();

  const merged = [];
  let ti=0, ii=0;

  // interleave: text, then image, etc. up to 15
  while(merged.length < 15 && (ti < textQs.length || ii < imageQs.length)){
    if(ti < textQs.length) merged.push({...textQs[ti++]});
    if(ii < imageQs.length && merged.length < 15) merged.push({...imageQs[ii++]});
  }
  // pad with remaining text if needed
  while(merged.length < 15 && ti < textQs.length) merged.push({...textQs[ti++]});

  // randomize answer order for non-image questions
  merged.forEach(q=>{
    if(q.type !== "image"){
      const pairs = q.options.map((opt,i)=>({i, opt}));
      const shuf = shuffled(pairs);
      q.options = shuf.map(p=>p.opt);
      q.answer  = shuf.findIndex(p=>p.i === q.answer);
    }
  });

  return merged;
}

// ---------- UI helpers ----------
function updateProgress(){
  const total = Math.max(1, allQuestions.length);
  bar.style.width = `${(current/total)*100}%`;
  scoreEl.textContent = `Score: ${score}`;
}

function renderIntro(){
  stage.innerHTML = `
    <div id="intro">
      <h2>Welcome, challengers!</h2>
      <p>Across 15 rounds, decide which content is AI vs human. No timers — discuss, debate, and lock in your answer.</p>
      <button id="startBtn" class="btn accent">Start Game</button>
    </div>`;
  $("#startBtn").addEventListener("click", nextQuestion);
}

function renderQuestion(q){
  const idx = current + 1; // show 1..15
  updateProgress();

  if(q.type === "image"){
    const cols = q.options.length;
    stage.innerHTML = `
      <div class="q-meta"><div>${q.diff.toUpperCase()}</div><div>Question ${idx} / ${allQuestions.length}</div></div>
      <div class="q-title">${q.q}</div>
      <div class="grid ${cols===3?'cols-3':'cols-2'}">
        ${q.options.map((url,i)=>`
          <div class="option" data-i="${i}">
            <img src="${url}" alt="Option ${String.fromCharCode(65+i)}" />
            <button class="btn pick btn choice">Pick ${String.fromCharCode(65+i)}</button>
          </div>
        `).join("")}
      </div>
      <div id="feedback"></div>
    `;
    stage.querySelectorAll(".option").forEach(el=>{
      el.addEventListener("click", ()=> submit(parseInt(el.dataset.i,10)));
    });
  } else {
    stage.innerHTML = `
      <div class="q-meta"><div>${(q.diff||'').toUpperCase()}</div><div>Question ${idx} / ${allQuestions.length}</div></div>
      <div class="q-title">${q.q}</div>
      <div id="choices"></div>
      <div id="feedback"></div>
    `;
    const box = $("#choices");
    q.options.forEach((opt,i)=>{
      const btn = document.createElement("button");
      btn.className = "btn choice";
      btn.textContent = `${String.fromCharCode(65+i)}) ${opt}`;
      btn.addEventListener("click", ()=> submit(i));
      box.appendChild(btn);
    });
  }
}

function showFeedback(isCorrect){
  const fb = $("#feedback");
  fb.className = `feedback ${isCorrect===true?'ok':isCorrect===false?'bad':''}`;
  fb.textContent = isCorrect===true ? "Nice catch! 🎯" : "AI slipped past you. 🤖";
  setTimeout(nextQuestion, 450);
}

// ---------- grading & navigation ----------
// IMPORTANT: increment `current` ONLY here (fixes 16/15 bug)
function submit(i){
  const q = allQuestions[current];
  if(i === q.answer){
    score++;
    showFeedback(true);
  } else {
    showFeedback(false);
  }
  current++;           // advance AFTER scoring
  updateProgress();
}

function renderEnd(){
  updateProgress();
  stage.innerHTML = `
    <h2>Game Over!</h2>
    <p><strong>You scored ${score} / ${allQuestions.length}</strong></p>
    <p class="small">${rankTitle(score, allQuestions.length)}</p>

    <div class="keybox">
      <h3>🤖 Key Takeaways</h3>
      <p>
        • AI can generate text that feels natural and images that look real.<br/>
        • Spotting AI is about subtle cues, consistency, and context — not just glitches.<br/>
        • In the future, critical thinking and verification will matter more than ever.<br/><br/>
        👉 Replace this paragraph with your custom message for the booth.
      </p>
    </div>

    <div style="margin-top:18px">
      <button id="again" class="btn accent">Play Again</button>
    </div>
  `;
  $("#again").addEventListener("click", async ()=>{
    score = 0; current = 0;
    allQuestions = await buildQuiz();
    renderQuestion(allQuestions[current]);
  });
}

function rankTitle(s,total){
  if(s <= total*0.33) return "AI Victim — the bots got you this time.";
  if(s <= total*0.66) return "AI Sleuth — solid instincts.";
  if(s < total)       return "Matrix Breaker — you see through the static.";
  return "Unstoppable Human Mind — perfection!";
}

async function nextQuestion(){
  if(allQuestions.length === 0){
    allQuestions = await buildQuiz();
    current = 0;
    score = 0;
    updateProgress();
  }
  if(current >= allQuestions.length){
    renderEnd();
    return;
  }
  // render current question (do NOT increment here)
  renderQuestion(allQuestions[current]);
}

// ---------- boot ----------
document.addEventListener("DOMContentLoaded", renderIntro);
