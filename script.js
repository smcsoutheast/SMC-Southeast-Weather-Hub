const ADMIN_USERS = [
  { name: "Justin", role: "Tournament Director", password: "justin2026$" },
  { name: "Ashley", role: "Tournament Operations", password: "ashley2026$" }
];

const STORAGE_KEY = "smcSoutheastWeatherHotlinePhase3AdminTabs";
const FIREBASE_DATA_PATH = "southeast-weather-hotline/live-data";
const LEGACY_KEYS = [];

const regions = ["Florida", "North Carolina", "South Carolina", "Alabama", "Georgia"];

const tournamentOptions = [
  "Carolina Patriots Cup (NC)",
  "Florida Extreme Cup (FL)",
  "Florence Cup (SC)",
  "Palm Beach Gardens Classic Fall (FL)",
  "Alabama Super Cup (AL)",
  "Florida Winter Cup Juniors (FL)",
  "Florida Winter Cup & Showcase (FL)",
  "Gulf Coast Invitational (FL)",
  "Alabama President's Day Invitational (AL)",
  "Palm Beach Gardens Classic Spring (FL)",
  "Florida St Paddy's Day Invitational (FL)",
  "Sarasota Cup GIRLS (FL)",
  "Sarasota Cup BOYS (FL)"
];

const LIGHTNING_RED_MILES = 10;
const LIGHTNING_YELLOW_MILES = 15;
const LIGHTNING_CLEAR_MINUTES = 30;

const fieldStatusOptions = ["Open", "Delayed", "Closed", "Under Review", "Maintenance"];

const templates = {
  allClear: "All venues are currently operating as scheduled. SMC staff will continue to monitor conditions and post updates here as needed.",
  monitoring: "SMC staff are monitoring weather and field conditions. Games remain scheduled unless noted below. Please keep checking this page for updates.",
  lightningDelay: "Lightning has been detected in the area. Games are temporarily suspended. Teams should leave the fields and wait for further instructions from SMC staff.",
  heatAdvisory: "Heat conditions are being monitored. Teams should hydrate, use shade when available, and follow all referee and event staff instructions.",
  fieldClosure: "One or more fields are closed due to weather or facility conditions. SMC staff will post schedule or field updates as soon as they are available.",
  resumePlay: "Play is cleared to resume. Teams should return to their assigned fields and follow referee or field marshal instructions."
};

const defaultData = {
  globalStatus: "green",
  globalNote: templates.allClear,
  lastUpdated: null,
  showCurrentOnly: false,
  currentTournaments: [],
  venues: [],
  history: [],
  timeline: [],
  incidents: [],
  lightningAlerts: [],
  fieldBoard: []
};

let data = loadData();
let adminUnlocked = false;
let currentAdmin = null;
let lightningPanelExpanded = false;
let firebaseDb = null;
let firebaseReady = false;
let firebaseListening = false;
let firebaseInitialSyncComplete = false;
let firebaseHydrationPending = false;
let suppressFirebasePush = false;
let pendingFirebaseSave = null;

const elements = {
  globalStatus: document.getElementById("globalStatus"),
  stickyStatus: document.getElementById("stickyStatus"),
  stickyStatusText: document.getElementById("stickyStatusText"),
  stickyUpdateText: document.getElementById("stickyUpdateText"),
  lastUpdated: document.getElementById("lastUpdated"),
  globalNote: document.getElementById("globalNote"),
  venueGrid: document.getElementById("venueGrid"),
  publicLightningPanel: document.getElementById("publicLightningPanel"),
  publicLightningList: document.getElementById("publicLightningList"),
  publicLightningBadge: document.getElementById("publicLightningBadge"),
  fieldStatusPanel: document.getElementById("fieldStatusPanel"),
  fieldStatusBoard: document.getElementById("fieldStatusBoard"),
  timelineList: document.getElementById("timelineList"),
  historyList: document.getElementById("historyList"),
  stateFilter: document.getElementById("stateFilter"),
  eventFilter: document.getElementById("eventFilter"),
  eventFilterToggle: document.getElementById("eventFilterToggle"),
  eventFilterCheckboxMenu: document.getElementById("eventFilterCheckboxMenu"),
  currentTournamentToggle: document.getElementById("currentTournamentToggle"),
  currentTournamentCheckboxMenu: document.getElementById("currentTournamentCheckboxMenu"),
  passwordInput: document.getElementById("passwordInput"),
  verifyBtn: document.getElementById("verifyBtn"),
  loginBox: document.getElementById("loginBox"),
  commandCenter: document.getElementById("commandCenter"),
  lockBtn: document.getElementById("lockBtn"),
  fullScreenBtn: document.getElementById("fullScreenBtn"),
  refreshBtn: document.getElementById("refreshBtn"),
  clearHistoryBtn: document.getElementById("clearHistoryBtn"),
  globalForm: document.getElementById("globalForm"),
  globalTemplateSelect: document.getElementById("globalTemplateSelect"),
  globalNoteInput: document.getElementById("globalNoteInput"),
  venueForm: document.getElementById("venueForm"),
  adminVenueList: document.getElementById("adminVenueList"),
  newVenueEvents: document.getElementById("newVenueEvents"),
  publicViewForm: document.getElementById("publicViewForm"),
  showCurrentOnly: document.getElementById("showCurrentOnly"),
  currentTournamentSelect: document.getElementById("currentTournamentSelect"),
  adminShieldBtn: document.getElementById("adminShieldBtn"),
  adminDrawer: document.getElementById("adminDrawer"),
  minimizeAdminBtn: document.getElementById("minimizeAdminBtn"),
  adminSessionText: document.getElementById("adminSessionText"),
  firebaseStatusText: document.getElementById("firebaseStatusText"),
  firebaseStatusBadge: document.getElementById("firebaseStatusBadge"),
  timelineForm: document.getElementById("timelineForm"),
  timelineTitleInput: document.getElementById("timelineTitleInput"),
  timelineBodyInput: document.getElementById("timelineBodyInput"),
  incidentForm: document.getElementById("incidentForm"),
  incidentVenueSelect: document.getElementById("incidentVenueSelect"),
  incidentTypeSelect: document.getElementById("incidentTypeSelect"),
  incidentNoteInput: document.getElementById("incidentNoteInput"),
  incidentFileInput: document.getElementById("incidentFileInput"),
  incidentList: document.getElementById("incidentList"),
  clearIncidentsBtn: document.getElementById("clearIncidentsBtn"),
  lightningForm: document.getElementById("lightningForm"),
  lightningVenueSelect: document.getElementById("lightningVenueSelect"),
  lightningDistanceInput: document.getElementById("lightningDistanceInput"),
  lightningMinutesInput: document.getElementById("lightningMinutesInput"),
  lightningSourceSelect: document.getElementById("lightningSourceSelect"),
  lightningNotesInput: document.getElementById("lightningNotesInput"),
  lightningAlertList: document.getElementById("lightningAlertList"),
  aiUpdateForm: document.getElementById("aiUpdateForm"),
  aiVenueSelect: document.getElementById("aiVenueSelect"),
  aiAlertTypeSelect: document.getElementById("aiAlertTypeSelect"),
  aiSeveritySelect: document.getElementById("aiSeveritySelect"),
  aiWeatherDetailsInput: document.getElementById("aiWeatherDetailsInput"),
  aiGeneratedOutput: document.getElementById("aiGeneratedOutput"),
  aiApplyVenueBtn: document.getElementById("aiApplyVenueBtn"),
  aiApplyGlobalBtn: document.getElementById("aiApplyGlobalBtn"),
  fieldStatusForm: document.getElementById("fieldStatusForm"),
  fieldVenueSelect: document.getElementById("fieldVenueSelect"),
  fieldNameInput: document.getElementById("fieldNameInput"),
  fieldStatusSelect: document.getElementById("fieldStatusSelect"),
  fieldNoteInput: document.getElementById("fieldNoteInput"),
  fieldBoardAdminList: document.getElementById("fieldBoardAdminList"),
  clearFieldBoardBtn: document.getElementById("clearFieldBoardBtn")
};



function safeUUID() {
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createVenue(name, state, events, map = "", address = "", medical = "", shelter = "", parking = "") {
  return {
    id: safeUUID(),
    name,
    state,
    events,
    status: "green",
    note: "Normal operations.",
    map,
    address,
    medical,
    shelter,
    parking,
    fieldCondition: "Open"
  };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function loadData() {
  const saved = localStorage.getItem(STORAGE_KEY) || LEGACY_KEYS.map(key => localStorage.getItem(key)).find(Boolean);
  if (!saved) return clone(defaultData);
  try {
    return migrateData(JSON.parse(saved));
  } catch {
    return clone(defaultData);
  }
}

function normalizeTournamentName(eventName) {
  const map = {
    "Florida Extreme Cup": "Florida Extreme Cup (FL)",
    "Gulf Coast Invitational": "Gulf Coast Invitational (FL)",
    "Florence Cup": "Florence Cup (SC)",
    "Alabama Super Cup": "Alabama Super Cup (AL)",
    "General": tournamentOptions[0]
  };
  return map[eventName] || eventName || tournamentOptions[0];
}

function normalizeEvents(venue) {
  const rawEvents = Array.isArray(venue.events) ? venue.events : [venue.event];
  const cleanEvents = rawEvents.map(normalizeTournamentName).filter(event => tournamentOptions.includes(event));
  return cleanEvents.length ? [...new Set(cleanEvents)] : [tournamentOptions[0]];
}

function migrateData(saved) {
  const merged = { ...clone(defaultData), ...saved };
  merged.venues = (saved.venues || defaultData.venues).map(venue => ({
    id: venue.id || safeUUID(),
    name: venue.name || "Unnamed Venue",
    state: regions.includes(venue.state) ? venue.state : "Florida",
    events: normalizeEvents(venue),
    status: ["green", "yellow", "red"].includes(venue.status) ? venue.status : "green",
    note: venue.note || "Normal operations.",
    map: venue.map || "",
    address: venue.address || "",
    medical: venue.medical || "",
    shelter: venue.shelter || "",
    parking: venue.parking || "",
    fieldCondition: venue.fieldCondition || "Open"
  }));
  merged.currentTournaments = (saved.currentTournaments || []).filter(event => tournamentOptions.includes(event));
  merged.showCurrentOnly = Boolean(saved.showCurrentOnly);
  merged.history = Array.isArray(saved.history) ? saved.history : [];
  merged.timeline = Array.isArray(saved.timeline) ? saved.timeline : [];
  merged.incidents = Array.isArray(saved.incidents) ? saved.incidents : [];
  merged.lightningAlerts = Array.isArray(saved.lightningAlerts) ? saved.lightningAlerts : [];
  merged.fieldBoard = Array.isArray(saved.fieldBoard) ? saved.fieldBoard : [];
  merged.globalStatus = calculateGlobalStatus(merged.venues);
  merged.globalNote = saved.globalNote || templates.allClear;
  return merged;
}

function saveData(options = {}) {
  data.globalStatus = calculateGlobalStatus(data.venues);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  if (!options.skipFirebase) pushDataToFirebase();
}

function getFirebaseConfig() {
  const config = window.SMC_FIREBASE_CONFIG || {};
  if (!config.enabled) return null;
  if (!config.apiKey || !config.authDomain || !config.databaseURL || !config.projectId) return null;
  return config;
}

function updateFirebaseStatus(status, message) {
  if (!elements.firebaseStatusText || !elements.firebaseStatusBadge) return;
  elements.firebaseStatusText.textContent = message;
  elements.firebaseStatusBadge.textContent = status;
  elements.firebaseStatusBadge.className = `sync-badge ${status.toLowerCase().replace(/\s+/g, "-")}`;
}

function initFirebase() {
  const config = getFirebaseConfig();
  if (!config) {
    firebaseInitialSyncComplete = true;
    firebaseHydrationPending = false;
    updateFirebaseStatus("Local Only", "Firebase is not connected. This page currently saves updates to this browser only.");
    return;
  }

  firebaseHydrationPending = true;

  if (!window.firebase || !window.firebase.database) {
    firebaseInitialSyncComplete = true;
    firebaseHydrationPending = false;
    updateFirebaseStatus("Offline", "Firebase scripts did not load. Check your internet connection or script tags.");
    return;
  }

  try {
    if (!firebase.apps.length) firebase.initializeApp(config);
    firebaseDb = firebase.database();
    firebaseReady = true;
    updateFirebaseStatus("Connecting", "Firebase connected. Loading the current cloud status before this device is allowed to save.");
    listenToFirebase();
  } catch (error) {
    firebaseInitialSyncComplete = true;
    firebaseHydrationPending = false;
    console.error("Firebase setup error", error);
    updateFirebaseStatus("Error", "Firebase setup failed. Check firebase-config.js and Realtime Database rules.");
  }
}

function listenToFirebase() {
  if (!firebaseReady || firebaseListening) return;
  firebaseListening = true;
  const ref = firebaseDb.ref(FIREBASE_DATA_PATH);

  ref.on("value", snapshot => {
    const remoteData = snapshot.val();

    // The first Firebase read is authoritative. This prevents a second device
    // with stale LocalStorage from overwriting active venue or lightning status.
    if (!firebaseInitialSyncComplete) {
      suppressFirebasePush = true;

      if (remoteData) {
        data = migrateData(remoteData);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        updateFirebaseStatus("Synced", `Cloud status loaded: ${nowStamp()}`);
      } else {
        updateFirebaseStatus("Connected", "Firebase connected. No cloud data has been saved yet.");
      }

      suppressFirebasePush = false;
      firebaseInitialSyncComplete = true;
      firebaseHydrationPending = false;
      render();

      // Only seed an empty Firebase database after Firebase confirms it is empty.
      // Existing cloud data always wins over this device's cached browser data.
      if (!remoteData && !getFirebaseConfig().readOnlyPublic) {
        const localSnapshot = localStorage.getItem(STORAGE_KEY);
        if (localSnapshot && data.lastUpdated) pushDataToFirebase();
      }
      return;
    }

    if (!remoteData) {
      updateFirebaseStatus("Connected", "Firebase connected. No cloud data has been saved yet.");
      return;
    }

    suppressFirebasePush = true;
    data = migrateData(remoteData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    suppressFirebasePush = false;
    updateFirebaseStatus("Synced", `Last cloud sync: ${nowStamp()}`);
    render();
  }, error => {
    firebaseInitialSyncComplete = true;
    firebaseHydrationPending = false;
    console.error("Firebase read error", error);
    updateFirebaseStatus("Error", "Firebase read failed. Check Realtime Database rules.");
  });
}

function pushDataToFirebase() {
  // Never write before the first cloud read completes. A stale browser must not
  // overwrite the live tournament state when the page opens on another device.
  if (suppressFirebasePush || firebaseHydrationPending || !firebaseInitialSyncComplete || !firebaseReady || !firebaseDb) return;
  clearTimeout(pendingFirebaseSave);
  pendingFirebaseSave = setTimeout(() => {
    firebaseDb.ref(FIREBASE_DATA_PATH).set(data)
      .then(() => updateFirebaseStatus("Synced", `Last cloud save: ${nowStamp()}`))
      .catch(error => {
        console.error("Firebase save error", error);
        updateFirebaseStatus("Error", "Firebase save failed. Check write permissions and Realtime Database rules.");
      });
  }, 250);
}

function nowStamp() {
  return new Date().toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function adminLabel() {
  if (!currentAdmin) return "System";
  return `${currentAdmin.name}, ${currentAdmin.role}`;
}

function titleCaseStatus(status) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function calculateGlobalStatus(venues) {
  if (venues.some(venue => venue.status === "red")) return "red";
  if (venues.some(venue => venue.status === "yellow")) return "yellow";
  return "green";
}

function addHistory(title, note, status = "neutral") {
  data.history.unshift({ title, note, status, time: nowStamp(), admin: adminLabel() });
  data.history = data.history.slice(0, 75);
}

function detectHistoryStatus(item) {
  if (["green", "yellow", "red"].includes(item.status)) return item.status;
  const content = `${item.title || ""} ${item.note || ""}`.toLowerCase();
  if (content.includes("red") || content.includes("closed") || content.includes("suspended") || content.includes("lightning")) return "red";
  if (content.includes("yellow") || content.includes("monitoring") || content.includes("delay") || content.includes("advisory")) return "yellow";
  if (content.includes("green") || content.includes("all clear") || content.includes("normal operations") || content.includes("resume")) return "green";
  return "neutral";
}

function addTimeline(title, note) {
  data.timeline.unshift({ title, note, time: nowStamp(), admin: adminLabel() });
  data.timeline = data.timeline.slice(0, 75);
}

function playAlertTone() {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.frequency.value = 720;
    gainNode.gain.value = 0.08;
    oscillator.start();
    setTimeout(() => {
      oscillator.stop();
      audioContext.close();
    }, 350);
  } catch {
    return;
  }
}

function getSelectedValues(selectElement) {
  return Array.from(selectElement.selectedOptions || []).map(option => option.value);
}

function setSelectedValues(selectElement, values) {
  const selected = new Set(values || []);
  Array.from(selectElement.options).forEach(option => {
    option.selected = selected.has(option.value);
  });
}

function updateTournamentSelect(selectElement, includeAll = false, selectedValues = []) {
  if (!selectElement) return;
  const previous = selectedValues.length ? selectedValues : getSelectedValues(selectElement);
  selectElement.innerHTML = `${includeAll ? '<option value="all">All Tournaments</option>' : ''}${tournamentOptions.map(event => `<option value="${escapeAttr(event)}">${escapeHtml(event)}</option>`).join("")}`;
  if (includeAll && (!previous.length || previous.includes("all"))) {
    selectElement.options[0].selected = true;
  } else {
    setSelectedValues(selectElement, previous.filter(value => value === "all" || tournamentOptions.includes(value)));
  }
  renderLinkedCheckboxDropdown(selectElement);
}

function getCheckboxDropdownParts(selectElement) {
  if (selectElement === elements.eventFilter) {
    return {
      menu: elements.eventFilterCheckboxMenu,
      toggle: elements.eventFilterToggle,
      includeAll: true,
      emptyLabel: "All Tournaments"
    };
  }
  if (selectElement === elements.currentTournamentSelect) {
    return {
      menu: elements.currentTournamentCheckboxMenu,
      toggle: elements.currentTournamentToggle,
      includeAll: false,
      emptyLabel: "No current tournaments selected"
    };
  }
  return null;
}

function getDropdownLabel(selectElement, emptyLabel) {
  const selected = getSelectedValues(selectElement).filter(value => value !== "all");
  if (getSelectedValues(selectElement).includes("all")) return "All Tournaments";
  if (!selected.length) return emptyLabel;
  if (selected.length === 1) return selected[0];
  return `${selected.length} tournaments selected`;
}

function renderLinkedCheckboxDropdown(selectElement) {
  const parts = getCheckboxDropdownParts(selectElement);
  if (!parts || !parts.menu || !parts.toggle) return;
  const selected = new Set(getSelectedValues(selectElement));
  parts.toggle.textContent = getDropdownLabel(selectElement, parts.emptyLabel);
  parts.menu.innerHTML = Array.from(selectElement.options).map(option => `
    <label class="checkbox-option">
      <input type="checkbox" value="${escapeAttr(option.value)}" ${selected.has(option.value) ? "checked" : ""} />
      <span>${escapeHtml(option.textContent)}</span>
    </label>
  `).join("");
}

function syncCheckboxDropdown(selectElement, changedValue) {
  const parts = getCheckboxDropdownParts(selectElement);
  if (!parts || !parts.menu) return;
  let values = Array.from(parts.menu.querySelectorAll('input[type="checkbox"]:checked')).map(input => input.value);
  if (parts.includeAll) {
    if (changedValue === "all") {
      values = ["all"];
    } else {
      values = values.filter(value => value !== "all");
      if (!values.length) values = ["all"];
    }
  }
  setSelectedValues(selectElement, values);
  renderLinkedCheckboxDropdown(selectElement);
  selectElement.dispatchEvent(new Event("change", { bubbles: true }));
}

function toggleCheckboxDropdown(menuElement) {
  if (!menuElement) return;
  document.querySelectorAll(".checkbox-menu").forEach(menu => {
    if (menu !== menuElement) menu.classList.add("hidden");
  });
  menuElement.classList.toggle("hidden");
}

function updateVenueSelect(selectElement, includeGlobal = false) {
  if (!selectElement) return;
  const previous = selectElement.value;
  const globalOption = includeGlobal ? '<option value="global">All Public Venues</option>' : '';
  const emptyOption = data.venues.length ? '' : '<option value="">Add a venue first</option>';
  selectElement.innerHTML = `${globalOption}${emptyOption}${data.venues.map(venue => `<option value="${escapeAttr(venue.id)}">${escapeHtml(venue.name)}</option>`).join("")}`;
  if (previous && Array.from(selectElement.options).some(option => option.value === previous)) {
    selectElement.value = previous;
  }
}

function updateAllVenueSelects() {
  updateVenueSelect(elements.incidentVenueSelect);
  updateVenueSelect(elements.lightningVenueSelect);
  updateVenueSelect(elements.aiVenueSelect, true);
  updateVenueSelect(elements.fieldVenueSelect);
}

function render() {
  data.globalStatus = calculateGlobalStatus(data.venues);
  updateTournamentSelect(elements.eventFilter, true);
  updateTournamentSelect(elements.newVenueEvents, false);
  updateTournamentSelect(elements.currentTournamentSelect, false, data.currentTournaments);
  updateAllVenueSelects();

  elements.showCurrentOnly.checked = data.showCurrentOnly;
  const statusText = `${data.globalStatus.toUpperCase()} STATUS`;
  elements.globalStatus.className = `global-status ${data.globalStatus}`;
  elements.globalStatus.textContent = statusText;
  elements.stickyStatus.className = `sticky-status ${data.globalStatus}`;
  elements.stickyStatusText.textContent = statusText;
  elements.stickyUpdateText.textContent = data.lastUpdated ? `Last updated: ${data.lastUpdated}` : "Last updated: Not yet updated";
  elements.globalNote.textContent = data.globalNote;
  elements.globalNoteInput.value = data.globalNote;
  elements.lastUpdated.textContent = data.lastUpdated ? `Last updated: ${data.lastUpdated}` : "Last updated: Not yet updated";

  renderPublicLightningAlerts();
  renderPublicVenues();
  renderFieldStatusBoard();
  renderTimeline();
  renderHistory();
  renderAdminVenues();
  renderIncidents();
  renderLightningAlerts();
  renderFieldBoardAdmin();
  updateSessionText();
}

function getPublicVenues() {
  if (!data.showCurrentOnly || !data.currentTournaments.length) return data.venues;
  return data.venues.filter(venue => venue.events.some(event => data.currentTournaments.includes(event)));
}

function getCommandVenues() {
  const selectedState = elements.stateFilter.value;
  const selectedEvents = getSelectedValues(elements.eventFilter);
  const showAllEvents = !selectedEvents.length || selectedEvents.includes("all");
  return data.venues.filter(venue => {
    const regionMatch = selectedState === "all" || venue.state === selectedState;
    const eventMatch = showAllEvents || venue.events.some(event => selectedEvents.includes(event));
    return regionMatch && eventMatch;
  });
}

function getVenueLightningState(venueId, now = Date.now()) {
  const venueAlerts = data.lightningAlerts.filter(alert => alert.venueId === venueId);
  const relevantAlerts = [];

  for (const alert of venueAlerts) {
    if (alert.status === "green") break;
    relevantAlerts.push(alert);
  }

  const unresolvedRedAlerts = relevantAlerts.filter(alert =>
    alert.status === "red" &&
    alert.allClearTarget &&
    !alert.autoCleared &&
    !alert.manualCleared
  );

  const activeRedAlerts = unresolvedRedAlerts.filter(alert => Number(alert.allClearTarget) > now);
  const timerTarget = activeRedAlerts.reduce((latest, alert) => Math.max(latest, Number(alert.allClearTarget) || 0), 0);
  const activeRedAlert = activeRedAlerts.reduce((selected, alert) => {
    if (!selected) return alert;
    return Number(alert.allClearTarget) >= Number(selected.allClearTarget) ? alert : selected;
  }, null);
  const latestYellowAlert = relevantAlerts.find(alert => alert.status === "yellow") || null;

  return {
    latestAlert: venueAlerts[0] || null,
    relevantAlerts,
    unresolvedRedAlerts,
    activeRedAlerts,
    activeRed: activeRedAlerts.length > 0,
    activeRedAlert,
    timerTarget,
    latestYellowAlert
  };
}

function getLatestPublicLightningAlerts() {
  const publicVenues = getPublicVenues();
  const alerts = [];

  publicVenues.forEach(venue => {
    const state = getVenueLightningState(venue.id);
    if (state.activeRed && state.activeRedAlert) {
      alerts.push({ ...state.activeRedAlert, allClearTarget: state.timerTarget, status: "red" });
      return;
    }
    if (state.latestYellowAlert) alerts.push(state.latestYellowAlert);
  });

  return alerts.slice(0, 6);
}

function getLatestLightningAllClear() {
  const publicVenueIds = new Set(getPublicVenues().map(venue => venue.id));
  return data.lightningAlerts.find(alert => alert.status === "green" && publicVenueIds.has(alert.venueId)) || null;
}

function formatLightningDistance(distance) {
  if (distance === null || distance === undefined || Number.isNaN(Number(distance))) return "Not entered";
  return `${Number(distance).toFixed(1)} miles`;
}

function getLightningCountdownParts(alert) {
  if (!alert.allClearTarget || alert.status !== "red") {
    return { clock: "--:--", label: "No active delay countdown", detail: "SMC staff are monitoring conditions." };
  }

  const remainingMs = alert.allClearTarget - Date.now();
  if (remainingMs <= 0) {
    return { clock: "00:00", label: "Timer complete", detail: "Wait for SMC staff confirmation before returning to fields." };
  }

  const totalSeconds = Math.ceil(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = String(totalSeconds % 60).padStart(2, "0");

  return {
    clock: `${minutes}:${seconds}`,
    label: "Lightning countdown",
    detail: "Time remaining until the 30-minute timer is complete."
  };
}

function renderPublicLightningAlerts() {
  const alerts = getLatestPublicLightningAlerts();
  if (!elements.publicLightningPanel || !elements.publicLightningList) return;

  if (alerts.length) {
    if (elements.publicLightningBadge) elements.publicLightningBadge.classList.add("hidden");
    elements.publicLightningPanel.classList.remove("hidden");
    elements.publicLightningList.innerHTML = alerts.map(alert => {
      const countdown = getLightningCountdownParts(alert);
      return `
        <article class="public-lightning-card ${escapeAttr(alert.status)}-lightning-card">
          <div class="public-lightning-header">
            <h3>${escapeHtml(String(alert.venueName || "Venue").toUpperCase())}</h3>
            <span class="alert-status-pill ${escapeAttr(alert.status)}">${escapeHtml(titleCaseStatus(alert.status))}</span>
          </div>
          <div class="lightning-public-grid">
            <div class="lightning-stat-box">
              <span>Closest lightning strike</span>
              <strong>${escapeHtml(formatLightningDistance(alert.distance))}</strong>
            </div>
            <div class="lightning-stat-box countdown-box">
              <span>${escapeHtml(countdown.label)}</span>
              <strong class="lightning-countdown-clock">${escapeHtml(countdown.clock)}</strong>
            </div>
          </div>
          <p class="lightning-public-note">${escapeHtml(alert.note || countdown.detail)}</p>
          <div class="public-lightning-meta">Updated: ${escapeHtml(alert.time || "Time not recorded")} | Source: ${escapeHtml(alert.source || "Not listed")}</div>
        </article>
      `;
    }).join("");
    return;
  }

  const latestAllClear = getLatestLightningAllClear();
  if (elements.publicLightningBadge) {
    elements.publicLightningBadge.classList.remove("hidden");
    elements.publicLightningBadge.setAttribute("aria-expanded", String(lightningPanelExpanded));
  }
  elements.publicLightningPanel.classList.toggle("hidden", !lightningPanelExpanded);

  const allClearNote = latestAllClear ? latestAllClear.note : "No active lightning delay is posted. Continue checking this page for updates.";
  const allClearTime = latestAllClear ? latestAllClear.time : (data.lastUpdated || "Not yet updated");
  const allClearSource = latestAllClear ? latestAllClear.source : "SMC staff";

  elements.publicLightningList.innerHTML = lightningPanelExpanded ? `
    <article class="public-lightning-card green-lightning-card all-clear-lightning-card">
      <div class="public-lightning-header">
        <h3>LIGHTNING STATUS</h3>
        <span class="alert-status-pill green">ALL CLEAR</span>
      </div>
      <div class="lightning-public-grid">
        <div class="lightning-stat-box">
          <span>Closest lightning strike</span>
          <strong>Clear</strong>
        </div>
        <div class="lightning-stat-box countdown-box">
          <span>Lightning countdown</span>
          <strong class="lightning-countdown-clock">00:00</strong>
        </div>
      </div>
      <p class="lightning-public-note">${escapeHtml(allClearNote)}</p>
      <div class="public-lightning-meta">Updated: ${escapeHtml(allClearTime)} | Source: ${escapeHtml(allClearSource)}</div>
    </article>
  ` : "";
}

function renderPublicVenues() {
  const venues = getPublicVenues();
  elements.venueGrid.innerHTML = venues.length ? venues.map(venue => `
    <article class="venue-card ${venue.status}-card">
      <h2>${escapeHtml(venue.name.toUpperCase())}</h2>
      <div class="venue-status-pill ${venue.status}">${venue.status.toUpperCase()}</div>
      <p class="venue-note">${escapeHtml(venue.note || "No current note.")}</p>
    </article>
  `).join("") : `<article class="venue-card empty-card"><h2>NO CURRENT PUBLIC VENUES</h2><p class="venue-note">Venue records are managed in Admin Access.</p></article>`;
}

function fieldStatusClass(status) {
  const clean = String(status || "").toLowerCase().replace(/\s+/g, "-");
  return `field-${clean}`;
}

function getPublicFieldBoardItems() {
  const publicVenueIds = new Set(getPublicVenues().map(venue => venue.id));
  return data.fieldBoard.filter(item => publicVenueIds.has(item.venueId));
}

function renderFieldStatusBoard() {
  const items = getPublicFieldBoardItems();
  elements.fieldStatusPanel.classList.toggle("hidden", !items.length);
  elements.fieldStatusBoard.innerHTML = items.length ? items.map(item => `
    <article class="field-status-card">
      <h3>${escapeHtml(item.fieldName)}</h3>
      <div class="field-meta">${escapeHtml(item.venueName)}</div>
      <span class="field-status-pill ${fieldStatusClass(item.status)}">${escapeHtml(item.status)}</span>
      <p>${escapeHtml(item.note || "No field note posted.")}</p>
      <div class="field-meta">Updated: ${escapeHtml(item.time || "Time not recorded")}</div>
    </article>
  `).join("") : "";
}

function renderTimeline() {
  elements.timelineList.innerHTML = data.timeline.length ? data.timeline.slice(0, 12).map(item => `
    <div class="history-item">
      <strong>${escapeHtml(item.title)}</strong>
      <span>${escapeHtml(item.time || "Time not recorded")}</span>
      <p>${escapeHtml(item.note || "No details provided.")}</p>
    </div>
  `).join("") : `<p class="muted">No timeline updates yet.</p>`;
}

function renderHistory() {
  const visibleHistory = data.history
    .filter(item => ["green", "yellow", "red"].includes(item.status));

  elements.historyList.innerHTML = visibleHistory.length ? visibleHistory.slice(0, 18).map(item => {
    const status = item.status;
    const statusLabel = titleCaseStatus(status);
    return `
      <div class="history-item status-history-item ${status}-history">
        <div class="history-title-row">
          <strong>${escapeHtml(item.title)}</strong>
          <span class="history-status-pill ${status}">${escapeHtml(statusLabel)}</span>
        </div>
        <span>${escapeHtml(item.time || "Time not recorded")} | ${escapeHtml(item.admin || "System")}</span>
        <p>${escapeHtml(item.note || "No details provided.")}</p>
      </div>
    `;
  }).join("") : `<p class="muted">No Green, Yellow, or Red status updates have been posted yet.</p>`;
}

function renderAdminVenues() {
  const venues = getCommandVenues();
  elements.adminVenueList.innerHTML = venues.length ? venues.map(venue => `
    <div class="admin-venue-card ${venue.status}-admin-card">
      <h3>${escapeHtml(venue.name)}</h3>
      <label>Venue name</label>
      <input type="text" data-action="name" data-id="${escapeAttr(venue.id)}" value="${escapeAttr(venue.name)}" />
      <label>Region</label>
      <select data-action="state" data-id="${escapeAttr(venue.id)}">
        ${regions.map(state => `<option value="${escapeAttr(state)}" ${venue.state === state ? "selected" : ""}>${escapeHtml(state)}</option>`).join("")}
      </select>
      <label>Status</label>
      <select data-action="status" data-id="${escapeAttr(venue.id)}">
        <option value="green" ${venue.status === "green" ? "selected" : ""}>Green</option>
        <option value="yellow" ${venue.status === "yellow" ? "selected" : ""}>Yellow</option>
        <option value="red" ${venue.status === "red" ? "selected" : ""}>Red</option>
      </select>
      <label>Template</label>
      <select data-action="template" data-id="${escapeAttr(venue.id)}">
        <option value="">Select a template</option>
        <option value="allClear">All clear</option>
        <option value="monitoring">Weather monitoring</option>
        <option value="lightningDelay">Lightning delay</option>
        <option value="heatAdvisory">Heat advisory</option>
        <option value="fieldClosure">Field closure</option>
        <option value="resumePlay">Resume play</option>
      </select>
      <label>Public note</label>
      <textarea rows="3" data-action="note" data-id="${escapeAttr(venue.id)}">${escapeHtml(venue.note || "")}</textarea>
      <label>Tournaments</label>
      <select multiple size="8" data-action="events" data-id="${escapeAttr(venue.id)}">
        ${tournamentOptions.map(event => `<option value="${escapeAttr(event)}" ${venue.events.includes(event) ? "selected" : ""}>${escapeHtml(event)}</option>`).join("")}
      </select>
      <label>Venue address or details</label>
      <input type="text" data-action="address" data-id="${escapeAttr(venue.id)}" value="${escapeAttr(venue.address || "")}" />
      <label>Field condition</label>
      <input type="text" data-action="fieldCondition" data-id="${escapeAttr(venue.id)}" value="${escapeAttr(venue.fieldCondition || "")}" />
      <label>Medical location</label>
      <input type="text" data-action="medical" data-id="${escapeAttr(venue.id)}" value="${escapeAttr(venue.medical || "")}" />
      <label>Shelter instructions</label>
      <input type="text" data-action="shelter" data-id="${escapeAttr(venue.id)}" value="${escapeAttr(venue.shelter || "")}" />
      <label>Parking details</label>
      <input type="text" data-action="parking" data-id="${escapeAttr(venue.id)}" value="${escapeAttr(venue.parking || "")}" />
      <label>Map link</label>
      <input type="url" data-action="map" data-id="${escapeAttr(venue.id)}" value="${escapeAttr(venue.map || "")}" />
      <div class="admin-actions">
        <button data-action="saveVenue" data-id="${escapeAttr(venue.id)}" type="button">Save Venue</button>
        <button class="secondary" data-action="deleteVenue" data-id="${escapeAttr(venue.id)}" type="button">Delete</button>
      </div>
    </div>
  `).join("") : `<p class="muted">No venues match the command center filters.</p>`;
}

function renderIncidents() {
  elements.incidentList.innerHTML = data.incidents.length ? data.incidents.map(incident => `
    <div class="incident-item">
      <strong>${escapeHtml(incident.type)} | ${escapeHtml(incident.venueName)}</strong>
      <span>${escapeHtml(incident.time)} | ${escapeHtml(incident.admin || "System")}</span>
      <p>${escapeHtml(incident.note || "No note entered.")}</p>
      ${incident.files && incident.files.length ? `<ul class="file-list">${incident.files.map(file => `<li><a class="file-link" href="${escapeAttr(file.dataUrl)}" download="${escapeAttr(file.name)}">${escapeHtml(file.name)}</a> <span>(${escapeHtml(formatBytes(file.size))})</span></li>`).join("")}</ul>` : ""}
    </div>
  `).join("") : `<p class="muted">No incidents recorded yet.</p>`;
}

function renderLightningAlerts() {
  elements.lightningAlertList.innerHTML = data.lightningAlerts.length ? data.lightningAlerts.slice(0, 12).map(alert => {
    const countdown = getLightningCountdownText(alert);
    return `
      <div class="incident-item">
        <strong>${escapeHtml(alert.venueName)} | ${escapeHtml(titleCaseStatus(alert.status))}</strong>
        <span>${escapeHtml(alert.time || "Time not recorded")} | ${escapeHtml(alert.admin || "System")}</span>
        <p>${escapeHtml(alert.note || "No alert note entered.")}</p>
        <span class="alert-status-pill ${escapeAttr(alert.status)}">${escapeHtml(titleCaseStatus(alert.status))}</span>
        ${countdown ? `<div class="lightning-countdown">${escapeHtml(countdown)}</div>` : ""}
        ${["red", "yellow"].includes(alert.status) && !alert.autoCleared ? `<button class="secondary small-btn manual-clear-btn" data-action="manualLightningAllClear" data-alert-id="${escapeAttr(alert.id)}" type="button">Manual All Clear</button>` : ""}
      </div>
    `;
  }).join("") : `<p class="muted">No lightning alerts recorded yet.</p>`;
}

function renderFieldBoardAdmin() {
  elements.fieldBoardAdminList.innerHTML = data.fieldBoard.length ? data.fieldBoard.map(item => `
    <div class="incident-item">
      <strong>${escapeHtml(item.fieldName)} | ${escapeHtml(item.venueName)}</strong>
      <span>${escapeHtml(item.time || "Time not recorded")} | ${escapeHtml(item.admin || "System")}</span>
      <p>${escapeHtml(item.note || "No field note posted.")}</p>
      <span class="field-status-pill ${fieldStatusClass(item.status)}">${escapeHtml(item.status)}</span>
    </div>
  `).join("") : `<p class="muted">No field statuses posted yet.</p>`;
}

function getLightningCountdownText(alert) {
  if (alert.status !== "red" || alert.autoCleared) return "";
  const state = getVenueLightningState(alert.venueId);
  const target = state.activeRed && state.timerTarget ? state.timerTarget : alert.allClearTarget;
  if (!target) return "";
  const remaining = target - Date.now();
  if (remaining <= 0) return "All-clear timer complete. Confirm conditions before play resumes.";
  const minutes = Math.ceil(remaining / 60000);
  return `${minutes} minute lightning timer remaining`;
}

function processLightningTimers() {
  let changed = false;
  const now = Date.now();

  data.venues.forEach(venue => {
    const state = getVenueLightningState(venue.id, now);

    if (state.activeRed) {
      if (venue.status !== "red") {
        venue.status = "red";
        venue.note = "Lightning delay remains active. The venue will stay Red until the latest lightning countdown finishes or SMC staff issue a Manual All Clear.";
        data.lastUpdated = nowStamp();
        changed = true;
      }
      return;
    }

    if (!state.unresolvedRedAlerts.length) return;

    state.unresolvedRedAlerts.forEach((alert, index) => {
      alert.autoCleared = true;
      alert.allClearTarget = null;
      if (index > 0) alert.superseded = true;
    });

    const newestExpiredRed = state.unresolvedRedAlerts[0];
    newestExpiredRed.status = "green";
    newestExpiredRed.note = "The latest 30-minute lightning timer completed. Staff confirmation is still required before restart.";

    if (state.latestYellowAlert) {
      venue.status = "yellow";
      venue.note = state.latestYellowAlert.note || "Lightning remains under monitoring near this venue.";
      addHistory(`${venue.name} lightning monitoring`, venue.note, "yellow");
      addTimeline(`${venue.name} lightning delay timer completed`, "The delay countdown finished, but lightning monitoring remains active.");
    } else {
      venue.status = "green";
      venue.note = "The latest lightning timer has cleared. Play may resume when SMC staff, referees, and facility staff confirm fields are safe.";
      addHistory(`${venue.name} lightning all clear`, venue.note, "green");
      addTimeline(`${venue.name} lightning timer cleared`, venue.note);
    }

    data.lastUpdated = nowStamp();
    changed = true;
  });

  return changed;
}

function getStatusFromAiInputs(alertType, severity) {
  if (severity === "All Clear" || alertType === "Resume Play") return "green";
  if (severity === "Suspended") return "red";
  if (alertType === "Lightning" && severity === "Delay") return "red";
  return "yellow";
}

function generateWeatherUpdateDraft() {
  const selectedVenueId = elements.aiVenueSelect.value;
  const venue = data.venues.find(item => item.id === selectedVenueId);
  const venueText = selectedVenueId === "global" ? "all public venues" : venue ? venue.name : "the selected venue";
  const alertType = elements.aiAlertTypeSelect.value;
  const severity = elements.aiSeveritySelect.value;
  const details = elements.aiWeatherDetailsInput.value.trim();
  const status = getStatusFromAiInputs(alertType, severity);

  if (status === "green") {
    return `All clear for ${venueText}. SMC staff have reviewed the latest ${alertType.toLowerCase()} update. Teams should return to normal event operations and follow referee or field marshal instructions.`;
  }

  if (status === "red") {
    return `${alertType} alert for ${venueText}. Games are temporarily suspended. Teams should clear the fields and wait for further instructions from SMC staff. ${details}`.trim();
  }

  return `${alertType} monitoring is active for ${venueText}. Games remain scheduled unless noted by SMC staff. Teams should stay close to their field and continue checking this page for updates. ${details}`.trim();
}

function applyGeneratedUpdateToVenue() {
  const note = elements.aiGeneratedOutput.value.trim();
  const venue = data.venues.find(item => item.id === elements.aiVenueSelect.value);
  if (!note) return alert("Generate or enter an update first.");
  if (!venue) return alert("Select one venue before applying this update.");
  const oldStatus = venue.status;
  const status = getStatusFromAiInputs(elements.aiAlertTypeSelect.value, elements.aiSeveritySelect.value);
  venue.status = status;
  venue.note = note;
  data.lastUpdated = nowStamp();
  addHistory(`${venue.name} ${titleCaseStatus(status)} update`, note, status);
  addTimeline(`${venue.name} generated weather update`, note);
  saveData();
  if (status === "red" && oldStatus !== "red") playAlertTone();
  render();
}

function applyGeneratedUpdateToGlobal() {
  const note = elements.aiGeneratedOutput.value.trim();
  if (!note) return alert("Generate or enter an update first.");
  data.globalNote = note;
  data.lastUpdated = nowStamp();
  addHistory("Global generated weather update", note, data.globalStatus);
  addTimeline("Global generated weather update", note);
  saveData();
  render();
}

function updateSessionText() {
  elements.adminSessionText.textContent = currentAdmin ? `${currentAdmin.name} | ${currentAdmin.role}` : "Protected command center";
}

function unlockAdmin(user) {
  currentAdmin = user;
  adminUnlocked = true;
  elements.loginBox.classList.add("hidden");
  elements.commandCenter.classList.remove("hidden");
  elements.adminDrawer.classList.add("admin-fullscreen");
  document.body.classList.add("command-mode");
  elements.fullScreenBtn.textContent = "Exit Full Screen";
  document.querySelectorAll(".admin-only").forEach(item => item.classList.remove("hidden"));
  addTimeline("Admin session opened", `${adminLabel()} unlocked the command center.`);
  saveData();
  render();
}

function lockAdmin() {
  adminUnlocked = false;
  currentAdmin = null;
  elements.commandCenter.classList.add("hidden");
  elements.loginBox.classList.remove("hidden");
  elements.passwordInput.value = "";
  elements.adminDrawer.classList.remove("admin-fullscreen");
  document.body.classList.remove("command-mode");
  elements.fullScreenBtn.textContent = "Exit Full Screen";
  document.querySelectorAll(".admin-only").forEach(item => item.classList.add("hidden"));
  render();
}

function openAdminDrawer() {
  elements.adminDrawer.classList.remove("hidden");
  if (adminUnlocked) {
    elements.adminDrawer.classList.add("admin-fullscreen");
    document.body.classList.add("command-mode");
    elements.fullScreenBtn.textContent = "Exit Full Screen";
  }
  setTimeout(() => {
    if (!adminUnlocked) elements.passwordInput.focus();
  }, 50);
}

function minimizeAdminDrawer() {
  elements.adminDrawer.classList.add("hidden");
  elements.adminDrawer.classList.remove("admin-fullscreen");
  document.body.classList.remove("command-mode");
  elements.fullScreenBtn.textContent = "Full Screen";
}

function verifyPassword() {
  const password = elements.passwordInput.value;
  const user = ADMIN_USERS.find(admin => admin.password === password);
  if (!user) {
    alert("Incorrect password.");
    return;
  }
  unlockAdmin({ name: user.name, role: user.role });
}

async function filesToDataUrls(fileList) {
  const files = Array.from(fileList || []);
  return Promise.all(files.map(file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({ name: file.name, type: file.type, size: file.size, dataUrl: reader.result });
    reader.onerror = reject;
    reader.readAsDataURL(file);
  })));
}

function setAllStatuses(status) {
  const oldStatus = data.globalStatus;
  data.venues = data.venues.map(venue => ({ ...venue, status }));
  data.lastUpdated = nowStamp();
  data.globalNote = status === "green" ? templates.allClear : status === "yellow" ? templates.monitoring : templates.lightningDelay;
  addHistory(`All venues changed to ${titleCaseStatus(status)}`, data.globalNote, status);
  addTimeline(`All venues ${titleCaseStatus(status)}`, data.globalNote);
  saveData();
  if (status === "red" && oldStatus !== "red") playAlertTone();
  render();
}

function formatBytes(bytes) {
  if (!bytes) return "0 KB";
  const units = ["B", "KB", "MB"];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value = value / 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;"
  }[char]));
}

function escapeAttr(value) {
  return escapeHtml(value);
}

elements.adminShieldBtn.addEventListener("click", openAdminDrawer);
elements.minimizeAdminBtn.addEventListener("click", minimizeAdminDrawer);
elements.verifyBtn.addEventListener("click", verifyPassword);
elements.passwordInput.addEventListener("keydown", event => {
  if (event.key === "Enter") verifyPassword();
});
elements.lockBtn.addEventListener("click", lockAdmin);
elements.stateFilter.addEventListener("change", render);
elements.eventFilter.addEventListener("change", render);
if (elements.eventFilterToggle) {
  elements.eventFilterToggle.addEventListener("click", () => toggleCheckboxDropdown(elements.eventFilterCheckboxMenu));
}
if (elements.eventFilterCheckboxMenu) {
  elements.eventFilterCheckboxMenu.addEventListener("change", event => syncCheckboxDropdown(elements.eventFilter, event.target.value));
}
if (elements.currentTournamentToggle) {
  elements.currentTournamentToggle.addEventListener("click", () => toggleCheckboxDropdown(elements.currentTournamentCheckboxMenu));
}
if (elements.currentTournamentCheckboxMenu) {
  elements.currentTournamentCheckboxMenu.addEventListener("change", event => syncCheckboxDropdown(elements.currentTournamentSelect, event.target.value));
}
document.addEventListener("click", event => {
  if (event.target.closest(".checkbox-dropdown")) return;
  document.querySelectorAll(".checkbox-menu").forEach(menu => menu.classList.add("hidden"));
});
elements.refreshBtn.addEventListener("click", render);
if (elements.publicLightningBadge) {
  elements.publicLightningBadge.addEventListener("click", () => {
    lightningPanelExpanded = !lightningPanelExpanded;
    renderPublicLightningAlerts();
  });
}

document.querySelectorAll(".tab-btn").forEach(button => {
  button.addEventListener("click", () => {
    const tab = button.dataset.tab;
    document.querySelectorAll(".tab-btn").forEach(item => item.classList.toggle("active", item === button));
    document.querySelectorAll(".tab-panel").forEach(panel => panel.classList.toggle("active", panel.dataset.tabPanel === tab));
  });
});

elements.fullScreenBtn.addEventListener("click", () => {
  document.body.classList.toggle("command-mode");
  elements.adminDrawer.classList.toggle("admin-fullscreen", document.body.classList.contains("command-mode"));
  elements.fullScreenBtn.textContent = document.body.classList.contains("command-mode") ? "Exit Full Screen" : "Full Screen";
});

elements.globalTemplateSelect.addEventListener("change", () => {
  const value = elements.globalTemplateSelect.value;
  if (value && templates[value]) elements.globalNoteInput.value = templates[value];
});

elements.globalForm.addEventListener("submit", event => {
  event.preventDefault();
  data.globalNote = elements.globalNoteInput.value.trim() || "No current note.";
  data.lastUpdated = nowStamp();
  addHistory("Global note updated", data.globalNote, data.globalStatus);
  addTimeline("Global note updated", data.globalNote);
  saveData();
  render();
});

elements.timelineForm.addEventListener("submit", event => {
  event.preventDefault();
  const title = elements.timelineTitleInput.value.trim() || "Operations update";
  const note = elements.timelineBodyInput.value.trim();
  if (!note) return alert("Enter a timeline note.");
  data.lastUpdated = nowStamp();
  addTimeline(title, note);
  saveData();
  elements.timelineForm.reset();
  render();
});

elements.publicViewForm.addEventListener("submit", event => {
  event.preventDefault();
  data.showCurrentOnly = elements.showCurrentOnly.checked;
  data.currentTournaments = getSelectedValues(elements.currentTournamentSelect).filter(value => tournamentOptions.includes(value));
  data.lastUpdated = nowStamp();
  const note = data.showCurrentOnly ? `Showing current tournaments: ${data.currentTournaments.join(", ") || "None selected"}` : "Showing all venue tournaments.";
  addTimeline("Public tournament view updated", note);
  saveData();
  render();
});

elements.venueForm.addEventListener("submit", event => {
  event.preventDefault();
  const name = document.getElementById("newVenueName").value.trim();
  const state = document.getElementById("newVenueState").value;
  const events = getSelectedValues(elements.newVenueEvents).filter(value => tournamentOptions.includes(value));
  const address = document.getElementById("newVenueAddress").value.trim();
  const map = document.getElementById("newVenueMap").value.trim();
  if (!name) return alert("Enter a venue name.");
  if (!events.length) return alert("Select at least one tournament.");
  data.venues.push(createVenue(name, state, events, map, address));
  data.lastUpdated = nowStamp();
  addHistory(`Venue added: ${name}`, "Venue added to the Southeast hotline.");
  saveData();
  elements.venueForm.reset();
  render();
});

elements.adminVenueList.addEventListener("change", event => {
  if (event.target.dataset.action !== "template") return;
  const card = event.target.closest(".admin-venue-card");
  const template = templates[event.target.value];
  if (template) card.querySelector('[data-action="note"]').value = template;
});

elements.adminVenueList.addEventListener("click", event => {
  if (event.target.tagName !== "BUTTON") return;
  event.preventDefault();
  const id = event.target.dataset.id;
  const action = event.target.dataset.action;
  const venue = data.venues.find(v => v.id === id);
  if (!venue) return;

  if (action === "deleteVenue") {
    if (!confirm(`Delete ${venue.name}?`)) return;
    data.venues = data.venues.filter(v => v.id !== id);
    data.lastUpdated = nowStamp();
    addHistory(`Venue deleted: ${venue.name}`, "Venue removed from the hotline.");
  }

  if (action === "saveVenue") {
    const card = event.target.closest(".admin-venue-card");
    const oldStatus = venue.status;
    const oldName = venue.name;
    venue.name = card.querySelector('[data-action="name"]').value.trim() || "Unnamed Venue";
    venue.state = card.querySelector('[data-action="state"]').value;
    venue.status = card.querySelector('[data-action="status"]').value;
    venue.note = card.querySelector('[data-action="note"]').value.trim() || "No current note.";
    venue.events = getSelectedValues(card.querySelector('[data-action="events"]')).filter(value => tournamentOptions.includes(value));
    if (!venue.events.length) venue.events = [tournamentOptions[0]];
    venue.address = card.querySelector('[data-action="address"]').value.trim();
    venue.fieldCondition = card.querySelector('[data-action="fieldCondition"]').value.trim();
    venue.medical = card.querySelector('[data-action="medical"]').value.trim();
    venue.shelter = card.querySelector('[data-action="shelter"]').value.trim();
    venue.parking = card.querySelector('[data-action="parking"]').value.trim();
    venue.map = card.querySelector('[data-action="map"]').value.trim();
    data.lastUpdated = nowStamp();
    const note = `${oldName !== venue.name ? `Renamed from ${oldName}. ` : ""}Status: ${titleCaseStatus(venue.status)}. ${venue.note}`;
    addHistory(`${venue.name} saved`, note, venue.status);
    addTimeline(`${venue.name} ${titleCaseStatus(venue.status)}`, venue.note);
    if (venue.status === "red" && oldStatus !== "red") playAlertTone();
  }

  saveData();
  render();
});

elements.incidentForm.addEventListener("submit", async event => {
  event.preventDefault();
  const venue = data.venues.find(item => item.id === elements.incidentVenueSelect.value);
  const note = elements.incidentNoteInput.value.trim();
  if (!venue) return alert("Select a venue.");
  if (!note) return alert("Enter an incident note.");
  const files = await filesToDataUrls(elements.incidentFileInput.files);
  data.incidents.unshift({
    id: safeUUID(),
    venueId: venue.id,
    venueName: venue.name,
    type: elements.incidentTypeSelect.value,
    note,
    files,
    time: nowStamp(),
    admin: adminLabel()
  });
  data.incidents = data.incidents.slice(0, 75);
  addTimeline(`Incident logged: ${venue.name}`, `${elements.incidentTypeSelect.value} incident logged by ${adminLabel()}.`);
  saveData();
  elements.incidentForm.reset();
  render();
});

elements.clearIncidentsBtn.addEventListener("click", () => {
  if (!adminUnlocked) return;
  if (!confirm("Clear incident records from this browser?")) return;
  data.incidents = [];
  addTimeline("Incident records cleared", `${adminLabel()} cleared incident records.`);
  saveData();
  render();
});

function applyManualLightningAllClear(alertId) {
  if (!adminUnlocked) return;
  const alert = data.lightningAlerts.find(item => item.id === alertId);
  if (!alert) return;
  const venue = data.venues.find(item => item.id === alert.venueId);
  const venueName = alert.venueName || (venue ? venue.name : "Selected venue");
  const note = `SMC staff have issued the all clear for ${venueName}. Play may resume when referees and facility staff confirm fields are ready.`;

  if (venue) {
    venue.status = "green";
    venue.note = note;
  }

  data.lightningAlerts.forEach(item => {
    if (item.venueId !== alert.venueId || !["red", "yellow"].includes(item.status)) return;
    item.allClearTarget = null;
    item.autoCleared = true;
    item.manualCleared = true;
    if (item.id !== alertId) item.superseded = true;
  });

  alert.status = "green";
  alert.note = note;
  alert.allClearTarget = null;
  alert.autoCleared = true;
  alert.manualCleared = true;
  alert.clearedBy = adminLabel();
  alert.clearedAt = nowStamp();

  data.lightningAlerts.unshift({
    id: safeUUID(),
    venueId: alert.venueId,
    venueName,
    distance: alert.distance ?? null,
    minutes: LIGHTNING_CLEAR_MINUTES,
    source: "Manual all clear",
    status: "green",
    note,
    allClearTarget: null,
    autoCleared: true,
    manualCleared: true,
    time: nowStamp(),
    admin: adminLabel()
  });

  data.lightningAlerts = data.lightningAlerts.slice(0, 40);
  data.lastUpdated = nowStamp();
  addHistory(`${venueName} lightning all clear`, note, "green");
  addTimeline(`${venueName} manual lightning all clear`, note);
  saveData();
  render();
}

elements.lightningForm.addEventListener("submit", event => {
  event.preventDefault();
  const venue = data.venues.find(item => item.id === elements.lightningVenueSelect.value);
  if (!venue) return alert("Select a venue.");
  const distance = Number.parseFloat(elements.lightningDistanceInput.value);
  const minutes = Number.parseInt(elements.lightningMinutesInput.value, 10);
  if (Number.isNaN(distance) && Number.isNaN(minutes)) return alert("Enter a strike distance or minutes since last strike.");
  const source = elements.lightningSourceSelect.value;
  const details = elements.lightningNotesInput.value.trim();
  const oldStatus = venue.status;
  let status = "yellow";
  let note = "Lightning is being monitored near this venue. Games remain scheduled unless SMC staff post a delay or suspension.";
  let allClearTarget = null;
  const existingLightningState = getVenueLightningState(venue.id);

  if (!Number.isNaN(distance) && distance <= LIGHTNING_RED_MILES && (Number.isNaN(minutes) || minutes < LIGHTNING_CLEAR_MINUTES)) {
    status = "red";
    allClearTarget = Date.now() + Math.max(1, LIGHTNING_CLEAR_MINUTES - (Number.isNaN(minutes) ? 0 : minutes)) * 60000;
    note = `Lightning has been detected within ${distance.toFixed(1)} miles of ${venue.name}. Games are temporarily suspended. Teams should clear the fields and wait for further instructions from SMC staff.`;
  } else if ((!Number.isNaN(distance) && distance <= LIGHTNING_YELLOW_MILES) || (!Number.isNaN(minutes) && minutes < LIGHTNING_CLEAR_MINUTES)) {
    status = "yellow";
    note = `Lightning is being monitored near ${venue.name}. Teams should stay close to updates and follow SMC staff instructions.`;
  } else if (!Number.isNaN(minutes) && minutes >= LIGHTNING_CLEAR_MINUTES) {
    status = "green";
    note = `The 30-minute lightning timer has cleared for ${venue.name}. Play may resume when SMC staff, referees, and facility staff confirm fields are safe.`;
  }

  if (status === "red" && existingLightningState.activeRed && existingLightningState.timerTarget) {
    allClearTarget = Math.max(allClearTarget || 0, existingLightningState.timerTarget);
    note = `Lightning delay remains active at ${venue.name}. The 30-minute countdown is based on the latest qualifying strike and will not clear until the newest active timer is complete.`;
  } else if (status !== "red" && existingLightningState.activeRed) {
    status = "red";
    allClearTarget = existingLightningState.timerTarget;
    note = `Lightning delay remains active at ${venue.name}. A previous qualifying strike still has an active countdown. Teams should remain off the fields until the latest timer is complete or SMC staff issue a Manual All Clear.`;
  }

  venue.status = status;
  venue.note = note;
  data.lastUpdated = nowStamp();
  data.lightningAlerts.unshift({
    id: safeUUID(),
    venueId: venue.id,
    venueName: venue.name,
    distance: Number.isNaN(distance) ? null : distance,
    minutes: Number.isNaN(minutes) ? null : minutes,
    source,
    status,
    note: details ? `${note} Staff note: ${details}` : note,
    allClearTarget,
    autoCleared: false,
    time: nowStamp(),
    admin: adminLabel()
  });
  data.lightningAlerts = data.lightningAlerts.slice(0, 40);
  addHistory(`${venue.name} lightning ${titleCaseStatus(status)}`, note, status);
  addTimeline(`${venue.name} lightning alert`, `${note} Source: ${source}. ${details}`.trim());
  saveData();
  elements.lightningForm.reset();
  if (status === "red" && oldStatus !== "red") playAlertTone();
  render();
});

elements.lightningAlertList.addEventListener("click", event => {
  const button = event.target.closest("button[data-action='manualLightningAllClear']");
  if (!button) return;
  event.preventDefault();
  applyManualLightningAllClear(button.dataset.alertId);
});

elements.aiUpdateForm.addEventListener("submit", event => {
  event.preventDefault();
  elements.aiGeneratedOutput.value = generateWeatherUpdateDraft();
});

elements.aiApplyVenueBtn.addEventListener("click", applyGeneratedUpdateToVenue);
elements.aiApplyGlobalBtn.addEventListener("click", applyGeneratedUpdateToGlobal);

elements.fieldStatusForm.addEventListener("submit", event => {
  event.preventDefault();
  const venue = data.venues.find(item => item.id === elements.fieldVenueSelect.value);
  const fieldName = elements.fieldNameInput.value.trim();
  if (!venue) return alert("Select a venue.");
  if (!fieldName) return alert("Enter a field name or number.");
  const status = elements.fieldStatusSelect.value;
  const note = elements.fieldNoteInput.value.trim() || `${fieldName} is currently ${status.toLowerCase()}.`;
  const existing = data.fieldBoard.find(item => item.venueId === venue.id && item.fieldName.toLowerCase() === fieldName.toLowerCase());
  const record = {
    id: existing ? existing.id : safeUUID(),
    venueId: venue.id,
    venueName: venue.name,
    fieldName,
    status,
    note,
    time: nowStamp(),
    admin: adminLabel()
  };
  if (existing) {
    Object.assign(existing, record);
  } else {
    data.fieldBoard.unshift(record);
  }
  data.lastUpdated = nowStamp();
  const historyStatus = status === "Closed" ? "red" : status === "Open" ? "green" : "yellow";
  addHistory(`${venue.name} ${fieldName} ${status}`, note, historyStatus);
  addTimeline(`${venue.name} field status updated`, `${fieldName}: ${status}. ${note}`);
  saveData();
  elements.fieldStatusForm.reset();
  render();
});

elements.clearFieldBoardBtn.addEventListener("click", () => {
  if (!adminUnlocked) return;
  if (!confirm("Clear field status board records from this browser?")) return;
  data.fieldBoard = [];
  addTimeline("Field status board cleared", `${adminLabel()} cleared field status records.`);
  saveData();
  render();
});

document.getElementById("allGreenBtn").addEventListener("click", () => setAllStatuses("green"));
document.getElementById("allYellowBtn").addEventListener("click", () => setAllStatuses("yellow"));
document.getElementById("allRedBtn").addEventListener("click", () => setAllStatuses("red"));
document.getElementById("seedBtn").addEventListener("click", () => {
  if (!confirm("Reset all hotline data to blank defaults? This removes venue data saved in this browser.")) return;
  data = clone(defaultData);
  data.lastUpdated = nowStamp();
  addTimeline("Database reset", "Hotline reset to blank defaults. No venue records are included by default.");
  saveData();
  render();
});

elements.clearHistoryBtn.addEventListener("click", () => {
  if (!adminUnlocked) return;
  if (!confirm("Clear status history?")) return;
  data.history = [];
  saveData();
  render();
});

initFirebase();

// Render cached data immediately for speed, but do not let timers mutate or save
// anything until Firebase has loaded the authoritative cloud state.
render();
if (!firebaseHydrationPending && processLightningTimers()) saveData();

setInterval(() => {
  if (firebaseHydrationPending) {
    renderPublicLightningAlerts();
    renderLightningAlerts();
    return;
  }

  if (processLightningTimers()) {
    saveData();
    render();
  } else {
    renderPublicLightningAlerts();
    renderLightningAlerts();
  }
}, 1000);
