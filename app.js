// Clue Detective Companion App - Vue 3 Logic
const { createApp, ref, computed, watch, onMounted } = Vue;

const STORAGE_KEY = 'clue_app_save_v3';
const THEME_KEY = 'clue_app_theme';
const SOUND_KEY = 'clue_app_sound';

const CATEGORIES = [
  {
    id: 'suspects',
    name: '¿Quién? (Sospechosos)',
    shortName: 'Sospechosos',
    icon: 'bi-person-fill',
    items: [
      { id: 'verduzco', name: 'Verduzco', subtitle: 'Reverendo Verde', color: '#16a34a', icon: 'bi-person-fill' },
      { id: 'mostaza', name: 'Mostaza', subtitle: 'Coronel Mostaza', color: '#eab308', icon: 'bi-person-fill' },
      { id: 'marlene', name: 'Marlene', subtitle: 'Sra. Marlene / Peacock', color: '#0284c7', icon: 'bi-person-fill' },
      { id: 'moradillo', name: 'Moradillo', subtitle: 'Prof. Moradillo / Plum', color: '#a855f7', icon: 'bi-person-fill' },
      { id: 'escarlata', name: 'Escarlata', subtitle: 'Srta. Escarlata', color: '#ef4444', icon: 'bi-person-fill' },
      { id: 'blanca', name: 'Blanca', subtitle: 'Sra. Blanca / White', color: '#f8fafc', icon: 'bi-person-fill' },
    ],
  },
  {
    id: 'weapons',
    name: '¿Con qué? (Armas)',
    shortName: 'Armas',
    icon: 'bi-crosshair',
    items: [
      { id: 'candelabro', name: 'Candelabro', color: '#f59e0b', icon: 'bi-fire' },
      { id: 'daga', name: 'Daga', color: '#94a3b8', icon: 'bi-slash-lg' },
      { id: 'tubo', name: 'Tubo de plomo', color: '#64748b', icon: 'bi-hammer' },
      { id: 'revolver', name: 'Revólver', color: '#475569', icon: 'bi-crosshair' },
      { id: 'soga', name: 'Soga', color: '#d97706', icon: 'bi-link-45deg' },
      { id: 'llave', name: 'Llave inglesa', color: '#0284c7', icon: 'bi-tools' },
    ],
  },
  {
    id: 'rooms',
    name: '¿Dónde? (Habitaciones)',
    shortName: 'Habitaciones',
    icon: 'bi-door-open-fill',
    items: [
      { id: 'salon', name: 'Salón de baile', color: '#ec4899', icon: 'bi-music-note-beamed' },
      { id: 'billar', name: 'Sala de billar', color: '#10b981', icon: 'bi-circle-fill' },
      { id: 'terraza', name: 'Terraza', color: '#14b8a6', icon: 'bi-tree-fill' },
      { id: 'comedor', name: 'Comedor', color: '#f97316', icon: 'bi-cup-hot-fill' },
      { id: 'pasillo', name: 'Pasillo', color: '#8b5cf6', icon: 'bi-door-open-fill' },
      { id: 'cocina', name: 'Cocina', color: '#ef4444', icon: 'bi-egg-fried' },
      { id: 'biblioteca', name: 'Biblioteca', color: '#6366f1', icon: 'bi-book-fill' },
      { id: 'sala', name: 'Sala', color: '#3b82f6', icon: 'bi-house-door-fill' },
      { id: 'estudio', name: 'Estudio', color: '#84cc16', icon: 'bi-pencil-square' },
    ],
  },
];

const ALL_ITEMS = CATEGORIES.flatMap((c) => c.items);

const DEFAULT_PLAYERS = [
  { id: 0, name: 'Yo', isMe: true },
  { id: 1, name: 'Jugador 2', isMe: false },
  { id: 2, name: 'Jugador 3', isMe: false },
  { id: 3, name: 'Jugador 4', isMe: false },
];

// Web Audio API Synthesizer (Zero external dependencies)
class SoundFX {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }
  init() {
    if (!this.ctx && typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext)) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }
  playTone(freq, type = 'sine', duration = 0.06, vol = 0.05) {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(vol, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      // Audio not permitted or suspended
    }
  }
  playCell(state) {
    if (!this.enabled) return;
    if (state === 'no') this.playTone(260, 'triangle', 0.08, 0.06);
    else if (state === 'yes') this.playTone(520, 'sine', 0.12, 0.08);
    else if (state === 'maybe') this.playTone(390, 'sine', 0.08, 0.05);
    else this.playTone(200, 'sine', 0.04, 0.03);
  }
  playVictory() {
    if (!this.enabled) return;
    const notes = [392, 523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      setTimeout(() => this.playTone(freq, 'triangle', 0.25, 0.08), idx * 120);
    });
  }
}

const sfx = new SoundFX();

createApp({
  setup() {
    // Reactive State
    const players = ref(JSON.parse(JSON.stringify(DEFAULT_PLAYERS)));
    const matrix = ref({}); // { [itemId]: { [playerId]: '' | 'no' | 'yes' | 'maybe' } }
    const envelope = ref({}); // { [itemId]: '' | 'no' | 'yes' }
    const notes = ref({}); // { [itemId]: string }
    const suggestions = ref([]); // [{ id, timestamp, asker, target, suspect, weapon, room, showed, cardShown }]
    const history = ref([]); // Snapshot stack for undo
    const currentTurnIndex = ref(0);

    const activeFilter = ref('all'); // 'all' | 'suspects' | 'weapons' | 'rooms' | 'unsolved'
    const searchQuery = ref('');
    const theme = ref(localStorage.getItem(THEME_KEY) || 'dark');
    const soundEnabled = ref(localStorage.getItem(SOUND_KEY) !== 'false');
    const autoDeduce = ref(true);
    const deductionAlerts = ref([]);

    // Form states for modals
    const newPlayerCount = ref(4);
    const handSelection = ref({});
    const activeNoteItemId = ref(null);
    const noteText = ref('');
    const suggestionForm = ref({
      askerId: 0,
      targetId: 1,
      suspectId: 'verduzco',
      weaponId: 'candelabro',
      roomId: 'salon',
      showed: 'yes', // 'yes' | 'no'
      cardShownId: '',
      autoMarkNo: true,
    });
    const copyNotification = ref(false);

    sfx.enabled = soundEnabled.value;

    const toggleSound = () => {
      soundEnabled.value = !soundEnabled.value;
      sfx.enabled = soundEnabled.value;
      localStorage.setItem(SOUND_KEY, soundEnabled.value);
      if (soundEnabled.value) sfx.playTone(440, 'sine', 0.1, 0.07);
    };

    // Current turn player
    const currentTurnPlayer = computed(() => {
      if (players.value.length === 0) return null;
      const idx = currentTurnIndex.value % players.value.length;
      return players.value[idx];
    });

    const nextTurn = () => {
      currentTurnIndex.value = (currentTurnIndex.value + 1) % players.value.length;
      sfx.playTone(350, 'sine', 0.05, 0.05);
    };

    // Snapshot for Undo
    const pushHistory = () => {
      const snapshot = {
        matrix: JSON.parse(JSON.stringify(matrix.value)),
        envelope: JSON.parse(JSON.stringify(envelope.value)),
        notes: JSON.parse(JSON.stringify(notes.value)),
        currentTurnIndex: currentTurnIndex.value,
      };
      history.value.push(snapshot);
      if (history.value.length > 35) {
        history.value.shift();
      }
    };

    const undo = () => {
      if (history.value.length === 0) return;
      const lastState = history.value.pop();
      matrix.value = lastState.matrix;
      envelope.value = lastState.envelope;
      notes.value = lastState.notes || {};
      if (typeof lastState.currentTurnIndex === 'number') {
        currentTurnIndex.value = lastState.currentTurnIndex;
      }
      sfx.playTone(220, 'triangle', 0.08, 0.05);
      runAutoDeductions();
    };

    const canUndo = computed(() => history.value.length > 0);

    // Initialize blank matrix
    const initMatrix = (playerList = players.value) => {
      const newMatrix = {};
      const newEnvelope = {};
      const newNotes = {};

      ALL_ITEMS.forEach((item) => {
        newMatrix[item.id] = {};
        playerList.forEach((p) => {
          newMatrix[item.id][p.id] = '';
        });
        newEnvelope[item.id] = '';
        newNotes[item.id] = '';
      });

      matrix.value = newMatrix;
      envelope.value = newEnvelope;
      notes.value = newNotes;
      history.value = [];
      currentTurnIndex.value = 0;
      deductionAlerts.value = [];
    };

    // Load from LocalStorage
    const loadState = () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.players && parsed.matrix) {
            players.value = parsed.players;
            matrix.value = parsed.matrix;
            envelope.value = parsed.envelope || {};
            notes.value = parsed.notes || {};
            suggestions.value = parsed.suggestions || [];
            currentTurnIndex.value = parsed.currentTurnIndex || 0;
            if (typeof parsed.autoDeduce === 'boolean') {
              autoDeduce.value = parsed.autoDeduce;
            }
            return;
          }
        }
      } catch (err) {
        console.error('Error loading game state:', err);
      }
      initMatrix();
    };

    // Save to LocalStorage
    const saveState = () => {
      const state = {
        players: players.value,
        matrix: matrix.value,
        envelope: envelope.value,
        notes: notes.value,
        suggestions: suggestions.value,
        currentTurnIndex: currentTurnIndex.value,
        autoDeduce: autoDeduce.value,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    };

    // Watchers for persistence
    watch([players, matrix, envelope, notes, suggestions, autoDeduce, currentTurnIndex], saveState, { deep: true });

    // Toggle Theme
    const toggleTheme = () => {
      theme.value = theme.value === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', theme.value);
      localStorage.setItem(THEME_KEY, theme.value);
      sfx.playTone(400, 'sine', 0.05, 0.04);
    };

    // Helper: Find item by ID
    const getItem = (id) => ALL_ITEMS.find((i) => i.id === id);

    // Cell safe getters
    const getCellState = (itemId, playerId) => {
      return matrix.value[itemId]?.[playerId] || '';
    };

    const getCellClass = (itemId, playerId) => {
      const state = getCellState(itemId, playerId);
      return {
        'state-no': state === 'no',
        'state-yes': state === 'yes',
        'state-maybe': state === 'maybe',
      };
    };

    // Cross-Deduction Engine: Checks past suggestions where someone showed a card
    const runCrossDeduction = () => {
      if (!autoDeduce.value || suggestions.value.length === 0) return;

      suggestions.value.forEach((sug) => {
        if (!sug.showed) return;
        const targetId = sug.targetId;
        const cardIds = [sug.suspect.id, sug.weapon.id, sug.room.id];

        // Is target already known to have one of these cards?
        const alreadyHasOne = cardIds.some((cId) => matrix.value[cId]?.[targetId] === 'yes');
        if (alreadyHasOne) return;

        // Check how many of the 3 cards are ruled out for this target
        const ruledOutCards = cardIds.filter((cId) => {
          // Explicitly marked 'no' for this target
          if (matrix.value[cId]?.[targetId] === 'no') return true;
          // Or another player confirmed owns it
          const otherOwns = players.value.some((p) => p.id !== targetId && matrix.value[cId]?.[p.id] === 'yes');
          if (otherOwns) return true;
          // Or it is in the envelope
          if (envelope.value[cId] === 'yes') return true;
          return false;
        });

        // If exactly 2 are ruled out, target MUST hold the 3rd card!
        if (ruledOutCards.length === 2) {
          const deducedCardId = cardIds.find((cId) => !ruledOutCards.includes(cId));
          if (deducedCardId && matrix.value[deducedCardId]?.[targetId] !== 'yes') {
            matrix.value[deducedCardId][targetId] = 'yes';
            envelope.value[deducedCardId] = 'no';
            const card = getItem(deducedCardId);
            const target = players.value.find((p) => p.id === targetId);
            const alertMsg = `💡 Deducción cruzada: ¡${target ? target.name : 'Un jugador'} tiene ${card ? card.name : 'la carta'}! (Descartadas 2 cartas de su pregunta de las ${sug.timestamp})`;
            if (!deductionAlerts.value.includes(alertMsg)) {
              deductionAlerts.value.unshift(alertMsg);
              if (deductionAlerts.value.length > 3) deductionAlerts.value.pop();
            }
          }
        }
      });
    };

    // Run Auto Deductions
    const runAutoDeductions = () => {
      if (!autoDeduce.value) return;

      CATEGORIES.forEach((cat) => {
        // 1. For each item: If any player has 'yes', all others are 'no', and envelope is 'no'
        cat.items.forEach((item) => {
          const itemMatrix = matrix.value[item.id] || {};
          let hasOwner = false;

          players.value.forEach((p) => {
            if (itemMatrix[p.id] === 'yes') {
              hasOwner = true;
              players.value.forEach((otherP) => {
                if (otherP.id !== p.id && itemMatrix[otherP.id] !== 'no') {
                  itemMatrix[otherP.id] = 'no';
                }
              });
              if (envelope.value[item.id] !== 'no') {
                envelope.value[item.id] = 'no';
              }
            }
          });

          // 2. If all players have 'no' for this item -> MUST be in envelope!
          if (!hasOwner) {
            const allPlayersNo = players.value.length > 0 && players.value.every((p) => itemMatrix[p.id] === 'no');
            if (allPlayersNo && envelope.value[item.id] !== 'yes') {
              envelope.value[item.id] = 'yes';
            }
          }

          // 3. If envelope is 'yes', all players are 'no'
          if (envelope.value[item.id] === 'yes') {
            players.value.forEach((p) => {
              if (itemMatrix[p.id] !== 'no') {
                itemMatrix[p.id] = 'no';
              }
            });
            cat.items.forEach((otherItem) => {
              if (otherItem.id !== item.id && envelope.value[otherItem.id] !== 'no') {
                envelope.value[otherItem.id] = 'no';
              }
            });
          }
        });

        // 4. In this category: If all items except one are marked 'no' in envelope,
        // the remaining item must be in the envelope!
        const itemsWithEnvelopeNo = cat.items.filter((item) => envelope.value[item.id] === 'no');
        if (itemsWithEnvelopeNo.length === cat.items.length - 1) {
          const remainingItem = cat.items.find((item) => envelope.value[item.id] !== 'no');
          if (remainingItem && envelope.value[remainingItem.id] !== 'yes') {
            envelope.value[remainingItem.id] = 'yes';
            players.value.forEach((p) => {
              if (!matrix.value[remainingItem.id]) matrix.value[remainingItem.id] = {};
              matrix.value[remainingItem.id][p.id] = 'no';
            });
          }
        }
      });

      // Run advanced cross-deductions from turn suggestions
      runCrossDeduction();
    };

    // Toggle Cell Value: empty -> no -> yes -> maybe -> empty
    const toggleCell = (itemId, playerId) => {
      pushHistory();
      if (!matrix.value[itemId]) {
        matrix.value[itemId] = {};
      }
      const current = matrix.value[itemId][playerId] || '';
      let next = '';
      if (current === '') next = 'no';
      else if (current === 'no') next = 'yes';
      else if (current === 'yes') next = 'maybe';
      else if (current === 'maybe') next = '';

      matrix.value[itemId][playerId] = next;

      if (next === 'yes') {
        envelope.value[itemId] = 'no';
      }

      sfx.playCell(next);
      runAutoDeductions();

      if (caseSolution.value.isFullySolved) {
        sfx.playVictory();
      }
    };

    // Toggle Envelope Status: empty -> no -> yes -> empty
    const toggleEnvelope = (itemId) => {
      pushHistory();
      const current = envelope.value[itemId] || '';
      let next = '';
      if (current === '') next = 'no';
      else if (current === 'no') next = 'yes';
      else if (current === 'yes') next = '';

      envelope.value[itemId] = next;
      sfx.playCell(next === 'yes' ? 'yes' : next);
      runAutoDeductions();

      if (caseSolution.value.isFullySolved) {
        sfx.playVictory();
      }
    };

    // Count of cards marked 'yes' for a player
    const getPlayerCardCount = (playerId) => {
      let count = 0;
      ALL_ITEMS.forEach((item) => {
        if (matrix.value[item.id] && matrix.value[item.id][playerId] === 'yes') {
          count++;
        }
      });
      return count;
    };

    // Deduction Solution Dossier
    const caseSolution = computed(() => {
      const getSolvedItem = (catId) => {
        const cat = CATEGORIES.find((c) => c.id === catId);
        const confirmed = cat.items.find((item) => envelope.value[item.id] === 'yes');
        if (confirmed) return { solved: true, item: confirmed };

        const candidates = cat.items.filter((item) => {
          if (envelope.value[item.id] === 'no') return false;
          const isOwned = players.value.some((p) => matrix.value[item.id]?.[p.id] === 'yes');
          return !isOwned;
        });

        if (candidates.length === 1) {
          return { solved: true, item: candidates[0], deduced: true };
        }
        return { solved: false, candidatesCount: candidates.length, candidates };
      };

      const suspectSol = getSolvedItem('suspects');
      const weaponSol = getSolvedItem('weapons');
      const roomSol = getSolvedItem('rooms');

      const isFullySolved = suspectSol.solved && weaponSol.solved && roomSol.solved;

      return {
        suspect: suspectSol,
        weapon: weaponSol,
        room: roomSol,
        isFullySolved,
      };
    });

    // Filtered Categories and Items
    const filteredCategories = computed(() => {
      const q = searchQuery.value.trim().toLowerCase();

      return CATEGORIES.map((cat) => {
        if (activeFilter.value !== 'all' && activeFilter.value !== cat.id && activeFilter.value !== 'unsolved') {
          return { ...cat, items: [] };
        }

        const items = cat.items.filter((item) => {
          if (q) {
            const matchesName = item.name.toLowerCase().includes(q);
            const matchesSub = item.subtitle ? item.subtitle.toLowerCase().includes(q) : false;
            if (!matchesName && !matchesSub) return false;
          }

          if (activeFilter.value === 'unsolved') {
            const isEnvelopeSolved = envelope.value[item.id] === 'yes' || envelope.value[item.id] === 'no';
            const isHeldBySomeone = players.value.some((p) => matrix.value[item.id]?.[p.id] === 'yes');
            if (isEnvelopeSolved || isHeldBySomeone) return false;
          }

          return true;
        });

        return { ...cat, items };
      }).filter((cat) => cat.items.length > 0);
    });

    // Set Active Player (Me)
    const setMe = (playerId) => {
      players.value.forEach((p) => {
        p.isMe = p.id === playerId;
      });
      sfx.playTone(480, 'sine', 0.08, 0.06);
    };

    // Open Player Settings Modal
    const openPlayerModal = () => {
      newPlayerCount.value = players.value.length;
      const modalEl = document.getElementById('playersModal');
      if (modalEl && window.bootstrap) {
        new bootstrap.Modal(modalEl).show();
      }
    };

    // Apply Player Count Change
    const applyPlayerCount = () => {
      const count = parseInt(newPlayerCount.value);
      if (count === players.value.length) return;

      pushHistory();
      const currentList = [...players.value];
      const updatedList = [];

      for (let i = 0; i < count; i++) {
        if (currentList[i]) {
          updatedList.push(currentList[i]);
        } else {
          updatedList.push({
            id: i,
            name: `Jugador ${i + 1}`,
            isMe: false,
          });
        }
      }

      if (!updatedList.some((p) => p.isMe)) {
        updatedList[0].isMe = true;
      }

      ALL_ITEMS.forEach((item) => {
        if (!matrix.value[item.id]) matrix.value[item.id] = {};
        updatedList.forEach((p) => {
          if (matrix.value[item.id][p.id] === undefined) {
            matrix.value[item.id][p.id] = '';
          }
        });
      });

      players.value = updatedList;
      currentTurnIndex.value = currentTurnIndex.value % updatedList.length;
      runAutoDeductions();
    };

    const selectedHandCount = computed(() => {
      return Object.values(handSelection.value).filter(Boolean).length;
    });

    const openHandModal = () => {
      const myPlayer = players.value.find((p) => p.isMe) || players.value[0];
      const selection = {};
      ALL_ITEMS.forEach((item) => {
        selection[item.id] = matrix.value[item.id]?.[myPlayer.id] === 'yes';
      });
      handSelection.value = selection;

      const modalEl = document.getElementById('handModal');
      if (modalEl && window.bootstrap) {
        new bootstrap.Modal(modalEl).show();
      }
    };

    const applyStartingHand = () => {
      pushHistory();
      const myPlayer = players.value.find((p) => p.isMe) || players.value[0];

      ALL_ITEMS.forEach((item) => {
        const isSelected = !!handSelection.value[item.id];
        if (isSelected) {
          matrix.value[item.id][myPlayer.id] = 'yes';
          envelope.value[item.id] = 'no';
          players.value.forEach((p) => {
            if (p.id !== myPlayer.id) {
              matrix.value[item.id][p.id] = 'no';
            }
          });
        } else if (matrix.value[item.id][myPlayer.id] === 'yes') {
          matrix.value[item.id][myPlayer.id] = '';
        }
      });

      sfx.playTone(520, 'triangle', 0.15, 0.08);
      runAutoDeductions();
      const modalEl = document.getElementById('handModal');
      if (modalEl && window.bootstrap) {
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();
      }
    };

    const openNoteModal = (item) => {
      activeNoteItemId.value = item.id;
      noteText.value = notes.value[item.id] || '';
      const modalEl = document.getElementById('noteModal');
      if (modalEl && window.bootstrap) {
        new bootstrap.Modal(modalEl).show();
      }
    };

    const saveNote = () => {
      if (activeNoteItemId.value) {
        pushHistory();
        notes.value[activeNoteItemId.value] = noteText.value.trim();
        sfx.playTone(320, 'sine', 0.05, 0.04);
      }
      const modalEl = document.getElementById('noteModal');
      if (modalEl && window.bootstrap) {
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();
      }
    };

    const openSuggestionModal = () => {
      if (players.value.length > 0) {
        const askerIdx = currentTurnIndex.value % players.value.length;
        const targetIdx = (currentTurnIndex.value + 1) % players.value.length;
        suggestionForm.value.askerId = players.value[askerIdx].id;
        suggestionForm.value.targetId = players.value[targetIdx].id;
      }
      const modalEl = document.getElementById('suggestionModal');
      if (modalEl && window.bootstrap) {
        new bootstrap.Modal(modalEl).show();
      }
    };

    const saveSuggestion = () => {
      pushHistory();
      const form = suggestionForm.value;
      const asker = players.value.find((p) => p.id === form.askerId);
      const target = players.value.find((p) => p.id === form.targetId);

      const entry = {
        id: Date.now(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        askerName: asker ? asker.name : `P${form.askerId + 1}`,
        targetName: target ? target.name : `P${form.targetId + 1}`,
        askerId: form.askerId,
        targetId: form.targetId,
        suspect: getItem(form.suspectId),
        weapon: getItem(form.weaponId),
        room: getItem(form.roomId),
        showed: form.showed === 'yes',
        cardShown: form.cardShownId ? getItem(form.cardShownId) : null,
      };

      suggestions.value.unshift(entry);

      if (form.showed === 'no' && form.autoMarkNo) {
        [form.suspectId, form.weaponId, form.roomId].forEach((itemId) => {
          if (matrix.value[itemId]) {
            matrix.value[itemId][form.targetId] = 'no';
          }
        });
      } else if (form.showed === 'yes' && form.cardShownId) {
        if (matrix.value[form.cardShownId]) {
          matrix.value[form.cardShownId][form.targetId] = 'yes';
          envelope.value[form.cardShownId] = 'no';
        }
      }

      sfx.playTone(440, 'triangle', 0.1, 0.06);
      nextTurn();
      runAutoDeductions();

      const modalEl = document.getElementById('suggestionModal');
      if (modalEl && window.bootstrap) {
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();
      }
    };

    const removeSuggestion = (id) => {
      suggestions.value = suggestions.value.filter((s) => s.id !== id);
    };

    const dismissDeductionAlert = (idx) => {
      deductionAlerts.value.splice(idx, 1);
    };

    const confirmReset = (fullReset = false) => {
      if (fullReset) {
        players.value = JSON.parse(JSON.stringify(DEFAULT_PLAYERS));
        suggestions.value = [];
        initMatrix();
      } else {
        initMatrix(players.value);
        suggestions.value = [];
      }
      sfx.playTone(200, 'sawtooth', 0.15, 0.05);
      runAutoDeductions();

      const modalEl = document.getElementById('resetModal');
      if (modalEl && window.bootstrap) {
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();
      }
    };

    const exportSummary = () => {
      const sol = caseSolution.value;
      const suspectText = sol.suspect.solved ? sol.suspect.item.name : `${sol.suspect.candidatesCount} opciones restantes`;
      const weaponText = sol.weapon.solved ? sol.weapon.item.name : `${sol.weapon.candidatesCount} opciones restantes`;
      const roomText = sol.room.solved ? sol.room.item.name : `${sol.room.candidatesCount} opciones restantes`;

      let text = `🕵️ CLUE - ESTADO DEL CASO\n`;
      text += `---------------------------------\n`;
      text += `❓ ¿QUIÉN?      : ${suspectText}\n`;
      text += `🗡️ ¿CON QUÉ?    : ${weaponText}\n`;
      text += `🚪 ¿DÓNDE?      : ${roomText}\n`;
      text += `---------------------------------\n`;
      text += `Jugadores (${players.value.length}):\n`;
      players.value.forEach((p) => {
        text += `- ${p.name} ${p.isMe ? '(Yo)' : ''}: ${getPlayerCardCount(p.id)} cartas confirmadas\n`;
      });

      if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
          copyNotification.value = true;
          sfx.playTone(600, 'sine', 0.08, 0.05);
          setTimeout(() => {
            copyNotification.value = false;
          }, 2500);
        });
      }
    };

    const printSheet = () => {
      window.print();
    };

    const openShortcutsModal = () => {
      const modalEl = document.getElementById('shortcutsModal');
      if (modalEl && window.bootstrap) {
        new bootstrap.Modal(modalEl).show();
      }
    };

    onMounted(() => {
      document.documentElement.setAttribute('data-theme', theme.value);
      loadState();
      runAutoDeductions();

      // Register Service Worker for PWA
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js').catch((err) => {
          console.warn('SW registration failed:', err);
        });
      }

      // Keyboard shortcuts
      window.addEventListener('keydown', (e) => {
        if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

        // Undo: Ctrl+Z / Cmd+Z
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
          if (canUndo.value) {
            e.preventDefault();
            undo();
          }
        }
        // Turn: T
        else if (e.key.toLowerCase() === 't') {
          nextTurn();
        }
        // New question: Q
        else if (e.key.toLowerCase() === 'q') {
          openSuggestionModal();
        }
        // My hand: H
        else if (e.key.toLowerCase() === 'h') {
          openHandModal();
        }
        // Sound toggle: S
        else if (e.key.toLowerCase() === 's') {
          toggleSound();
        }
        // Help / Shortcuts: ?
        else if (e.key === '?') {
          openShortcutsModal();
        }
      });
    });

    return {
      CATEGORIES,
      ALL_ITEMS,
      players,
      matrix,
      envelope,
      notes,
      suggestions,
      history,
      canUndo,
      currentTurnIndex,
      currentTurnPlayer,
      activeFilter,
      searchQuery,
      theme,
      soundEnabled,
      autoDeduce,
      deductionAlerts,
      newPlayerCount,
      handSelection,
      selectedHandCount,
      activeNoteItemId,
      noteText,
      suggestionForm,
      copyNotification,
      caseSolution,
      filteredCategories,
      getCellState,
      getCellClass,
      toggleCell,
      toggleEnvelope,
      getPlayerCardCount,
      toggleTheme,
      toggleSound,
      nextTurn,
      setMe,
      undo,
      openPlayerModal,
      applyPlayerCount,
      openHandModal,
      applyStartingHand,
      openNoteModal,
      saveNote,
      openSuggestionModal,
      saveSuggestion,
      removeSuggestion,
      dismissDeductionAlert,
      confirmReset,
      exportSummary,
      printSheet,
      openShortcutsModal,
    };
  },
}).mount('#app');
