// Clue Detective Companion App - Vue 3 Logic
const { createApp, ref, computed, watch, onMounted } = Vue;

const STORAGE_KEY = 'clue_app_save_v2';
const THEME_KEY = 'clue_app_theme';

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

createApp({
  setup() {
    // Reactive State
    const players = ref(JSON.parse(JSON.stringify(DEFAULT_PLAYERS)));
    const matrix = ref({}); // { [itemId]: { [playerId]: '' | 'no' | 'yes' | 'maybe' } }
    const envelope = ref({}); // { [itemId]: '' | 'no' | 'yes' }
    const notes = ref({}); // { [itemId]: string }
    const suggestions = ref([]); // [{ id, timestamp, asker, target, suspect, weapon, room, showed, cardShown }]
    const history = ref([]); // Snapshot stack for undo

    const activeFilter = ref('all'); // 'all' | 'suspects' | 'weapons' | 'rooms' | 'unsolved'
    const searchQuery = ref('');
    const theme = ref(localStorage.getItem(THEME_KEY) || 'dark');
    const autoDeduce = ref(true);

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

    // Snapshot for Undo
    const pushHistory = () => {
      const snapshot = {
        matrix: JSON.parse(JSON.stringify(matrix.value)),
        envelope: JSON.parse(JSON.stringify(envelope.value)),
        notes: JSON.parse(JSON.stringify(notes.value)),
      };
      history.value.push(snapshot);
      if (history.value.length > 30) {
        history.value.shift();
      }
    };

    const undo = () => {
      if (history.value.length === 0) return;
      const lastState = history.value.pop();
      matrix.value = lastState.matrix;
      envelope.value = lastState.envelope;
      notes.value = lastState.notes || {};
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
        autoDeduce: autoDeduce.value,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    };

    // Watchers for persistence
    watch([players, matrix, envelope, notes, suggestions, autoDeduce], saveState, { deep: true });

    // Toggle Theme
    const toggleTheme = () => {
      theme.value = theme.value === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', theme.value);
      localStorage.setItem(THEME_KEY, theme.value);
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
              // Other players cannot have it
              players.value.forEach((otherP) => {
                if (otherP.id !== p.id && itemMatrix[otherP.id] !== 'no') {
                  itemMatrix[otherP.id] = 'no';
                }
              });
              // Envelope cannot have it
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
            // Other items in this category cannot be in envelope
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

      // If set to yes, envelope cannot have it
      if (next === 'yes') {
        envelope.value[itemId] = 'no';
      }

      runAutoDeductions();
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
      runAutoDeductions();
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
        // Direct envelope yes
        const confirmed = cat.items.find((item) => envelope.value[item.id] === 'yes');
        if (confirmed) return { solved: true, item: confirmed };

        // Remaining candidates (neither confirmed NO in envelope nor owned by any player)
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
          // Search query check
          if (q) {
            const matchesName = item.name.toLowerCase().includes(q);
            const matchesSub = item.subtitle ? item.subtitle.toLowerCase().includes(q) : false;
            if (!matchesName && !matchesSub) return false;
          }

          // Unsolved filter check
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

      // Ensure at least one is 'me'
      if (!updatedList.some((p) => p.isMe)) {
        updatedList[0].isMe = true;
      }

      // Re-initialize matrix columns for new players
      ALL_ITEMS.forEach((item) => {
        if (!matrix.value[item.id]) matrix.value[item.id] = {};
        updatedList.forEach((p) => {
          if (matrix.value[item.id][p.id] === undefined) {
            matrix.value[item.id][p.id] = '';
          }
        });
      });

      players.value = updatedList;
      runAutoDeductions();
    };

    // Starting hand count selected
    const selectedHandCount = computed(() => {
      return Object.values(handSelection.value).filter(Boolean).length;
    });

    // Open Starting Hand Modal
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

    // Apply Starting Hand
    const applyStartingHand = () => {
      pushHistory();
      const myPlayer = players.value.find((p) => p.isMe) || players.value[0];

      ALL_ITEMS.forEach((item) => {
        const isSelected = !!handSelection.value[item.id];
        if (isSelected) {
          // I have this card!
          matrix.value[item.id][myPlayer.id] = 'yes';
          envelope.value[item.id] = 'no';
          // Other players don't have it
          players.value.forEach((p) => {
            if (p.id !== myPlayer.id) {
              matrix.value[item.id][p.id] = 'no';
            }
          });
        } else if (matrix.value[item.id][myPlayer.id] === 'yes') {
          // Unselected a card I previously held
          matrix.value[item.id][myPlayer.id] = '';
        }
      });

      runAutoDeductions();
      const modalEl = document.getElementById('handModal');
      if (modalEl && window.bootstrap) {
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();
      }
    };

    // Note Modal
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
      }
      const modalEl = document.getElementById('noteModal');
      if (modalEl && window.bootstrap) {
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();
      }
    };

    // Open Suggestion / Question Log Modal
    const openSuggestionModal = () => {
      const modalEl = document.getElementById('suggestionModal');
      if (modalEl && window.bootstrap) {
        new bootstrap.Modal(modalEl).show();
      }
    };

    // Save Suggestion Entry
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

      // Auto actions
      if (form.showed === 'no' && form.autoMarkNo) {
        // Target doesn't have any of the 3 cards!
        [form.suspectId, form.weaponId, form.roomId].forEach((itemId) => {
          if (matrix.value[itemId]) {
            matrix.value[itemId][form.targetId] = 'no';
          }
        });
      } else if (form.showed === 'yes' && form.cardShownId) {
        // Target confirmed showed this specific card!
        if (matrix.value[form.cardShownId]) {
          matrix.value[form.cardShownId][form.targetId] = 'yes';
          envelope.value[form.cardShownId] = 'no';
        }
      }

      runAutoDeductions();

      // Close modal
      const modalEl = document.getElementById('suggestionModal');
      if (modalEl && window.bootstrap) {
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();
      }
    };

    // Remove Suggestion
    const removeSuggestion = (id) => {
      suggestions.value = suggestions.value.filter((s) => s.id !== id);
    };

    // Reset Game
    const confirmReset = (fullReset = false) => {
      if (fullReset) {
        players.value = JSON.parse(JSON.stringify(DEFAULT_PLAYERS));
        suggestions.value = [];
        initMatrix();
      } else {
        // Keep players and names, clear markings and suggestions
        initMatrix(players.value);
        suggestions.value = [];
      }
      runAutoDeductions();

      const modalEl = document.getElementById('resetModal');
      if (modalEl && window.bootstrap) {
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();
      }
    };

    // Export Case Summary to Clipboard
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
          setTimeout(() => {
            copyNotification.value = false;
          }, 2500);
        });
      }
    };

    onMounted(() => {
      document.documentElement.setAttribute('data-theme', theme.value);
      loadState();
      runAutoDeductions();

      // Keyboard shortcut for Undo (Ctrl+Z or Cmd+Z)
      window.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
          if (canUndo.value && !['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
            e.preventDefault();
            undo();
          }
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
      activeFilter,
      searchQuery,
      theme,
      autoDeduce,
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
      confirmReset,
      exportSummary,
    };
  },
}).mount('#app');
