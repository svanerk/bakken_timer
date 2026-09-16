const { createClient } = window.supabase;

const config = window.APP_CONFIG || {};
const supabaseConfigured =
  config.SUPABASE_URL &&
  config.SUPABASE_ANON_KEY &&
  !config.SUPABASE_URL.includes("JOUW-PROJECT") &&
  !config.SUPABASE_ANON_KEY.includes("JOUW-PUBLISHABLE");

const db = supabaseConfigured
  ? createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY)
  : null;

// Pas hier de zes namen en kleuren aan.
let PEOPLE = [];

const homeScreen = document.querySelector("#homeScreen");
const timerScreen = document.querySelector("#timerScreen");
const scoreboardScreen = document.querySelector("#scoreboardScreen");
const peopleGrid = document.querySelector("#peopleGrid");
const selectedPersonEl = document.querySelector("#selectedPerson");
const timerEl = document.querySelector("#timer");
const timerBtn = document.querySelector("#timerBtn");
const timerStatus = document.querySelector("#timerStatus");
const scoreboardEl = document.querySelector("#scoreboard");
const scoreboardStatus = document.querySelector("#scoreboardStatus");
const errorBanner = document.querySelector("#errorBanner");

let selectedPerson = null;
let running = false;
let startTime = null;
let animationFrame = null;

function showError(message) {
  errorBanner.textContent = message;
  errorBanner.classList.remove("hidden");
  setTimeout(() => errorBanner.classList.add("hidden"), 5000);
}

async function loadPeople() {
  if (!db) {
    showError("Supabase is niet ingesteld.");
    return;
  }

  const { data, error } = await db
    .from("people")
    .select("id, name, colour")
    .order("id");

  if (error) {
    console.error(error);
    showError("De personen konden niet worden geladen.");
    return;
  }

  PEOPLE = data;
  renderPeople();
}

function renderPeople() {
  peopleGrid.innerHTML = "";

  PEOPLE.forEach(person => {
    const button = document.createElement("button");
    button.className = "person-button";
    button.style.background = person.colour;
    button.textContent = person.name;
    button.addEventListener("click", () => selectPerson(person));
    peopleGrid.appendChild(button);
  });
}
function selectPerson(person) {
  selectedPerson = person;
  selectedPersonEl.textContent = person.name;
  timerEl.textContent = "0.00";
  timerBtn.textContent = "START";
  timerBtn.classList.remove("running");
  timerStatus.textContent = "";
  running = false;
  startTime = null;

  homeScreen.classList.add("hidden");
  scoreboardScreen.classList.add("hidden");
  timerScreen.classList.remove("hidden");
}

function updateTimer() {
  if (!running) return;

  const elapsed = performance.now() - startTime;
  timerEl.textContent = (elapsed / 1000).toFixed(2);
  animationFrame = requestAnimationFrame(updateTimer);
}

function startTimer() {
  running = true;
  startTime = performance.now();
  timerBtn.textContent = "STOP";
  timerBtn.classList.add("running");
  timerStatus.textContent = "";
  updateTimer();
}

async function stopTimer() {
  running = false;
  cancelAnimationFrame(animationFrame);

  const elapsedMs = Math.round(performance.now() - startTime);
  timerEl.textContent = (elapsedMs / 1000).toFixed(2);
  timerBtn.textContent = "START";
  timerBtn.classList.remove("running");

  await saveAttempt(elapsedMs);
}

async function saveAttempt(timeMs) {
  if (!db) {
    timerStatus.textContent = "Demo-modus: Supabase is nog niet ingesteld.";
    return;
  }

  timerStatus.textContent = "Tijd opslaan…";

  const { error } = await db
    .from("attempts")
    .insert({
      person_id: selectedPerson.id,
      time_ms: timeMs
    });

  if (error) {
    console.error(error);
    timerStatus.textContent = "Opslaan mislukt.";
    showError("De tijd kon niet worden opgeslagen. Controleer je Supabase-configuratie.");
    return;
  }

  timerStatus.textContent = "Opgeslagen!";
}

function showHome() {
  running = false;
  cancelAnimationFrame(animationFrame);
  timerScreen.classList.add("hidden");
  scoreboardScreen.classList.add("hidden");
  homeScreen.classList.remove("hidden");
}

async function showScoreboard() {
  timerScreen.classList.add("hidden");
  homeScreen.classList.add("hidden");
  scoreboardScreen.classList.remove("hidden");

  scoreboardEl.innerHTML = "";
  scoreboardStatus.textContent = "Scoreboard laden…";

  if (!db) {
    renderDemoScoreboard();
    return;
  }

  const { data, error } = await db
    .from("best_times")
    .select("person_id, person_name, colour, best_time_ms")
    .order("best_time_ms", { ascending: true });

  if (error) {
    console.error(error);
    scoreboardStatus.textContent = "Kon scoreboard niet laden.";
    showError("Het scoreboard kon niet worden geladen.");
    return;
  }

  scoreboardStatus.textContent = "";
  renderScoreboard(data || []);
}

function renderScoreboard(rows) {
  scoreboardEl.innerHTML = "";

  const known = new Map(PEOPLE.map(p => [p.id, p]));
  const sorted = [...rows].sort((a, b) => a.best_time_ms - b.best_time_ms);

  if (sorted.length === 0) {
    scoreboardStatus.textContent = "Nog geen tijden geregistreerd.";
    return;
  }

  sorted.forEach((row, index) => {
    const person = known.get(row.person_id);
    const name = person?.name || row.person_name || row.person_id;

    const div = document.createElement("div");
    div.className = "score-row";

    const rank = document.createElement("div");
    rank.className = "rank";
    rank.textContent = `${index + 1}.`;

    const player = document.createElement("div");
    player.className = "player-name";
    player.textContent = name;

    const time = document.createElement("div");
    time.className = "best-time";
    time.textContent = `${(row.best_time_ms / 1000).toFixed(2)} s`;

    div.append(rank, player, time);
    scoreboardEl.appendChild(div);
  });
}

function renderDemoScoreboard() {
  scoreboardStatus.textContent = "Demo-modus — verbind Supabase om echte tijden te zien.";

  const demo = PEOPLE.map((p, i) => ({
    person_id: p.id,
    person_name: p.name,
    best_time_ms: 7500 + i * 800
  }));

  renderScoreboard(demo);
  scoreboardStatus.textContent = "Demo-modus — verbind Supabase om echte tijden te zien.";
}

timerBtn.addEventListener("click", () => {
  if (!selectedPerson) return;
  if (running) stopTimer();
  else startTimer();
});

document.querySelector("#backBtn").addEventListener("click", showHome);
document.querySelector("#scoreboardBtn").addEventListener("click", showScoreboard);
document.querySelector("#closeScoreboardBtn").addEventListener("click", showHome);

loadPeople();
