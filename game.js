// ===================== AI Detection Games - game.js =====================
// Requires: index.html (with #stage, #score, #bar), style.css, questions.js,
// canvases: <canvas id="space-bg"></canvas> and <canvas id="confetti"></canvas>
// If using file://, EMBED images JSON in: <script id="images-manifest" type="application/json">…</script>

// ---------- tiny helpers ----------
const $  = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);
const stage   = $("#stage");
const scoreEl = $("#score");
const bar     = $("#bar");
const topbar  = document.querySelector(".topbar");

let score = 0;
let current = 0;
let allQuestions = [];
let streak = 0;
let bonusAdded = false;
let answered = false;   // NEW: lock per-question once answered

// shuffle
function shuffled(arr){
  const a = [...arr];
  for(let i=a.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---------- Space Starfield ----------
(function initStarfield(){
  const canvas = document.getElementById("space-bg");
  if(!canvas) return;
  const ctx = canvas.getContext("2d", { alpha: true });

  let stars = [];
  let shooting = null;
  let w = 0, h = 0, device = Math.min(window.devicePixelRatio || 1, 2);

  function resize(){
    w = canvas.clientWidth = window.innerWidth;
    h = canvas.clientHeight = window.innerHeight;
    canvas.width  = Math.floor(w * device);
    canvas.height = Math.floor(h * device);
    ctx.setTransform(device, 0, 0, device, 0, 0);
    const target = Math.min(350, Math.floor((w*h) / 8000));
    stars = new Array(target).fill(0).map(()=>makeStar());
  }
  function makeStar(){
    const d = Math.random();
    return { x:Math.random()*w, y:Math.random()*h, r:0.6+d*1.4, s:0.05+0.35*Math.pow(d,2), tw:Math.random()*Math.PI*2, d };
  }
  function maybeShoot(){
    if(shooting || Math.random() > 0.006) return;
    const fromTop = Math.random() < 0.6;
    shooting = { x:Math.random()*w, y: fromTop?-20:Math.random()*h*0.4, vx:6+Math.random()*4, vy:2+Math.random()*2, life:0, maxLife:90+Math.random()*50 };
  }
  function draw(){
    ctx.clearRect(0,0,w,h);
    for(const st of stars){
      st.x += st.s*(0.6+st.d*0.8);
      st.y += st.s*0.05;
      if(st.x > w+4) st.x = -4;
      if(st.y > h+4) st.y = -4;
      st.tw += 0.03+st.d*0.05;
      const a = 0.5 + 0.5*Math.sin(st.tw);
      ctx.beginPath();
      ctx.fillStyle = `rgba(231,233,255,${0.2+0.6*a})`;
      ctx.arc(st.x, st.y, st.r, 0, Math.PI*2); ctx.fill();
      if(st.d > 0.7){
        ctx.beginPath();
        ctx.fillStyle = `rgba(108,140,255,${0.08*st.d})`;
        ctx.arc(st.x, st.y, st.r*2.2, 0, Math.PI*2); ctx.fill();
      }
    }
    if(shooting){
      shooting.life++;
      ctx.strokeStyle = `rgba(255,255,255,${1 - shooting.life/shooting.maxLife})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(shooting.x, shooting.y);
      ctx.lineTo(shooting.x-24, shooting.y-10);
      ctx.stroke();
      shooting.x += shooting.vx; shooting.y += shooting.vy;
      if(shooting.life > shooting.maxLife || shooting.x>w+60 || shooting.y>h+60) shooting = null;
    } else maybeShoot();
    requestAnimationFrame(draw);
  }
  window.addEventListener("resize", resize, {passive:true});
  resize(); requestAnimationFrame(draw);
})();

// ---------- Confetti ----------
(function initConfetti(){
  const cvs = document.getElementById("confetti");
  if(!cvs) return;
  const ctx = cvs.getContext("2d");
  let W=0, H=0, dpr=Math.min(window.devicePixelRatio||1,2);
  let particles=[], running=false, rafId=0, endAt=0;

  function resize(){
    W = cvs.clientWidth = window.innerWidth;
    H = cvs.clientHeight = window.innerHeight;
    cvs.width = Math.floor(W*dpr);
    cvs.height= Math.floor(H*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }
  window.addEventListener("resize", resize, {passive:true}); resize();

  function makeParticle(){
    const colors=["#6C8CFF","#23D0A8","#FF6B6B","#E7E9FF","#9aa3b2"];
    return { x:Math.random()*W, y:-10, vx:-2+Math.random()*4, vy:4+Math.random()*3, g:0.12+Math.random()*0.08,
      s:6+Math.random()*6, r:Math.random()*Math.PI, vr:(-0.1+Math.random()*0.2), c:colors[(Math.random()*colors.length)|0],
      life:0, maxLife:300+Math.random()*120 };
  }
  function step(){
    ctx.clearRect(0,0,W,H);
    particles.forEach(p=>{
      p.vy+=p.g; p.x+=p.vx; p.y+=p.vy; p.r+=p.vr; p.life++;
      ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.r);
      ctx.fillStyle=p.c; ctx.fillRect(-p.s*0.5,-p.s*0.3,p.s,p.s*0.6);
      ctx.restore();
    });
    particles = particles.filter(p=> p.y<H+40 && p.life<p.maxLife);
    if(Date.now()<endAt){ for(let i=0;i<10;i++) particles.push(makeParticle()); }
    if(particles.length===0 && Date.now()>=endAt){ running=false; cancelAnimationFrame(rafId); return; }
    rafId = requestAnimationFrame(step);
  }
  window.launchConfetti = function(ms=2500){
    endAt = Date.now()+ms;
    if(!running){ running=true; rafId=requestAnimationFrame(step); }
  };
})();

// ---------- glitch overlay ----------
function glitchOverlay(){
  let overlay = $("#glitch");
  if(!overlay){
    overlay = document.createElement("div");
    overlay.id = "glitch";
    document.body.appendChild(overlay);
  }
  overlay.classList.add("show");
  setTimeout(()=>overlay.classList.remove("show"), 600);
}

// ---------- image rounds from embedded JSON ----------
async function buildImageRounds(){
  const node = document.getElementById("images-manifest");
  if(!node) return [];
  let data; try{ data = JSON.parse(node.textContent); } catch { return []; }

  const ai   = Array.isArray(data.ai)   ? [...data.ai]   : [];
  const real = Array.isArray(data.real) ? [...data.real] : [];
  const numRounds = Math.max(0, (data.config && data.config.numImageRounds) || 6);
  const choices   = Math.max(2, (data.config && data.config.choicesPerImageRound) || 2);

  // NEW: difficulty label for image rounds (override via images-manifest config)
  const imageDiff = (data.config && data.config.imageDifficulty) || "Medium";

  if(ai.length===0 || real.length < (choices-1)) return [];

  const rounds=[];
  for(let r=0;r<numRounds;r++){
    if(ai.length===0 || real.length<(choices-1)) break;
    const aiPick = ai.splice((Math.random()*ai.length)|0,1)[0];
    const realPicks=[];
    for(let k=0;k<choices-1;k++){
      if(real.length===0) break;
      realPicks.push(real.splice((Math.random()*real.length)|0,1)[0]);
    }
    if(realPicks.length<(choices-1)) break;
    const options = shuffled([{kind:"AI",url:aiPick}, ...realPicks.map(u=>({kind:"REAL",url:u}))]);
    rounds.push({
      type:"image",
      q:"Which image is AI-generated?",
      options: options.map(o=>o.url),
      answer: options.findIndex(o=>o.kind==="AI"),
      diff: imageDiff        // 👈 shows like Easy/Medium/Hard
    });
  }
  return rounds;
}

// ---------- build the full quiz (+ optional bonus round) ----------
async function buildQuiz(){
  const textQs  = (window.TEXT_QUESTIONS || []).slice(0, 15);
  const imageQs = await buildImageRounds();
  const merged=[];
  let ti=0, ii=0;

  while(merged.length<15 && (ti<textQs.length || ii<imageQs.length)){
    if(ti<textQs.length) merged.push({...textQs[ti++]});
    if(ii<imageQs.length && merged.length<15) merged.push({...imageQs[ii++]});
  }
  while(merged.length<15 && ti<textQs.length) merged.push({...textQs[ti++]});

  merged.forEach(q=>{
    if(q.type!=="image"){
      const pairs = q.options.map((opt,i)=>({i,opt}));
      const shuf = shuffled(pairs);
      q.options = shuf.map(p=>p.opt);
      q.answer  = shuf.findIndex(p=>p.i===q.answer);
    }
  });

  // Bonus round (2 pts) after the 15
  if(!bonusAdded){
    merged.push({
      type:"text",
      q:"✨ Bonus Round (worth 2 pts): Which statement is AI?",
      options:[
        "The night makes old cities feel like they remember you back.",
        "Autonomy is an operational mode optimizing agentic throughput across goal hierarchies."
      ],
      answer:1,
      diff:"Bonus"
    });
    bonusAdded = true;
  }
  return merged;
}

// ---------- UI ----------
function updateProgress(){
  const total = Math.max(1, allQuestions.length);
  bar.style.width = `${(current/total)*100}%`;
  scoreEl.textContent = `Score: ${score}`;
}
function neonPulse(){
  topbar?.classList.add("pulse");
  bar?.classList.add("pulse");
  setTimeout(()=>{ topbar?.classList.remove("pulse"); bar?.classList.remove("pulse"); }, 400);
}
function emojiPop(char){
  let el = $("#emoji-pop");
  if(!el){ el = document.createElement("div"); el.id="emoji-pop"; document.body.appendChild(el); }
  el.textContent = char;
  el.classList.add("show");
  setTimeout(()=>el.classList.remove("show"), 500);
}

function renderIntro(){
  stage.innerHTML = `
    <div id="intro">
      <h2>Welcome, challengers!</h2>
      <p>Across 15 rounds + a bonus, decide which content is AI vs human. No timers — discuss, debate, and lock in your answer.</p>
      <button id="startBtn" class="btn accent">Start Game</button>
    </div>`;
  $("#startBtn").addEventListener("click", async () => {
    score=0; current=0; streak=0; bonusAdded=false; answered=false;
    allQuestions = await buildQuiz();
    renderQuestion(allQuestions[current]);
  });
}

function renderQuestion(q){
  const idx = current + 1;
  answered = false; // reset for this question
  updateProgress();

  // occasional "AI interference"
  if(current>0 && current%4===0) glitchOverlay();

  if(q.type === "image"){
    const cols = q.options.length;
    stage.innerHTML = `
      <div class="q-meta"><div>${(q.diff||'').toUpperCase()}</div><div>Question ${idx} / ${allQuestions.length}</div></div>
      <div class="q-title">${q.q}</div>
      <div class="grid ${cols===3?'cols-3':'cols-2'}">
        ${q.options.map((url,i)=>`
          <div class="option floaty" data-i="${i}">
            <div class="imgbox">
              <img src="${url}" alt="Option ${String.fromCharCode(65+i)}" />
            </div>
            <button class="btn pick">Pick ${String.fromCharCode(65+i)}</button>
          </div>
        `).join("")}
      </div>
      <div class="streak" id="streak"></div>
      <div id="feedback"></div>
      <div class="q-nav" style="display:flex;justify-content:space-between;margin-top:10px">
        <button id="skipBtn" class="btn ghost">Skip</button>
        <button id="nextBtn" class="btn accent" disabled>Next</button>
      </div>
    `;
    $$(".option").forEach(el=>{
      el.addEventListener("click", ()=>{
        if(answered) return;
        el.classList.add("locked"); // pulse lock animation
        submit(parseInt(el.dataset.i,10));
      });
    });
  } else {
    stage.innerHTML = `
      <div class="q-meta"><div>${(q.diff||'').toUpperCase()}</div><div>Question ${idx} / ${allQuestions.length}</div></div>
      <div class="q-title glitch" data-text="${q.q}">${q.q}</div>
      <div id="choices"></div>
      <div class="streak" id="streak"></div>
      <div id="feedback"></div>
      <div class="q-nav" style="display:flex;justify-content:space-between;margin-top:10px">
        <button id="skipBtn" class="btn ghost">Skip</button>
        <button id="nextBtn" class="btn accent" disabled>Next</button>
      </div>
    `;
    const box = $("#choices");
    q.options.forEach((opt,i)=>{
      const btn = document.createElement("button");
      btn.className = "btn choice";
      btn.textContent = `${String.fromCharCode(65+i)}) ${opt}`;
      btn.addEventListener("click", (e)=>{
        if(answered) return;
        e.currentTarget.classList.add("locked");
        submit(i);
      });
      box.appendChild(btn);
    });
  }

  // Nav handlers
  $("#skipBtn").addEventListener("click", ()=>{
    streak = 0;
    // advance without scoring
    current++;
    nextQuestion();
  });
  $("#nextBtn").addEventListener("click", ()=>{
    // Only proceeds after an answer (enabled then)
    nextQuestion();
  });

  updateStreakBadge();
}

function updateStreakBadge(){
  const s = $("#streak");
  if(!s) return;
  if(streak >= 5) s.textContent = `🔥 Streak: ${streak}! Unstoppable!`;
  else if(streak >= 3) s.textContent = `⚡ Streak: ${streak}!`;
  else s.textContent = "";
}

function showFeedback(isCorrect, isBonus){
  const fb = $("#feedback");
  fb.className = `feedback ${isCorrect===true?'ok':isCorrect===false?'bad':''}`;
  fb.textContent = isCorrect===true ? (isBonus? "Double points! 🎯" : "Nice catch! 🎯") : "AI slipped past you. 🤖";

  // NEW: enable Next button (no auto-advance)
  const nextBtn = $("#nextBtn");
  if(nextBtn) nextBtn.disabled = false;
}

// ---------- grading & navigation ----------
function submit(i){
  const q = allQuestions[current];
  if(answered) return;        // prevent double submit
  answered = true;

  const isBonus = (q.diff === "Bonus");
  const pts = isBonus ? 2 : 1;
  const isCorrect = (i === q.answer);

  // score + effects
  if(isCorrect){
    score += pts;
    streak++;
    emojiPop("🎯");
    neonPulse();
    showFeedback(true, isBonus);
  } else {
    streak = 0;
    emojiPop("🤖");
    showFeedback(false, isBonus);
  }

  // ---- VISUAL HIGHLIGHTING ----
  if(q.type === "image"){
    const cards = document.querySelectorAll(".option");
    cards.forEach((el, idx) => {
      if(idx === i){
        el.classList.add(isCorrect ? "selected-correct" : "selected-wrong");
      }
      if(idx === q.answer){
        el.classList.add("correct");
      }
      // dim everything (and block clicks) now that we have an answer
      el.classList.add("disabled");
    });
  } else {
    const btns = document.querySelectorAll(".btn.choice");
    btns.forEach((btn, idx) => {
      if(idx === i){
        btn.classList.add(isCorrect ? "selected-correct" : "selected-wrong");
      }
      if(idx === q.answer){
        btn.classList.add("correct");
      }
      btn.classList.add("disabled");
    });
  }
  // -----------------------------

  // advance index immediately; screen stays until Next
  current++;
  updateProgress();
  updateStreakBadge();
}

function renderEnd(){
  launchConfetti(2800);
  updateProgress();

  const name = prompt("Great job! Enter your name or initials for the leaderboard:", "Player");
  saveScore(name || "Player", score, allQuestions.length);

  const top = loadLeaderboard();

  stage.innerHTML = `
    <h2>Game Over!</h2>
    <p><strong>You scored ${score} / ${allQuestions.length}</strong></p>
    <p class="small">${rankTitle(score, allQuestions.length)}</p>

    <div class="keybox">
      <h3>🤖 Key Takeaways</h3>
      <p>

       • Human Oversight is Essential: Always critically review and validate AI outputs. Your expertise ensures accuracy and alignment with Novartis standards.<br/>
       • Adhere to Novartis AI Principles: Use AI responsibly, especially when generating images or handling sensitive data, to maintain trust and compliance.<br/>
       • Recognise & Address Bias: Be aware of AI's potential for bias in inputs and outputs, and actively work to mitigate it for fair and equitable outcomes.<br/>
       • Unlock Business Value Responsibly: By applying these principles, we can harness AI's power effectively and ethically to drive innovation and impact at Novartis.<br/>
      </p>
    </div>

    <div class="keybox" style="margin-top:18px">
      <h3>🏆 Leaderboard (Top 5)</h3>
      <ol class="board">
        ${top.map(x=>`<li><span>${escapeHtml(x.name)}</span> <em>${x.score}/${x.total}</em></li>`).join("")}
      </ol>
      <p class="small">Scores are stored locally in this browser.</p>
    </div>

    <div style="margin-top:18px">
      <button id="again" class="btn accent">Play Again</button>
    </div>
  `;
  $("#again").addEventListener("click", async ()=>{
    score=0; current=0; streak=0; bonusAdded=false; answered=false;
    allQuestions = await buildQuiz();
    renderQuestion(allQuestions[current]);
  });
}

function escapeHtml(s){ return String(s).replace(/[&<>"']/g, m=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[m])); }
function saveScore(name, score, total){
  try{
    const key="aidetect-leaderboard";
    const data = JSON.parse(localStorage.getItem(key) || "[]");
    data.push({name, score, total, ts: Date.now()});
    data.sort((a,b)=> b.score - a.score || a.ts - b.ts);
    localStorage.setItem(key, JSON.stringify(data.slice(0, 20)));
  }catch{}
}
function loadLeaderboard(){
  try{
    const data = JSON.parse(localStorage.getItem("aidetect-leaderboard") || "[]");
    return data.slice(0,5);
  }catch{ return []; }
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
    current = 0; score = 0; streak = 0; answered=false;
    updateProgress();
  }
  if(current >= allQuestions.length){
    renderEnd();
    return;
  }
  renderQuestion(allQuestions[current]);  // do NOT increment here
}

// ---------- boot ----------
document.addEventListener("DOMContentLoaded", renderIntro);
