document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const modeSwitcher = document.getElementById('mode-switcher');
    const mainEditor = document.getElementById('main-editor');
    const sidebarTitle = document.getElementById('sidebar-title');
    const sidebarTabsContainer = document.getElementById('sidebar-tabs');
    const notesContentContainer = document.getElementById('notes-content');
    const addTabBtn = document.getElementById('add-tab-btn');
    const addNoteBtn = document.getElementById('add-note-btn');
    // NEW: Theme elements
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const accentColorSelect = document.getElementById('accent-color-select');

    // NEW: Accent color options
    const accentColors = {
        blue: '#007acc', pink: '#e91e63', red: '#f44336',
        green: '#4caf50', yellow: '#ffeb3b', orange: '#ff9800',
        cyan: '#00bcd4', purple: '#9c27b0'
    };

    // App State
    let state = {};

    function getInitialState() {
        return {
            // NEW: Theme state added
            theme: {
                mode: 'dark', // 'dark' or 'light'
                accent: accentColors.blue
            },
            currentMode: 'fiction',
            documents: {
                fiction: createNewDocumentState('World Anvil'),
                journalism: createNewDocumentState('Sources'),
                technical: createNewDocumentState('Specs'),
            }
        };
    }

    function createNewDocumentState(initialTabName) {
        return {
            text: '',
            sidebar: {
                activeTabId: 'tab-1',
                tabs: [{ id: 'tab-1', name: initialTabName, notes: ['A place for your first note.'] }]
            }
        };
    }

    // --- State Management ---
    function saveState() {
        localStorage.setItem('vibeWriterState', JSON.stringify(state));
    }

    function loadState() {
        const savedState = localStorage.getItem('vibeWriterState');
        const initialState = getInitialState();
        // MODIFIED: Merge saved state with initial state to prevent errors if new properties are added
        state = savedState ? { ...initialState, ...JSON.parse(savedState) } : initialState;
        // Ensure theme object exists
        state.theme = state.theme || initialState.theme;
    }

    // --- Rendering ---
    // NEW: Function to specifically render theme changes
    function renderTheme() {
        document.body.dataset.theme = state.theme.mode;
        document.documentElement.style.setProperty('--accent-color', state.theme.accent);

        darkModeToggle.checked = state.theme.mode === 'dark';
        accentColorSelect.value = state.theme.accent;
        accentColorSelect.disabled = state.theme.mode === 'dark';
    }

    function render() {
        renderTheme(); // Call theme renderer first

        const currentDoc = state.documents[state.currentMode];

        modeSwitcher.value = state.currentMode;
        mainEditor.value = currentDoc.text;
        sidebarTitle.textContent = `${state.currentMode.charAt(0).toUpperCase() + state.currentMode.slice(1)} Notes`;

        sidebarTabsContainer.innerHTML = '';
        currentDoc.sidebar.tabs.forEach(tab => {
            const tabEl = document.createElement('div');
            tabEl.className = 'tab';
            tabEl.dataset.tabId = tab.id;

            const tabNameEl = document.createElement('span');
            tabNameEl.textContent = tab.name;
            tabNameEl.className = 'tab-name';

            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = '×';
            deleteBtn.className = 'delete-btn delete-tab-btn';
            deleteBtn.title = 'Delete Tab';
            deleteBtn.dataset.tabId = tab.id;

            tabEl.appendChild(tabNameEl);
            tabEl.appendChild(deleteBtn);

            if (tab.id === currentDoc.sidebar.activeTabId) {
                tabEl.classList.add('active');
            }
            sidebarTabsContainer.appendChild(tabEl);
        });

        notesContentContainer.innerHTML = '';
        const activeTab = currentDoc.sidebar.tabs.find(t => t.id === currentDoc.sidebar.activeTabId);
        if (activeTab) {
            activeTab.notes.forEach((noteText, index) => {
                const wrapper = document.createElement('div');
                wrapper.className = 'note-wrapper';
                const noteEl = document.createElement('textarea');
                noteEl.className = 'note-textarea';
                noteEl.value = noteText;
                noteEl.dataset.noteIndex = index;
                const deleteBtn = document.createElement('button');
                deleteBtn.textContent = '×';
                deleteBtn.className = 'delete-btn delete-note-btn';
                deleteBtn.title = 'Delete Note';
                deleteBtn.dataset.noteIndex = index;
                wrapper.appendChild(noteEl);
                wrapper.appendChild(deleteBtn);
                notesContentContainer.appendChild(wrapper);
            });
        }
        addNoteBtn.style.display = activeTab ? 'block' : 'none';
    }

    // --- Event Listeners ---
    // (Existing listeners for editor, tabs, notes, etc. remain here...)
    modeSwitcher.addEventListener('change', (e) => { state.currentMode = e.target.value; render(); saveState(); });
    mainEditor.addEventListener('input', () => { state.documents[state.currentMode].text = mainEditor.value; saveState(); });
    addTabBtn.addEventListener('click', () => { const name = prompt('Enter new tab name:'); if (name) { const s = state.documents[state.currentMode].sidebar; const t = {id: `tab-${Date.now()}`, name, notes:[]}; s.tabs.push(t); s.activeTabId = t.id; render(); saveState(); } });
    addNoteBtn.addEventListener('click', () => { const s = state.documents[state.currentMode].sidebar; const t = s.tabs.find(t => t.id === s.activeTabId); if (t) { t.notes.push(''); render(); saveState(); } });
    sidebarTabsContainer.addEventListener('click', (e) => { const t = e.target; const tabEl = t.closest('.tab'); if (tabEl && !t.classList.contains('delete-tab-btn')) { state.documents[state.currentMode].sidebar.activeTabId = tabEl.dataset.tabId; render(); saveState(); } if (t.classList.contains('delete-tab-btn')) { if (confirm('Are you sure?')) { const s = state.documents[state.currentMode].sidebar; s.tabs = s.tabs.filter(tab => tab.id !== t.dataset.tabId); if (s.activeTabId === t.dataset.tabId) s.activeTabId = s.tabs.length > 0 ? s.tabs[0].id : null; render(); saveState(); } } });
    notesContentContainer.addEventListener('click', (e) => { if(e.target.classList.contains('delete-note-btn')) { if(confirm('Are you sure?')) { const s = state.documents[state.currentMode].sidebar; const t = s.tabs.find(t=>t.id === s.activeTabId); if(t) { t.notes.splice(parseInt(e.target.dataset.noteIndex, 10), 1); render(); saveState(); } } } });
    notesContentContainer.addEventListener('input', (e) => { if(e.target.classList.contains('note-textarea')) { const s = state.documents[state.currentMode].sidebar; const t = s.tabs.find(t=>t.id === s.activeTabId); if(t) { t.notes[parseInt(e.target.dataset.noteIndex, 10)] = e.target.value; saveState(); } } });

    // NEW: Listeners for theme controls
    darkModeToggle.addEventListener('change', () => {
        state.theme.mode = darkModeToggle.checked ? 'dark' : 'light';
        renderTheme();
        saveState();
    });

    accentColorSelect.addEventListener('change', () => {
        state.theme.accent = accentColorSelect.value;
        renderTheme();
        saveState();
    });

    // --- Initial Load ---
    // NEW: Function to populate the accent color dropdown
    function initializeControls() {
        for (const [name, color] of Object.entries(accentColors)) {
            const option = document.createElement('option');
            option.value = color;
            option.textContent = name.charAt(0).toUpperCase() + name.slice(1);
            accentColorSelect.appendChild(option);
        }
    }

    initializeControls();
    loadState();
    render();
});
