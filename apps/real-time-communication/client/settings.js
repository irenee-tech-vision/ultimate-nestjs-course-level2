// Settings module - localStorage management for real-time service toggles

const SETTINGS_KEY = 'rtc-settings';

const defaultSettings = {
  pollingEnabled: false,
  sseEnabled: false,
  websocketEnabled: false,
  userId: null,
};

function loadSettings() {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      return { ...defaultSettings, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.warn('Failed to load settings from localStorage:', e);
  }
  return { ...defaultSettings };
}

function saveSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.warn('Failed to save settings to localStorage:', e);
  }
}

function getSetting(key) {
  const settings = loadSettings();
  return settings[key];
}

function setSetting(key, value) {
  const settings = loadSettings();
  settings[key] = value;
  saveSettings(settings);
}
