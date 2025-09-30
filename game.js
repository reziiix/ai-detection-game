// ===================== AI Detection Games - game.js =====================
// Frontend-only (GitHub Pages OK). Shared leaderboard via Supabase REST.
// Canvases expected in HTML: <canvas id="space-bg"></canvas>, <canvas id="confetti"></canvas>

// ---------- Supabase leaderboard (shared + live) ----------
const SUPABASE_URL  = "https://tzmegilrifrlruljfamb.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6bWVnaWxyaWZybHJ1bGpmYW1iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNzU2MzEsImV4cCI6MjA3NDc1MTYzMX0.UBpJTuPOg1DOwUvffd_ch0fKwWyYbmOPEpkzIEh3thg";
const SCORES_TABLE  = "scores";

async function saveScoreRemote(name, score, total){
  const row = {
    name: String(name || "Player").slice(0, 20),
    score: Math.max(0, Math.min(Number(score||0), Number(total||10))),
    total: Number(total||10),
    ts: Date.now()
  };
  try{
    await fetch(`${SUPABASE_URL}/rest/v1/${SCORES_TABLE}`, {
      method:"POST",
      headers:{
        "apikey": SUPABASE_ANON,
        "Authorization": `Bearer ${SUPABASE_ANON}`,
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
      },
      body: JSON.stringify(row)
    });
  }catch(e){
    console.warn("saveScoreRemote failed", e);
  }
}
async function loadLeaderboardRemote(limit=10){
  try{
    const q = `${SUPABASE_URL}/rest/v1/${SCORES_TABLE}?select=name,score,total,ts&order=score.desc,ts.asc&limit=${limit}`;
    const r = await fetch(q, {
      headers:{ "apikey": SUPABASE_ANON, "Authorization": `Bearer ${SUPABASE_ANON}` }
    });
    return await r.json();
  }catch(e){
    console.warn("loadLeaderboardRemote failed", e);
    return [];
  }
}

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
let answered = false;

function shuffled(arr){
  const a = [...arr];
  for(let i=a.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function escapeHtml(s){ return String(s).replace(/[&<>"']/g, m=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[m])); }

// ---------- Space Starfield (background) ----------
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
    shooting = { x:Math.random()*w, y:-20, vx:6+Math.random()*4, vy:2+Math.random()*2, life:0, maxLife:120 };
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
    }
    if(shooting){
      shooting.life++;
      ctx.strokeStyle = `rgba(255,255,255,${1 - shooting.life/shooting.maxLife})`;
      ctx.beginPath();
      ctx.moveTo(shooting.x, shooting.y);
      ctx.lineTo(shooting.x-24, shooting.y-10);
      ctx.stroke();
      shooting.x += shooting.vx; shooting.y += shooting.vy;
      if(shooting.life > shooting.maxLife) shooting = null;
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

// ---------- Build image rounds from embedded JSON ----------
async function buildImageRounds(maxChoicesPer = 2){
  const node = document.getElementById("images-manifest");
  if(!node) return [];
  let data; try{ data = JSON.parse(node.textContent); } catch { return []; }

  const ai   = Array.isArray(data.ai)   ? [...data.ai]   : [];
  const real = Array.isArray(data.real) ? [...data.real] : [];
  const choices = Math.max(2, (data.config && data.config.choicesPerImageRound) || maxChoicesPer);
  const imageDiff = (data.config && data.config.imageDifficulty) || "Medium";

  if(ai.length === 0 || real.length < (choices - 1)) return [];

  const rounds = [];
  while(ai.length > 0 && real.length >= (choices-1)){
    const aiPick = ai.splice((Math.random()*ai.length)|0,1)[0];
    const realPicks=[];
    for(let k=0;k<choices-1;k++){
      if(real.length===0) break;
      realPicks.push(real.splice((Math.random()*real.length)|0,1)[0]);
    }
    if(realPicks.length < (choices-1)) break;

    const options = shuffled([{kind:"AI",url:aiPick}, ...realPicks.map(u=>({kind:"REAL",url:u}))]);
    const answer = options.findIndex(o=>o.kind==="AI");
    rounds.push({
      type:"image",
      q:"Which image is AI-generated?",
      options: options.map(o=>o.url),
      answer,
      diff: imageDiff
    });
  }
  return rounds;
}

// ---------- Build the quiz: 10 total, ≥5 images if available ----------
async function buildQuiz(){
  const desiredTotal = 10;
  const desiredImages = 5;

  const imageQsAll = await buildImageRounds(2);
  const imageCount = Math.min(desiredImages, imageQsAll.length);
  const imageQs = imageQsAll.slice(0, imageCount);

  const textNeeded = desiredTotal - imageQs.length;
  const textQs = (window.TEXT_QUESTIONS || []).slice(0, textNeeded);

  // Interleave for variety
  const merged = [];
  let ti = 0, ii = 0;
  while(merged.length < desiredTotal && (ti < textQs.length || ii < imageQs.length)){
    if(ti < textQs.length) merged.push({...textQs[ti++]});
    if(ii < imageQs.length && merged.length < desiredTotal) merged.push({...imageQs[ii++]});
  }
  while(merged.length < desiredTotal && ti < textQs.length) merged.push({...textQs[ti++]});
  while(merged.length < desiredTotal && ii < imageQs.length) merged.push({...imageQs[ii++]});

  // Randomize answer order for text questions only
  merged.forEach(q=>{
    if(q.type !== "image"){
      const pairs = q.options.map((opt,i)=>({i,opt}));
      const shuf = shuffled(pairs);
      q.options = shuf.map(p=>p.opt);
      q.answer  = shuf.findIndex(p=>p.i===q.answer);
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

// ---------- Global Leaderboard UI (button + modal; creates if missing) ----------
// Ensure the modal HTML exists (if you didn't include it in index.html)
function ensureLeaderboardModal() {
  if (document.getElementById("lb-modal")) return;
  const div = document.createElement("div");
  div.id = "lb-modal";
  div.innerHTML = `
    <div class="lb-backdrop"></div>
    <div class="lb-panel">
      <div class="lb-head">
        <h3>Live Leaderboard</h3>
        <button class="btn ghost lb-close">Close</button>
      </div>
      <ol class="board lb-board"></ol>
      <p class="small">Auto-refreshes every 5s</p>
    </div>
  `;
  document.body.appendChild(div);

  // Attach close handlers
  div.querySelector(".lb-backdrop").addEventListener("click", closeLeaderboardModal);
  div.querySelector(".lb-close").addEventListener("click", closeLeaderboardModal);
}


let lbPoll = null;

function openLeaderboardModal() {
  ensureLeaderboardModal();
  const m = document.getElementById("lb-modal");
  if (!m) return;
  m.classList.add("show"); // <- THIS makes it visible (matches your CSS)

  async function refresh() {
    const top = await loadLeaderboardRemote(10);
    const ol = m.querySelector(".lb-board");
    if (!ol) return;
    ol.innerHTML = top.map(x =>
      `<li style="display:flex;justify-content:space-between;margin:4px 0">
         <span>${escapeHtml(x.name)}</span><em>${x.score}/${x.total}</em>
       </li>`
    ).join("");
  }
  refresh();
  if (lbPoll) clearInterval(lbPoll);
  lbPoll = setInterval(refresh, 5000);
}

function closeLeaderboardModal() {
  const m = document.getElementById("lb-modal");
  if (!m) return;
  m.classList.remove("show");
  if (lbPoll) { clearInterval(lbPoll); lbPoll = null; }
}


// ---------- Screens ----------
function renderIntro(){
  stage.innerHTML = `
    <div id="intro">
      <h2>Welcome, challengers!</h2>
      <p>Across <strong>10 rounds</strong> (at least 5 image rounds), decide which content is AI vs human. No timers — discuss, debate, and lock in your answer.</p>
      <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:center">
        <button id="startBtn" class="btn accent">Start Game</button>
        <button id="openLB" class="btn ghost">Leaderboard</button>
      </div>
    </div>`;
  $("#startBtn").addEventListener("click", async () => {
    score=0; current=0; streak=0; answered=false;
    allQuestions = await buildQuiz();
    renderQuestion(allQuestions[current]);
  });
  $("#openLB")?.addEventListener("click", openLeaderboardModal);
}

function renderQuestion(q){
  const idx = current + 1;
  answered = false;
  updateProgress();

  if(q.type === "image"){
    const cols = q.options.length;
    stage.innerHTML = `
      <div class="q-meta"><div>${(q.diff||'').toUpperCase()}</div><div>Question ${idx} / ${allQuestions.length}</div></div>
      <div class="q-title">${q.q}</div>
      <div class="grid ${cols===3?'cols-3':'cols-2'}">
        ${q.options.map((url,i)=>`
          <div class="option floaty" data-i="${i}">
            <div class="imgbox">
              <img src="${url}" alt="Option ${String.fromCharCode(65+i)}" loading="lazy"/>
            </div>
            <button class="btn pick">Pick ${String.fromCharCode(65+i)}</button>
          </div>
        `).join("")}
      </div>
      <div class="streak" id="streak"></div>
      <div id="feedback"></div>
      <div id="explain"></div>
      <div class="q-nav" style="display:flex;justify-content:space-between;margin-top:10px">
        <button id="skipBtn" class="btn ghost" type="button">Skip</button>
        <button id="nextBtn" class="btn accent" type="button" disabled>Next</button>
      </div>
    `;
    $$(".option").forEach(el=>{
      el.addEventListener("click", ()=>{
        if(answered) return;
        el.classList.add("locked");
        submit(parseInt(el.dataset.i,10));
      });
    });
  } else {
    stage.innerHTML = `
      <div class="q-meta"><div>${(q.diff||'').toUpperCase()}</div><div>Question ${idx} / ${allQuestions.length}</div></div>
      <div class="q-title">${q.q}</div>
      <div id="choices"></div>
      <div class="streak" id="streak"></div>
      <div id="feedback"></div>
      <div id="explain"></div>
      <div class="q-nav" style="display:flex;justify-content:space-between;margin-top:10px">
        <button id="skipBtn" class="btn ghost" type="button">Skip</button>
        <button id="nextBtn" class="btn accent" type="button" disabled>Next</button>
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

  $("#skipBtn").addEventListener("click", ()=>{
    streak = 0;
    current++;
    nextQuestion();
  });
  $("#nextBtn").addEventListener("click", ()=> nextQuestion());

  updateStreakBadge();
}

function updateStreakBadge(){
  const s = $("#streak");
  if(!s) return;
  if(streak >= 5) s.textContent = `🔥 Streak: ${streak}! Unstoppable!`;
  else if(streak >= 3) s.textContent = `⚡ Streak: ${streak}!`;
  else s.textContent = "";
}

function showFeedback(isCorrect){
  const fb = $("#feedback");
  fb.className = `feedback ${isCorrect===true?'ok':isCorrect===false?'bad':''}`;
  fb.textContent = isCorrect===true ? "Nice catch! 🎯" : "AI slipped past you. 🤖";
  $("#nextBtn")?.removeAttribute("disabled");
}

// ---------- grading & highlighting ----------
function submit(i){
  const q = allQuestions[current];
  if(answered) return;
  answered = true;

  const isCorrect = (i === q.answer);

  if(isCorrect){
    score++;
    streak++;
    emojiPop("🎯");
    neonPulse();
    showFeedback(true);
  } else {
    streak = 0;
    emojiPop("🤖");
    showFeedback(false);
  }

  if(q.type === "image"){
    const cards = document.querySelectorAll(".option");
    cards.forEach((el, idx) => {
      if(idx === i) el.classList.add(isCorrect ? "selected-correct" : "selected-wrong");
      if(idx === q.answer) el.classList.add("correct");
      el.classList.add("disabled");
    });
  } else {
    const btns = document.querySelectorAll(".btn.choice");
    btns.forEach((btn, idx) => {
      if(idx === i) btn.classList.add(isCorrect ? "selected-correct" : "selected-wrong");
      if(idx === q.answer) btn.classList.add("correct");
      btn.classList.add("disabled");
    });
  }

  current++; // advance but wait on screen until Next
  updateProgress();
  updateStreakBadge();
}

async function renderEnd(){
  launchConfetti(2800);
  updateProgress();

  // Build screen first so UI always works
  stage.innerHTML = `
    <h2>Game Over!</h2>
    <p><strong>You scored ${score} / ${allQuestions.length}</strong></p>
    <p class="small">${rankTitle(score, allQuestions.length)}</p>

    <div class="keybox">
      <h3>🤖 Key Takeaways</h3>
      <p>
<strong> • Human Oversight is Essential:</strong> Always critically review and validate AI outputs. Your expertise ensures accuracy and alignment with Novartis standards.<br><br>

<strong> • Adhere to Novartis AI Principles:</strong> Use AI responsibly, especially when generating images or handling sensitive data, to maintain trust and compliance.<br><br>

<strong> • Recognise & Address Bias:</strong> Be aware of AI's potential for bias in inputs and outputs, and actively work to mitigate it for fair and equitable outcomes.<br><br>

<strong> • Unlock Business Value Responsibly:</strong> By applying these principles, we can harness AI's power effectively and ethically to drive innovation and impact at Novartis.

      </p>
    </div>

    <div class="keybox" style="margin-top:18px">
      <h3>🏆 Leaderboard (Top 5)</h3>
      <ol class="board"></ol>
      <p class="small">Live scores from all players</p>
    </div>

    <div style="margin-top:18px">
      <button id="again" class="btn accent" type="button">Play Again</button>
      <button id="viewLB" class="btn ghost" type="button">Open Full Leaderboard</button>
    </div>
  `;

  // Buttons always active
  let pollId = null;
  $("#again")?.addEventListener("click", async ()=>{
    if(pollId) clearInterval(pollId);
    score=0; current=0; streak=0; answered=false;
    allQuestions = await buildQuiz();
    renderQuestion(allQuestions[current]);
  });
  $("#viewLB")?.addEventListener("click", openLeaderboardModal);

  // Save score (non-blocking) → then refresh board and start polling
  try{
    const name = prompt("Great job! Enter your name or initials for the leaderboard:", "Player");
    await saveScoreRemote(name || "Player", score, allQuestions.length);
  }catch(e){ console.warn("saveScoreRemote error", e); }

  async function refreshBoard(){
    try{
      const top = (await loadLeaderboardRemote(10)).slice(0,5);
      const ol = stage.querySelector("ol.board");
      if(!ol) return;
      ol.innerHTML = top.map(x =>
        `<li><span>${escapeHtml(x.name)}</span> <em>${x.score}/${x.total}</em></li>`
      ).join("");
    }catch(e){ console.warn("refreshBoard failed", e); }
  }
  await refreshBoard();
  pollId = setInterval(refreshBoard, 5000);
}

// ---------- helpers ----------
function rankTitle(s,total){
  if(s <= total*0.33) return "AI Sleuth — solid instincts.";
  if(s <= total*0.66) return "Matrix Breaker — sharp eyes.";
  if(s < total)       return "Reality Bender — almost perfect.";
  return "Unstoppable Human Mind — perfection!";
}
async function nextQuestion(){
  if(current >= allQuestions.length){ renderEnd(); return; }
  renderQuestion(allQuestions[current]);
}
// --- Guaranteed click handler for all Leaderboard buttons anywhere ---
// --- Guaranteed click handler for all Leaderboard buttons ---
document.addEventListener("click", (e) => {
  const t = e.target && e.target.closest && e.target.closest("#openLB, #lb-btn, #viewLB");
  if (!t) return;
  e.preventDefault();
  e.stopPropagation();
  // Optional debug:
  // console.log("Leaderboard button clicked:", t.id || t.textContent);
  try { openLeaderboardModal(); } catch (err) { console.warn("openLeaderboardModal failed:", err); }
});


// --- Global handlers to ALWAYS close the leaderboard ---
document.addEventListener("click", (e) => {
  // Close on "Close" button or backdrop click
  const shouldClose = e.target?.closest?.("#lb-close, .lb-close, #lb-modal .lb-backdrop");
  if (!shouldClose) return;
  e.preventDefault();
  e.stopPropagation();
  try { closeLeaderboardModal(); } catch (err) { console.warn("closeLeaderboardModal failed:", err); }
});

// Esc key closes the modal too
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    try { closeLeaderboardModal(); } catch {}
  }
});

// ---------- boot ----------
document.addEventListener("DOMContentLoaded", ()=>{
  // If you placed a Leaderboard button in the topbar yourself:
  $("#lb-btn")?.addEventListener("click", openLeaderboardModal);
  renderIntro();
});
