const canvas = document.getElementById('starCanvas');
const ctx    = canvas.getContext('2d');
let stars = [], W, H, t = 0;

const GEM_NODES = [
  {x:.30,y:.35,r:2.2}, // 0
  {x:.34,y:.33,r:2.0}, // 1
  {x:.38,y:.35,r:2.0}, // 2
  {x:.42,y:.30,r:2.2}, // 3
  {x:.47,y:.25,r:2.6}, // 4 cima
  {x:.50,y:.35,r:2.1}, // 5 centro
  {x:.58,y:.38,r:2.2}, // 6
  {x:.65,y:.38,r:2.0}, // 7
  {x:.70,y:.36,r:2.3}, // 8 extremo der
  {x:.55,y:.48,r:2.1}, // 9
  {x:.48,y:.55,r:2.0}, // 10
  {x:.42,y:.60,r:2.1}, // 11
  {x:.38,y:.52,r:2.0}, // 12
  {x:.35,y:.45,r:2.1}, // 13
  {x:.33,y:.40,r:1.9}, // 14
];

const GEM_EDGES = [
  [0,1],[1,2],[2,3],[3,4],     // brazo superior
  [3,5],                        // al centro
  [5,6],[6,7],[7,8],            // brazo derecho
  [5,9],[9,10],[10,11],         // pierna der
  [5,12],[12,13],[13,14],[14,0] // pierna izq → cierre
];

let gemPx = [], gemLines = [];


let drawTime = -1;
const DRAW_SPEED = 0.08;
const TOTAL_LINES = GEM_EDGES.length;


const trailParticles = [];


function resize(){
  W = canvas.width  = window.innerWidth;
  H = canvas.height = window.innerHeight;
  buildGemini();
  buildBgStars();
}

function buildGemini(){
  const isMobile = W < 700;
  const targetW = isMobile ? W * 0.92 : W * 0.84;
  const targetH = isMobile ? H * 0.62 : H * 0.68;
  const sx = targetW / 0.40;
  const sy = targetH / 0.35;
  const ox = W * 0.5 - 0.50 * sx;
  const oy = isMobile ? H * -0.15 : H * -0.3;

  gemPx = GEM_NODES.map(s => ({
    ...s,
    px: ox + s.x * sx,
    py: oy + s.y * sy,
    phase: Math.random() * Math.PI * 2,
    speed: .003 + Math.random() * .004,
  }));

  gemLines = GEM_EDGES.map(([a,b]) => ({
    x1: gemPx[a].px, y1: gemPx[a].py,
    x2: gemPx[b].px, y2: gemPx[b].py,
  }));

  const lbl = document.getElementById('gemLabel');
  lbl.style.left = (gemPx[4].px - 20) + 'px';
  lbl.style.top  = (gemPx[4].py - 28) + 'px';
}

function buildBgStars(){
  stars = [];
  const n = Math.floor(W * H / 2600);
  for(let i = 0; i < n; i++) stars.push({
    x: Math.random()*W, y: Math.random()*H,
    r: Math.random()*1.4+.18, a: Math.random()*.7+.3,
    speed: Math.random()*.007+.003, phase: Math.random()*Math.PI*2,
  });
}

function spawnTrailSparks(x, y){
  const count = 3 + Math.floor(Math.random() * 3);
  for(let i = 0; i < count; i++){
    trailParticles.push({
      x, y,
      vx: (Math.random() - .5) * 2.2,
      vy: (Math.random() - .5) * 2.2 - .8,
      life: 1,
      decay: .055 + Math.random() * .06,
      r: .8 + Math.random() * 1.4,
      gold: Math.random() > .4,
    });
  }
}

function updateAndDrawSparks(){
  for(let i = trailParticles.length - 1; i >= 0; i--){
    const p = trailParticles[i];
    p.x  += p.vx;
    p.y  += p.vy;
    p.vy += .06;
    p.life -= p.decay;
    if(p.life <= 0){ trailParticles.splice(i,1); continue; }
    const col = p.gold
      ? `rgba(255,220,100,${p.life * .9})`
      : `rgba(255,200,220,${p.life * .85})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r * p.life, 0, Math.PI*2);
    ctx.fillStyle = col;
    ctx.fill();
  }
}

let lastTimestamp = null;

function drawFrame(timestamp){
  const dt = lastTimestamp ? (timestamp - lastTimestamp) / 1000 : 0.016;
  lastTimestamp = timestamp;

  if(drawTime >= 0 && drawTime < TOTAL_LINES) drawTime += dt * DRAW_SPEED * TOTAL_LINES;

  ctx.clearRect(0,0,W,H);

  const bg = ctx.createRadialGradient(W*.5, H*.28, 0, W*.5, H*.5, Math.max(W,H)*.9);
  bg.addColorStop(0,  '#0d0820');
  bg.addColorStop(.55,'#060410');
  bg.addColorStop(1,  '#02010a');
  ctx.fillStyle = bg; ctx.fillRect(0,0,W,H);

  t += dt;

  stars.forEach(s => {
    const tw = .35 + .65*(.5 + .5*Math.sin(t*s.speed*60 + s.phase));
    ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
    ctx.fillStyle = `rgba(255,240,220,${s.a*tw})`; ctx.fill();
  });

  if(drawTime < 0){
    requestAnimationFrame(drawFrame);
    return;
  }

  const lp = .25 + .10*Math.sin(t*.4);
  ctx.strokeStyle = `rgba(212,168,83,${lp})`;
  ctx.lineWidth = 1.15;

  let tipX = null, tipY = null;

  gemLines.forEach((l, i) => {
    const progress = Math.min(1, Math.max(0, drawTime - i));
    if(progress <= 0) return;

    const ex = l.x1 + (l.x2 - l.x1) * progress;
    const ey = l.y1 + (l.y2 - l.y1) * progress;

    ctx.beginPath();
    ctx.moveTo(l.x1, l.y1);
    ctx.lineTo(ex, ey);
    ctx.stroke();

    if(progress < 1){ tipX = ex; tipY = ey; }
  });

  if(tipX !== null && drawTime < TOTAL_LINES){
    if(Math.random() < .6) spawnTrailSparks(tipX, tipY);
    const grd = ctx.createRadialGradient(tipX, tipY, 0, tipX, tipY, 8);
    grd.addColorStop(0, 'rgba(255,240,160,.9)');
    grd.addColorStop(1, 'rgba(255,200,80,0)');
    ctx.beginPath(); ctx.arc(tipX, tipY, 8, 0, Math.PI*2);
    ctx.fillStyle = grd; ctx.fill();
  }

  updateAndDrawSparks();

  const reachedNodes = new Set();
  gemLines.forEach((l, i) => {
    const [a, b] = GEM_EDGES[i];
    const progress = Math.min(1, Math.max(0, drawTime - i));
    if(progress > 0)  reachedNodes.add(a);
    if(progress >= 1) reachedNodes.add(b);
  });

  gemPx.forEach((s, i) => {
    if(!reachedNodes.has(i)) return;
    const tw = .65 + .35*(.5 + .5*Math.sin(t*s.speed*60 + s.phase));
    const glow = s.r * 6;
    const grd = ctx.createRadialGradient(s.px, s.py, 0, s.px, s.py, glow);
    grd.addColorStop(0,  `rgba(255,232,190,${.55*tw})`);
    grd.addColorStop(.4, `rgba(232,168,83,${.22*tw})`);
    grd.addColorStop(1,  'rgba(255,210,120,0)');
    ctx.beginPath(); ctx.arc(s.px, s.py, glow, 0, Math.PI*2);
    ctx.fillStyle = grd; ctx.fill();
    ctx.beginPath(); ctx.arc(s.px, s.py, s.r*tw, 0, Math.PI*2);
    ctx.fillStyle = `rgba(255,248,230,${.9*tw})`; ctx.fill();
    if(s.r >= 2.4){
      ctx.strokeStyle = `rgba(255,240,200,${.30*tw})`;
      ctx.lineWidth = .8;
      const len = s.r * 8;
      ctx.beginPath(); ctx.moveTo(s.px-len, s.py); ctx.lineTo(s.px+len, s.py); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(s.px, s.py-len); ctx.lineTo(s.px, s.py+len); ctx.stroke();
    }
  });

  requestAnimationFrame(drawFrame);
}


const flowerDefs = [
  { xp:.50, sc:1,    dl:0,    sb:'0deg',    sp:'2deg',    gd:1.9, sd:5.2 },
  { xp:.27, sc:.88,  dl:.28,  sb:'-1deg',   sp:'-3deg',   gd:1.7, sd:4.6 },
  { xp:.73, sc:.88,  dl:.36,  sb:'1deg',    sp:'3deg',    gd:1.7, sd:4.8 },
  { xp:.11, sc:.73,  dl:.55,  sb:'-2deg',   sp:'-4.5deg', gd:1.5, sd:4.0 },
  { xp:.39, sc:.73,  dl:.52,  sb:'-1deg',   sp:'-3.5deg', gd:1.5, sd:4.3 },
  { xp:.61, sc:.73,  dl:.62,  sb:'1deg',    sp:'3.5deg',  gd:1.5, sd:4.4 },
  { xp:.89, sc:.73,  dl:.68,  sb:'2deg',    sp:'4.5deg',  gd:1.5, sd:4.1 },
  { xp:.03, sc:.53,  dl:.90,  sb:'-3deg',   sp:'-6deg',   gd:1.3, sd:3.7 },
  { xp:.21, sc:.55,  dl:.95,  sb:'-2deg',   sp:'-5deg',   gd:1.3, sd:3.5 },
  { xp:.79, sc:.55,  dl:1.02, sb:'2deg',    sp:'5deg',    gd:1.3, sd:3.6 },
  { xp:.97, sc:.53,  dl:1.08, sb:'3deg',    sp:'6deg',    gd:1.3, sd:3.8 },
];

const roseColors = [
  {outer:'#c0396e',inner:'#8b1a4a',center:'#ffd6e7',leaf:'#2d6a2d',leafD:'#1e4d1e'},
  {outer:'#e8789a',inner:'#c0396e',center:'#fff0f5',leaf:'#3a7a3a',leafD:'#235023'},
  {outer:'#a02558',inner:'#6b1338',center:'#f9d0e0',leaf:'#255225',leafD:'#183818'},
  {outer:'#d44b7e',inner:'#9b2052',center:'#ffe4ef',leaf:'#2f6e2f',leafD:'#1d4d1d'},
];

function buildRose(ci, stemH){
  const c = roseColors[ci % roseColors.length];
  const W2=130, H2=stemH+150, cx=65, cy=94;
  const petals = Array.from({length:8},(_,i)=>{
    const r = (i*45*Math.PI)/180;
    const px=cx+Math.cos(r)*20, py=cy+Math.sin(r)*15;
    return `<ellipse cx="${px}" cy="${py}" rx="29" ry="21"
      fill="${c.outer}" transform="rotate(${i*45},${px},${py})" opacity=".91"/>`;
  }).join('');
  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W2} ${H2}" width="${W2}" height="${H2}">
<defs>
  <radialGradient id="rg${ci}" cx="50%" cy="35%">
    <stop offset="0%" stop-color="${c.center}" stop-opacity=".65"/>
    <stop offset="100%" stop-color="${c.outer}" stop-opacity="0"/>
  </radialGradient>
  <filter id="gf${ci}">
    <feGaussianBlur stdDeviation="3.5" result="b"/>
    <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
</defs>
<path d="M${cx},${H2} Q${cx-10},${H2-stemH*.55} ${cx+2},${H2-stemH}"
      stroke="${c.leaf}" stroke-width="4.5" fill="none" stroke-linecap="round"/>
<ellipse cx="${cx-26}" cy="${H2-stemH*.38}" rx="20" ry="9"
  fill="${c.leaf}" transform="rotate(-38,${cx-26},${H2-stemH*.38})" opacity=".88"/>
<ellipse cx="${cx+25}" cy="${H2-stemH*.60}" rx="18" ry="8"
  fill="${c.leaf}" transform="rotate(38,${cx+25},${H2-stemH*.60})" opacity=".85"/>
<ellipse cx="${cx-18}" cy="${H2-stemH*.73}" rx="13" ry="6"
  fill="${c.leafD}" transform="rotate(-28,${cx-18},${H2-stemH*.73})" opacity=".7"/>
<g class="petal-group" style="transform-origin:${cx}px ${cy}px">
  ${petals}
  <ellipse cx="${cx}" cy="${cy}"   rx="23" ry="19" fill="${c.outer}"/>
  <ellipse cx="${cx}" cy="${cy-3}" rx="17" ry="14" fill="${c.inner}" opacity=".88"/>
  <ellipse cx="${cx}" cy="${cy-5}" rx="11" ry="9"  fill="${c.inner}" opacity=".75"/>
  <circle cx="${cx}" cy="${cy}" r="11" fill="${c.center}" filter="url(#gf${ci})"/>
  <circle cx="${cx}" cy="${cy}" r="5.5" fill="#fff" opacity=".75"/>
  <ellipse cx="${cx}" cy="${cy}" rx="26" ry="21" fill="url(#rg${ci})"/>
</g>
</svg>`;
}

function playMusic(){
  const ac = new (window.AudioContext||window.webkitAudioContext)();
  const master = ac.createGain();
  master.gain.setValueAtTime(0, ac.currentTime);
  master.gain.linearRampToValueAtTime(.16, ac.currentTime+3);
  master.connect(ac.destination);
  const rb = ac.createBuffer(2, ac.sampleRate*3, ac.sampleRate);
  for(let c=0;c<2;c++){
    const d=rb.getChannelData(c);
    for(let i=0;i<d.length;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,3);
  }
  const rev=ac.createConvolver(); rev.buffer=rb;
  const rg=ac.createGain(); rg.gain.value=.32;
  rev.connect(rg); rg.connect(master);
  const sc2=[261.63,293.66,329.63,349.23,392,440,493.88,523.25];
  const mel=[4,4,5,6,6,5,4,2,0,2,4,4,4,2,2,0,4,4,5,6,6,5,4,2,0,2,4,2,0,0,0,0];
  const bpm=68, beat=60/bpm;
  function note(f,t2,d){
    const o=ac.createOscillator(),e=ac.createGain();
    o.type='sine'; o.frequency.value=f;
    e.gain.setValueAtTime(0,t2);
    e.gain.linearRampToValueAtTime(.48,t2+.04);
    e.gain.exponentialRampToValueAtTime(.001,t2+d*.88);
    o.connect(e); e.connect(master); e.connect(rev); o.start(t2); o.stop(t2+d);
  }
  function pad(f,t2,d){
    [1,1.5,2].forEach(h=>{
      const o=ac.createOscillator(),e=ac.createGain();
      o.type='sine'; o.frequency.value=f*h*.5;
      e.gain.setValueAtTime(0,t2);
      e.gain.linearRampToValueAtTime(.035/h,t2+.6);
      e.gain.linearRampToValueAtTime(.025/h,t2+d-.6);
      e.gain.linearRampToValueAtTime(0,t2+d);
      o.connect(e); e.connect(rev); o.start(t2); o.stop(t2+d);
    });
  }
  const ch=[[261.63,329.63,392],[246.94,311.13,369.99],[220,277.18,329.63],[261.63,329.63,392]];
  function schedule(){
    const now=ac.currentTime+.05;
    mel.forEach((n,i)=>note(sc2[n],now+i*beat,beat*.83));
    ch.forEach((c,i)=>c.forEach(f=>pad(f,now+i*beat*8,beat*8.5)));
  }
  schedule();
  setInterval(schedule, mel.length*beat*1000);
}


function addSparkles(){
  for(let i=0;i<22;i++){
    const sp=document.createElement('div');
    sp.className='sparkle';
    const size=Math.random()*4+2;
    const col=Math.random()>.5?'rgba(247,197,213,.9)':'rgba(212,168,83,.9)';
    Object.assign(sp.style,{
      width:size+'px', height:size+'px',
      left:(8+Math.random()*84)+'%',
      top:(22+Math.random()*55)+'%',
      background:col, boxShadow:`0 0 ${size*2}px ${col}`,
      '--sd2':(1.5+Math.random()*2.2)+'s',
      '--sdel':(Math.random()*3.5)+'s',
    });
    document.body.appendChild(sp);
  }
}


document.getElementById('startBtn').addEventListener('click', function(){
  this.classList.add('hidden');
  setTimeout(()=>this.remove(), 900);

  playMusic();
  addSparkles();
  document.getElementById('gemLabel').classList.add('show');

  drawTime = 0;

  const scene = document.getElementById('scene');
  const vw = window.innerWidth, vh = window.innerHeight;
  const baseH = Math.min(vh * .40, 230);

  flowerDefs.forEach((fd, i) => {
    const wrap = document.createElement('div');
    wrap.className = 'flower-wrap';
    const stemH  = Math.round(baseH * fd.sc);
    const totalH = (stemH + 150) * fd.sc;
    const ww     = 130 * fd.sc;
    const xPx    = fd.xp * vw - ww/2;
    wrap.style.cssText = `
      left:${xPx}px;width:${ww}px;height:${totalH}px;
      --gl:${fd.dl}s;--gd:${fd.gd}s;
      --sb:${fd.sb};--sp:${fd.sp};--sd:${fd.sd}s;
      --ss:${fd.dl+fd.gd-.15}s;
    `;
    wrap.innerHTML = buildRose(i%4, stemH);
    wrap.querySelector('svg').style.cssText = 'width:100%;height:100%;display:block;';
    const pg = wrap.querySelector('.petal-group');
    if(pg) pg.style.setProperty('--pd', (fd.dl + fd.gd*.6)+'s');
    scene.appendChild(wrap);
    requestAnimationFrame(() => wrap.classList.add('bloom'));
  });
});


window.addEventListener('resize', resize);
resize();
requestAnimationFrame(drawFrame);