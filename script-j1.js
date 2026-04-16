// ============================================================================
// 👨‍🏫 先生用設定エリア (EDIT HERE)
// ============================================================================

// ▼ 1. ここでお題を編集してください (Edit prompts here)
// カテゴリーとテキストを自由に追加・変更できます。
const DEFAULT_PROMPTS = [
    // 日常のこと
    { category: "日常のこと", text: "好きな給食は？" },
    { category: "日常のこと", text: "好きな季節は？" },
    { category: "日常のこと", text: "休みの日にしてみたいことは？" },
    { category: "日常のこと", text: "朝は早いほう？ゆっくりなほう？" },
    { category: "日常のこと", text: "好きな教科は？" },
    { category: "日常のこと", text: "最近楽しかったことは？" },
    // 小学校の算数のかんたんな復習
    { category: "小学校の算数のかんたんな復習", text: "7 + 5 は？" },
    { category: "小学校の算数のかんたんな復習", text: "12 - 4 は？" },
    { category: "小学校の算数のかんたんな復習", text: "3 × 4 は？" },
    { category: "小学校の算数のかんたんな復習", text: "20 ÷ 5 は？" },
    { category: "小学校の算数のかんたんな復習", text: "1m は何cm？" },
    { category: "小学校の算数のかんたんな復習", text: "三角形の辺は何本？" },
    { category: "小学校の算数のかんたんな復習", text: "1時間は何分？" },
    { category: "小学校の算数のかんたんな復習", text: "100円が3まいでいくら？" },
    { category: "小学校の算数のかんたんな復習", text: "1/2 は 1 より大きい？小さい？" },
    { category: "小学校の算数のかんたんな復習", text: "四角形の角は何個？" }
];

// ▼ 2. ゲームボードの設定 (Edit board squares here)
const BOARD_SIZE = 26; // マスの総数 (0がSTART、最後がGOALになります)

// ▼ 3. 使いたいカテゴリーの設定 (Square categories)
const CATEGORIES = ["日常のこと", "小学校の算数のかんたんな復習", "カスタム"]; 
const CATEGORY_CLASSES = {
    "日常のこと": "cat-daily",
    "小学校の算数のかんたんな復習": "cat-math",
    "カスタム": "cat-custom"
};

// ▼ 4. プレイヤー関連の設定 (Default player setup)
const DEFAULT_PLAYER_PREFIX = "生徒"; // 一括入力ボタンで使われる名前の先頭文字
const DEFAULT_COLORS = ["#ff595e", "#ffca3a", "#8ac926", "#1982c4", "#6a4c93", "#f8961e", "#f3722c", "#43aa8b"];

// ============================================================================
// ⚠️ これより下はゲームの動作ロジックです。必要がなければ変更しないでください。
// (Do not change below unless necessary)
// ============================================================================

let state = {
    prompts: [],
    players: [],
    currentTurn: 0,
    board: [], // Array of categories for each square
    isRolling: false
};

let currentCols = 0;

function getCols() {
    if (window.innerWidth <= 600) return 3;
    if (window.innerWidth <= 900) return 4;
    return 5;
}


// --- Initialization ---

document.addEventListener("DOMContentLoaded", () => {
    loadPrompts();
    initSetupScreen();
    bindEvents();
    
    window.addEventListener("resize", () => {
        if (!document.getElementById("game-screen").classList.contains("hidden")) {
            const newCols = getCols();
            if (newCols !== currentCols) {
                renderBoard();
                state.players.forEach(p => {
                    placeToken(p.id, p.pos);
                });
            }
        }
    });
});

function loadPrompts() {
    state.prompts = [...DEFAULT_PROMPTS];
}


// --- Setup Screen ---

function initSetupScreen() {
    const selector = document.getElementById("player-count");
    renderPlayerInputs(parseInt(selector.value, 10));

    selector.addEventListener("change", (e) => {
        renderPlayerInputs(parseInt(e.target.value, 10));
    });

    document.getElementById("btn-default-names").addEventListener("click", () => {
        const inputs = document.querySelectorAll('.player-row input[type="text"]');
        inputs.forEach((input, index) => {
            input.value = `${DEFAULT_PLAYER_PREFIX}${index + 1}`;
        });
    });

    document.getElementById("btn-start-game").addEventListener("click", startGame);
}

function renderPlayerInputs(count) {
    const container = document.getElementById("player-inputs");
    container.innerHTML = "";
    
    for (let i = 0; i < count; i++) {
        const row = document.createElement("div");
        row.className = "player-row";
        
        const nameInput = document.createElement("input");
        nameInput.type = "text";
        nameInput.placeholder = `プレイヤー ${i + 1} のなまえ`;
        nameInput.id = `player-name-${i}`;
        
        const colorInput = document.createElement("input");
        colorInput.type = "color";
        colorInput.value = DEFAULT_COLORS[i % DEFAULT_COLORS.length];
        colorInput.id = `player-color-${i}`;
        
        row.appendChild(nameInput);
        row.appendChild(colorInput);
        container.appendChild(row);
    }
}


// --- Game Initialization ---

function startGame() {
    const count = parseInt(document.getElementById("player-count").value, 10);
    state.players = [];
    
    for (let i = 0; i < count; i++) {
        let name = document.getElementById(`player-name-${i}`).value.trim();
        if (!name) name = `プレイヤー ${i + 1}`;
        let color = document.getElementById(`player-color-${i}`).value;
        
        state.players.push({
            id: i,
            name: name,
            color: color,
            pos: 0
        });
    }
    
    generateBoard();
    renderBoard();
    
    // Put players at start
    state.players.forEach(p => {
        placeToken(p.id, 0);
    });
    
    state.currentTurn = 0;
    updateSidePanel();
    
    // Switch screens
    document.getElementById("setup-screen").classList.add("hidden");
    document.getElementById("setup-screen").classList.remove("view-active");
    document.getElementById("game-screen").classList.remove("hidden");
    document.getElementById("game-screen").classList.add("view-active");
}

function generateBoard() {
    state.board = [];
    // 0 is start
    state.board.push("スタート");
    
    // Generate valid categories from available prompts
    const availableCategories = [...new Set(state.prompts.map(p => p.category))];
    if (availableCategories.length === 0) availableCategories.push("日常のこと"); // fallback

    for (let i = 1; i < BOARD_SIZE - 1; i++) {
        // Randomly pick an available category
        const randomCat = availableCategories[Math.floor(Math.random() * availableCategories.length)];
        state.board.push(randomCat);
    }
    
    // Last is goal
    state.board.push("ゴール");
}

function renderBoard() {
    const boardEl = document.getElementById("board");
    boardEl.innerHTML = "";
    
    currentCols = getCols();
    boardEl.style.gridTemplateColumns = `repeat(${currentCols}, 1fr)`;
    
    for (let i = 0; i < BOARD_SIZE; i++) {
        const sq = document.createElement("div");
        sq.className = "square";
        sq.id = `square-${i}`;
        
        // Calculate snake path grid placement
        const row = Math.floor(i / currentCols) + 1;
        let col;
        if (row % 2 === 1) {
            col = (i % currentCols) + 1; // Left to right
        } else {
            col = currentCols - (i % currentCols); // Right to left
        }
        
        sq.style.gridRow = row;
        sq.style.gridColumn = col;
        
        // Path connections
        if (i < BOARD_SIZE - 1) {
            const nextRow = Math.floor((i + 1) / currentCols) + 1;
            if (nextRow > row) {
                sq.classList.add("path-down");
            } else if (row % 2 === 1) {
                sq.classList.add("path-right");
            } else {
                sq.classList.add("path-left");
            }
        }
        
        const numLabel = document.createElement("div");
        numLabel.className = "square-number";
        numLabel.innerText = i;
        if(i > 0 && i < BOARD_SIZE - 1) {
             sq.appendChild(numLabel);
        }
       
        if (i === 0) {
            sq.classList.add("start");
            sq.innerHTML += "<div>START</div>";
        } else if (i === BOARD_SIZE - 1) {
            sq.classList.add("goal");
            sq.innerHTML += "<div>GOAL</div>";
        } else {
            const catLabel = document.createElement("div");
            catLabel.className = `square-category ${CATEGORY_CLASSES[state.board[i]] || 'cat-daily'}`;
            catLabel.innerText = state.board[i];
            sq.appendChild(catLabel);
        }
        
        const tokenContainer = document.createElement("div");
        tokenContainer.className = "token-container";
        tokenContainer.id = `token-container-${i}`;
        sq.appendChild(tokenContainer);
        
        boardEl.appendChild(sq);
    }
}

function placeToken(playerId, squareIndex) {
    let token = document.getElementById(`token-${playerId}`);
    const player = state.players.find(p => p.id === playerId);
    
    if (!token) {
        token = document.createElement("div");
        token.id = `token-${playerId}`;
        token.className = "token";
        token.style.backgroundColor = player.color;
    }
    
    const container = document.getElementById(`token-container-${squareIndex}`);
    if(container) {
        container.appendChild(token);
    }
}

function getSquareCoordinates(squareIndex) {
    const container = document.getElementById(`token-container-${squareIndex}`);
    const rect = container.getBoundingClientRect();
    return { x: rect.left + rect.width/2, y: rect.top + rect.height/2 };
}

async function moveToken(playerId, steps) {
    const player = state.players.find(p => p.id === playerId);
    let currentPos = player.pos;
    const targetPos = Math.min(currentPos + steps, BOARD_SIZE - 1);
    
    const token = document.getElementById(`token-${playerId}`);
    token.classList.add('moving');
    
    // Animate square by square
    for (let i = currentPos + 1; i <= targetPos; i++) {
        await new Promise(resolve => setTimeout(resolve, 300));
        placeToken(playerId, i);
        if(document.getElementById("sound-checkbox").checked) {
            playMoveSound();
        }
    }
    
    token.classList.remove('moving');
    player.pos = targetPos;
    
    checkLandedSquare(targetPos);
}


// --- Game Logic ---

function updateSidePanel() {
    const currentPlayer = state.players[state.currentTurn];
    
    // Update Turn Display
    document.getElementById("current-turn-display").innerText = `${currentPlayer.name} の番です`;
    document.getElementById("current-turn-display").style.color = currentPlayer.color;
    
    // Update Player List
    const list = document.getElementById("player-list");
    list.innerHTML = "";
    state.players.forEach((p, idx) => {
        const item = document.createElement("li");
        item.className = "player-status-item" + (idx === state.currentTurn ? " active" : "");
        
        const indicator = document.createElement("span");
        indicator.className = "token-indicator";
        indicator.style.backgroundColor = p.color;
        
        const text = document.createElement("span");
        text.innerText = `${p.name} : ${p.pos === BOARD_SIZE - 1 ? 'ゴール' : p.pos + 'マス目'}`;
        
        item.appendChild(indicator);
        item.appendChild(text);
        list.appendChild(item);
    });

    // Reset Dice and Buttons
    document.getElementById("btn-roll-dice").disabled = false;
    document.getElementById("prompt-display").classList.add("hidden");
    resetDiceFace();
}

function rollDice() {
    if (state.isRolling) return;
    state.isRolling = true;
    
    document.getElementById("btn-roll-dice").disabled = true;
    document.getElementById("prompt-display").classList.add("hidden");
    
    const dice = document.getElementById("dice");
    dice.classList.remove(...Array.from({length:6},(_,i)=>'show-'+(i+1)));
    
    // Force reflow
    void dice.offsetWidth;
    
    dice.classList.add("rolling");
    
    if(document.getElementById("sound-checkbox").checked) {
        playRollSound();
    }
    
    const rollResult = Math.floor(Math.random() * 6) + 1;
    
    setTimeout(() => {
        dice.classList.remove("rolling");
        dice.classList.add(`show-${rollResult}`);
        
        setTimeout(() => {
            const currentPlayer = state.players[state.currentTurn];
            moveToken(currentPlayer.id, rollResult).then(() => {
                state.isRolling = false;
            });
        }, 1000);
        
    }, 1000);
}

function resetDiceFace() {
    const dice = document.getElementById("dice");
    dice.classList.remove(...Array.from({length:6},(_,i)=>'show-'+(i+1)));
    dice.classList.add("show-1"); // Default front
}

function checkLandedSquare(pos) {
    if (pos === BOARD_SIZE - 1) {
        // Goal
        const currentPlayer = state.players[state.currentTurn];
        document.getElementById("goal-message").innerText = `${currentPlayer.name} さん、おめでとうございます！`;
        document.getElementById("modal-goal").classList.remove("hidden");
        
        // Still need next turn button to let others finish
        document.getElementById("prompt-display").classList.remove("hidden");
        document.getElementById("prompt-category").innerText = "ゴール";
        document.getElementById("prompt-text").innerText = "お疲れ様でした！他の人を応援しましょう。";
        document.getElementById("prompt-category").className = "category-badge cat-math";
        
        return;
    }
    
    const category = state.board[pos];
    const availablePrompts = state.prompts.filter(p => p.category === category);
    
    let promptText = "お題がありません";
    if (availablePrompts.length > 0) {
        const randomPrompt = availablePrompts[Math.floor(Math.random() * availablePrompts.length)];
        promptText = randomPrompt.text;
    } else {
        const allPrompts = state.prompts;
        if (allPrompts.length > 0) {
            promptText = allPrompts[Math.floor(Math.random() * allPrompts.length)].text;
        }
    }
    
    document.getElementById("prompt-category").innerText = category;
    document.getElementById("prompt-category").className = `category-badge ${CATEGORY_CLASSES[category] || 'cat-daily'}`;
    document.getElementById("prompt-text").innerText = promptText;
    
    document.getElementById("prompt-display").classList.remove("hidden");
}

function nextTurn() {
    // Check if everyone is at goal
    const allGoal = state.players.every(p => p.pos === BOARD_SIZE - 1);
    if (allGoal) {
        alert("全員ゴールしました！お疲れ様でした！");
        return;
    }
    
    do {
         state.currentTurn = (state.currentTurn + 1) % state.players.length;
    } while (state.players[state.currentTurn].pos === BOARD_SIZE - 1 && !allGoal);
    
    updateSidePanel();
}


// --- Events & Modals ---

function bindEvents() {
    // Buttons
    document.getElementById("btn-roll-dice").addEventListener("click", rollDice);
    document.getElementById("btn-next-turn").addEventListener("click", nextTurn);
    
    // Modals
    document.getElementById("btn-rules").addEventListener("click", () => openModal("modal-rules"));
    document.getElementById("close-rules").addEventListener("click", () => closeModal("modal-rules"));
    document.getElementById("btn-close-goal").addEventListener("click", () => closeModal("modal-goal"));
    
    // Close modal on outside click
    document.querySelectorAll(".modal").forEach(modal => {
        modal.addEventListener("click", (e) => {
            if (e.target === modal) closeModal(modal.id);
        });
    });
}

function openModal(id) {
    document.getElementById(id).classList.remove("hidden");
}
function closeModal(id) {
    document.getElementById(id).classList.add("hidden");
}


// --- Sound Synthesis (Web Audio API) for simple gentle beeps ---
let audioCtx = null;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function playBeep(freq, type, duration, vol) {
    initAudio();
    if(audioCtx.state === 'suspended') audioCtx.resume();
    
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    
    gainNode.gain.setValueAtTime(vol, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
}

function playRollSound() {
    // A quick rattling, but we'll do a simple arp
    playBeep(440, 'sine', 0.1, 0.1);
    setTimeout(() => playBeep(554, 'sine', 0.1, 0.1), 100);
    setTimeout(() => playBeep(659, 'sine', 0.1, 0.1), 200);
    setTimeout(() => playBeep(880, 'sine', 0.1, 0.1), 300);
}

function playMoveSound() {
    playBeep(500, 'triangle', 0.1, 0.1);
}
