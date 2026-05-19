import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getDatabase,
  ref,
  set,
  update,
  onValue,
  get,
  remove
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";
import { firebaseConfig, hasFirebaseConfig } from "./firebase-config.js";

const categories = {
  "Comida": [
    ["Pizza", "tiene queso y se comparte"],
    ["Hamburguesa", "se come con las manos"],
    ["Empanada", "puede venir al horno o frita"],
    ["Helado", "frio y dulce"],
    ["Milanesa", "clasico de plato lleno"],
    ["Sushi", "viene en piezas"],
    ["Tacos", "se arman y se doblan"],
    ["Panqueque", "puede ser dulce"]
  ],
  "Peliculas y series": [
    ["Stranger Things", "grupo de amigos y misterio"],
    ["Harry Potter", "magia y escuela"],
    ["Shrek", "verde y muy meme"],
    ["Spider-Man", "heroe con traje"],
    ["Los Simpsons", "familia amarilla"],
    ["Toy Story", "juguetes con drama"],
    ["La Casa de Papel", "mascaras y plan"],
    ["Intensamente", "emociones con colores"]
  ],
  "Lugares": [
    ["Playa", "arena y agua"],
    ["Cine", "pantalla gigante"],
    ["Escuela", "todos conocen ese lugar"],
    ["Gimnasio", "hay maquinas"],
    ["Supermercado", "carritos y pasillos"],
    ["Aeropuerto", "valijas y esperas"],
    ["Boliche", "musica fuerte"],
    ["Parque", "aire libre"]
  ],
  "Objetos": [
    ["Celular", "siempre esta cerca"],
    ["Mochila", "sirve para llevar cosas"],
    ["Auriculares", "van cerca de la cabeza"],
    ["Llave", "abre algo"],
    ["Botella", "puede tener bebida"],
    ["Silla", "sirve para sentarse"],
    ["Dados", "azar de mesa"],
    ["Cuaderno", "hojas y tapa"]
  ],
  "Random": [
    ["Discord", "chat con canales"],
    ["Mate", "ronda y termo"],
    ["Cumpleanos", "hay torta"],
    ["Karaoke", "nadie canta igual"],
    ["Minecraft", "bloques por todos lados"],
    ["WiFi", "cuando falla se nota"],
    ["Sticker", "sirve para reaccionar"],
    ["Memes", "se mandan sin contexto"]
  ]
};

const avatarColors = ["#ff6b80", "#5ee0c2", "#ffcc57", "#6aa7ff", "#c58cff", "#ff9b6a", "#7ad66d", "#f26fc1", "#8bd3ff", "#d7ed62"];
const hairColors = ["#2c1e1a", "#6c3f25", "#f2c15d", "#16161d", "#9b5732"];
const skinColors = ["#f5c7a9", "#d99a73", "#8f5d43", "#ffd8bd", "#b77957"];

const screens = {
  home: document.querySelector("#homeScreen"),
  lobby: document.querySelector("#lobbyScreen"),
  secret: document.querySelector("#secretScreen"),
  table: document.querySelector("#tableScreen"),
  vote: document.querySelector("#voteScreen")
};

const dom = {
  categorySelect: document.querySelector("#categorySelect"),
  hintToggle: document.querySelector("#hintToggle"),
  createError: document.querySelector("#createError"),
  joinError: document.querySelector("#joinError"),
  firebaseNotice: document.querySelector("#firebaseNotice"),
  roomCodeInput: document.querySelector("#roomCodeInput"),
  roomCodeLabel: document.querySelector("#roomCodeLabel"),
  lobbyPlayers: document.querySelector("#lobbyPlayers"),
  lobbyCount: document.querySelector("#lobbyCount"),
  lobbyHelp: document.querySelector("#lobbyHelp"),
  hostPanel: document.querySelector("#hostPanel"),
  secretPlayerName: document.querySelector("#secretPlayerName"),
  secretAvatar: document.querySelector("#secretAvatar"),
  roleCard: document.querySelector("#roleCard"),
  roleLabel: document.querySelector("#roleLabel"),
  roleValue: document.querySelector("#roleValue"),
  hintText: document.querySelector("#hintText"),
  currentTurnName: document.querySelector("#currentTurnName"),
  tableScene: document.querySelector("#tableScene"),
  tablePlayers: document.querySelector("#tablePlayers"),
  voteButtons: document.querySelector("#voteButtons"),
  voteStatus: document.querySelector("#voteStatus"),
  finalReveal: document.querySelector("#finalReveal"),
  impostorName: document.querySelector("#impostorName"),
  realWord: document.querySelector("#realWord"),
  playAgainBtn: document.querySelector("#playAgainBtn")
};

let db = null;
let roomCode = "";
let playerId = "";
let currentRoom = null;
let currentPlayers = [];
let unsubscribeRoom = null;

function boot() {
  renderCategoryOptions();
  readRoomFromUrl();

  if (hasFirebaseConfig()) {
    const app = initializeApp(firebaseConfig);
    db = getDatabase(app);
    dom.firebaseNotice.classList.add("hidden");
  } else {
    dom.firebaseNotice.classList.remove("hidden");
  }

  if (roomCode) {
    dom.roomCodeInput.value = roomCode;
  }

  bindEvents();
}

function bindEvents() {
  document.querySelector("#createRoomForm").addEventListener("submit", createRoom);
  document.querySelector("#joinRoomForm").addEventListener("submit", joinRoomFromForm);
  document.querySelector("#copyInviteBtn").addEventListener("click", copyInviteLink);
  document.querySelector("#leaveRoomBtn").addEventListener("click", leaveRoom);
  document.querySelector("#startGameBtn").addEventListener("click", startGame);
  document.querySelector("#goTableBtn").addEventListener("click", () => setStatus("table"));
  document.querySelector("#nextTurnBtn").addEventListener("click", nextTurn);
  document.querySelector("#goVoteBtn").addEventListener("click", () => setStatus("vote"));
  dom.playAgainBtn.addEventListener("click", resetToLobby);
}

function renderCategoryOptions() {
  dom.categorySelect.innerHTML = Object.keys(categories)
    .map(category => `<option value="${category}">${category}</option>`)
    .join("");
}

function readRoomFromUrl() {
  const params = new URLSearchParams(window.location.search);
  roomCode = (params.get("room") || "").toUpperCase();
}

function showScreen(screenName) {
  Object.values(screens).forEach(screen => screen.classList.remove("active"));
  screens[screenName].classList.add("active");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function requireFirebase(errorElement) {
  if (db) return true;
  errorElement.textContent = "Primero hay que pegar la configuracion de Firebase en firebase-config.js.";
  return false;
}

function cleanName(value) {
  return value.trim().replace(/\s+/g, " ").slice(0, 18);
}

function makeRoomCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
}

function makePlayerId() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function shuffle(array) {
  return [...array].sort(() => Math.random() - 0.5);
}

function randomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function createAvatarSeed(index = 0) {
  return {
    color: avatarColors[index % avatarColors.length],
    skin: index % skinColors.length,
    hairColor: Math.floor(Math.random() * hairColors.length),
    glasses: Math.random() > 0.62,
    beard: Math.random() > 0.72,
    cap: Math.random() > 0.68,
    mouth: Math.floor(Math.random() * 2),
    accessory: Math.floor(Math.random() * 3)
  };
}

async function createRoom(event) {
  event.preventDefault();
  if (!requireFirebase(dom.createError)) return;

  const name = cleanName(document.querySelector("#hostNameInput").value);
  if (!name) {
    dom.createError.textContent = "Pone tu nombre para crear la sala.";
    return;
  }

  roomCode = makeRoomCode();
  playerId = makePlayerId();
  sessionStorage.setItem(`impostor-player-${roomCode}`, playerId);

  const player = {
    id: playerId,
    name,
    avatar: createAvatarSeed(0),
    joinedAt: Date.now()
  };

  const room = {
    code: roomCode,
    hostId: playerId,
    status: "lobby",
    category: dom.categorySelect.value,
    hintEnabled: dom.hintToggle.checked,
    word: "",
    hint: "",
    impostorId: "",
    turnIndex: 0,
    createdAt: Date.now(),
    players: {
      [playerId]: player
    },
    votes: {}
  };

  await set(ref(db, `rooms/${roomCode}`), room);
  enterRoom(roomCode, playerId);
  history.replaceState(null, "", `${location.pathname}?room=${roomCode}`);
}

async function joinRoomFromForm(event) {
  event.preventDefault();
  if (!requireFirebase(dom.joinError)) return;

  const name = cleanName(document.querySelector("#joinNameInput").value);
  const code = dom.roomCodeInput.value.trim().toUpperCase();

  if (!name) {
    dom.joinError.textContent = "Pone tu nombre para entrar.";
    return;
  }
  if (!/^[A-Z0-9]{6}$/.test(code)) {
    dom.joinError.textContent = "El codigo tiene que tener 6 caracteres.";
    return;
  }

  const roomSnapshot = await get(ref(db, `rooms/${code}`));
  if (!roomSnapshot.exists()) {
    dom.joinError.textContent = "No encontre esa sala.";
    return;
  }

  const room = roomSnapshot.val();
  const players = Object.values(room.players || {});
  if (players.length >= 10) {
    dom.joinError.textContent = "La sala ya tiene 10 jugadores.";
    return;
  }
  if (players.some(player => player.name.toLowerCase() === name.toLowerCase())) {
    dom.joinError.textContent = "Ese nombre ya esta en la sala.";
    return;
  }

  roomCode = code;
  playerId = makePlayerId();
  sessionStorage.setItem(`impostor-player-${roomCode}`, playerId);

  await set(ref(db, `rooms/${roomCode}/players/${playerId}`), {
    id: playerId,
    name,
    avatar: createAvatarSeed(players.length),
    joinedAt: Date.now()
  });

  enterRoom(roomCode, playerId);
  history.replaceState(null, "", `${location.pathname}?room=${roomCode}`);
}

function enterRoom(code, id) {
  roomCode = code;
  playerId = id;
  dom.roomCodeLabel.textContent = code;
  listenToRoom();
}

function listenToRoom() {
  if (unsubscribeRoom) unsubscribeRoom();

  unsubscribeRoom = onValue(ref(db, `rooms/${roomCode}`), snapshot => {
    if (!snapshot.exists()) {
      leaveRoom();
      return;
    }

    currentRoom = snapshot.val();
    currentPlayers = Object.values(currentRoom.players || {}).sort((a, b) => a.joinedAt - b.joinedAt);
    renderByStatus();
  });
}

function isHost() {
  return currentRoom?.hostId === playerId;
}

function getMe() {
  return currentPlayers.find(player => player.id === playerId);
}

function renderByStatus() {
  document.querySelectorAll(".host-only").forEach(element => {
    element.classList.toggle("hidden", !isHost());
  });

  if (currentRoom.status === "lobby") renderLobby();
  if (currentRoom.status === "roles") renderSecret();
  if (currentRoom.status === "table") renderTable();
  if (currentRoom.status === "vote" || currentRoom.status === "result") renderVote();
}

function renderLobby() {
  showScreen("lobby");
  dom.roomCodeLabel.textContent = roomCode;
  dom.hostPanel.classList.toggle("hidden", !isHost());
  dom.lobbyCount.textContent = `${currentPlayers.length}/10`;
  dom.lobbyHelp.textContent = currentPlayers.length < 4
    ? "Minimo 4 jugadores para empezar."
    : "Ya pueden empezar. Maximo 10 jugadores.";

  dom.lobbyPlayers.innerHTML = currentPlayers.map(player => `
    <div class="lobby-player ${player.id === currentRoom.hostId ? "leader" : ""}">
      ${buildAvatar(player.avatar, true)}
      <span>${escapeHtml(player.name)}</span>
      <small>${player.id === currentRoom.hostId ? "lider" : "listo"}</small>
    </div>
  `).join("");
}

function renderSecret() {
  const me = getMe();
  if (!me) return;

  const isImpostor = me.id === currentRoom.impostorId;
  showScreen("secret");
  dom.secretPlayerName.textContent = me.name;
  dom.secretAvatar.innerHTML = buildAvatar(me.avatar);
  dom.roleCard.className = `role-card ${isImpostor ? "impostor" : ""}`;
  dom.roleLabel.textContent = isImpostor ? "Tu rol" : "Palabra";
  dom.roleValue.textContent = isImpostor ? "Sos el impostor" : currentRoom.word;

  if (isImpostor && currentRoom.hintEnabled) {
    dom.hintText.textContent = `Pista: ${currentRoom.hint}`;
    dom.hintText.classList.remove("hidden");
  } else {
    dom.hintText.classList.add("hidden");
  }
}

function renderTable() {
  const total = currentPlayers.length;
  const radiusX = 43;
  const radiusY = total >= 8 ? 39 : 34;
  const currentTurnPlayer = currentPlayers[currentRoom.turnIndex % total];

  showScreen("table");
  dom.currentTurnName.textContent = currentTurnPlayer?.name || "-";
  dom.tableScene.classList.toggle("dense", total >= 8);
  dom.tablePlayers.innerHTML = currentPlayers.map((player, index) => {
    const angle = (-90 + (360 / total) * index) * (Math.PI / 180);
    const x = 50 + Math.cos(angle) * radiusX;
    const y = 50 + Math.sin(angle) * radiusY;

    return `
      <div class="seat ${index === currentRoom.turnIndex % total ? "current" : ""}" style="left:${x}%; top:${y}%">
        <div class="seat-name">${escapeHtml(player.name)}</div>
        ${buildAvatar(player.avatar, true)}
      </div>
    `;
  }).join("");
}

function renderVote() {
  const votes = currentRoom.votes || {};
  const voted = votes[playerId];
  const totalVotes = Object.keys(votes).length;
  const isResult = currentRoom.status === "result";

  showScreen("vote");
  dom.voteButtons.innerHTML = currentPlayers.map(player => `
    <button class="vote-btn ${voted === player.id ? "picked" : ""}" type="button" data-id="${player.id}" aria-label="${escapeHtml(player.name)}" ${voted || isResult ? "disabled" : ""}>
      ${buildAvatar(player.avatar, true)}
      <span>${escapeHtml(player.name)}</span>
    </button>
  `).join("");

  dom.voteButtons.querySelectorAll(".vote-btn").forEach(button => {
    button.addEventListener("click", () => votePlayer(button.dataset.id));
  });

  dom.voteStatus.textContent = isResult
    ? "Resultado revelado."
    : `${totalVotes}/${currentPlayers.length} votos cargados.`;

  if (isResult) {
    const impostor = currentPlayers.find(player => player.id === currentRoom.impostorId);
    dom.impostorName.textContent = impostor?.name || "-";
    dom.realWord.textContent = `La palabra real era: ${currentRoom.word}`;
    dom.finalReveal.classList.remove("hidden");
    dom.playAgainBtn.classList.toggle("hidden", !isHost());
  } else {
    dom.finalReveal.classList.add("hidden");
    dom.playAgainBtn.classList.add("hidden");
  }

  if (isHost() && totalVotes >= currentPlayers.length && !isResult) {
    setStatus("result");
  }
}

async function startGame() {
  if (!isHost()) return;
  if (currentPlayers.length < 4) {
    dom.lobbyHelp.textContent = "Faltan jugadores: minimo 4.";
    return;
  }
  if (currentPlayers.length > 10) {
    dom.lobbyHelp.textContent = "Maximo 10 jugadores.";
    return;
  }

  const [word, hint] = randomItem(categories[currentRoom.category]);
  const impostor = randomItem(currentPlayers);

  await update(ref(db, `rooms/${roomCode}`), {
    status: "roles",
    word,
    hint,
    impostorId: impostor.id,
    turnIndex: 0,
    votes: {}
  });
}

async function setStatus(status) {
  if (!isHost()) return;
  await update(ref(db, `rooms/${roomCode}`), { status });
}

async function nextTurn() {
  if (!isHost()) return;
  await update(ref(db, `rooms/${roomCode}`), {
    turnIndex: (Number(currentRoom.turnIndex) + 1) % currentPlayers.length
  });
}

async function votePlayer(targetId) {
  if (currentRoom.status !== "vote") return;
  if ((currentRoom.votes || {})[playerId]) return;
  await set(ref(db, `rooms/${roomCode}/votes/${playerId}`), targetId);
}

async function resetToLobby() {
  if (!isHost()) return;
  await update(ref(db, `rooms/${roomCode}`), {
    status: "lobby",
    word: "",
    hint: "",
    impostorId: "",
    turnIndex: 0,
    votes: {}
  });
}

async function copyInviteLink() {
  const invite = `${location.origin}${location.pathname}?room=${roomCode}`;
  await navigator.clipboard.writeText(invite);
  dom.lobbyHelp.textContent = "Link copiado. Abrilo en otras pestañas para probar.";
}

async function leaveRoom() {
  if (unsubscribeRoom) unsubscribeRoom();
  unsubscribeRoom = null;

  if (db && roomCode && playerId) {
    const roomSnapshot = await get(ref(db, `rooms/${roomCode}`));
    const room = roomSnapshot.val();
    const players = Object.keys(room?.players || {});

    if (room?.hostId === playerId || players.length <= 1) {
      await remove(ref(db, `rooms/${roomCode}`));
    } else {
      await remove(ref(db, `rooms/${roomCode}/players/${playerId}`));
    }
  }

  roomCode = "";
  playerId = "";
  currentRoom = null;
  currentPlayers = [];
  history.replaceState(null, "", location.pathname);
  showScreen("home");
}

function buildAvatar(seed, compact = false) {
  const safeSeed = seed || createAvatarSeed(0);
  const skin = skinColors[safeSeed.skin];
  const hair = hairColors[safeSeed.hairColor];
  const shirt = safeSeed.color;
  const mouth = safeSeed.mouth === 0 ? "M70 72 Q82 82 94 72" : "M72 77 Q82 70 92 77";
  const glasses = safeSeed.glasses
    ? `<circle cx="68" cy="58" r="9" fill="none" stroke="#191724" stroke-width="4"/><circle cx="96" cy="58" r="9" fill="none" stroke="#191724" stroke-width="4"/><path d="M77 58 H87" stroke="#191724" stroke-width="4"/>`
    : "";
  const beard = safeSeed.beard ? `<path d="M62 70 Q82 94 102 70 Q98 106 82 109 Q66 106 62 70" fill="${hair}" opacity=".9"/>` : "";
  const cap = safeSeed.cap ? `<path d="M50 39 Q82 12 114 39 L110 47 Q82 31 54 47 Z" fill="${shirt}"/><path d="M107 40 Q126 40 132 49 Q115 50 104 47 Z" fill="${shirt}"/>` : "";
  const hairShape = safeSeed.cap ? "" : `<path d="M51 50 Q58 25 84 24 Q111 25 116 53 Q100 38 82 42 Q66 38 51 50" fill="${hair}"/>`;
  const accessory = safeSeed.accessory === 1
    ? `<path d="M116 62 L129 54 L128 74 Z" fill="${shirt}"/>`
    : safeSeed.accessory === 2
      ? `<circle cx="48" cy="82" r="5" fill="${shirt}"/><circle cx="116" cy="82" r="5" fill="${shirt}"/>`
      : "";

  return `
    <svg class="avatar-svg ${compact ? "compact" : ""}" viewBox="0 0 164 184" role="img" aria-label="Avatar">
      <path d="M51 110 L26 150" stroke="${skin}" stroke-width="15" stroke-linecap="round"/>
      <path d="M113 110 L138 150" stroke="${skin}" stroke-width="15" stroke-linecap="round"/>
      <path d="M62 151 L52 178" stroke="#262333" stroke-width="16" stroke-linecap="round"/>
      <path d="M102 151 L112 178" stroke="#262333" stroke-width="16" stroke-linecap="round"/>
      <path d="M45 103 Q82 79 119 103 L112 157 H52 Z" fill="${shirt}"/>
      <circle cx="82" cy="59" r="38" fill="${skin}"/>
      ${hairShape}
      ${cap}
      ${beard}
      <circle cx="69" cy="59" r="4" fill="#17131d"/>
      <circle cx="95" cy="59" r="4" fill="#17131d"/>
      ${glasses}
      <path d="${mouth}" fill="none" stroke="#17131d" stroke-width="4" stroke-linecap="round"/>
      ${accessory}
    </svg>
  `;
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

boot();
