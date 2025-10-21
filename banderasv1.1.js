/*
  Diversión con banderas — v2 (split)
  Cambios clave:
  - Opción 2B: auto-avance SÍ, botón "Siguiente" eliminado (no se puede pasar sin contestar).
  - Fix reanudar: disableAnswers() ahora habilita/deshabilita correctamente.
  - Blindaje de opciones (si falta pool) con pickOptions().
  - object-fit: contain (hecho en CSS del HTML).
  - erratas corregidas en textos del Reto del día.
  - Preload simplificado y sin doble descarga.
  - Semana ISO local (aprox.)
  - Atajos: 1–4 responden; P pausa; Esc reanuda/cierra pausa.
*/

// ===== Utilidades DOM/varias =====
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const randomInt = n => Math.floor(Math.random() * n);
function shuffle(arr){ for(let i=arr.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]] } return arr; }

function flagUrl(code){ return `https://flagcdn.com/w320/${code}.png`; }
function isoWeekStringLocal(d=new Date()){
  // Aproximación: calcula semana ISO con fecha local (no UTC) para evitar saltos por TZ
  const date = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  // Jueves de la semana actual
  const dayNum = (date.getDay() || 7); // 1..7
  date.setDate(date.getDate() + 4 - dayNum);
  const yearStart = new Date(date.getFullYear(), 0, 1);
  const weekNo = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
  const y = date.getFullYear();
  return `${y}-W${String(weekNo).padStart(2,'0')}`;
}
const todayStr = () => new Date().toISOString().slice(0,10);

// ===== Pantallas =====
const screens = {
  player: $('#screen-player'),
  mode: $('#screen-mode'),
  level: $('#screen-level'),
  game: $('#screen-game'),
  final: $('#finalCard'),
};
function showScreen(name){
  Object.values(screens).forEach(s => s.classList.remove('active'));
  screens[name].classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if(name==='mode') updateDailyTile();
}

// ===== Config =====
const LEVELS = {
  kids:   { label: "Niños",  time: 15, wrongPenalty: 0 },
  adult:  { label: "Adultos", time: 12, wrongPenalty: 0 },
  master: { label: "Máster", time: 8,  wrongPenalty: -5 },
};
const MAX_Q = 10;

// ===== Datos ES =====
const CAPITAL_ES = { "Algiers":"Argel","Oran":"Orán","Tunis":"Túnez","Cairo":"El Cairo","Khartoum":"Jartum","N'Djamena":"Yamena","Abuja":"Abuya","Accra":"Acra","Addis Ababa":"Addís Abeba","Asmara":"Asmara","Bamako":"Bamako","Bangui":"Bangui","Banjul":"Banjul","Bissau":"Bisáu","Conakry":"Conakri","Dakar":"Dakar","Freetown":"Freetown","Gaborone":"Gaborone","Harare":"Harare","Kampala":"Kampala","Kinshasa":"Kinsasa","Libreville":"Libreville","Lilongwe":"Lilongüe","Lomé":"Lomé","Luanda":"Luanda","Lusaka":"Lusaka","Malabo":"Malabo","Maputo":"Maputo","Maseru":"Maseru","Mbabane":"Mbabane","Mogadishu":"Mogadiscio","Monrovia":"Monrovia","Moroni":"Moroni","Nairobi":"Nairobi","Niamey":"Niamey","Nouakchott":"Nuakchot","Ouagadougou":"Uagadugú","Porto-Novo":"Portonovo","Praia":"Praia","Pretoria":"Pretoria","Rabat":"Rabat","Tripoli":"Trípoli","Torshavn":"Tórshavn","Victoria":"Victoria","Windhoek":"Windhoek","Yaoundé":"Yaundé","Yamoussoukro":"Yamusukro","Amsterdam":"Ámsterdam","Athens":"Atenas","Belgrade":"Belgrado","Berlin":"Berlín","Berne":"Berna","Bern":"Berna","Bratislava":"Bratislava","Brussels":"Bruselas","Bucharest":"Bucarest","Budapest":"Budapest","Chisinau":"Chisináu","Copenhagen":"Copenhague","Dublin":"Dublín","Helsinki":"Helsinki","Kyiv":"Kiev","Kiev":"Kiev","Lisbon":"Lisboa","Ljubljana":"Liubliana","London":"Londres","Luxembourg":"Luxemburgo","Madrid":"Madrid","Minsk":"Minsk","Monaco":"Mónaco","Moscow":"Moscú","Nicosia":"Nicosia","Oslo":"Oslo","Paris":"París","Podgorica":"Podgorica","Prague":"Praga","Reykjavik":"Reikiavik","Riga":"Riga","Rome":"Roma","San Marino":"San Marino","Sarajevo":"Sarajevo","Skopje":"Skopie","Sofia":"Sofía","Stockholm":"Estocolmo","Tallinn":"Tallin","Tirana":"Tirana","Vaduz":"Vaduz","Valletta":"La Valeta","Vatican City":"Ciudad del Vaticano","Vienna":"Viena","Vilnius":"Vilna","Warsaw":"Varsovia","Zagreb":"Zagreb","Abu Dhabi":"Abu Dabi","Amman":"Amán","Ankara":"Ankara","Astana":"Astaná","Baghdad":"Bagdad","Baku":"Bakú","Beijing":"Pekín","Peking":"Pekín","Beirut":"Beirut","Damascus":"Damasco","Dhaka":"Daca","Doha":"Doha","Hanoi":"Hanói","Islamabad":"Islamabad","Jakarta":"Yakarta","Jerusalem":"Jerusalén","Kabul":"Kabul","Kathmandu":"Katmandú","Kuala Lumpur":"Kuala Lumpur","Manila":"Manila","Muscat":"Mascate","New Delhi":"Nueva Delhi","Nur-Sultan":"Astaná","Phnom Penh":"Nom Pen","Riyadh":"Riad","Seoul":"Seúl","Singapore":"Singapur","Sri Jayawardenepura Kotte":"Sri Jayawardenapura Kotte","Taipei":"Taipéi","Tashkent":"Taskent","Tehran":"Teherán","Thimphu":"Timbu","Tokyo":"Tokio","Ulaanbaatar":"Ulán Bator","Vientiane":"Vientián","Sanaa":"Saná","Canberra":"Canberra","Suva":"Suva","Wellington":"Wellington","Port Moresby":"Port Moresby","Apia":"Apia","Nukuʻalofa":"Nukualofa","Nuku'alofa":"Nukualofa","Honiara":"Honiara","Funafuti":"Funafuti","Buenos Aires":"Buenos Aires","Asuncion":"Asunción","Asunción":"Asunción","Bogotá":"Bogotá","Brasília":"Brasilia","Brasilia":"Brasilia","Caracas":"Caracas","Georgetown":"Georgetown","Lima":"Lima","La Paz":"La Paz","Sucre":"Sucre","Montevideo":"Montevideo","Paramaribo":"Paramaribo","Quito":"Quito","Santiago":"Santiago","Belmopan":"Belmopán","Guatemala City":"Ciudad de Guatemala","Havana":"La Habana","Kingston":"Kingston","Managua":"Managua","Mexico City":"Ciudad de México","Panama City":"Ciudad de Panamá","Port-au-Prince":"Puerto Príncipe","Port of Spain":"Puerto España","San Jose":"San José","San José":"San José","Santo Domingo":"Santo Domingo","Ottawa":"Ottawa","Washington, D.C.":"Washington D. C.","Saint John's":"Saint John’s","St. John's":"Saint John’s","Nassau":"Nassau","Bridgetown":"Bridgetown","Kuwait City":"Kuwait","Manama":"Manama","Sanaa":"Saná","Majuro":"Majuro","Melekeok":"Melekeok","Ngerulmud":"Ngerulmud","Palikir":"Palikir","Tarawa":"Tarawa" };
function toSpanishCapital(cap){ return cap ? (CAPITAL_ES[cap] || cap) : ""; }

let ALL = []; // {code, nameES, capitalES, region}

async function loadData(){
  try{
    const [resNames, resAll] = await Promise.all([
      fetch("https://flagcdn.com/es/codes.json"),
      fetch("https://restcountries.com/v3.1/all?fields=name,cca2,capital,region,translations")
    ]);
    const namesES = await resNames.json();
    const all = await resAll.json();
    ALL = all.map(c=>{
      const code = (c.cca2 || "").toLowerCase();
      // usa traducción española si está disponible
      const nameES = (c.translations?.spa?.common) || namesES[code] || (c.name?.common || "");
      const capIn = Array.isArray(c.capital) && c.capital.length ? c.capital[0] : "";
      const capitalES = toSpanishCapital(capIn);
      const region = c.region || "Other";
      return { code, nameES, capitalES, region };
    }).filter(x => x.code && x.nameES);
  }catch(e){
    // Fallback robusto (≥ 40 países)
    ALL = [
      {code:"es",nameES:"España",capitalES:"Madrid",region:"Europe"},{code:"fr",nameES:"Francia",capitalES:"París",region:"Europe"},{code:"de",nameES:"Alemania",capitalES:"Berlín",region:"Europe"},{code:"it",nameES:"Italia",capitalES:"Roma",region:"Europe"},{code:"pt",nameES:"Portugal",capitalES:"Lisboa",region:"Europe"},{code:"gb",nameES:"Reino Unido",capitalES:"Londres",region:"Europe"},{code:"ie",nameES:"Irlanda",capitalES:"Dublín",region:"Europe"},{code:"nl",nameES:"Países Bajos",capitalES:"Ámsterdam",region:"Europe"},{code:"be",nameES:"Bélgica",capitalES:"Bruselas",region:"Europe"},{code:"lu",nameES:"Luxemburgo",capitalES:"Luxemburgo",region:"Europe"},{code:"ch",nameES:"Suiza",capitalES:"Berna",region:"Europe"},{code:"at",nameES:"Austria",capitalES:"Viena",region:"Europe"},{code:"pl",nameES:"Polonia",capitalES:"Varsovia",region:"Europe"},{code:"cz",nameES:"Chequia",capitalES:"Praga",region:"Europe"},{code:"sk",nameES:"Eslovaquia",capitalES:"Bratislava",region:"Europe"},{code:"hu",nameES:"Hungría",capitalES:"Budapest",region:"Europe"},{code:"gr",nameES:"Grecia",capitalES:"Atenas",region:"Europe"},{code:"se",nameES:"Suecia",capitalES:"Estocolmo",region:"Europe"},{code:"no",nameES:"Noruega",capitalES:"Oslo",region:"Europe"},{code:"fi",nameES:"Finlandia",capitalES:"Helsinki",region:"Europe"},{code:"dk",nameES:"Dinamarca",capitalES:"Copenhague",region:"Europe"},{code:"is",nameES:"Islandia",capitalES:"Reikiavik",region:"Europe"},{code:"ee",nameES:"Estonia",capitalES:"Tallin",region:"Europe"},{code:"lv",nameES:"Letonia",capitalES:"Riga",region:"Europe"},{code:"lt",nameES:"Lituania",capitalES:"Vilna",region:"Europe"},{code:"us",nameES:"Estados Unidos",capitalES:"Washington D. C.",region:"Americas"},{code:"ca",nameES:"Canadá",capitalES:"Ottawa",region:"Americas"},{code:"mx",nameES:"México",capitalES:"Ciudad de México",region:"Americas"},{code:"br",nameES:"Brasil",capitalES:"Brasilia",region:"Americas"},{code:"ar",nameES:"Argentina",capitalES:"Buenos Aires",region:"Americas"},{code:"cl",nameES:"Chile",capitalES:"Santiago",region:"Americas"},{code:"co",nameES:"Colombia",capitalES:"Bogotá",region:"Americas"},{code:"pe",nameES:"Perú",capitalES:"Lima",region:"Americas"},{code:"uy",nameES:"Uruguay",capitalES:"Montevideo",region:"Americas"},{code:"py",nameES:"Paraguay",capitalES:"Asunción",region:"Americas"},{code:"bo",nameES:"Bolivia",capitalES:"La Paz",region:"Americas"},{code:"ec",nameES:"Ecuador",capitalES:"Quito",region:"Americas"},{code:"ve",nameES:"Venezuela",capitalES:"Caracas",region:"Americas"},{code:"au",nameES:"Australia",capitalES:"Canberra",region:"Oceania"},{code:"nz",nameES:"Nueva Zelanda",capitalES:"Wellington",region:"Oceania"},{code:"jp",nameES:"Japón",capitalES:"Tokio",region:"Asia"},{code:"kr",nameES:"Corea del Sur",capitalES:"Seúl",region:"Asia"},{code:"cn",nameES:"China",capitalES:"Pekín",region:"Asia"},{code:"in",nameES:"India",capitalES:"Nueva Delhi",region:"Asia"},{code:"id",nameES:"Indonesia",capitalES:"Yakarta",region:"Asia"},{code:"sa",nameES:"Arabia Saudí",capitalES:"Riad",region:"Asia"},{code:"ae",nameES:"Emiratos Árabes Unidos",capitalES:"Abu Dabi",region:"Asia"}
    ];
  }
}

// ===== Estado =====
let playerName = "";
let currentMode = null; // 'flags' | 'capitals' | 'mixed'
let currentLevel = 'adult';
let order = [];
let optionsPool = [];
let idx = 0;
let score = 0, hits = 0, misses = 0;
let locked = false;

// Temporizador + Pausa
let timeLeft = 0, timeInterval = null, nextTimer = null;
let paused = false;
let qActiveStartMs = 0;
let qAccumulatedMs = 0;

// Métricas
let timesMs = [];
let missMap = {};

// ===== Audio =====
const AudioCtx = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioCtx();
function playTone(f=440, d=0.12, type='sine', vol=0.2){
  const o=audioCtx.createOscillator(); const g=audioCtx.createGain();
  o.type=type; o.frequency.value=f; g.gain.value=vol;
  o.connect(g).connect(audioCtx.destination); o.start();
  setTimeout(()=>{ g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.05); o.stop(audioCtx.currentTime+0.06); }, d*1000);
}
function playCoin(){ let t=0; [{f:523,d:0.08},{f:659,d:0.08},{f:784,d:0.10}]
  .forEach(n=>{ setTimeout(()=>playTone(n.f,n.d,'square',0.15), t); t+=n.d*1000*0.9; }); }
function playBuzzer(){ const s=260,e=140,steps=6,ms=50; for(let i=0;i<steps;i++){ const f=s+(e-s)*(i/(steps-1)); setTimeout(()=>playTone(f, ms/1000, 'sawtooth', 0.12), i*ms); } }

// ===== Confeti =====
const confettiLayer = $("#confetti");
const confettiEmojis = ["🎉","🎊","✨","🎈","🟡","🔷","🟢","🟣","⭐","💠"];
function launchConfetti() {
  for (let i = 0; i < 18; i++) {
    const s = document.createElement("span");
    s.textContent = confettiEmojis[Math.floor(Math.random()*confettiEmojis.length)];
    s.style.left = (Math.random() * 100) + "vw";
    s.style.animationDuration = (0.8 + Math.random() * 0.9) + "s";
    s.style.transform = `translateY(0) rotate(${Math.random()*360}deg)`;
    confettiLayer.appendChild(s);
    setTimeout(() => s.remove(), 1800);
  }
}

// ===== LocalStorage =====
const LS = { name: 'dcf_player_name', scores: 'dcf_scores', stats: 'dcf_stats', challenge: 'dcf_challenges', last: 'dcf_last_sel' };
function lsGet(k, def){ try{ const v = localStorage.getItem(k); return v?JSON.parse(v):def; }catch{ return def; } }
function lsSet(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch{} }

function recordGameToLeague({name, score, mode, level, durationMs}){
  const arr = lsGet(LS.scores, []);
  arr.unshift({name, score, mode, level, dateISO: new Date().toISOString(), week: isoWeekStringLocal(), durationMs});
  while(arr.length>300) arr.pop();
  lsSet(LS.scores, arr);
}
function updateGlobalStatsFromRun(){
  const st = lsGet(LS.stats, { times:{count:0,sumMs:0,maxMs:0,minMs:0}, countries:{} });
  for(const ms of timesMs){
    st.times.count += 1;
    st.times.sumMs += ms;
    st.times.maxMs = Math.max(st.times.maxMs||0, ms);
    st.times.minMs = st.times.minMs? Math.min(st.times.minMs, ms) : ms;
  }
  for(const code in missMap){
    const m = missMap[code];
    if(!st.countries[code]) st.countries[code] = {name:m.name, attempts:0, wrong:0};
    st.countries[code].attempts += m.attempts;
    st.countries[code].wrong += m.wrong;
  }
  lsSet(LS.stats, st);
}

// ===== Liga UI =====
function renderLeague(){
  const week = isoWeekStringLocal();
  $("#leagueWeek").textContent = week;
  $("#leagueName").value = playerName;

  const arr = lsGet(LS.scores, []);
  const thisWeek = arr.filter(x=>x.week===week);
  const bestByPlayer = {};
  thisWeek.forEach(s=>{ if(!bestByPlayer[s.name] || s.score>bestByPlayer[s.name].score){ bestByPlayer[s.name] = s; } });
  const rows = Object.values(bestByPlayer).sort((a,b)=> b.score - a.score).slice(0,20);
  const html = `
    <table class="min-w-full text-sm">
      <thead><tr class="text-left text-slate-500">
        <th class="py-2 pr-3">#</th>
        <th class="py-2 pr-3">Jugador</th>
        <th class="py-2 pr-3">Puntos</th>
        <th class="py-2 pr-3">Modo</th>
        <th class="py-2 pr-3">Dificultad</th>
        <th class="py-2 pr-3">Fecha</th>
      </tr></thead>
      <tbody>
        ${rows.map((r,i)=>`
          <tr class="border-t">
            <td class="py-2 pr-3 font-semibold">${i+1}</td>
            <td class="py-2 pr-3">${r.name}</td>
            <td class="py-2 pr-3">${r.score}</td>
            <td class="py-2 pr-3">${r.mode}</td>
            <td class="py-2 pr-3">${LEVELS[r.level]?.label||r.level}</td>
            <td class="py-2 pr-3">${new Date(r.dateISO).toLocaleString('es-ES',{dateStyle:'short', timeStyle:'short'})}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>`;
  $("#leagueTable").innerHTML = html || `<div class="text-slate-500 text-sm">Aún no hay partidas esta semana.</div>`;
}

// ===== Estadísticas UI =====
function renderStats(tab='overview'){
  const st = lsGet(LS.stats, { times:{count:0,sumMs:0,maxMs:0,minMs:0}, countries:{} });
  const content = $("#statsContent");
  const avg = st.times.count? (st.times.sumMs/st.times.count) : 0;

  if(tab==='overview'){
    content.innerHTML = `
      <div class="grid sm:grid-cols-3 gap-3">
        <div class="p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
          <div class="text-xs text-slate-500">Preguntas respondidas</div>
          <div class="text-2xl font-black">${st.times.count||0}</div>
        </div>
        <div class="p-4 rounded-2xl bg-sky-50 border border-sky-100">
          <div class="text-xs text-slate-500">Tiempo medio</div>
          <div class="text-2xl font-black">${avg? (avg/1000).toFixed(2) : '—'} s</div>
        </div>
        <div class="p-4 rounded-2xl bg-amber-50 border border-amber-100">
          <div class="text-xs text-slate-500">Rango (rápido / lento)</div>
          <div class="text-2xl font-black">${st.times.minMs? (st.times.minMs/1000).toFixed(2):'—'}s / ${st.times.maxMs? (st.times.maxMs/1000).toFixed(2):'—'}s</div>
        </div>
      </div>`;
  }
  if(tab==='mistakes'){
    const entries = Object.entries(st.countries||{}).map(([code, v])=>({code, ...v, rate: v.wrong/(v.attempts||1)}))
      .filter(x=>x.attempts>=1).sort((a,b)=>b.rate-a.rate).slice(0,15);
    content.innerHTML = `
      <div class="text-sm text-slate-600 mb-2">Top países con mayor tasa de error (mín. 1 intento)</div>
      <table class="min-w-full text-sm">
        <thead><tr class="text-left text-slate-500">
          <th class="py-2 pr-3">País</th>
          <th class="py-2 pr-3">Fallos</th>
          <th class="py-2 pr-3">Intentos</th>
          <th class="py-2 pr-3">Tasa</th>
        </tr></thead>
        <tbody>
          ${entries.map(r=>`
            <tr class="border-t">
              <td class="py-2 pr-3 flex items-center gap-2">
                <img src="${flagUrl(r.code)}" class="w-6 h-4 rounded border" alt="" />
                <span>${r.name}</span>
              </td>
              <td class="py-2 pr-3">${r.wrong}</td>
              <td class="py-2 pr-3">${r.attempts}</td>
              <td class="py-2 pr-3">${(r.rate*100).toFixed(0)}%</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      ${entries.length? '' : '<div class="text-slate-500 text-sm mt-2">Aún no hay suficientes datos.</div>'}
    `;
  }
  if(tab==='times'){
    content.innerHTML = `
      <div class="text-sm text-slate-600 mb-2">Distribución de tiempos (últimas ${Math.min(timesMs.length, MAX_Q)} preguntas de esta sesión)</div>
      <div class="flex flex-wrap gap-2">
        ${timesMs.map((ms,i)=>`<span class="px-2 py-1 rounded-lg bg-slate-100 text-xs">${i+1}: ${(ms/1000).toFixed(2)}s</span>`).join('') || '<div class="text-slate-500 text-sm">Juega una partida para ver tiempos.</div>'}
      </div>
    `;
  }
}

// ===== Reto del día =====
function dailySeedIndex(max){
  const d = todayStr().replaceAll('-','');
  let h = 0; for(let i=0;i<d.length;i++){ h = (h*31 + d.charCodeAt(i)) % 2147483647; }
  return h % max;
}
function pickVeryHardSet(){
  const hardCodes = ["nr","tv","ws","to","ki","fm","mh","sb","pw","gd","ag","lc","vc","kn","bb","bz","gy","sr","gw","gn","ga","gq","bj","ne","td","cg","cd","bi","rw","er","dj","km","cv","st","bt","tm","kg","tj","la","bn","mm","af","ye","om","qa","bh","kw","mc","li","ad","sm","va","fo","ax"];
  const hardPool = ALL.filter(x=>hardCodes.includes(x.code));
  if(hardPool.length<4) return shuffle([...ALL]).slice(0,4);
  return shuffle(hardPool).slice(0,4);
}
function makeDailyQuestion(){
  const options = pickVeryHardSet();
  const idxSeed = dailySeedIndex(options.length);
  const correct = options[idxSeed];
  const useCapital = correct.capitalES && (idxSeed % 2 === 0);
  const mixed = shuffle([...options]);
  return { kind: useCapital?'capital':'flag', correct, options: mixed };
}
function updateDailyTile(){
  const challenges = lsGet(LS.challenge, {});
  const done = challenges[todayStr()];
  const tile = $("#tile-daily");
  tile.style.display = done ? 'none' : '';
}
function obfuscateText(txt){
  const chars = txt.split(''); let letters = [];
  for(let i=0;i<chars.length;i++){ if(/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/.test(chars[i])) letters.push(i); }
  if(letters.length<=2) return txt;
  const hideCount = Math.max(2, Math.floor(letters.length*0.4));
  shuffle(letters); const toHide = new Set(letters.slice(0, hideCount));
  return chars.map((ch,i)=> toHide.has(i) ? ' _ ' : ch).join('');
}
function renderDailyModal(){
  const challenges = lsGet(LS.challenge, {});
  const done = challenges[todayStr()];
  const container = $("#dailyQuestion");
  $("#dailyPrize").classList.add("hidden");
  $("#dailyEmoji").textContent = "⭐";

  if(done){
    container.innerHTML = `<div class="p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
      <div class="text-sm">Ya hiciste el reto de hoy (${todayStr()}). Resultado: <strong>${done.correct? '✅ correcto' : '❌ incorrecto'}</strong>.</div>
    </div>
    <div class="mt-3 text-sm text-slate-700">¿Ya tienes ganas de saber el próximo reto? Tendrás que esperar a mañana para descubrirlo</div>`;
    return;
  }

  const q = makeDailyQuestion();
  let html = "";
  if(q.kind==='flag'){
    html += `
      <div class="mb-3 text-sm text-slate-700">¿De qué país es esta bandera?</div>
      <div class="w-full max-h-64 overflow-hidden rounded-xl border bg-white mb-3 grid place-items-center p-2">
        <img src="${flagUrl(q.correct.code)}" class="max-h-60 w-auto object-contain" style="filter: blur(2px);" alt="Bandera (difuminada)" />
      </div>`;
  } else {
    const obsc = obfuscateText(q.correct.capitalES);
    html += `<div class="mb-3 text-sm text-slate-700">¿De qué país es la capital <strong>${obsc}</strong>?</div>`;
  }
  html += `<div class="grid grid-cols-1 gap-2">`;
  q.options.forEach((opt,i)=>{ html += `<button class="dailyOpt px-4 py-3 rounded-2xl bg-sky-50 hover:bg-sky-100 border border-sky-100 text-left font-bold" data-code="${opt.code}">${i+1}) ${opt.nameES}</button>`; });
  html += `</div>`;
  container.innerHTML = html;

  $$(".dailyOpt").forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const chosenCode = btn.dataset.code;
      const correct = (chosenCode === q.correct.code);
      const challenges = lsGet(LS.challenge, {});
      challenges[todayStr()] = { name: playerName||'Anónimo', correct, score: correct? 10: 0 };
      lsSet(LS.challenge, challenges);

      $$(".dailyOpt").forEach((b)=>{
        b.classList.remove("bg-sky-50","hover:bg-sky-100","border-sky-100");
        const isCorrect = b.dataset.code === q.correct.code;
        if(isCorrect){ b.classList.add("bg-emerald-100","border-emerald-300","text-emerald-900"); }
        else if (b === btn){ b.classList.add("bg-rose-100","border-rose-300","text-rose-900"); }
        else { b.classList.add("bg-slate-50","border-slate-200","text-slate-500"); }
        b.disabled = true;
      });

      $("#dailyPrize").classList.remove("hidden");
      $("#dailyEmoji").textContent = correct ? "⭐" : "💩";
      if(correct){ launchConfetti(); playCoin(); } else { playBuzzer(); }
      updateDailyTile();
    });
  });
}

// ===== UI refs =====
const ui = {
  playerInput: $('#playerName'),
  uiPlayer: $('#uiPlayer'),
  modeLabel: $('#modeLabel'),
  levelLabel: $('#levelLabel'),
  qNumber: $('#qNumber'),
  points: $('#points'),
  hits: $('#hits'),
  misses: $('#misses'),
  progressBar: $('#progressBar'),
  flagImg: $('#flagImg'),
  capitalName: $('#capitalName'),
  flagImgReveal: $('#flagImgReveal'),
  countryReveal: $('#countryReveal'),
  btnsFlag: $$("#card-flag .answer-btn"),
  btnsCap: $$("#card-capital .answer-btn.cap"),
  timeLeft: $('#timeLeft'),
  timeBar: $('#timeBar'),
  finalPoints: $('#finalPoints'),
  finalHits: $('#finalHits'),
  finalMisses: $('#finalMisses'),
};

// ===== Temporizador con pausa =====
function startTimer(tRemain){
  clearInterval(timeInterval);
  const total = (typeof tRemain === 'number') ? tRemain : LEVELS[currentLevel].time;
  timeLeft = total;
  ui.timeLeft.textContent = Math.ceil(timeLeft);
  ui.timeBar.style.width = "100%";
  qActiveStartMs = Date.now();
  paused = false;

  timeInterval = setInterval(()=>{
    const elapsed = (Date.now()-qActiveStartMs)/1000;
    const remain = Math.max(0, total - elapsed);
    timeLeft = remain;
    ui.timeLeft.textContent = Math.ceil(remain);
    ui.timeBar.style.width = Math.max(0,(remain/LEVELS[currentLevel].time)*100) + "%";
    if (remain <= 0){
      clearInterval(timeInterval);
      handleTimeout();
    }
  }, 100);
}
function stopTimer(){ clearInterval(timeInterval); }
function pauseGame(){
  if (paused) return;
  paused = true;
  qAccumulatedMs += (Date.now() - qActiveStartMs);
  stopTimer();
  disableAnswers(true);
  $("#pauseModal").showModal();
}
function resumeGame(){
  if (!paused) return;
  paused = false;
  qActiveStartMs = Date.now();
  startTimer(timeLeft);
  disableAnswers(false);
  $("#pauseModal").close();
}
function disableAnswers(disabled){
  ui.btnsFlag.forEach(b=> b.disabled = disabled);
  ui.btnsCap.forEach(b=> b.disabled = disabled);
}

// ===== Juego =====
function pickOptions(correct, pool, n=4){
  const others = pool.filter(x=>x.code!==correct.code);
  shuffle(others);
  const fill = others.slice(0, Math.max(0, n-1));
  while (fill.length < n-1){
    const cand = ALL[randomInt(ALL.length)];
    if (cand && cand.code!==correct.code && !fill.some(o=>o.code===cand.code)) fill.push(cand);
  }
  return shuffle([correct, ...fill]);
}

function newGame(){
  const pool = [...ALL].filter(x => x.code && x.nameES);
  shuffle(pool);
  order = [];
  const withCapital = pool.filter(x => x.capitalES && x.capitalES.trim().length);

  for (let i=0; i<MAX_Q; i++){
    if (currentMode === 'flags')      order.push({ kind:'flag',    item: pool[i % pool.length] });
    else if (currentMode === 'capitals') order.push({ kind:'capital', item: withCapital[i % withCapital.length] || pool[i % pool.length] });
    else {
      const kind = (Math.random()<0.5 && withCapital.length) ? 'capital' : 'flag';
      const base = (kind==='capital') ? (withCapital.length?withCapital:pool) : pool;
      order.push({ kind, item: base[i % base.length] });
    }
  }

  optionsPool = pool;
  idx = 0; score = 0; hits = 0; misses = 0; locked = false;
  timesMs = []; missMap = {};
  qAccumulatedMs = 0; paused = false;
  ui.points.textContent = score; ui.hits.textContent = hits; ui.misses.textContent = misses;
  ui.qNumber.textContent = 1; ui.progressBar.style.width = "0%";
  ui.modeLabel.textContent = currentMode==='flags'? 'Banderas' : currentMode==='capitals'? 'Capitales' : 'Mixto';
  ui.levelLabel.textContent = LEVELS[currentLevel].label;
  ui.uiPlayer.textContent = playerName || 'Anónimo';

  // persistir última selección
  lsSet(LS.last, { mode: currentMode, level: currentLevel });

  renderQuestion();
  showScreen('game');
}

function renderQuestion(){
  const q = order[idx];
  ui.flagImgReveal.classList.add('hidden');
  ui.countryReveal.classList.add('hidden');
  qAccumulatedMs = 0;

  if (q.kind === 'flag'){
    $("#card-flag").classList.remove('hidden');
    $("#card-capital").classList.add('hidden');

    const url = flagUrl(q.item.code);
    ui.flagImg.src = url; // simple, el navegador cachea
    ui.flagImg.alt = `Bandera de ${q.item.nameES}`;

    const options = pickOptions(q.item, optionsPool, 4);
    ui.btnsFlag.forEach((btn, i)=>{
      btn.textContent = options[i].nameES;
      btn.dataset.correct = (options[i].code === q.item.code) ? "1" : "0";
      btn.disabled = false;
      btn.className = "answer-btn px-4 py-3 rounded-2xl bg-sky-50 hover:bg-sky-100 border border-sky-100 text-left font-bold";
    });

  } else {
    $("#card-flag").classList.add('hidden');
    $("#card-capital").classList.remove('hidden');

    ui.capitalName.textContent = q.item.capitalES || "—";
    ui.flagImgReveal.src = flagUrl(q.item.code);
    ui.countryReveal.textContent = `Es ${q.item.nameES}`;

    const base = optionsPool.filter(x=>x.capitalES && x.capitalES.trim().length);
    const options = pickOptions(q.item, base.length?base:optionsPool, 4);

    ui.btnsCap.forEach((btn, i)=>{
      btn.textContent = options[i].nameES;
      btn.dataset.correct = (options[i].code === q.item.code) ? "1" : "0";
      btn.disabled = false;
      btn.className = "answer-btn cap px-4 py-3 rounded-2xl bg-sky-50 hover:bg-sky-100 border border-sky-100 text-left font-bold";
    });
  }

  locked = false;
  ui.qNumber.textContent = idx + 1;
  startTimer();
}

function handleTimeout(){
  if (locked) return;
  locked = true;
  qAccumulatedMs += (Date.now() - qActiveStartMs);
  timesMs.push(qAccumulatedMs);

  const q = order[idx];
  if(!missMap[q.item.code]) missMap[q.item.code] = {name: q.item.nameES, attempts:0, wrong:0};
  missMap[q.item.code].attempts += 1;
  missMap[q.item.code].wrong += 1;

  const { wrongPenalty } = LEVELS[currentLevel];
  if (wrongPenalty < 0) score = Math.max(0, score + wrongPenalty);
  misses += 1;
  ui.points.textContent = score; ui.misses.textContent = misses;

  if (q.kind === 'flag') markButtons(ui.btnsFlag, null); else { ui.flagImgReveal.classList.remove('hidden'); ui.countryReveal.classList.remove('hidden'); markButtons(ui.btnsCap, null); }
  advanceProgress();
  playBuzzer();
  scheduleNext();
}

function markButtons(buttons, targetBtn){
  buttons.forEach(btn=>{
    const isCorrect = btn.dataset.correct === "1";
    const clsBase = ["bg-sky-50","hover:bg-sky-100","border-sky-100"];
    btn.classList.remove(...clsBase);
    if (btn === targetBtn){
      if (isCorrect) btn.classList.add("bg-emerald-100","border-emerald-300","text-emerald-900");
      else btn.classList.add("bg-rose-100","border-rose-300","text-rose-900");
    } else if (isCorrect){ btn.classList.add("bg-emerald-100","border-emerald-300","text-emerald-900"); }
    else { btn.classList.add("bg-slate-50","border-slate-200","text-slate-500"); }
    btn.disabled = true;
  });
}

function onSelect(e){
  if (locked || paused) return;
  locked = true;
  qAccumulatedMs += (Date.now() - qActiveStartMs);
  stopTimer();

  const btn = e.currentTarget;
  const correct = btn.dataset.correct === "1";
  const q = order[idx];
  if(!missMap[q.item.code]) missMap[q.item.code] = {name: q.item.nameES, attempts:0, wrong:0};
  missMap[q.item.code].attempts += 1;

  if (q.kind === 'flag'){
    if (correct){ score += 10; hits += 1; launchConfetti(); playCoin(); }
    else { misses += 1; missMap[q.item.code].wrong += 1; if (LEVELS[currentLevel].wrongPenalty < 0) score = Math.max(0, score + LEVELS[currentLevel].wrongPenalty); playBuzzer(); }
    ui.points.textContent = score; ui.hits.textContent = hits; ui.misses.textContent = misses;
    markButtons(ui.btnsFlag, btn);
  } else {
    if (correct){ score += 10; hits += 1; launchConfetti(); playCoin(); }
    else { misses += 1; missMap[q.item.code].wrong += 1; if (LEVELS[currentLevel].wrongPenalty < 0) score = Math.max(0, score + LEVELS[currentLevel].wrongPenalty); playBuzzer(); }
    ui.points.textContent = score; ui.hits.textContent = hits; ui.misses.textContent = misses;
    ui.flagImgReveal.classList.remove('hidden');
    ui.countryReveal.classList.remove('hidden');
    markButtons(ui.btnsCap, btn);
  }
  timesMs.push(qAccumulatedMs);
  advanceProgress();
  scheduleNext();
}

function advanceProgress(){ ui.progressBar.style.width = (((idx + 1) / MAX_Q) * 100) + "%"; }
function scheduleNext(){ if(nextTimer){ clearTimeout(nextTimer); } nextTimer = setTimeout(nextQuestion, 800); }
function nextQuestion(){ if (idx < MAX_Q - 1){ idx++; renderQuestion(); } else { endGame(); } }

function endGame(){
  stopTimer(); if(nextTimer){ clearTimeout(nextTimer); nextTimer=null; }
  ui.finalPoints.textContent = score;
  ui.finalHits.textContent = hits;
  ui.finalMisses.textContent = misses;
  showScreen('final');

  const durationMs = timesMs.reduce((a,b)=>a+b,0);
  recordGameToLeague({name: playerName||'Anónimo', score, mode: ui.modeLabel.textContent, level: currentLevel, durationMs});
  updateGlobalStatsFromRun();
}

// ===== Eventos navegación =====
$("#goToMode").addEventListener('click', ()=>{
  playerName = ui.playerInput.value.trim() || 'Anónimo';
  lsSet(LS.name, playerName);
  $("#leagueName").value = playerName;
  showScreen('mode');
});
$("#backToPlayer").addEventListener('click', ()=> showScreen('player'));

// Selección de modo
$$(".mode-btn").forEach(b=>{
  b.addEventListener('click', ()=>{
    const m = b.dataset.mode;
    if(m === 'daily'){ renderDailyModal(); $("#dailyModal").showModal(); return; }
    currentMode = m;
    $$(".mode-btn").forEach(x=>x.classList.remove("ring-2","ring-emerald-400"));
    b.classList.add("ring-2","ring-emerald-400");
  });
});

$("#toLevel").addEventListener('click', ()=>{ if(!currentMode || currentMode==='daily') return; showScreen('level'); });

$$(".level-btn").forEach(b=>{
  b.addEventListener('click', ()=>{
    currentLevel = b.dataset.level;
    $$(".level-btn").forEach(x=>x.classList.remove("ring-2","ring-emerald-400"));
    b.classList.add("ring-2","ring-emerald-400");
  });
});
$("#backToMode").addEventListener('click', ()=> showScreen('mode'));
$("#goToGame").addEventListener('click', ()=>{ try { audioCtx.resume(); } catch {} newGame(); });

// Botones juego
$("#restartBtn").addEventListener('click', ()=>{ stopTimer(); if(nextTimer){ clearTimeout(nextTimer); nextTimer=null; } newGame(); });
$("#restartBtn2").addEventListener('click', ()=>{ stopTimer(); if(nextTimer){ clearTimeout(nextTimer); nextTimer=null; } newGame(); });

// Salir
$("#exitBtn").addEventListener('click', ()=>{ stopTimer(); if(nextTimer){ clearTimeout(nextTimer); nextTimer=null; } showScreen('mode'); });
$("#exitBtn2").addEventListener('click', ()=>{ stopTimer(); if(nextTimer){ clearTimeout(nextTimer); nextTimer=null; } showScreen('mode'); });

// Pausa
$("#pauseBtn").addEventListener('click', ()=>{ pauseGame(); });
$("#pauseBtn2").addEventListener('click', ()=>{ pauseGame(); });
$("#resumeBtn").addEventListener('click', ()=>{ resumeGame(); });
$("#pauseExitBtn").addEventListener('click', ()=>{ paused=false; stopTimer(); if(nextTimer){ clearTimeout(nextTimer); nextTimer=null; } $("#pauseModal").close(); showScreen('mode'); });

document.addEventListener('keydown', (e)=>{
  if($("#pauseModal").open){
    if(e.key==='Escape') { $("#pauseModal").close(); resumeGame(); }
    return;
  }
  if(screens.game.classList.contains('active')){
    if(['1','2','3','4'].includes(e.key)){
      const idx = parseInt(e.key,10)-1;
      const pool = $("#card-flag").classList.contains('hidden') ? ui.btnsCap : ui.btnsFlag;
      if(pool[idx] && !pool[idx].disabled) pool[idx].click();
    }
    if(e.key.toLowerCase()==='p') pauseGame();
  }
});

// Final
$("#playAgainBtn").addEventListener('click', ()=>{ newGame(); });
$("#goHomeBtn").addEventListener('click', ()=>{ stopTimer(); if(nextTimer){ clearTimeout(nextTimer); nextTimer=null; } showScreen('mode'); });
$("#shareResult").addEventListener('click', ()=>{
  const text = `🏆 ${playerName} · ${ui.modeLabel.textContent} (${LEVELS[currentLevel].label}) · ${score} puntos · ${isoWeekStringLocal()}`;
  if (navigator.share) navigator.share({text}).catch(()=>{ navigator.clipboard.writeText(text); alert("Copiado al portapapeles"); });
  else { navigator.clipboard.writeText(text); alert("Copiado al portapapeles"); }
});

// Modales
$("#helpBtn").addEventListener('click', ()=> $("#helpModal").showModal());
$("#closeHelp").addEventListener('click', ()=> $("#helpModal").close());

// Liga
$("#btnLeague").addEventListener('click', ()=>{ renderLeague(); $("#leagueModal").showModal(); });
$("#closeLeague").addEventListener('click', ()=> $("#leagueModal").close());
$("#saveLeagueName").addEventListener('click', ()=>{
  const n = $("#leagueName").value.trim();
  if(n){ playerName = n; lsSet(LS.name, playerName); $("#uiPlayer").textContent = playerName; }
});
$("#resetLeague").addEventListener('click', ()=>{
  if(confirm("¿Seguro que quieres borrar ranking y estadísticas locales?")){
    localStorage.removeItem(LS.scores); localStorage.removeItem(LS.stats); renderLeague();
  }
});

// Estadísticas
$("#btnStats").addEventListener('click', ()=>{ renderStats('overview'); $("#statsModal").showModal(); setActiveTab('overview'); });
$("#closeStats").addEventListener('click', ()=> $("#statsModal").close());
$$("#statsModal .tab-btn").forEach(btn=>{ btn.addEventListener('click', ()=>{ setActiveTab(btn.dataset.tab); renderStats(btn.dataset.tab); }); });
function setActiveTab(tab){ $$("#statsModal .tab-btn").forEach(b=> b.classList.remove('active')); $(`#statsModal .tab-btn[data-tab="${tab}"]`).classList.add('active'); }

// Reto del día
$("#closeDaily").addEventListener('click', ()=> $("#dailyModal").close());

// ===== Carga inicial =====
async function ensureDataLoaded(){ if(!ALL.length) await loadData(); }
window.addEventListener('DOMContentLoaded', async ()=>{
  playerName = lsGet(LS.name, "") || "";
  if(playerName) $("#playerName").value = playerName;
  const last = lsGet(LS.last, null);
  if(last){ currentMode = last.mode; currentLevel = last.level || 'adult'; }
  await ensureDataLoaded();
  updateDailyTile();
  if (window.innerWidth >= 640) setTimeout(()=>$("#helpModal").showModal(), 400);
});

// Asignar handlers a respuestas
$$("#card-flag .answer-btn").forEach(b=> b.addEventListener('click', onSelect));
$$("#card-capital .answer-btn.cap").forEach(b=> b.addEventListener('click', onSelect));
