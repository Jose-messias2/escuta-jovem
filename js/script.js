let mood = null;
let emoji = null;
let chips = [];

let currentDiaryPhoto = "";
let editingEntryId = null;

let breathing = false;
let breathingCycle = 0;
let breathingStep = 0;
let breathingInterval;

let paintColor = "#8c4cff";
let puzzleExpected = 1;
let firstCard = null;
let lockMemory = false;

const breathingSteps = [
  {
    text: "🌬️ Inspire lentamente",
    instruction: "Puxe o ar pelo nariz por 4 segundos.",
    time: 4,
    color: "#45c8ff"
  },
  {
    text: "🫁 Segure o ar",
    instruction: "Segure o ar com calma por 4 segundos.",
    time: 4,
    color: "#ffd84d"
  },
  {
    text: "😮‍💨 Solte lentamente",
    instruction: "Solte o ar devagar pela boca por 6 segundos.",
    time: 6,
    color: "#8c4cff"
  }
];

const sounds = {
  rain: new Audio("./sons/chuva.mp3"),
  ocean: new Audio("./sons/oceano.mp3"),
  forest: new Audio("./sons/floresta.mp3"),
  fire: new Audio("./sons/fogueira.mp3")
};

Object.values(sounds).forEach(sound => {
  sound.loop = true;
  sound.volume = 0.55;
});

Object.values(sounds).forEach(sound => {
  sound.loop = true;
  sound.volume = 0.55;
});

function getData(key){
  try{
    return JSON.parse(localStorage.getItem(key)) || [];
  }catch(error){
    return [];
  }
}

function setData(key, value){
  localStorage.setItem(key, JSON.stringify(value));
}

function entries(){
  return getData("entries");
}

function saveEntries(data){
  setData("entries", data);
}

function openScreen(id){
    document.querySelectorAll("video").forEach(video => {
    video.pause();
  });
  document.querySelectorAll(".screen").forEach(screen => {
    screen.classList.remove("active");
  });

  const selected = document.getElementById(id);

  if(selected){
    selected.classList.add("active");
  }

  if(id === "diario"){
    renderHistory();
    renderInsights();
    renderVault();
    updateStreak();
  }

  if(id === "desafio"){
    renderBreathing();
  }

  if(window.lucide){
    lucide.createIcons();
  }
}

function tab(id, button){
  document.querySelectorAll(".tab").forEach(item => {
    item.classList.remove("active");
  });

  document.querySelectorAll(".tabs button").forEach(btn => {
    btn.classList.remove("active");
  });

  const selected = document.getElementById(id);

  if(selected){
    selected.classList.add("active");
  }

  if(button){
    button.classList.add("active");
  }

  renderHistory();
  renderInsights();
  renderVault();
}

function selectMood(button, selectedMood, selectedEmoji){
  mood = selectedMood;
  emoji = selectedEmoji;

  document.querySelectorAll(".moods button").forEach(btn => {
    btn.classList.remove("active");
  });

  button.classList.add("active");
}

function toggleChip(button, value){
  button.classList.toggle("active");

  if(chips.includes(value)){
    chips = chips.filter(chip => chip !== value);
  }else{
    chips.push(value);
  }
}

function countChars(){
  const textArea = document.getElementById("diaryText");
  const counter = document.getElementById("counter");

  if(textArea && counter){
    counter.textContent = textArea.value.length + "/1000";
  }
}

function saveDiary(){

  if(!mood){

    toast("Escolha uma emoção antes de salvar.");

    return;
  }

  const titleInput =
    document.getElementById("diaryTitle");

  const textInput =
    document.getElementById("diaryText");

  const title =
    titleInput ? titleInput.value.trim() : "";

  const text =
    textInput ? textInput.value.trim() : "";

  let data = entries();

  const entryData = {

    id: editingEntryId || Date.now(),

    title: title || mood,

    mood,

    emoji: getMoodEmoji(mood),

    chips,

    text,

    photo: currentDiaryPhoto,

    date: new Date().toLocaleDateString("pt-BR"),

    time: new Date().toLocaleTimeString(
      "pt-BR",
      {
        hour:"2-digit",
        minute:"2-digit"
      }
    )
  };

  if(editingEntryId){

    data = data.map(item => {

      if(item.id === editingEntryId){

        return {

          ...item,

          title: entryData.title,

          mood: entryData.mood,

          emoji: entryData.emoji,

          chips: entryData.chips,

          text: entryData.text,

          photo:
            entryData.photo || item.photo
        };
      }

      return item;
    });

    toast("Entrada editada.");

  }else{

    data.unshift(entryData);

    toast("Diário salvo.");
  }

  saveEntries(data);

  const saveMsg =
    document.getElementById("saveMsg");

  const homeMood =
    document.getElementById("homeMood");

  const counter =
    document.getElementById("counter");

  const photoInput =
    document.getElementById("diaryPhoto");

  const preview =
    document.getElementById(
      "diaryPhotoPreview"
    );

  if(saveMsg){

    saveMsg.style.display = "block";

    saveMsg.textContent =
      "Registro salvo com carinho 💜";
  }

  if(homeMood){

    homeMood.textContent =
      `${entryData.emoji} ${mood}`;
  }

  if(titleInput) titleInput.value = "";

  if(textInput) textInput.value = "";

  if(counter) counter.textContent = "0/1000";

  if(photoInput) photoInput.value = "";

  if(preview){

    preview.src = "";

    preview.style.display = "none";
  }

  mood = null;

  emoji = null;

  chips = [];

  currentDiaryPhoto = "";

  editingEntryId = null;

  document
    .querySelectorAll(".moods button, .chips button")
    .forEach(btn => {

      btn.classList.remove("active");
    });

  renderHistory();

  renderInsights();

  updateStreak();
}
let currentDiaryFilter = "Todos";

function filterDiary(filter, button){
  currentDiaryFilter = filter;

  document.querySelectorAll(".filter-option").forEach(btn => {
    btn.classList.remove("active");
  });

  if(button){
    button.classList.add("active");
  }

  renderHistory();
}

function renderHistory(){
  const history = document.getElementById("history");
  if(!history) return;

  const data = entries();

  const searchInput = document.getElementById("diarySearch");
  const search = searchInput ? searchInput.value.toLowerCase() : "";

  updateDiaryCounters(data);
  renderDiaryCalendar(data);

  let filtered = data;

  if(currentDiaryFilter !== "Todos"){
    filtered = filtered.filter(item => item.mood === currentDiaryFilter);
  }

  if(search){
    filtered = filtered.filter(item => {
      const title = item.title || "";
      const text = item.text || "";
      const mood = item.mood || "";

      return (
        title.toLowerCase().includes(search) ||
        text.toLowerCase().includes(search) ||
        mood.toLowerCase().includes(search)
      );
    });
  }

  if(filtered.length === 0){
    history.innerHTML = `
      <div class="empty-history">
        <h3>📝 Nenhuma entrada encontrada</h3>
        <p>Quando você salvar registros no diário, eles aparecerão aqui.</p>
      </div>
    `;
    return;
  }

  history.innerHTML = filtered.map(item => `
    <div class="history-pro-card ${item.photo ? "has-photo" : ""}">

      <div class="history-emoji">
        ${item.emoji || getMoodEmoji(item.mood)}
      </div>

      <div class="history-content">
        <small>${item.date} • ${item.time}</small>

        <h3>${item.title || item.mood || "Entrada do diário"}</h3>

        <p>${item.text || "Sem texto."}</p>

        <div class="history-tags">
          ${(item.chips || []).map(chip => `<span>${chip}</span>`).join("")}
        </div>

        <div class="history-actions">
          <button class="edit-small-btn" onclick="editEntry(${item.id})">
            Editar
          </button>

          <button class="delete-small-btn" onclick="deleteEntry(${item.id})">
            Excluir
          </button>
        </div>
      </div>

      <div class="history-thumb">
        ${
          item.photo
          ? `<img src="${item.photo}" alt="Foto da entrada">`
          : getMoodImage(item.mood)
        }
      </div>

    </div>
  `).join("");
}

function updateDiaryCounters(data){
  const total = document.getElementById("diaryTotal");
  if(total){
    total.textContent = data.length;
  }

  const counts = {
    "Todos": data.length,
    "Muito feliz": 0,
    "Feliz": 0,
    "Neutro": 0,
    "Triste": 0,
    "Muito triste": 0
  };

  data.forEach(item => {
    if(counts[item.mood] !== undefined){
      counts[item.mood]++;
    }
  });

  const ids = {
    "Todos": "countTodos",
    "Muito feliz": "countMuitoFeliz",
    "Feliz": "countFeliz",
    "Neutro": "countNeutro",
    "Triste": "countTriste",
    "Muito triste": "countMuitoTriste"
  };

  Object.keys(ids).forEach(key => {
    const element = document.getElementById(ids[key]);
    if(element){
      element.textContent = counts[key];
    }
  });
}

function renderDiaryCalendar(data){
  const calendar = document.getElementById("diaryCalendar");
  if(!calendar) return;

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  const monthNames = [
    "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
    "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"
  ];

  const daysOfWeek = ["D","S","T","Q","Q","S","S"];

  const firstDay = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();

  const daysWithEntry = data.map(item => item.date);

  let html = `
    <div class="calendar-title">${monthNames[month]} ${year}</div>
    <div class="calendar-days">
      ${daysOfWeek.map(day => `<div class="calendar-day-name">${day}</div>`).join("")}
  `;

  for(let i = 0; i < firstDay; i++){
    html += `<div></div>`;
  }

  for(let day = 1; day <= lastDate; day++){
    const dateString = String(day).padStart(2,"0") + "/" +
      String(month + 1).padStart(2,"0") + "/" +
      year;

    const hasEntry = daysWithEntry.includes(dateString);
    const isToday = day === today.getDate();

    html += `
      <div class="calendar-day ${hasEntry ? "has-entry" : ""} ${isToday ? "today" : ""}">
        ${day}
      </div>
    `;
  }

  html += `</div>`;

  calendar.innerHTML = html;
}

function getMoodImage(mood){
  const images = {
    "Muito feliz": "🌅",
    "Feliz": "🏡",
    "Neutro": "🌙",
    "Triste": "🌧️",
    "Muito triste": "⛈️"
  };

  return images[mood] || "✨";
}

function renderInsights(){
  const total = document.getElementById("totalEntries");
  const stats = document.getElementById("stats");

  if(!total || !stats) return;

  const data = entries();

  total.textContent = data.length;

  const moodCount = {};

  data.forEach(item => {
    moodCount[item.mood] = (moodCount[item.mood] || 0) + 1;
  });

  if(data.length === 0){
    stats.innerHTML = "<p>Nenhum dado ainda.</p>";
    return;
  }

  stats.innerHTML = Object.entries(moodCount)
    .map(([key,value]) => `<p>${key}: ${value}</p>`)
    .join("");
}

function updateStreak(){

  const streakElement = document.getElementById("streak");

  if(!streakElement) return;

  const data = entries();

  if(data.length === 0){
    streakElement.textContent = 0;
    return;
  }

  const uniqueDays = [];

  data.forEach(item => {

    if(!uniqueDays.includes(item.date)){
      uniqueDays.push(item.date);
    }

  });

  uniqueDays.sort((a,b) => {

    const [da,ma,aa] = a.split("/");
    const [db,mb,ab] = b.split("/");

    return new Date(`${ab}-${mb}-${db}`) -
           new Date(`${aa}-${ma}-${da}`);

  });

  let streak = 1;

  for(let i = 0; i < uniqueDays.length - 1; i++){

    const current = uniqueDays[i];
    const next = uniqueDays[i + 1];

    const [d1,m1,y1] = current.split("/");
    const [d2,m2,y2] = next.split("/");

    const date1 = new Date(`${y1}-${m1}-${d1}`);
    const date2 = new Date(`${y2}-${m2}-${d2}`);

    const diff =
      (date1 - date2) / (1000 * 60 * 60 * 24);

    if(diff === 1){
      streak++;
    }else{
      break;
    }

  }

  streakElement.textContent = streak;
}

function createVaultPassword(){
  const input = document.getElementById("newVaultPassword");
  const password = input ? input.value.trim() : "";

  if(password.length < 4){
    toast("A senha precisa ter pelo menos 4 caracteres.");
    return;
  }

  localStorage.setItem("vaultPassword", password);

  input.value = "";

  toast("Senha criada com sucesso 🔒");

  renderVault();
}

function unlockVault(){
  const input = document.getElementById("vaultPassword");
  const password = input ? input.value.trim() : "";
  const saved = localStorage.getItem("vaultPassword");

  if(!saved){
    toast("Crie uma senha primeiro.");
    return;
  }

  if(password === saved){
    const area = document.getElementById("vaultArea");

    if(area){
      area.style.display = "block";
    }

    input.value = "";
    toast("Cofre desbloqueado 🔓");
  }else{
    toast("Senha incorreta.");
  }
}

function saveVault(){
  const input = document.getElementById("vaultText");
  const text = input ? input.value.trim() : "";

  if(!text){
    toast("Digite algo para guardar.");
    return;
  }

  const data = getData("vault");

  data.unshift({
    id: Date.now(),
    text,
    date: new Date().toLocaleDateString("pt-BR")
  });

  setData("vault", data);

  input.value = "";

  renderVault();

  toast("Guardado no cofre.");
}

function renderVault(){
  const createBox = document.getElementById("vaultCreate");
  const loginBox = document.getElementById("vaultLoginBox");
  const area = document.getElementById("vaultArea");
  const list = document.getElementById("vaultList");

  if(!createBox || !loginBox || !area || !list){
    return;
  }

  const savedPassword = localStorage.getItem("vaultPassword");

  if(savedPassword){
    createBox.style.display = "none";
    loginBox.style.display = "block";
  }else{
    createBox.style.display = "block";
    loginBox.style.display = "none";
    area.style.display = "none";
  }

  const data = getData("vault");

  list.innerHTML = data.map(item => `
    <div class="history-item">
      <div class="emoji-big">🔒</div>
      <div>
        <h3>Item protegido</h3>
        <p>${item.text}</p>
        <small>${item.date}</small>
      </div>
    </div>
  `).join("");
}

function toggleFaq(button){
  const item = button.parentElement;
  const answer = item.querySelector(".faq-answer");

  item.classList.toggle("active");

  if(answer.style.maxHeight){
    answer.style.maxHeight = null;
  }else{
    answer.style.maxHeight = answer.scrollHeight + "px";
  }
}

function startBreathing(){
  if(breathing) return;

  breathing = true;
  breathingCycle = 0;
  breathingStep = 0;

  const bar = document.getElementById("breathBar");
  const count = document.getElementById("breathCount");

  if(bar) bar.style.width = "0%";
  if(count) count.textContent = "0/3 ciclos completos";

  nextBreathStep();
}

function nextBreathStep(){
  const step = breathingSteps[breathingStep];

  const title = document.getElementById("breathTitle");
  const instruction = document.getElementById("breathInstruction");
  const timer = document.getElementById("breathTimer");
  const circle = document.getElementById("breathCircle");
  const bar = document.getElementById("breathBar");
  const count = document.getElementById("breathCount");

  if(title) title.textContent = step.text;
  if(instruction) instruction.textContent = step.instruction;
  if(circle){
    circle.style.background = step.color;
    circle.style.boxShadow = `0 0 45px ${step.color}`;
  }

  let seconds = step.time;

  if(timer) timer.textContent = seconds + "s";

  breathingInterval = setInterval(() => {
    seconds--;

    if(timer) timer.textContent = seconds + "s";

    if(seconds <= 0){
      clearInterval(breathingInterval);

      breathingStep++;

      if(breathingStep >= breathingSteps.length){
        breathingStep = 0;
        breathingCycle++;

        if(bar) bar.style.width = (breathingCycle / 3) * 100 + "%";
        if(count) count.textContent = `${breathingCycle}/3 ciclos completos`;
      }

      if(breathingCycle >= 3){
        breathing = false;

        if(title) title.textContent = "Respiração concluída 🌿";
        if(instruction) instruction.textContent = "Muito bem. Pequenas pausas também cuidam de você.";
        if(timer) timer.textContent = "Fim";

        toast("Respiração concluída.");
        return;
      }

      nextBreathStep();
    }
  },1000);
}

function renderBreathing(){
  const count = document.getElementById("breathCount");
  const bar = document.getElementById("breathBar");

  if(count){
    count.textContent = `${breathingCycle}/3 ciclos completos`;
  }

  if(bar){
    bar.style.width = (breathingCycle / 3) * 100 + "%";
  }
}

function resetBreathing(){
  clearInterval(breathingInterval);

  breathing = false;
  breathingCycle = 0;
  breathingStep = 0;

  const title = document.getElementById("breathTitle");
  const instruction = document.getElementById("breathInstruction");
  const timer = document.getElementById("breathTimer");
  const count = document.getElementById("breathCount");
  const bar = document.getElementById("breathBar");
  const circle = document.getElementById("breathCircle");

  if(title) title.textContent = "Respire fundo";
  if(instruction) instruction.textContent = "Técnica 4-4-6: inspire, segure e expire.";
  if(timer) timer.textContent = "Pronto";
  if(count) count.textContent = "0/3 ciclos completos";
  if(bar) bar.style.width = "0%";
  if(circle) circle.style.background = "#45c8ff";

  toast("Respiração reiniciada.");
}

function stopSound(){
  Object.values(sounds).forEach(sound => {
    sound.pause();
    sound.currentTime = 0;
  });

  const player = document.getElementById("player");

  if(player){
    player.textContent = "Nenhum som tocando";
  }
}

function playSound(type){
  stopSound();

  const labels = {
    rain:"Chuva suave",
    ocean:"Oceano",
    forest:"Floresta",
    fire:"Fogueira"
  };

  if(!sounds[type]){
    toast("Som não encontrado.");
    return;
  }

  sounds[type].play()
    .then(() => {
      const player = document.getElementById("player");

      if(player){
        player.textContent = "Tocando: " + labels[type];
      }

      toast("Som iniciado.");
    })
    .catch(() => {
      toast("Clique novamente se o navegador bloquear o áudio.");
    });
}

let puzzleState = [];
let emptyIndex = 8;
let selectedColor = "#ff7092";

function openGame(type){
  const area = document.getElementById("gameArea");
  if(!area) return;

  if(type === "puzzle"){
    puzzleState = [1,2,3,4,5,6,7,8,null];
    puzzleState = puzzleState.sort(() => Math.random() - 0.5);
    emptyIndex = puzzleState.indexOf(null);
    renderPuzzle();
  }

  if(type === "memory"){
    firstCard = null;
    lockMemory = false;

    const cards = ["😊","😌","🌿","⭐","😊","😌","🌿","⭐"].sort(() => Math.random() - 0.5);

    area.innerHTML = `
      <div class="player">
        <h2>🃏 Memória</h2>
        <p>Encontre os pares iguais.</p>

        <div class="memory-grid">
          ${cards.map(card => `
            <button data-card="${card}" onclick="flipCard(this)">❔</button>
          `).join("")}
        </div>
      </div>
    `;
  }

  if(type === "paint"){
    area.innerHTML = `
      <div class="player">
        <h2>🎨 Colorir</h2>
        <p>Escolha uma cor e toque no desenho para pintar.</p>

        <div class="color-row">
          <button style="background:#ff7092" onclick="selectPaintColor('#ff7092')"></button>
          <button style="background:#45c8ff" onclick="selectPaintColor('#45c8ff')"></button>
          <button style="background:#8c4cff" onclick="selectPaintColor('#8c4cff')"></button>
          <button style="background:#64e28f" onclick="selectPaintColor('#64e28f')"></button>
          <button style="background:#ffd84d" onclick="selectPaintColor('#ffd84d')"></button>
          <button style="background:#ffffff" onclick="selectPaintColor('#ffffff')"></button>
        </div>

        <div class="drawing-options">
          <button onclick="loadDrawing('./desenhos/cidade.jpg')">Cidade</button>
          <button onclick="loadDrawing('./desenhos/biblioteca.jpg')">Biblioteca</button>
          <button onclick="loadDrawing('./desenhos/quarto.jpg')">Quarto</button>
        </div>

        <div class="coloring-area">
          <img id="drawingImage" src="./desenhos/cidade.jpg">
          <canvas id="paintCanvas"></canvas>
        </div>

        <button class="save" onclick="clearPainting()">Limpar pintura</button>
      </div>
    `;

    setTimeout(setupCanvas,300);
  }
}

function renderPuzzle(){
  const area = document.getElementById("gameArea");

  area.innerHTML = `
    <div class="player">
      <h2>🧩 Quebra-cabeça</h2>
      <p>Toque nas peças ao lado do espaço vazio para mover.</p>

      <div class="slide-puzzle">
        ${puzzleState.map((piece,index) => `
          <button
            class="${piece === null ? 'empty-piece' : ''}"
            onclick="movePuzzlePiece(${index})"
          >
            ${piece === null ? "" : piece}
          </button>
        `).join("")}
      </div>

      <button class="save" onclick="shufflePuzzle()">Embaralhar</button>
    </div>
  `;
}

function movePuzzlePiece(index){
  const sameRow =
    Math.floor(index / 3) === Math.floor(emptyIndex / 3);

  const horizontalMove =
    (index === emptyIndex - 1 || index === emptyIndex + 1) && sameRow;

  const verticalMove =
    index === emptyIndex - 3 || index === emptyIndex + 3;

  if(!horizontalMove && !verticalMove){
    toast("Essa peça não pode mover agora.");
    return;
  }

  puzzleState[emptyIndex] = puzzleState[index];
  puzzleState[index] = null;
  emptyIndex = index;

  renderPuzzle();

  if(JSON.stringify(puzzleState) === JSON.stringify([1,2,3,4,5,6,7,8,null])){
    toast("Quebra-cabeça concluído! 🌟");
  }
}

function shufflePuzzle(){
  puzzleState = [1,2,3,4,5,6,7,8,null].sort(() => Math.random() - 0.5);
  emptyIndex = puzzleState.indexOf(null);
  renderPuzzle();
}

function flipCard(button){
  if(lockMemory || button.classList.contains("matched")){
    return;
  }

  button.textContent = button.dataset.card;

  if(!firstCard){
    firstCard = button;
    return;
  }

  if(firstCard !== button && firstCard.dataset.card === button.dataset.card){
    firstCard.classList.add("matched");
    button.classList.add("matched");
    firstCard = null;

    const all = document.querySelectorAll(".memory-grid button");
    const matched = document.querySelectorAll(".memory-grid button.matched");

    if(all.length === matched.length){
      toast("Memória concluída!");
    }
  }else{
    lockMemory = true;

    setTimeout(() => {
      firstCard.textContent = "❔";
      button.textContent = "❔";
      firstCard = null;
      lockMemory = false;
    },700);
  }
}

function selectPaintColor(color){
  selectedColor = color;
  toast("Cor selecionada.");
}

function loadDrawing(src){
  const img = document.getElementById("drawingImage");

  if(img){
    img.src = src;
  }

  setTimeout(setupCanvas,300);
}

let drawing = false;
let brushSize = 22;

function setBrushSize(value){
  brushSize = value;
  toast("Pincel alterado.");
}

function setupCanvas(){
  const canvas = document.getElementById("paintCanvas");
  const img = document.getElementById("drawingImage");

  if(!canvas || !img) return;

  canvas.width = img.clientWidth;
  canvas.height = img.clientHeight;

  const ctx = canvas.getContext("2d");

  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  function getPosition(event){
    const rect = canvas.getBoundingClientRect();

    let x;
    let y;

    if(event.touches){
      x = event.touches[0].clientX - rect.left;
      y = event.touches[0].clientY - rect.top;
    }else{
      x = event.clientX - rect.left;
      y = event.clientY - rect.top;
    }

    return {x,y};
  }

  function startDraw(event){
    drawing = true;
    const pos = getPosition(event);
    ctx.beginPath();
    ctx.moveTo(pos.x,pos.y);
  }

  function draw(event){
    if(!drawing) return;

    event.preventDefault();

    const pos = getPosition(event);

    ctx.strokeStyle = selectedColor;
    ctx.lineWidth = brushSize;
    ctx.globalAlpha = 0.4;

    ctx.lineTo(pos.x,pos.y);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(pos.x,pos.y);
  }

  function stopDraw(){
    drawing = false;
    ctx.beginPath();
  }

  canvas.onmousedown = startDraw;
  canvas.onmousemove = draw;
  canvas.onmouseup = stopDraw;
  canvas.onmouseleave = stopDraw;

  canvas.ontouchstart = startDraw;
  canvas.ontouchmove = draw;
  canvas.ontouchend = stopDraw;
}

function clearPainting(){
  const canvas = document.getElementById("paintCanvas");

  if(!canvas) return;

  const ctx = canvas.getContext("2d");

  ctx.clearRect(0,0,canvas.width,canvas.height);
}

function toggleTheme(){
  document.body.classList.toggle("light");
  toast("Tema alterado.");
}

function toast(message){
  const toast = document.getElementById("toast");

  if(!toast) return;

  toast.textContent = message;
  toast.style.display = "block";

  setTimeout(() => {
    toast.style.display = "none";
  },2200);
}

document.addEventListener("DOMContentLoaded", () => {
  renderHistory();
  renderInsights();
  renderVault();
  updateStreak();
  renderBreathing();

  if(window.lucide){
    lucide.createIcons();
  }
});
function previewDiaryPhoto(event){

  const file = event.target.files[0];

  if(!file) return;

  const reader = new FileReader();

  reader.onload = function(){

    currentDiaryPhoto = reader.result;

    const preview =
      document.getElementById("diaryPhotoPreview");

    if(preview){

      preview.src = currentDiaryPhoto;

      preview.style.display = "block";
    }
  };

  reader.readAsDataURL(file);
}
function getMoodEmoji(moodName){

  const moodEmojis = {

    "Muito feliz":"😄",

    "Feliz":"😊",

    "Neutro":"😐",

    "Triste":"😟",

    "Muito triste":"😢"
  };

  return moodEmojis[moodName] || "📝";
}
function editEntry(id){

  const data = entries();

  const entry =
    data.find(item => item.id === id);

  if(!entry) return;

  editingEntryId = id;

  openScreen("diario");

  const hojeButton =
    document.querySelector(
      ".diary-tabs button"
    );

  tab("hoje", hojeButton);

  const titleInput =
    document.getElementById("diaryTitle");

  const textInput =
    document.getElementById("diaryText");

  const preview =
    document.getElementById(
      "diaryPhotoPreview"
    );

  if(titleInput)
    titleInput.value = entry.title || "";

  if(textInput)
    textInput.value = entry.text || "";

  mood = entry.mood;

  emoji =
    entry.emoji || getMoodEmoji(entry.mood);

  chips = entry.chips || [];

  currentDiaryPhoto = entry.photo || "";

  document
    .querySelectorAll(".moods button")
    .forEach(btn => {

      btn.classList.remove("active");

      if(btn.textContent.includes(entry.mood)){

        btn.classList.add("active");
      }
    });

  document
    .querySelectorAll(".chips button")
    .forEach(btn => {

      btn.classList.remove("active");

      chips.forEach(chip => {

        if(btn.textContent.includes(chip)){

          btn.classList.add("active");
        }
      });
    });

  if(preview && currentDiaryPhoto){

    preview.src = currentDiaryPhoto;

    preview.style.display = "block";
  }

  toast("Editando entrada.");
}

function deleteEntry(id){

  const confirmDelete = confirm(
    "Tem certeza que deseja excluir esta entrada?"
  );

  if(!confirmDelete) return;

  const data =
    entries().filter(item => item.id !== id);

  saveEntries(data);

  renderHistory();

  renderInsights();

  updateStreak();

  toast("Entrada excluída.");
}
function toggleDiaryMenu(){

    const menu = document.querySelector('.diary-sidebar');

    menu.classList.toggle('active');

}
const homeEmotions = [
  { emoji:"😊", name:"Felicidade", bg:"linear-gradient(135deg,#ffd84d,#ff8b2c)", glow:"#ffd84d66" },
  { emoji:"😌", name:"Calma", bg:"linear-gradient(135deg,#64e28f,#26d8d8)", glow:"#64e28f66" },
  { emoji:"😟", name:"Ansiedade", bg:"linear-gradient(135deg,#8c4cff,#45c8ff)", glow:"#8c4cff66" },
  { emoji:"😡", name:"Raiva", bg:"linear-gradient(135deg,#ff5a4e,#ff8b2c)", glow:"#ff5a4e66" },
  { emoji:"😢", name:"Tristeza", bg:"linear-gradient(135deg,#45c8ff,#5b2cff)", glow:"#45c8ff66" }
];

let homeEmotionIndex = 0;

function rotateHomeEmotion(){
  const orb = document.getElementById("homeEmotionOrb");
  const label = document.getElementById("homeEmotionName");

  if(!orb || !label) return;

  const current = homeEmotions[homeEmotionIndex];

  orb.textContent = current.emoji;
  orb.style.background = current.bg;
  orb.style.boxShadow = `0 0 28px ${current.glow}`;
  orb.style.animation = "none";

  setTimeout(() => {
    orb.style.animation = "emotionPop .8s ease";
  }, 20);

  label.textContent = current.name;

  homeEmotionIndex++;

  if(homeEmotionIndex >= homeEmotions.length){
    homeEmotionIndex = 0;
  }
}

setInterval(rotateHomeEmotion, 1800);
rotateHomeEmotion();

// Impede que mais de um vídeo seja reproduzido ao mesmo tempo
document.addEventListener("play", function(event) {
  if (event.target.tagName === "VIDEO") {
    const videos = document.querySelectorAll("video");

    videos.forEach(function(video) {
      if (video !== event.target) {
        video.pause();
      }
    });
  }
}, true);