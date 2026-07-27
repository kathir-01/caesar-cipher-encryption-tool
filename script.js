/**
 * ============================================================================
 * CAESAR CIPHER ENCRYPTION & CRYPTANALYSIS TOOL - CORE ENGINE (ES6+)
 * ============================================================================
 * Production-ready modular architecture powering encryption, decryption,
 * visual alphabet wheel rotation, step-by-step modulo math inspection,
 * brute-force auto-cracking, letter frequency analysis, and operation history.
 */

'use strict';

// ----------------------------------------------------------------------------
// 1. APPLICATION STATE MANAGEMENT & CONSTANTS
// ----------------------------------------------------------------------------
const ENGLISH_FREQUENCIES = {
    A: 8.17, B: 1.49, C: 2.78, D: 4.25, E: 12.70, F: 2.23, G: 2.01, H: 6.09,
    I: 6.97, J: 0.15, K: 0.77, L: 4.03, M: 2.41, N: 6.75, O: 7.51, P: 1.93,
    Q: 0.10, R: 5.98, S: 6.33, T: 9.06, U: 2.75, V: 0.98, W: 2.36, X: 0.15,
    Y: 1.97, Z: 0.07
};

const STORAGE_KEYS = {
    THEME: 'caesar_theme_v2',
    SOUND: 'caesar_sound_v2',
    ANIM: 'caesar_anim_v2',
    SHIFT: 'caesar_shift_v2',
    MODE: 'caesar_mode_v2',
    LIVE: 'caesar_live_v2',
    HISTORY: 'caesar_history_v2'
};

const state = {
    mode: 'encrypt', // 'encrypt' | 'decrypt'
    shift: 3,        // 1 - 25
    isLive: false,
    soundEnabled: true,
    animEnabled: true,
    theme: 'dark',
    history: []
};

// Audio Synthesizer Context
let audioCtx = null;

// ----------------------------------------------------------------------------
// 2. DOM ELEMENT REFERENCES
// ----------------------------------------------------------------------------
const DOM = {
    // Navigation Tabs & Views
    navTabs: document.querySelectorAll('.nav-tab'),
    tabViews: document.querySelectorAll('.tab-view'),
    
    // Header & Global Controls
    themeSelect: document.getElementById('themeSelect'),
    soundToggle: document.getElementById('soundToggle'),
    animToggle: document.getElementById('animToggle'),
    shortcutsBtn: document.getElementById('shortcutsBtn'),
    liveStatusPill: document.getElementById('liveStatusPill'),
    
    // Studio Mode & Toggles
    btnModeEncrypt: document.getElementById('btnModeEncrypt'),
    btnModeDecrypt: document.getElementById('btnModeDecrypt'),
    liveToggle: document.getElementById('liveToggle'),
    btnQuickClear: document.getElementById('btnQuickClear'),
    
    // Workspace Inputs & Textareas
    inputText: document.getElementById('inputText'),
    outputText: document.getElementById('outputText'),
    dropZone: document.getElementById('dropZone'),
    fileImportInput: document.getElementById('fileImportInput'),
    btnClearInput: document.getElementById('btnClearInput'),
    
    // Shift Controls
    shiftSlider: document.getElementById('shiftSlider'),
    shiftNumber: document.getElementById('shiftNumber'),
    presetChips: document.querySelectorAll('.preset-chip[data-shift]'),
    btnRandomShift: document.getElementById('btnRandomShift'),
    
    // Action Buttons
    btnExecute: document.getElementById('btnExecute'),
    btnExecuteText: document.getElementById('btnExecuteText'),
    btnSwap: document.getElementById('btnSwap'),
    btnReset: document.getElementById('btnReset'),
    btnCopy: document.getElementById('btnCopy'),
    btnDownloadTxt: document.getElementById('btnDownloadTxt'),
    btnOutputToInput: document.getElementById('btnOutputToInput'),
    
    // Statistics & Preview
    characterMappingBar: document.getElementById('characterMappingBar'),
    statChars: document.getElementById('statChars'),
    statLetters: document.getElementById('statLetters'),
    statUpper: document.getElementById('statUpper'),
    statLower: document.getElementById('statLower'),
    statNums: document.getElementById('statNums'),
    statSymbols: document.getElementById('statSymbols'),
    statSpaces: document.getElementById('statSpaces'),
    statShift: document.getElementById('statShift'),
    
    // Alphabet Wheel & Steps Tab
    wheelShiftLabel: document.getElementById('wheelShiftLabel'),
    caesarWheelSvg: document.getElementById('caesarWheelSvg'),
    stepsTableBody: document.getElementById('stepsTableBody'),
    
    // Cryptanalysis Tab
    btnRunBruteForce: document.getElementById('btnRunBruteForce'),
    bruteForceTableBody: document.getElementById('bruteForceTableBody'),
    freqChartContainer: document.getElementById('freqChartContainer'),
    
    // History Tab
    historySearch: document.getElementById('historySearch'),
    historyFilter: document.getElementById('historyFilter'),
    historyList: document.getElementById('historyList'),
    btnExportHistory: document.getElementById('btnExportHistory'),
    btnImportHistoryInput: document.getElementById('btnImportHistoryInput'),
    btnClearHistory: document.getElementById('btnClearHistory'),
    
    // Modals & Toasts
    modalShortcuts: document.getElementById('modalShortcuts'),
    btnCloseModal: document.getElementById('btnCloseModal'),
    toastContainer: document.getElementById('toastContainer')
};

// ----------------------------------------------------------------------------
// 3. CAESAR CIPHER ALGORITHM & MATH ENGINE
// ----------------------------------------------------------------------------

/**
 * Core Caesar Cipher Transformation
 * @param {string} text - Plaintext or Ciphertext input
 * @param {number} shiftKey - Integer shift offset (1-25)
 * @param {boolean} decrypt - True for decryption, False for encryption
 * @returns {string} - Transformed output string
 */
function caesarCipher(text, shiftKey, decrypt = false) {
    if (!text) return '';

    // Normalize shift key between 0 and 25
    let effectiveShift = parseInt(shiftKey, 10) % 26;
    if (isNaN(effectiveShift)) effectiveShift = 3;
    if (decrypt) {
        effectiveShift = (26 - effectiveShift) % 26;
    }

    return text.split('').map(char => {
        const code = char.charCodeAt(0);

        // Uppercase A-Z (ASCII 65 - 90)
        if (code >= 65 && code <= 90) {
            return String.fromCharCode(((code - 65 + effectiveShift) % 26) + 65);
        }
        // Lowercase a-z (ASCII 97 - 122)
        if (code >= 97 && code <= 122) {
            return String.fromCharCode(((code - 97 + effectiveShift) % 26) + 97);
        }

        // Numbers, symbols, spaces, linebreaks remain unshifted
        return char;
    }).join('');
}

/**
 * Calculates Text Analytics and Character Distributions
 */
function updateTextStatistics(text) {
    const chars = text.length;
    let letters = 0, upper = 0, lower = 0, nums = 0, symbols = 0, spaces = 0;

    for (let i = 0; i < text.length; i++) {
        const code = text.charCodeAt(i);
        if (code >= 65 && code <= 90) {
            letters++;
            upper++;
        } else if (code >= 97 && code <= 122) {
            letters++;
            lower++;
        } else if (code >= 48 && code <= 57) {
            nums++;
        } else if (code === 32 || code === 9 || code === 10) {
            spaces++;
        } else {
            symbols++;
        }
    }

    DOM.statChars.textContent = chars.toLocaleString();
    DOM.statLetters.textContent = letters.toLocaleString();
    DOM.statUpper.textContent = upper.toLocaleString();
    DOM.statLower.textContent = lower.toLocaleString();
    DOM.statNums.textContent = nums.toLocaleString();
    DOM.statSymbols.textContent = symbols.toLocaleString();
    DOM.statSpaces.textContent = spaces.toLocaleString();
    DOM.statShift.textContent = state.shift;
}

/**
 * Renders Character Key Shift Preview Bar (e.g. A->D, B->E...)
 */
function renderMappingPreviewBar(shift) {
    DOM.characterMappingBar.innerHTML = '';
    const sample = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const effectiveShift = state.mode === 'decrypt' ? (26 - shift) % 26 : shift;

    for (let i = 0; i < 26; i++) {
        const origChar = sample[i];
        const shiftedChar = sample[(i + effectiveShift) % 26];

        const pill = document.createElement('div');
        pill.className = 'map-pill';
        pill.innerHTML = `<span class="orig">${origChar}</span><span class="arrow">→</span><span class="shifted">${shiftedChar}</span>`;
        DOM.characterMappingBar.appendChild(pill);
    }
}

// ----------------------------------------------------------------------------
// 4. AUDIO & SOUND EFFECTS SYNTHESIZER (WEB AUDIO API)
// ----------------------------------------------------------------------------
function playSound(type = 'click') {
    if (!state.soundEnabled) return;

    try {
        if (!audioCtx) {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (AudioContextClass) audioCtx = new AudioContextClass();
        }
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        if (!audioCtx) return;

        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);

        const now = audioCtx.currentTime;

        if (type === 'click') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(600, now);
            osc.frequency.exponentialRampToValueAtTime(200, now + 0.05);
            gain.gain.setValueAtTime(0.15, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
            osc.start(now);
            osc.stop(now + 0.05);
        } else if (type === 'success') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(440, now);
            osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
            osc.start(now);
            osc.stop(now + 0.15);
        } else if (type === 'reset') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(300, now);
            osc.frequency.exponentialRampToValueAtTime(100, now + 0.2);
            gain.gain.setValueAtTime(0.15, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
            osc.start(now);
            osc.stop(now + 0.2);
        }
    } catch (e) {
        // Ignore audio playback errors if restricted by browser autoplay policy
    }
}

// ----------------------------------------------------------------------------
// 5. TOAST NOTIFICATIONS ENGINE
// ----------------------------------------------------------------------------
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '⚠️';

    toast.innerHTML = `<span class="toast-icon">${icon}</span><span class="toast-msg">${message}</span>`;
    DOM.toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ----------------------------------------------------------------------------
// 6. VISUAL ALPHABET WHEEL ENGINE (SVG)
// ----------------------------------------------------------------------------
function initAlphabetWheel() {
    const svg = DOM.caesarWheelSvg;
    if (!svg) return;

    svg.innerHTML = ''; // Clear existing
    const cx = 250, cy = 250;
    const rOuter = 210, rInner = 150;
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    // Group for rotating inner wheel
    const outerGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const innerGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    innerGroup.setAttribute('id', 'innerWheelGroup');

    // Background circles
    const bgOuter = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    bgOuter.setAttribute('cx', cx); bgOuter.setAttribute('cy', cy); bgOuter.setAttribute('r', rOuter + 20);
    bgOuter.setAttribute('fill', 'none'); bgOuter.setAttribute('stroke', 'var(--border-color)'); bgOuter.setAttribute('stroke-width', '2');

    const bgInner = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    bgInner.setAttribute('cx', cx); bgInner.setAttribute('cy', cy); bgInner.setAttribute('r', rInner - 20);
    bgInner.setAttribute('fill', 'none'); bgInner.setAttribute('stroke', 'var(--border-color)'); bgInner.setAttribute('stroke-width', '2');

    svg.appendChild(bgOuter);
    svg.appendChild(bgInner);

    // Render Outer Ring (A-Z Static)
    for (let i = 0; i < 26; i++) {
        const angle = (i * (360 / 26) - 90) * (Math.PI / 180);
        const x = cx + rOuter * Math.cos(angle);
        const y = cy + rOuter * Math.sin(angle);

        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', x);
        text.setAttribute('y', y + 5);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('fill', 'var(--text-main)');
        text.setAttribute('font-family', 'var(--font-heading)');
        text.setAttribute('font-weight', '700');
        text.setAttribute('font-size', '14');
        text.textContent = alphabet[i];
        outerGroup.appendChild(text);
    }

    // Render Inner Ring (A-Z Shiftable)
    for (let i = 0; i < 26; i++) {
        const angle = (i * (360 / 26) - 90) * (Math.PI / 180);
        const x = cx + rInner * Math.cos(angle);
        const y = cy + rInner * Math.sin(angle);

        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', x);
        text.setAttribute('y', y + 4);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('fill', 'var(--accent-purple)');
        text.setAttribute('font-family', 'var(--font-mono)');
        text.setAttribute('font-weight', '700');
        text.setAttribute('font-size', '13');
        text.textContent = alphabet[i];
        innerGroup.appendChild(text);
    }

    svg.appendChild(outerGroup);
    svg.appendChild(innerGroup);

    updateWheelRotation();
}

function updateWheelRotation() {
    const innerGroup = document.getElementById('innerWheelGroup');
    if (!innerGroup) return;

    const angle = (state.shift * (360 / 26));
    innerGroup.style.transformOrigin = '250px 250px';
    innerGroup.style.transform = `rotate(${state.mode === 'decrypt' ? -angle : angle}deg)`;
    innerGroup.style.transition = 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';

    if (DOM.wheelShiftLabel) {
        DOM.wheelShiftLabel.textContent = `${state.shift} (${state.mode.toUpperCase()})`;
    }
}

// ----------------------------------------------------------------------------
// 7. STEP-BY-STEP TRANSFORMATION INSPECTOR
// ----------------------------------------------------------------------------
function updateStepByStepInspector(text) {
    if (!DOM.stepsTableBody) return;
    DOM.stepsTableBody.innerHTML = '';

    if (!text || text.trim().length === 0) {
        DOM.stepsTableBody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">Enter text in Cipher Studio to inspect step-by-step modulo math.</td></tr>`;
        return;
    }

    const sample = text.slice(0, 30); // Inspect first 30 characters
    const effectiveShift = state.mode === 'decrypt' ? (26 - state.shift) % 26 : state.shift;

    sample.split('').forEach((char, index) => {
        const code = char.charCodeAt(0);
        let base = null;
        let resultChar = char;
        let formula = 'Preserved (Non-alpha)';

        if (code >= 65 && code <= 90) { // Uppercase
            base = 65;
            const shiftedCode = ((code - 65 + effectiveShift) % 26) + 65;
            resultChar = String.fromCharCode(shiftedCode);
            formula = `(${code} - 65 + ${effectiveShift}) mod 26 + 65 = ${shiftedCode}`;
        } else if (code >= 97 && code <= 122) { // Lowercase
            base = 97;
            const shiftedCode = ((code - 97 + effectiveShift) % 26) + 97;
            resultChar = String.fromCharCode(shiftedCode);
            formula = `(${code} - 97 + ${effectiveShift}) mod 26 + 97 = ${shiftedCode}`;
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>#${index + 1}</td>
            <td><strong>${char === ' ' ? '␣ [space]' : char}</strong></td>
            <td><code>${code}</code></td>
            <td><code>${formula}</code></td>
            <td><code>${resultChar.charCodeAt(0)}</code></td>
            <td><strong class="text-purple">${resultChar === ' ' ? '␣' : resultChar}</strong></td>
        `;
        DOM.stepsTableBody.appendChild(tr);
    });
}

// ----------------------------------------------------------------------------
// 8. CRYPTANALYSIS & AUTO-CRACK MODULE
// ----------------------------------------------------------------------------
function runBruteForceAnalysis() {
    const text = DOM.inputText.value;
    if (!text || text.trim().length === 0) {
        showToast('Please enter ciphertext first to run brute-force attack!', 'error');
        return;
    }

    DOM.bruteForceTableBody.innerHTML = '';
    const results = [];

    // Evaluate all 25 possible shifts
    for (let shift = 1; shift <= 25; shift++) {
        const decrypted = caesarCipher(text, shift, true);
        const score = calculateEnglishLikelihood(decrypted);
        results.push({ shift, decrypted, score });
    }

    // Sort candidates by likelihood score descending
    results.sort((a, b) => b.score - a.score);

    results.forEach((item, rank) => {
        const tr = document.createElement('tr');
        if (rank === 0) tr.className = 'table-row-highlight';

        const isBestMatch = rank === 0;
        const scorePercent = Math.min(Math.max(Math.round(item.score), 5), 100);

        tr.innerHTML = `
            <td><strong>Shift ${item.shift}</strong> ${isBestMatch ? '⭐ <span class="badge-tag">BEST MATCH</span>' : ''}</td>
            <td>
                <div style="display:flex; align-items:center; gap:0.5rem;">
                    <div class="score-bar-bg"><div class="score-bar-fill" style="width:${scorePercent}%;"></div></div>
                    <span>${scorePercent}%</span>
                </div>
            </td>
            <td style="font-family:var(--font-mono); max-width:250px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                ${escapeHtml(item.decrypted.slice(0, 45))}
            </td>
            <td>
                <button class="btn-btn-sm btn-apply-shift" data-shift="${item.shift}">
                    Apply Shift ${item.shift}
                </button>
            </td>
        `;
        DOM.bruteForceTableBody.appendChild(tr);
    });

    // Attach listeners to apply shift buttons
    document.querySelectorAll('.btn-apply-shift').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const shiftVal = parseInt(e.target.dataset.shift, 10);
            updateShift(shiftVal);
            setMode('decrypt');
            executeCipher();
            showToast(`Applied Shift ${shiftVal} for Decryption!`, 'success');
            playSound('click');
        });
    });

    renderFrequencyChart(text);
    showToast('Brute-force scan complete! Ranked 25 shift keys.', 'success');
}

/**
 * Calculates English Language Frequency Score using Chi-Squared Likelihood
 */
function calculateEnglishLikelihood(text) {
    const cleanText = text.toUpperCase().replace(/[^A-Z]/g, '');
    if (cleanText.length === 0) return 0;

    const counts = {};
    for (let i = 0; i < cleanText.length; i++) {
        const char = cleanText[i];
        counts[char] = (counts[char] || 0) + 1;
    }

    let score = 0;
    for (const letter in ENGLISH_FREQUENCIES) {
        const observed = counts[letter] || 0;
        const expected = (ENGLISH_FREQUENCIES[letter] / 100) * cleanText.length;
        const diff = observed - expected;
        score += (diff * diff) / (expected + 0.001); // Chi-squared step
    }

    // Lower chi-squared means higher likelihood match; invert for score percentage
    return Math.max(0, 100 - (score / cleanText.length) * 10);
}

/**
 * Render Letter Frequency Bar Chart
 */
function renderFrequencyChart(text) {
    if (!DOM.freqChartContainer) return;
    DOM.freqChartContainer.innerHTML = '';

    const cleanText = text.toUpperCase().replace(/[^A-Z]/g, '');
    const counts = {};
    let totalLetters = cleanText.length || 1;

    for (let i = 0; i < cleanText.length; i++) {
        const char = cleanText[i];
        counts[char] = (counts[char] || 0) + 1;
    }

    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    alphabet.split('').forEach(letter => {
        const msgFreq = ((counts[letter] || 0) / totalLetters) * 100;
        const engFreq = ENGLISH_FREQUENCIES[letter];

        const row = document.createElement('div');
        row.className = 'freq-row';
        row.innerHTML = `
            <span class="freq-letter">${letter}</span>
            <div class="freq-bars">
                <div class="bar-msg" style="width: ${Math.min(msgFreq * 5, 100)}%;" title="Message Freq: ${msgFreq.toFixed(1)}%"></div>
                <div class="bar-eng" style="width: ${Math.min(engFreq * 5, 100)}%;" title="English Standard: ${engFreq.toFixed(1)}%"></div>
            </div>
        `;
        DOM.freqChartContainer.appendChild(row);
    });
}

// ----------------------------------------------------------------------------
// 9. OPERATION HISTORY & FAVORITES MANAGER
// ----------------------------------------------------------------------------
function saveToHistory(inputText, outputText, shift, mode) {
    if (!inputText || !outputText) return;

    const newItem = {
        id: Date.now().toString(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        mode,
        shift,
        inputText: inputText.slice(0, 150),
        outputText: outputText.slice(0, 150),
        isFavorite: false
    };

    state.history.unshift(newItem);
    if (state.history.length > 10) state.history.pop(); // Keep top 10

    saveStateToStorage();
    renderHistoryList();
}

function renderHistoryList() {
    if (!DOM.historyList) return;
    DOM.historyList.innerHTML = '';

    const query = DOM.historySearch ? DOM.historySearch.value.toLowerCase() : '';
    const filter = DOM.historyFilter ? DOM.historyFilter.value : 'all';

    const filtered = state.history.filter(item => {
        const matchesQuery = item.inputText.toLowerCase().includes(query) || item.outputText.toLowerCase().includes(query);
        const matchesFilter = filter === 'all' || 
            (filter === 'encrypt' && item.mode === 'encrypt') ||
            (filter === 'decrypt' && item.mode === 'decrypt') ||
            (filter === 'favorite' && item.isFavorite);
        return matchesQuery && matchesFilter;
    });

    if (filtered.length === 0) {
        DOM.historyList.innerHTML = `<p class="text-center text-muted">No history snippets match your filter criteria.</p>`;
        return;
    }

    filtered.forEach(item => {
        const div = document.createElement('div');
        div.className = 'history-item';
        div.innerHTML = `
            <div class="history-content">
                <div>
                    <span class="badge-tag">${item.mode.toUpperCase()}</span>
                    <strong>Shift ${item.shift}</strong> • <span class="text-muted">${item.timestamp}</span>
                </div>
                <div><span class="text-muted">In:</span> ${escapeHtml(item.inputText)}</div>
                <div><span class="text-purple">Out:</span> ${escapeHtml(item.outputText)}</div>
            </div>
            <div class="history-actions-row">
                <button class="icon-btn btn-fav" data-id="${item.id}" title="Toggle Favorite">
                    ${item.isFavorite ? '⭐' : '☆'}
                </button>
                <button class="btn-btn-sm btn-reuse" data-id="${item.id}" title="Load snippet into input">
                    ⬆️ Reuse
                </button>
                <button class="icon-btn btn-delete" data-id="${item.id}" title="Delete Item">
                    🗑
                </button>
            </div>
        `;
        DOM.historyList.appendChild(div);
    });

    // Attach History Event Handlers
    DOM.historyList.querySelectorAll('.btn-fav').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.target.dataset.id;
            const target = state.history.find(h => h.id === id);
            if (target) {
                target.isFavorite = !target.isFavorite;
                saveStateToStorage();
                renderHistoryList();
            }
        });
    });

    DOM.historyList.querySelectorAll('.btn-reuse').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.target.dataset.id;
            const target = state.history.find(h => h.id === id);
            if (target) {
                DOM.inputText.value = target.inputText;
                updateShift(target.shift);
                setMode(target.mode);
                executeCipher();
                showToast('Loaded history snippet into workspace!', 'success');
                playSound('click');
            }
        });
    });

    DOM.historyList.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.target.dataset.id;
            state.history = state.history.filter(h => h.id !== id);
            saveStateToStorage();
            renderHistoryList();
            showToast('Deleted history item.', 'info');
        });
    });
}

// ----------------------------------------------------------------------------
// 10. PRIMARY EXECUTION & UI CONTROLLERS
// ----------------------------------------------------------------------------
function executeCipher() {
    const text = DOM.inputText.value;
    if (!text || text.trim().length === 0) {
        DOM.outputText.value = '';
        updateTextStatistics('');
        updateStepByStepInspector('');
        return;
    }

    const isDecrypt = state.mode === 'decrypt';
    const result = caesarCipher(text, state.shift, isDecrypt);

    DOM.outputText.value = result;
    updateTextStatistics(text);
    updateStepByStepInspector(text);
    renderMappingPreviewBar(state.shift);
    updateWheelRotation();

    saveToHistory(text, result, state.shift, state.mode);
    playSound('success');
}

function updateShift(val) {
    let num = parseInt(val, 10);
    if (isNaN(num)) num = 3;
    if (num < 1) num = 1;
    if (num > 25) num = 25;

    state.shift = num;
    DOM.shiftSlider.value = num;
    DOM.shiftNumber.value = num;

    renderMappingPreviewBar(num);
    updateWheelRotation();

    if (state.isLive) executeCipher();
    saveStateToStorage();
}

function setMode(mode) {
    state.mode = mode;
    if (mode === 'encrypt') {
        DOM.btnModeEncrypt.classList.add('active');
        DOM.btnModeDecrypt.classList.remove('active');
        DOM.btnExecuteText.textContent = '⚡ ENCRYPT MESSAGE';
    } else {
        DOM.btnModeDecrypt.classList.add('active');
        DOM.btnModeEncrypt.classList.remove('active');
        DOM.btnExecuteText.textContent = '🔓 DECRYPT MESSAGE';
    }

    renderMappingPreviewBar(state.shift);
    updateWheelRotation();

    if (state.isLive) executeCipher();
    saveStateToStorage();
}

// ----------------------------------------------------------------------------
// 11. LOCALSTORAGE & APP INITIALIZATION
// ----------------------------------------------------------------------------
function saveStateToStorage() {
    localStorage.setItem(STORAGE_KEYS.THEME, state.theme);
    localStorage.setItem(STORAGE_KEYS.SOUND, state.soundEnabled);
    localStorage.setItem(STORAGE_KEYS.ANIM, state.animEnabled);
    localStorage.setItem(STORAGE_KEYS.SHIFT, state.shift);
    localStorage.setItem(STORAGE_KEYS.MODE, state.mode);
    localStorage.setItem(STORAGE_KEYS.LIVE, state.isLive);
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(state.history));
}

function loadStateFromStorage() {
    const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
    if (savedTheme) {
        state.theme = savedTheme;
        DOM.themeSelect.value = savedTheme;
        document.documentElement.setAttribute('data-theme', savedTheme);
    }

    const savedSound = localStorage.getItem(STORAGE_KEYS.SOUND);
    if (savedSound !== null) state.soundEnabled = savedSound === 'true';

    const savedAnim = localStorage.getItem(STORAGE_KEYS.ANIM);
    if (savedAnim !== null) {
        state.animEnabled = savedAnim === 'true';
        if (!state.animEnabled) document.body.classList.add('no-animations');
    }

    const savedShift = localStorage.getItem(STORAGE_KEYS.SHIFT);
    if (savedShift) updateShift(parseInt(savedShift, 10));

    const savedMode = localStorage.getItem(STORAGE_KEYS.MODE);
    if (savedMode) setMode(savedMode);

    const savedLive = localStorage.getItem(STORAGE_KEYS.LIVE);
    if (savedLive !== null) {
        state.isLive = savedLive === 'true';
        DOM.liveToggle.checked = state.isLive;
        updateLivePillUI();
    }

    const savedHistory = localStorage.getItem(STORAGE_KEYS.HISTORY);
    if (savedHistory) {
        try {
            state.history = JSON.parse(savedHistory);
        } catch (e) {
            state.history = [];
        }
    }
}

function updateLivePillUI() {
    if (state.isLive) {
        DOM.liveStatusPill.classList.add('active');
        DOM.liveStatusPill.querySelector('.status-label').textContent = 'Live: ON';
    } else {
        DOM.liveStatusPill.classList.remove('active');
        DOM.liveStatusPill.querySelector('.status-label').textContent = 'Live: OFF';
    }
}

function escapeHtml(str) {
    return str.replace(/[&<>"']/g, function(m) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
    });
}

// ----------------------------------------------------------------------------
// 12. EVENT LISTENERS BINDING
// ----------------------------------------------------------------------------
function bindEvents() {
    // Tab Navigation
    DOM.navTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            DOM.navTabs.forEach(t => {
                t.classList.remove('active');
                t.setAttribute('aria-selected', 'false');
            });
            DOM.tabViews.forEach(v => v.classList.remove('active'));

            tab.classList.add('active');
            tab.setAttribute('aria-selected', 'true');
            const targetView = document.getElementById(`view-${tab.dataset.tab}`);
            if (targetView) targetView.classList.add('active');

            playSound('click');
        });
    });

    // Encrypt / Decrypt Segment Buttons
    DOM.btnModeEncrypt.addEventListener('click', () => { setMode('encrypt'); playSound('click'); });
    DOM.btnModeDecrypt.addEventListener('click', () => { setMode('decrypt'); playSound('click'); });

    // Live Encryption Toggle
    DOM.liveToggle.addEventListener('change', (e) => {
        state.isLive = e.target.checked;
        updateLivePillUI();
        if (state.isLive) executeCipher();
        saveStateToStorage();
        showToast(`Auto-Live Cipher ${state.isLive ? 'Enabled' : 'Disabled'}`, 'info');
        playSound('click');
    });

    // Input Text Area Input Event
    DOM.inputText.addEventListener('input', () => {
        if (state.isLive) executeCipher();
        else {
            updateTextStatistics(DOM.inputText.value);
            updateStepByStepInspector(DOM.inputText.value);
        }
    });

    // Shift Slider & Number Sync
    DOM.shiftSlider.addEventListener('input', (e) => updateShift(e.target.value));
    DOM.shiftNumber.addEventListener('input', (e) => updateShift(e.target.value));

    // Preset Shift Chips
    DOM.presetChips.forEach(chip => {
        chip.addEventListener('click', () => {
            updateShift(chip.dataset.shift);
            playSound('click');
        });
    });

    // Random Shift Button
    DOM.btnRandomShift.addEventListener('click', () => {
        const rand = Math.floor(Math.random() * 25) + 1;
        updateShift(rand);
        showToast(`Generated Random Shift: ${rand}`, 'success');
        playSound('click');
    });

    // Execute Button
    DOM.btnExecute.addEventListener('click', () => {
        executeCipher();
        showToast(`Message ${state.mode === 'encrypt' ? 'Encrypted' : 'Decrypted'} Successfully!`, 'success');
    });

    // Swap Button
    DOM.btnSwap.addEventListener('click', () => {
        setMode(state.mode === 'encrypt' ? 'decrypt' : 'encrypt');
        if (DOM.outputText.value) {
            DOM.inputText.value = DOM.outputText.value;
            executeCipher();
        }
        showToast('Swapped Operation Mode!', 'info');
        playSound('click');
    });

    // Reset All Button
    DOM.btnReset.addEventListener('click', () => {
        DOM.inputText.value = '';
        DOM.outputText.value = '';
        updateShift(3);
        setMode('encrypt');
        updateTextStatistics('');
        updateStepByStepInspector('');
        showToast('Reset all workspace fields to default.', 'info');
        playSound('reset');
    });

    // Quick Clear Button
    DOM.btnQuickClear.addEventListener('click', () => {
        DOM.inputText.value = '';
        DOM.outputText.value = '';
        updateTextStatistics('');
        updateStepByStepInspector('');
        showToast('Cleared input and output text fields.', 'info');
        playSound('reset');
    });
    DOM.btnClearInput.addEventListener('click', () => {
        DOM.inputText.value = '';
        updateTextStatistics('');
        updateStepByStepInspector('');
    });

    // Copy Output Feature
    DOM.btnCopy.addEventListener('click', () => {
        const text = DOM.outputText.value;
        if (!text) {
            showToast('Output is empty. Nothing to copy!', 'error');
            return;
        }
        navigator.clipboard.writeText(text).then(() => {
            showToast('Copied output text to clipboard!', 'success');
            playSound('success');
        });
    });

    // Download TXT Feature
    DOM.btnDownloadTxt.addEventListener('click', () => {
        const text = DOM.outputText.value;
        if (!text) {
            showToast('Nothing to download!', 'error');
            return;
        }
        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `caesar_${state.mode}_shift${state.shift}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('Downloaded .TXT file!', 'success');
        playSound('success');
    });

    // Output to Input Button
    DOM.btnOutputToInput.addEventListener('click', () => {
        if (!DOM.outputText.value) return;
        DOM.inputText.value = DOM.outputText.value;
        executeCipher();
        showToast('Moved output into input textarea.', 'info');
        playSound('click');
    });

    // Drag and Drop File Upload
    const dropZone = DOM.dropZone;
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        });
    });
    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
        });
    });
    dropZone.addEventListener('drop', (e) => {
        const files = e.dataTransfer.files;
        if (files.length > 0 && files[0].type.match('text.*')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                DOM.inputText.value = event.target.result;
                if (state.isLive) executeCipher();
                showToast(`Imported ${files[0].name}`, 'success');
            };
            reader.readAsText(files[0]);
        }
    });

    // File Input Import .TXT
    DOM.fileImportInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                DOM.inputText.value = event.target.result;
                if (state.isLive) executeCipher();
                showToast(`Imported ${file.name}`, 'success');
            };
            reader.readAsText(file);
        }
    });

    // Theme Switcher Listener
    DOM.themeSelect.addEventListener('change', (e) => {
        state.theme = e.target.value;
        document.documentElement.setAttribute('data-theme', state.theme);
        saveStateToStorage();
        showToast(`Theme changed to ${e.target.options[e.target.selectedIndex].text}`, 'info');
        playSound('click');
    });

    // Sound & Animation Toggles
    DOM.soundToggle.addEventListener('click', () => {
        state.soundEnabled = !state.soundEnabled;
        DOM.soundToggle.querySelector('.icon').textContent = state.soundEnabled ? '🔊' : '🔇';
        saveStateToStorage();
        showToast(`Sound Effects ${state.soundEnabled ? 'ON' : 'OFF'}`, 'info');
    });

    DOM.animToggle.addEventListener('click', () => {
        state.animEnabled = !state.animEnabled;
        document.body.classList.toggle('no-animations', !state.animEnabled);
        saveStateToStorage();
        showToast(`Animations ${state.animEnabled ? 'ON' : 'OFF'}`, 'info');
    });

    // Cryptanalysis Brute Force Button
    if (DOM.btnRunBruteForce) {
        DOM.btnRunBruteForce.addEventListener('click', runBruteForceAnalysis);
    }

    // History Filters & Export/Import
    if (DOM.historySearch) DOM.historySearch.addEventListener('input', renderHistoryList);
    if (DOM.historyFilter) DOM.historyFilter.addEventListener('change', renderHistoryList);

    if (DOM.btnClearHistory) {
        DOM.btnClearHistory.addEventListener('click', () => {
            state.history = [];
            saveStateToStorage();
            renderHistoryList();
            showToast('Cleared operation history.', 'info');
        });
    }

    if (DOM.btnExportHistory) {
        DOM.btnExportHistory.addEventListener('click', () => {
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state.history, null, 2));
            const a = document.createElement('a');
            a.href = dataStr;
            a.download = 'caesar_cipher_history.json';
            a.click();
            showToast('Exported history as JSON!', 'success');
        });
    }

    if (DOM.btnImportHistoryInput) {
        DOM.btnImportHistoryInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    try {
                        const imported = JSON.parse(event.target.result);
                        if (Array.isArray(imported)) {
                            state.history = imported;
                            saveStateToStorage();
                            renderHistoryList();
                            showToast('Imported history successfully!', 'success');
                        }
                    } catch (err) {
                        showToast('Invalid JSON history file!', 'error');
                    }
                };
                reader.readAsText(file);
            }
        });
    }

    // Shortcuts Modal Handlers
    DOM.shortcutsBtn.addEventListener('click', () => DOM.modalShortcuts.classList.add('active'));
    DOM.btnCloseModal.addEventListener('click', () => DOM.modalShortcuts.classList.remove('active'));
    DOM.modalShortcuts.addEventListener('click', (e) => {
        if (e.target === DOM.modalShortcuts) DOM.modalShortcuts.classList.remove('active');
    });

    // Global Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'Enter') {
            e.preventDefault();
            executeCipher();
        } else if (e.ctrlKey && e.shiftKey && (e.key === 'C' || e.key === 'c')) {
            e.preventDefault();
            DOM.btnCopy.click();
        } else if (e.ctrlKey && e.shiftKey && (e.key === 'R' || e.key === 'r')) {
            e.preventDefault();
            DOM.btnRandomShift.click();
        } else if (e.ctrlKey && e.shiftKey && (e.key === 'M' || e.key === 'm')) {
            e.preventDefault();
            DOM.btnSwap.click();
        } else if (e.key === 'Escape') {
            DOM.modalShortcuts.classList.remove('active');
        }
    });
}

// ----------------------------------------------------------------------------
// 13. DOM READY INITIALIZATION
// ----------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    loadStateFromStorage();
    initAlphabetWheel();
    renderMappingPreviewBar(state.shift);
    renderHistoryList();
    bindEvents();
});
