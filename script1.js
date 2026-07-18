/* ==================== GEMSTONE SORT - COMPLETE GAME ENGINE ==================== */

// ==================== CONSTANTS ====================
const STORAGE_KEYS = {
    COINS: 'gemsort_coins',
    STATISTICS: 'gemsort_statistics',
    SETTINGS: 'gemsort_settings',
    PROGRESS: 'gemsort_progress',
    CURRENT_GAME: 'gemsort_current_game',
    CUSTOM_GAME: 'gemsort_custom_game'
};

const GEM_COLORS = [
    { name: 'ruby', hex: '#e63946', cssClass: 'gem-ruby' },
    { name: 'emerald', hex: '#2a9d4e', cssClass: 'gem-emerald' },
    { name: 'sapphire', hex: '#2563eb', cssClass: 'gem-sapphire' },
    { name: 'amethyst', hex: '#8b5cf6', cssClass: 'gem-amethyst' },
    { name: 'topaz', hex: '#f59e0b', cssClass: 'gem-topaz' },
    { name: 'aquamarine', hex: '#06b6d4', cssClass: 'gem-aquamarine' },
    { name: 'quartz', hex: '#e2c4d8', cssClass: 'gem-quartz' },
    { name: 'citrine', hex: '#eab308', cssClass: 'gem-citrine' },
    { name: 'jade', hex: '#10b981', cssClass: 'gem-jade' },
    { name: 'amber', hex: '#f97316', cssClass: 'gem-amber' },
    { name: 'peridot', hex: '#84cc16', cssClass: 'gem-peridot' },
    { name: 'turquoise', hex: '#14b8a6', cssClass: 'gem-turquoise' },
    { name: 'coral', hex: '#ef4444', cssClass: 'gem-coral' },
    { name: 'moonstone', hex: '#c4b5fd', cssClass: 'gem-moonstone' },
    { name: 'garnet', hex: '#991b1b', cssClass: 'gem-garnet' },
    { name: 'pinkDiamond', hex: '#f9a8d4', cssClass: 'gem-pink-diamond' },
    { name: 'obsidian', hex: '#1e1e2e', cssClass: 'gem-obsidian' },
    { name: 'opal', hex: '#e0f2fe', cssClass: 'gem-opal' }
];

const PALETTE_PRESETS = {
    classic: ['ruby', 'emerald', 'sapphire', 'amethyst', 'topaz', 'aquamarine'],
    ocean: ['aquamarine', 'sapphire', 'turquoise', 'opal', 'moonstone', 'quartz'],
    neon: ['ruby', 'topaz', 'peridot', 'coral', 'citrine', 'pinkDiamond'],
    pastel: ['quartz', 'moonstone', 'pinkDiamond', 'opal', 'jade', 'amber']
};

const DIFFICULTIES = {
    noob: { name: 'Noob', bottleCount: 5, height: 3, colors: 2, emptyBottles: 1, winTarget: 3 },
    easy: { name: 'Easy', bottleCount: 7, height: 4, colors: 4, emptyBottles: 2, winTarget: 5 },
    medium: { name: 'Medium', bottleCount: 9, height: 5, colors: 5, emptyBottles: 2, winTarget: 5 },
    mediumPlus: { name: 'Medium+', bottleCount: 11, height: 5, colors: 7, emptyBottles: 2, winTarget: 5 },
    hard: { name: 'Hard', bottleCount: 12, height: 6, colors: 9, emptyBottles: 2, winTarget: 5 },
    devil: { name: 'Devil', bottleCount: 14, height: 7, colors: 12, emptyBottles: 2, winTarget: 5 }
};

const DEV_COMMANDS = {
    UNLOCK_ALL: 'unlockall',
    ADD_COINS: 'addcoins',
    RESET_PROGRESS: 'resetprogress',
    RESET_STATS: 'resetstats'
};

// ==================== UTILITIES ====================
function shuffleArray(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function getGemColorData(colorName) {
    return GEM_COLORS.find(c => c.name === colorName) || GEM_COLORS[0];
}

// ==================== STORAGE ====================
const Storage = {
    get(key, defaultValue = null) {
        try {
            const raw = localStorage.getItem(key);
            if (raw === null) return defaultValue;
            return JSON.parse(raw);
        } catch (e) {
            console.warn('Storage get error:', e);
            return defaultValue;
        }
    },
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.warn('Storage set error:', e);
        }
    },
    remove(key) {
        localStorage.removeItem(key);
    }
};

// ==================== APP STATE ====================
const AppState = {
    // Persistent
    coins: Storage.get(STORAGE_KEYS.COINS, 0),
    statistics: Storage.get(STORAGE_KEYS.STATISTICS, {
        gamesPlayed: 0,
        gamesWon: 0,
        bestTime: null,
        totalTime: 0,
        fewestMoves: null,
        currentStreak: 0,
        bestStreak: 0,
        hintsUsed: 0
    }),
    settings: Storage.get(STORAGE_KEYS.SETTINGS, {
        theme: 'dark',
        musicEnabled: true,
        soundEnabled: true,
        animationSpeed: 3,
        language: 'en'
    }),
    progress: Storage.get(STORAGE_KEYS.PROGRESS, {
        unlockedDifficulties: ['noob'],
        difficultyWins: {}
    }),
    // Current game
    currentGame: Storage.get(STORAGE_KEYS.CURRENT_GAME, null),
    customGameConfig: Storage.get(STORAGE_KEYS.CUSTOM_GAME, {
        bottleCount: 7,
        height: 4,
        colors: ['ruby', 'emerald', 'sapphire', 'amethyst'],
        emptyBottles: 2,
        animationSpeed: 3
    }),
    // Transient
    screen: 'menu',
    game: null,
    selectedBottle: null,
    undoStack: [],
    hintUsed: false,
    gameTimerInterval: null,
    gameStartTime: null,
    devModeActive: false,
    logoClickCount: 0,
    logoClickTimer: null,
    playDifficulty: null,
    animating: false        // lock during pour animation
};

// ==================== GAME STATE FACTORY ====================
function createGameState(bottleCount, height, colorNames, emptyBottleCount) {
    return {
        bottles: [],          // will be set by generator
        height,
        colorNames,
        moves: 0,
        startTime: Date.now(),
        elapsedTime: 0,
        completed: false
    };
}

// ==================== GAME LOGIC ====================
const GameLogic = {
    getTopGroup(bottle) {
        if (bottle.length === 0) return { color: null, count: 0 };
        const topColor = bottle[bottle.length - 1];
        let count = 0;
        for (let i = bottle.length - 1; i >= 0; i--) {
            if (bottle[i] === topColor) count++;
            else break;
        }
        return { color: topColor, count };
    },

    isValidMove(sourceBottle, destBottle, maxHeight) {
        if (sourceBottle.length === 0) return false;
        const sourceGroup = this.getTopGroup(sourceBottle);
        if (destBottle.length === 0) return true;
        const destTop = destBottle[destBottle.length - 1];
        if (destTop !== sourceGroup.color) return false;
        if (destBottle.length + sourceGroup.count > maxHeight) return false;
        return true;
    },

    executeMove(bottles, fromIdx, toIdx, height) {
        const newBottles = bottles.map(b => [...b]);
        const source = newBottles[fromIdx];
        const dest = newBottles[toIdx];
        const group = this.getTopGroup(source);
        if (group.count === 0) return null;
        if (!this.isValidMove(source, dest, height)) return null;
        const movingGems = source.splice(source.length - group.count, group.count);
        dest.push(...movingGems);
        return newBottles;
    },

    isBottleComplete(bottle, height) {
        if (bottle.length === 0) return true;
        if (bottle.length !== height) return false;
        return bottle.every(gem => gem === bottle[0]);
    },

    isWin(bottles, height) {
        return bottles.every(b => this.isBottleComplete(b, height));
    },

    findValidMoves(bottles, height) {
        const moves = [];
        for (let i = 0; i < bottles.length; i++) {
            for (let j = 0; j < bottles.length; j++) {
                if (i === j) continue;
                if (this.isValidMove(bottles[i], bottles[j], height)) {
                    moves.push({ from: i, to: j });
                }
            }
        }
        return moves;
    },

    isDeadlock(bottles, height) {
        const moves = this.findValidMoves(bottles, height);
        if (moves.length === 0) return true;
        for (const move of moves) {
            const fromBottle = bottles[move.from];
            const toBottle = bottles[move.to];
            if (toBottle.length === height) continue;
            if (this.isBottleComplete(fromBottle, height) && toBottle.length === 0) continue;
            return false;
        }
        return true;
    },

    // Generates a guaranteed solvable and unsolved board
    generateSolvableBoard(bottleCount, height, colorNames, emptyBottleCount) {
        const maxAttempts = 500;
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const board = this._randomBoard(bottleCount, height, colorNames, emptyBottleCount);
            if (this.isWin(board, height)) continue;   // already solved, try again
            if (this._isSolvable(board, height)) {
                return board;
            }
        }
        // Fallback: return the last generated board (possibly unsolvable) – should not happen
        console.warn('Could not generate solvable board after many attempts, returning random board.');
        return this._randomBoard(bottleCount, height, colorNames, emptyBottleCount);
    },

    // Create a random distribution of gems into bottles
    _randomBoard(bottleCount, height, colorNames, emptyBottleCount) {
        const bottles = Array.from({ length: bottleCount }, () => []);
        // Collect all gems (height of each color)
        const allGems = [];
        colorNames.forEach(color => {
            for (let i = 0; i < height; i++) allGems.push(color);
        });
        // Shuffle gems
        shuffleArray(allGems);
        // Determine non-empty bottle indices (first N bottles, rest are empty)
        const nonEmptyIndices = Array.from({ length: bottleCount - emptyBottleCount }, (_, i) => i);
        // Randomly assign each gem to a non-empty bottle that still has space
        for (const gem of allGems) {
            // collect available bottles (with free space)
            const available = nonEmptyIndices.filter(idx => bottles[idx].length < height);
            if (available.length === 0) {
                // This can happen if capacity is less than total gems (should not)
                console.error('Not enough capacity for all gems, check puzzle parameters');
                break;
            }
            const randomIdx = available[Math.floor(Math.random() * available.length)];
            bottles[randomIdx].push(gem);
        }
        // Shuffle the order of bottles to avoid bias
        return shuffleArray(bottles);
    },

    // Simple BFS solver with state limit
    _isSolvable(initialBottles, height) {
        const MAX_STATES = 25000;
        const stateToString = (bottles) => JSON.stringify(bottles.map(b => [...b].sort()));
        const startState = deepClone(initialBottles);
        if (this.isWin(startState, height)) return true;
        const visited = new Set();
        visited.add(stateToString(startState));
        const queue = [startState];
        let stateCount = 0;

        while (queue.length > 0 && stateCount < MAX_STATES) {
            const current = queue.shift();
            stateCount++;
            const moves = this.findValidMoves(current, height);
            for (const move of moves) {
                const next = this.executeMove(current, move.from, move.to, height);
                if (!next) continue;
                if (this.isWin(next, height)) return true;
                const nextStr = stateToString(next);
                if (!visited.has(nextStr)) {
                    visited.add(nextStr);
                    queue.push(next);
                }
            }
        }
        return false;
    }
};

// ==================== ANIMATION HELPER ====================
function animatePour(fromElement, toElement, gemsCount, duration = 300) {
    return new Promise(resolve => {
        const gemElements = fromElement.querySelectorAll('.gemstone');
        if (gemElements.length === 0) { resolve(); return; }
        const movingGems = [];
        for (let i = gemElements.length - 1; i >= Math.max(0, gemElements.length - gemsCount); i--) {
            movingGems.push(gemElements[i]);
        }
        movingGems.forEach(g => g.style.opacity = '0');
        const fromRect = fromElement.getBoundingClientRect();
        const toRect = toElement.getBoundingClientRect();
        const clones = movingGems.map((gem, index) => {
            const clone = gem.cloneNode(true);
            clone.style.position = 'fixed';
            clone.style.zIndex = '500';
            clone.style.left = fromRect.left + fromRect.width / 2 - gem.offsetWidth / 2 + 'px';
            clone.style.top = fromRect.bottom - (movingGems.length - index) * (gem.offsetHeight + 2) - gem.offsetHeight / 2 + 'px';
            clone.style.transition = `all ${duration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`;
            clone.style.pointerEvents = 'none';
            document.body.appendChild(clone);
            return clone;
        });
        clones[0].offsetHeight;
        const destStack = toElement.querySelector('.bottle-gems-stack');
        const existingGems = destStack ? destStack.children.length : 0;
        const gemHeight = movingGems[0] ? movingGems[0].offsetHeight : 28;
        clones.forEach((clone, i) => {
            const targetX = toRect.left + toRect.width / 2 - clone.offsetWidth / 2;
            const targetY = toRect.bottom - (existingGems + i) * (gemHeight + 1) - gemHeight / 2 - 4;
            clone.style.left = targetX + 'px';
            clone.style.top = targetY + 'px';
        });
        setTimeout(() => {
            clones.forEach(c => c.remove());
            resolve();
        }, duration);
    });
}

// ==================== RENDERER ====================
const Renderer = {
    bottlesArea: document.getElementById('bottlesArea'),

    clearBottles() {
        this.bottlesArea.innerHTML = '';
    },

    createBottleElement(bottleIndex, bottleData, height, isSelected = false, hintGlow = false, completed = false) {
        const container = document.createElement('div');
        container.className = 'bottle-container';
        container.setAttribute('data-index', bottleIndex);
        container.setAttribute('tabindex', '0');
        if (isSelected) container.classList.add('selected');
        if (hintGlow) container.classList.add('hint-glow');
        if (completed) container.classList.add('completed');

        const glass = document.createElement('div');
        glass.className = 'bottle-glass';

        const stack = document.createElement('div');
        stack.className = 'bottle-gems-stack';

        bottleData.forEach(colorName => {
            const gemColor = getGemColorData(colorName);
            const gem = this.createGemElement(gemColor.cssClass);
            stack.appendChild(gem);
        });

        glass.appendChild(stack);
        container.appendChild(glass);
        return container;
    },

    createGemElement(cssClass) {
        const gem = document.createElement('div');
        gem.className = `gemstone ${cssClass}`;
        gem.innerHTML = `
            <div class="gem-facet gem-facet-top"></div>
            <div class="gem-facet gem-facet-ul"></div>
            <div class="gem-facet gem-facet-ur"></div>
            <div class="gem-facet gem-facet-ll"></div>
            <div class="gem-facet gem-facet-lr"></div>
            <div class="gem-shine"></div>
        `;
        return gem;
    },

    renderBoard(gameState, selectedIndex = -1, hintMove = null) {
        this.clearBottles();
        const { bottles, height } = gameState;
        bottles.forEach((bottle, idx) => {
            const isSelected = idx === selectedIndex;
            let hintGlow = false;
            if (hintMove && (idx === hintMove.from || idx === hintMove.to)) {
                hintGlow = true;
            }
            const completed = GameLogic.isBottleComplete(bottle, height);
            const bottleEl = this.createBottleElement(idx, bottle, height, isSelected, hintGlow, completed);
            this.bottlesArea.appendChild(bottleEl);
        });
    },

    updateMoveCounter(moves) {
        document.getElementById('moveCount').textContent = moves;
    },

    updateTimeDisplay(seconds) {
        document.getElementById('timeDisplay').textContent = formatTime(seconds);
    },

    updateGameDiamonds(count) {
        document.getElementById('gameDiamonds').textContent = count;
    },

    updateHeaderCoins() {
        document.getElementById('coinsAmount').textContent = AppState.coins;
    },

    shakeBottle(index) {
        const bottleEl = this.bottlesArea.querySelector(`[data-index="${index}"]`);
        if (!bottleEl) return;
        bottleEl.classList.add('shaking');
        setTimeout(() => bottleEl.classList.remove('shaking'), 500);
    }
};

// ==================== UI MANAGER ====================
const UI = {
    screens: {
        menu: document.getElementById('screenMenu'),
        difficulty: document.getElementById('screenDifficulty'),
        game: document.getElementById('screenGame'),
        custom: document.getElementById('screenCustom'),
        stats: document.getElementById('screenStats'),
        settings: document.getElementById('screenSettings'),
        collection: document.getElementById('screenCollection')
    },

    showScreen(screenId) {
        Object.values(this.screens).forEach(s => s.classList.remove('active'));
        const screen = this.screens[screenId];
        if (screen) screen.classList.add('active');
        AppState.screen = screenId;
        const headerTitle = document.getElementById('headerTitle');
        const btnBack = document.getElementById('btnBack');
        switch (screenId) {
            case 'menu':
                headerTitle.textContent = 'Gemstone Sort';
                btnBack.style.visibility = 'hidden';
                break;
            case 'difficulty':
                headerTitle.textContent = 'Select Difficulty';
                btnBack.style.visibility = 'visible';
                break;
            case 'game':
                headerTitle.textContent = AppState.playDifficulty ? DIFFICULTIES[AppState.playDifficulty]?.name + ' Mode' : 'Custom Game';
                btnBack.style.visibility = 'hidden';
                break;
            case 'custom':
                headerTitle.textContent = 'Custom Game';
                btnBack.style.visibility = 'visible';
                break;
            case 'stats':
                headerTitle.textContent = 'Statistics';
                btnBack.style.visibility = 'visible';
                break;
            case 'settings':
                headerTitle.textContent = 'Settings';
                btnBack.style.visibility = 'visible';
                break;
            case 'collection':
                headerTitle.textContent = 'Collection';
                btnBack.style.visibility = 'visible';
                break;
        }
        document.getElementById('headerCoins').style.display = (screenId === 'game' || screenId === 'menu') ? 'flex' : 'none';
    },

    showModal(modalId) {
        document.getElementById('modalOverlay').classList.add('active');
        document.getElementById(modalId).style.display = 'block';
    },

    hideAllModals() {
        document.getElementById('modalOverlay').classList.remove('active');
        document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
    },

    showToast(message, duration = 2500) {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), duration);
    },

    refreshDifficultyGrid() {
        const grid = document.getElementById('difficultyGrid');
        grid.innerHTML = '';
        const difficulties = Object.entries(DIFFICULTIES);
        difficulties.forEach(([key, diff]) => {
            const card = document.createElement('div');
            card.className = 'difficulty-card';
            const isUnlocked = AppState.progress.unlockedDifficulties.includes(key);
            const wins = AppState.progress.difficultyWins[key] || 0;
            const targetWins = diff.winTarget;
            if (!isUnlocked) {
                card.classList.add('locked');
                card.innerHTML = `<div class="diff-name">${diff.name}</div><div class="diff-info">Complete previous difficulty</div><div class="diff-lock">🔒</div>`;
            } else {
                card.classList.add('available');
                if (wins >= targetWins) card.classList.add('completed');
                card.innerHTML = `<div class="diff-name">${diff.name}</div><div class="diff-info">${diff.bottleCount} bottles · ${diff.height} height · ${diff.colors} colors</div>`;
                if (wins >= targetWins) {
                    card.innerHTML += `<div class="diff-check">✅</div>`;
                }
                card.innerHTML += `<div class="diff-progress">Wins: ${wins}/${targetWins}</div>`;
                card.addEventListener('click', () => this.startDifficultyGame(key));
            }
            grid.appendChild(card);
        });
    },

    startDifficultyGame(difficultyKey) {
        const diff = DIFFICULTIES[difficultyKey];
        if (!AppState.progress.unlockedDifficulties.includes(difficultyKey)) {
            UI.showToast('This difficulty is locked.');
            return;
        }
        AppState.playDifficulty = difficultyKey;
        const colorNames = PALETTE_PRESETS.classic.slice(0, diff.colors);
        const board = GameLogic.generateSolvableBoard(diff.bottleCount, diff.height, colorNames, diff.emptyBottles);
        AppState.game = createGameState(diff.bottleCount, diff.height, colorNames, diff.emptyBottles);
        AppState.game.bottles = board;
        AppState.game.moves = 0;
        AppState.game.startTime = Date.now();
        AppState.undoStack = [];
        AppState.selectedBottle = null;
        AppState.hintUsed = false;
        AppState.animating = false;
        this.startGameTimer();
        Renderer.renderBoard(AppState.game, -1);
        Renderer.updateMoveCounter(0);
        Renderer.updateGameDiamonds(0);
        UI.showScreen('game');
        UI.hideAllModals();
    },

    startCustomGame() {
        const config = AppState.customGameConfig;
        const colorNames = config.colors.slice();
        if (colorNames.length === 0) {
            UI.showToast('Please select at least one color.');
            return;
        }
        const board = GameLogic.generateSolvableBoard(config.bottleCount, config.height, colorNames, config.emptyBottles);
        AppState.playDifficulty = null;
        AppState.game = createGameState(config.bottleCount, config.height, colorNames, config.emptyBottles);
        AppState.game.bottles = board;
        AppState.game.moves = 0;
        AppState.game.startTime = Date.now();
        AppState.undoStack = [];
        AppState.selectedBottle = null;
        AppState.hintUsed = false;
        AppState.animating = false;
        this.startGameTimer();
        Renderer.renderBoard(AppState.game, -1);
        Renderer.updateMoveCounter(0);
        Renderer.updateGameDiamonds(0);
        UI.showScreen('game');
        UI.hideAllModals();
    },

    startGameTimer() {
        this.stopGameTimer();
        if (!AppState.game) return;
        AppState.gameStartTime = Date.now() - (AppState.game.elapsedTime || 0) * 1000;
        AppState.gameTimerInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - AppState.gameStartTime) / 1000);
            AppState.game.elapsedTime = elapsed;
            Renderer.updateTimeDisplay(elapsed);
        }, 200);
    },

    stopGameTimer() {
        if (AppState.gameTimerInterval) {
            clearInterval(AppState.gameTimerInterval);
            AppState.gameTimerInterval = null;
        }
    },

    handleBottleClick(index) {
        if (!AppState.game || AppState.game.completed || AppState.animating) return;
        const game = AppState.game;
        const bottles = game.bottles;

        if (AppState.selectedBottle === null) {
            if (bottles[index].length === 0) {
                UI.showToast('Empty bottle selected. Choose a bottle with gems.');
                return;
            }
            AppState.selectedBottle = index;
            Renderer.renderBoard(game, index);
        } else {
            const fromIdx = AppState.selectedBottle;
            if (fromIdx === index) {
                AppState.selectedBottle = null;
                Renderer.renderBoard(game, -1);
                return;
            }
            if (GameLogic.isValidMove(bottles[fromIdx], bottles[index], game.height)) {
                AppState.undoStack.push(deepClone(bottles));
                AppState.animating = true;
                const fromEl = Renderer.bottlesArea.querySelector(`[data-index="${fromIdx}"]`);
                const toEl = Renderer.bottlesArea.querySelector(`[data-index="${index}"]`);
                const group = GameLogic.getTopGroup(bottles[fromIdx]);
                animatePour(fromEl, toEl, group.count, 250).then(() => {
                    const newBottles = GameLogic.executeMove(bottles, fromIdx, index, game.height);
                    if (newBottles) {
                        game.bottles = newBottles;
                        game.moves++;
                        Renderer.updateMoveCounter(game.moves);
                    }
                    AppState.selectedBottle = null;
                    AppState.animating = false;
                    Renderer.renderBoard(game, -1);
                    this.checkGameEnd();
                });
            } else {
                Renderer.shakeBottle(index);
                AppState.selectedBottle = null;
                Renderer.renderBoard(game, -1);
            }
        }
    },

    performUndo() {
        if (!AppState.game || AppState.undoStack.length === 0 || AppState.animating) return;
        const prevState = AppState.undoStack.pop();
        AppState.game.bottles = prevState;
        AppState.game.moves = Math.max(0, AppState.game.moves - 1);
        AppState.selectedBottle = null;
        Renderer.renderBoard(AppState.game, -1);
        Renderer.updateMoveCounter(AppState.game.moves);
    },

    useHint() {
        if (!AppState.game || AppState.game.completed) return;
        const moves = GameLogic.findValidMoves(AppState.game.bottles, AppState.game.height);
        if (moves.length === 0) return;
        const usefulMoves = moves.filter(m => {
            const from = AppState.game.bottles[m.from];
            const to = AppState.game.bottles[m.to];
            return !(GameLogic.isBottleComplete(from, AppState.game.height) && to.length === 0);
        });
        const move = usefulMoves.length > 0 ? usefulMoves[Math.floor(Math.random() * usefulMoves.length)] : moves[0];
        AppState.hintUsed = true;
        AppState.statistics.hintsUsed++;
        Storage.set(STORAGE_KEYS.STATISTICS, AppState.statistics);
        Renderer.renderBoard(AppState.game, -1, move);
        setTimeout(() => Renderer.renderBoard(AppState.game, -1), 1500);
    },

    checkGameEnd() {
        const game = AppState.game;
        if (!game) return;
        if (GameLogic.isWin(game.bottles, game.height)) {
            this.stopGameTimer();
            game.completed = true;
            const elapsed = game.elapsedTime;
            const moves = game.moves;
            // Diamonds: one per full sorted bottle (non‑empty)
            const fullCompleted = game.bottles.filter(b => b.length === game.height && b.every(g => g === b[0])).length;
            const diamondsEarned = fullCompleted;
            AppState.coins += diamondsEarned;
            Storage.set(STORAGE_KEYS.COINS, AppState.coins);
            AppState.statistics.gamesPlayed++;
            AppState.statistics.gamesWon++;
            if (!AppState.statistics.bestTime || elapsed < AppState.statistics.bestTime) AppState.statistics.bestTime = elapsed;
            AppState.statistics.totalTime += elapsed;
            if (!AppState.statistics.fewestMoves || moves < AppState.statistics.fewestMoves) AppState.statistics.fewestMoves = moves;
            AppState.statistics.currentStreak++;
            if (AppState.statistics.currentStreak > AppState.statistics.bestStreak) AppState.statistics.bestStreak = AppState.statistics.currentStreak;
            Storage.set(STORAGE_KEYS.STATISTICS, AppState.statistics);
            if (AppState.playDifficulty) {
                const diffKey = AppState.playDifficulty;
                if (!AppState.progress.difficultyWins[diffKey]) AppState.progress.difficultyWins[diffKey] = 0;
                AppState.progress.difficultyWins[diffKey]++;
                const diff = DIFFICULTIES[diffKey];
                if (AppState.progress.difficultyWins[diffKey] >= diff.winTarget) {
                    const diffKeys = Object.keys(DIFFICULTIES);
                    const currentIndex = diffKeys.indexOf(diffKey);
                    if (currentIndex >= 0 && currentIndex < diffKeys.length - 1) {
                        const nextKey = diffKeys[currentIndex + 1];
                        if (!AppState.progress.unlockedDifficulties.includes(nextKey)) {
                            AppState.progress.unlockedDifficulties.push(nextKey);
                            UI.showToast(`New difficulty unlocked: ${DIFFICULTIES[nextKey].name}!`);
                        }
                    }
                }
                Storage.set(STORAGE_KEYS.PROGRESS, AppState.progress);
            }
            document.getElementById('winTime').textContent = formatTime(elapsed);
            document.getElementById('winMoves').textContent = moves;
            document.getElementById('winDiamonds').textContent = `+${diamondsEarned}`;
            document.getElementById('winBest').textContent = AppState.statistics.bestTime ? formatTime(AppState.statistics.bestTime) : '-';
            UI.showModal('modalWin');
            Renderer.updateHeaderCoins();
            Storage.remove(STORAGE_KEYS.CURRENT_GAME);
            AppState.currentGame = null;
        } else if (GameLogic.isDeadlock(game.bottles, game.height)) {
            this.stopGameTimer();
            UI.showModal('modalDeadlock');
        }
        this.saveCurrentGame();
    },

    saveCurrentGame() {
        if (AppState.game && !AppState.game.completed) {
            AppState.currentGame = {
                difficulty: AppState.playDifficulty,
                gameState: AppState.game,
                customConfig: AppState.playDifficulty ? null : AppState.customGameConfig
            };
            Storage.set(STORAGE_KEYS.CURRENT_GAME, AppState.currentGame);
        } else {
            AppState.currentGame = null;
            Storage.remove(STORAGE_KEYS.CURRENT_GAME);
        }
    },

    continueGame() {
        const saved = Storage.get(STORAGE_KEYS.CURRENT_GAME);
        if (!saved || !saved.gameState) {
            UI.showToast('No saved game found.');
            return;
        }
        AppState.playDifficulty = saved.difficulty;
        if (!saved.difficulty && saved.customConfig) {
            AppState.customGameConfig = saved.customConfig;
        }
        AppState.game = saved.gameState;
        AppState.undoStack = [];
        AppState.selectedBottle = null;
        AppState.hintUsed = false;
        AppState.animating = false;
        this.startGameTimer();
        Renderer.renderBoard(AppState.game, -1);
        Renderer.updateMoveCounter(AppState.game.moves);
        Renderer.updateGameDiamonds(0);
        UI.showScreen('game');
    },

    resetGame() {
        if (!AppState.game) return;
        const game = AppState.game;
        const board = GameLogic.generateSolvableBoard(
            game.bottles.length,
            game.height,
            game.colorNames,
            game.bottles.filter(b => b.length === 0).length
        );
        game.bottles = board;
        game.moves = 0;
        game.elapsedTime = 0;
        game.startTime = Date.now();
        game.completed = false;
        AppState.undoStack = [];
        AppState.selectedBottle = null;
        AppState.hintUsed = false;
        AppState.animating = false;
        this.stopGameTimer();
        this.startGameTimer();
        Renderer.renderBoard(game, -1);
        Renderer.updateMoveCounter(0);
        Renderer.updateGameDiamonds(0);
        UI.hideAllModals();
    },

    quitToMenu() {
        this.stopGameTimer();
        this.saveCurrentGame();
        AppState.game = null;
        AppState.selectedBottle = null;
        AppState.undoStack = [];
        AppState.animating = false;
        UI.hideAllModals();
        UI.showScreen('menu');
        this.refreshContinueButton();
    }
};

// ==================== EVENT HANDLERS ====================
function setupEventListeners() {
    Renderer.bottlesArea.addEventListener('click', (e) => {
        const bottleContainer = e.target.closest('.bottle-container');
        if (!bottleContainer) return;
        const index = parseInt(bottleContainer.getAttribute('data-index'));
        if (!isNaN(index)) {
            UI.handleBottleClick(index);
        }
    });

    document.getElementById('btnBack').addEventListener('click', () => {
        if (['difficulty', 'custom', 'stats', 'settings', 'collection'].includes(AppState.screen)) {
            UI.showScreen('menu');
            UI.refreshContinueButton();
        }
    });

    document.getElementById('btnPlay').addEventListener('click', () => {
        UI.showScreen('difficulty');
        UI.refreshDifficultyGrid();
    });
    document.getElementById('btnContinue').addEventListener('click', () => UI.continueGame());
    document.getElementById('btnCustomGame').addEventListener('click', () => {
        UI.showScreen('custom');
        updateCustomFormFromState();
    });
    document.getElementById('btnStatistics').addEventListener('click', () => {
        UI.showScreen('stats');
        updateStatsDisplay();
    });
    document.getElementById('btnCollection').addEventListener('click', () => UI.showScreen('collection'));
    document.getElementById('btnSettingsMenu').addEventListener('click', () => {
        UI.showScreen('settings');
        loadSettingsToForm();
    });

    document.getElementById('btnDiffBack').addEventListener('click', () => UI.showScreen('menu'));

    document.getElementById('btnUndo').addEventListener('click', UI.performUndo);
    document.getElementById('btnHint').addEventListener('click', UI.useHint);
    document.getElementById('btnRestart').addEventListener('click', () => {
        if (AppState.game && confirm('Restart this level?')) UI.resetGame();
    });
    document.getElementById('btnQuitGame').addEventListener('click', () => UI.showModal('modalConfirmQuit'));

    document.getElementById('btnNextLevel').addEventListener('click', () => {
        UI.hideAllModals();
        AppState.playDifficulty ? UI.startDifficultyGame(AppState.playDifficulty) : UI.startCustomGame();
    });
    document.getElementById('btnReplayWin').addEventListener('click', () => {
        UI.hideAllModals();
        UI.resetGame();
    });
    document.getElementById('btnWinMenu').addEventListener('click', () => {
        UI.hideAllModals();
        UI.quitToMenu();
    });

    document.getElementById('btnDeadlockRestart').addEventListener('click', () => {
        UI.hideAllModals();
        UI.resetGame();
    });
    document.getElementById('btnDeadlockUndo').addEventListener('click', () => {
        UI.hideAllModals();
        UI.performUndo();
        if (AppState.game && GameLogic.isDeadlock(AppState.game.bottles, AppState.game.height)) {
            UI.showModal('modalDeadlock');
        } else {
            UI.startGameTimer();
        }
    });
    document.getElementById('btnDeadlockMenu').addEventListener('click', () => {
        UI.hideAllModals();
        UI.quitToMenu();
    });

    document.getElementById('btnConfirmQuitYes').addEventListener('click', () => {
        UI.hideAllModals();
        UI.quitToMenu();
    });
    document.getElementById('btnConfirmQuitNo').addEventListener('click', () => UI.hideAllModals());

    document.getElementById('btnResetProgress').addEventListener('click', () => UI.showModal('modalConfirmReset'));
    document.getElementById('btnConfirmResetYes').addEventListener('click', () => {
        resetAllProgress();
        UI.hideAllModals();
        UI.showScreen('menu');
        UI.refreshContinueButton();
        UI.showToast('All progress has been reset.');
    });
    document.getElementById('btnConfirmResetNo').addEventListener('click', () => UI.hideAllModals());

    document.getElementById('settingTheme').addEventListener('change', (e) => {
        AppState.settings.theme = e.target.value;
        applyTheme(AppState.settings.theme);
        Storage.set(STORAGE_KEYS.SETTINGS, AppState.settings);
    });
    document.getElementById('settingMusic').addEventListener('change', (e) => {
        AppState.settings.musicEnabled = e.target.checked;
        Storage.set(STORAGE_KEYS.SETTINGS, AppState.settings);
    });
    document.getElementById('settingSound').addEventListener('change', (e) => {
        AppState.settings.soundEnabled = e.target.checked;
        Storage.set(STORAGE_KEYS.SETTINGS, AppState.settings);
    });
    document.getElementById('settingAnimSpeed').addEventListener('change', (e) => {
        AppState.settings.animationSpeed = parseInt(e.target.value);
        Storage.set(STORAGE_KEYS.SETTINGS, AppState.settings);
    });

    document.getElementById('customBottleCount').addEventListener('input', (e) => {
        const val = e.target.value;
        document.getElementById('customBottleCountVal').textContent = val;
        AppState.customGameConfig.bottleCount = parseInt(val);
    });
    document.getElementById('customBottleHeight').addEventListener('input', (e) => {
        const val = e.target.value;
        document.getElementById('customBottleHeightVal').textContent = val;
        AppState.customGameConfig.height = parseInt(val);
        updateCustomColorCount();   // stub
    });
    document.getElementById('customColorCount').addEventListener('input', (e) => {
        const val = e.target.value;
        document.getElementById('customColorCountVal').textContent = val;
        updateCustomColorsFromCount(parseInt(val));
    });
    document.getElementById('customEmptyBottles').addEventListener('input', (e) => {
        const val = e.target.value;
        document.getElementById('customEmptyBottlesVal').textContent = val;
        AppState.customGameConfig.emptyBottles = parseInt(val);
    });
    document.getElementById('customAnimSpeed').addEventListener('input', (e) => {
        const val = e.target.value;
        const labels = ['Very Slow', 'Slow', 'Normal', 'Fast', 'Very Fast'];
        document.getElementById('customAnimSpeedVal').textContent = labels[val - 1];
        AppState.customGameConfig.animationSpeed = parseInt(val);
    });
    document.querySelectorAll('.btn-palette').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.btn-palette').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const paletteName = btn.dataset.palette;
            const colors = PALETTE_PRESETS[paletteName] || PALETTE_PRESETS.classic;
            AppState.customGameConfig.colors = [...colors];
            updateCustomColorEditor();
            document.getElementById('customColorCount').value = colors.length;
            document.getElementById('customColorCountVal').textContent = colors.length;
            Storage.set(STORAGE_KEYS.CUSTOM_GAME, AppState.customGameConfig);
        });
    });
    document.getElementById('btnStartCustom').addEventListener('click', () => {
        Storage.set(STORAGE_KEYS.CUSTOM_GAME, AppState.customGameConfig);
        UI.startCustomGame();
    });
    document.getElementById('btnCustomBack').addEventListener('click', () => UI.showScreen('menu'));

    document.getElementById('btnStatsBack').addEventListener('click', () => UI.showScreen('menu'));
    document.getElementById('btnCollectionBack').addEventListener('click', () => UI.showScreen('menu'));

    document.getElementById('logoGem').addEventListener('click', () => {
        AppState.logoClickCount++;
        if (AppState.logoClickTimer) clearTimeout(AppState.logoClickTimer);
        AppState.logoClickTimer = setTimeout(() => { AppState.logoClickCount = 0; }, 2000);
        if (AppState.logoClickCount >= 5) {
            AppState.logoClickCount = 0;
            toggleDevMode();
        }
    });

    const devInput = document.getElementById('devCommandInput');
    devInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const command = devInput.value.trim().toLowerCase();
            handleDevCommand(command);
            devInput.value = '';
            devInput.style.display = 'none';
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
        switch (e.key.toUpperCase()) {
            case 'R': if (AppState.screen === 'game') UI.resetGame(); break;
            case 'U': if (AppState.screen === 'game') UI.performUndo(); break;
            case 'H': if (AppState.screen === 'game') UI.useHint(); break;
            case 'ESCAPE':
                UI.hideAllModals();
                if (AppState.screen === 'game' && AppState.selectedBottle !== null) {
                    AppState.selectedBottle = null;
                    Renderer.renderBoard(AppState.game, -1);
                }
                break;
        }
    });

    document.getElementById('modalOverlay').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) UI.hideAllModals();
    });
}

// ==================== CUSTOM GAME HELPERS ====================
function updateCustomFormFromState() {
    const cfg = AppState.customGameConfig;
    document.getElementById('customBottleCount').value = cfg.bottleCount;
    document.getElementById('customBottleCountVal').textContent = cfg.bottleCount;
    document.getElementById('customBottleHeight').value = cfg.height;
    document.getElementById('customBottleHeightVal').textContent = cfg.height;
    document.getElementById('customColorCount').value = cfg.colors.length;
    document.getElementById('customColorCountVal').textContent = cfg.colors.length;
    document.getElementById('customEmptyBottles').value = cfg.emptyBottles;
    document.getElementById('customEmptyBottlesVal').textContent = cfg.emptyBottles;
    document.getElementById('customAnimSpeed').value = cfg.animationSpeed;
    const labels = ['Very Slow', 'Slow', 'Normal', 'Fast', 'Very Fast'];
    document.getElementById('customAnimSpeedVal').textContent = labels[cfg.animationSpeed - 1];
    document.querySelectorAll('.btn-palette').forEach(b => b.classList.remove('active'));
    const currentPalette = Object.entries(PALETTE_PRESETS).find(([k, v]) => JSON.stringify(v) === JSON.stringify(cfg.colors));
    if (currentPalette) {
        const btn = document.querySelector(`.btn-palette[data-palette="${currentPalette[0]}"]`);
        if (btn) btn.classList.add('active');
    }
    updateCustomColorEditor();
}

function updateCustomColorEditor() {
    const editor = document.getElementById('customColorEditor');
    editor.innerHTML = '';
    AppState.customGameConfig.colors.forEach((colorName, idx) => {
        const gemColor = getGemColorData(colorName);
        const swatch = document.createElement('div');
        swatch.className = 'custom-color-swatch';
        swatch.style.background = gemColor.hex;
        swatch.title = gemColor.name;
        swatch.addEventListener('click', () => openColorEditor(idx));
        editor.appendChild(swatch);
    });
}

function openColorEditor(index) {
    const colorName = AppState.customGameConfig.colors[index];
    const gemColor = getGemColorData(colorName);
    document.getElementById('colorHexInput').value = gemColor.hex;
    document.getElementById('colorPickerInput').value = gemColor.hex;
    updateColorPreview(gemColor.hex);
    UI.showModal('modalColorEditor');
    document.getElementById('modalColorEditor')._editIndex = index;
}

function updateColorPreview(hex) {
    const preview = document.getElementById('colorPreviewGem');
    preview.innerHTML = `
        <div class="gem-facet gem-facet-top" style="background: linear-gradient(180deg, ${lightenColor(hex, 40)} 0%, ${hex} 60%, ${darkenColor(hex, 20)} 100%);"></div>
        <div class="gem-facet gem-facet-ul" style="background: linear-gradient(135deg, ${hex} 0%, ${darkenColor(hex, 30)} 100%);"></div>
        <div class="gem-facet gem-facet-ur" style="background: linear-gradient(225deg, ${lightenColor(hex, 20)} 0%, ${darkenColor(hex, 15)} 100%);"></div>
        <div class="gem-facet gem-facet-ll" style="background: linear-gradient(180deg, ${darkenColor(hex, 30)} 0%, ${darkenColor(hex, 45)} 100%);"></div>
        <div class="gem-facet gem-facet-lr" style="background: linear-gradient(180deg, ${darkenColor(hex, 15)} 0%, ${darkenColor(hex, 35)} 100%);"></div>
        <div class="gem-shine"></div>
    `;
}

function lightenColor(hex, percent) {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.min(255, (num >> 16) + percent);
    const g = Math.min(255, ((num >> 8) & 0x00FF) + percent);
    const b = Math.min(255, (num & 0x0000FF) + percent);
    return `#${(0x1000000 + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}
function darkenColor(hex, percent) {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.max(0, (num >> 16) - percent);
    const g = Math.max(0, ((num >> 8) & 0x00FF) - percent);
    const b = Math.max(0, (num & 0x0000FF) - percent);
    return `#${(0x1000000 + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

document.getElementById('colorHexInput').addEventListener('input', (e) => {
    let hex = e.target.value;
    if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
        document.getElementById('colorPickerInput').value = hex;
        updateColorPreview(hex);
    }
});
document.getElementById('colorPickerInput').addEventListener('input', (e) => {
    const hex = e.target.value;
    document.getElementById('colorHexInput').value = hex;
    updateColorPreview(hex);
});
document.getElementById('btnColorReset').addEventListener('click', () => {
    const index = document.getElementById('modalColorEditor')._editIndex;
    const defaultColor = PALETTE_PRESETS.classic[index % PALETTE_PRESETS.classic.length] || 'ruby';
    const gemColor = getGemColorData(defaultColor);
    document.getElementById('colorHexInput').value = gemColor.hex;
    document.getElementById('colorPickerInput').value = gemColor.hex;
    updateColorPreview(gemColor.hex);
    AppState.customGameConfig.colors[index] = defaultColor;
    updateCustomColorEditor();
});
document.getElementById('btnColorRandom').addEventListener('click', () => {
    const randomHex = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
    document.getElementById('colorHexInput').value = randomHex;
    document.getElementById('colorPickerInput').value = randomHex;
    updateColorPreview(randomHex);
});
document.getElementById('btnColorApply').addEventListener('click', () => {
    const index = document.getElementById('modalColorEditor')._editIndex;
    const hex = document.getElementById('colorHexInput').value;
    if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
        let colorName;
        const existing = GEM_COLORS.find(c => c.hex.toLowerCase() === hex.toLowerCase());
        if (existing) {
            colorName = existing.name;
        } else {
            let closest = GEM_COLORS[0];
            let minDist = Infinity;
            GEM_COLORS.forEach(c => {
                const dist = colorDistance(hex, c.hex);
                if (dist < minDist) { minDist = dist; closest = c; }
            });
            colorName = closest.name;
        }
        AppState.customGameConfig.colors[index] = colorName;
        Storage.set(STORAGE_KEYS.CUSTOM_GAME, AppState.customGameConfig);
        updateCustomColorEditor();
        UI.hideAllModals();
        UI.showToast('Color updated.');
    } else {
        UI.showToast('Invalid HEX color.');
    }
});

function colorDistance(hex1, hex2) {
    const r1 = parseInt(hex1.slice(1,3), 16), g1 = parseInt(hex1.slice(3,5), 16), b1 = parseInt(hex1.slice(5,7), 16);
    const r2 = parseInt(hex2.slice(1,3), 16), g2 = parseInt(hex2.slice(3,5), 16), b2 = parseInt(hex2.slice(5,7), 16);
    return Math.sqrt((r1-r2)**2 + (g1-g2)**2 + (b1-b2)**2);
}

function updateCustomColorsFromCount(count) {
    const currentColors = AppState.customGameConfig.colors;
    const palette = PALETTE_PRESETS.classic;
    while (currentColors.length < count) {
        const nextColor = palette[currentColors.length % palette.length];
        currentColors.push(nextColor);
    }
    if (currentColors.length > count) {
        currentColors.length = count;
    }
    AppState.customGameConfig.colors = [...currentColors];
    updateCustomColorEditor();
    Storage.set(STORAGE_KEYS.CUSTOM_GAME, AppState.customGameConfig);
}

// stub for height change
function updateCustomColorCount() {
    // can be used to auto-adjust color count based on height if needed
}

// ==================== STATISTICS DISPLAY ====================
function updateStatsDisplay() {
    const s = AppState.statistics;
    document.getElementById('statCoins').textContent = AppState.coins;
    document.getElementById('statPlayed').textContent = s.gamesPlayed;
    document.getElementById('statWon').textContent = s.gamesWon;
    document.getElementById('statWinRate').textContent = s.gamesPlayed > 0 ? Math.round((s.gamesWon / s.gamesPlayed) * 100) + '%' : '0%';
    document.getElementById('statBestTime').textContent = s.bestTime ? formatTime(s.bestTime) : '--:--';
    document.getElementById('statAvgTime').textContent = s.gamesPlayed > 0 ? formatTime(Math.round(s.totalTime / s.gamesPlayed)) : '--:--';
    document.getElementById('statFewestMoves').textContent = s.fewestMoves || '-';
    document.getElementById('statStreak').textContent = s.currentStreak;
    document.getElementById('statBestStreak').textContent = s.bestStreak;
    document.getElementById('statHints').textContent = s.hintsUsed;
}

// ==================== SETTINGS ====================
function loadSettingsToForm() {
    const s = AppState.settings;
    document.getElementById('settingTheme').value = s.theme;
    document.getElementById('settingMusic').checked = s.musicEnabled;
    document.getElementById('settingSound').checked = s.soundEnabled;
    document.getElementById('settingAnimSpeed').value = s.animationSpeed;
}

function applyTheme(theme) {
    if (theme === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    } else {
        document.documentElement.setAttribute('data-theme', theme);
    }
}

function resetAllProgress() {
    AppState.coins = 0;
    AppState.statistics = {
        gamesPlayed: 0,
        gamesWon: 0,
        bestTime: null,
        totalTime: 0,
        fewestMoves: null,
        currentStreak: 0,
        bestStreak: 0,
        hintsUsed: 0
    };
    AppState.progress = {
        unlockedDifficulties: ['noob'],
        difficultyWins: {}
    };
    Storage.set(STORAGE_KEYS.COINS, AppState.coins);
    Storage.set(STORAGE_KEYS.STATISTICS, AppState.statistics);
    Storage.set(STORAGE_KEYS.PROGRESS, AppState.progress);
    Storage.remove(STORAGE_KEYS.CURRENT_GAME);
    AppState.currentGame = null;
    Renderer.updateHeaderCoins();
    UI.refreshDifficultyGrid();
    updateStatsDisplay();
}

// ==================== DEV MODE ====================
function toggleDevMode() {
    AppState.devModeActive = !AppState.devModeActive;
    const indicator = document.getElementById('devModeIndicator');
    const input = document.getElementById('devCommandInput');
    if (AppState.devModeActive) {
        indicator.style.display = 'block';
        input.style.display = 'block';
        input.focus();
        UI.showToast('Developer mode activated. Type commands: unlockall, addcoins 1000, resetprogress, resetstats');
    } else {
        indicator.style.display = 'none';
        input.style.display = 'none';
    }
}

function handleDevCommand(command) {
    const parts = command.split(' ');
    const cmd = parts[0];
    switch (cmd) {
        case DEV_COMMANDS.UNLOCK_ALL:
            AppState.progress.unlockedDifficulties = Object.keys(DIFFICULTIES);
            Storage.set(STORAGE_KEYS.PROGRESS, AppState.progress);
            UI.refreshDifficultyGrid();
            UI.showToast('All difficulties unlocked!');
            break;
        case DEV_COMMANDS.ADD_COINS:
            const amount = parseInt(parts[1]) || 0;
            AppState.coins += amount;
            Storage.set(STORAGE_KEYS.COINS, AppState.coins);
            Renderer.updateHeaderCoins();
            UI.showToast(`Added ${amount} diamonds.`);
            break;
        case DEV_COMMANDS.RESET_PROGRESS:
            resetAllProgress();
            UI.showToast('Progress reset.');
            break;
        case DEV_COMMANDS.RESET_STATS:
            AppState.statistics = {
                gamesPlayed: 0, gamesWon: 0, bestTime: null, totalTime: 0,
                fewestMoves: null, currentStreak: 0, bestStreak: 0, hintsUsed: 0
            };
            Storage.set(STORAGE_KEYS.STATISTICS, AppState.statistics);
            updateStatsDisplay();
            UI.showToast('Statistics reset.');
            break;
        default:
            UI.showToast('Unknown command.');
    }
}

// ==================== INITIALIZATION ====================
function init() {
    applyTheme(AppState.settings.theme);
    Renderer.updateHeaderCoins();
    UI.refreshContinueButton = function() {
        const saved = Storage.get(STORAGE_KEYS.CURRENT_GAME);
        document.getElementById('btnContinue').style.display = saved ? 'flex' : 'none';
    };
    UI.refreshContinueButton();
    UI.showScreen('menu');
    setupEventListeners();
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if (AppState.settings.theme === 'system') applyTheme('system');
    });
}

document.addEventListener('DOMContentLoaded', init);
