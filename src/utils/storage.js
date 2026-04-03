/**
 * Storage Utility for Rococo Prive
 * This allows swapping LocalStorage for a real API/Database easily.
 */

const KEYS = {
  PROFILES: 'rococo_all_profiles',
  USER_DATA_PREFIX: 'rococo_data_',
  USER_AUTH: 'rococo_prive_user',
  ADMIN: 'rococo_admin_password',
  LOCATION: 'rococo_location',
  CARDS: 'rococo_cards'
};

export const storage = {
  // Profiles
  getAllProfiles: () => {
    try {
      const data = localStorage.getItem(KEYS.PROFILES);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error fetching profiles from storage', e);
      return [];
    }
  },

  saveAllProfiles: (profiles) => {
    localStorage.setItem(KEYS.PROFILES, JSON.stringify(profiles));
  },

  saveProfile: (profileData) => {
    const profiles = storage.getAllProfiles();
    const index = profiles.findIndex(p => p.email === profileData.email);
    let newProfiles;
    if (index >= 0) {
      newProfiles = [...profiles];
      newProfiles[index] = profileData;
    } else {
      newProfiles = [...profiles, profileData];
    }
    localStorage.setItem(KEYS.PROFILES, JSON.stringify(newProfiles));
    return newProfiles;
  },

  // User Specific Data (detailed profile info, stories, etc)
  getUserData: (email) => {
    try {
      const data = localStorage.getItem(`${KEYS.USER_DATA_PREFIX}${email}`);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  },

  saveUserData: (email, data) => {
    localStorage.setItem(`${KEYS.USER_DATA_PREFIX}${email}`, JSON.stringify(data));
  },

  // Auth & Session
  setSession: (userData) => {
    localStorage.setItem(KEYS.USER_AUTH, JSON.stringify(userData));
  },

  getSession: () => {
    try {
      const data = localStorage.getItem(KEYS.USER_AUTH);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  },

  // Location
  getLocation: () => {
    try {
      const data = localStorage.getItem(KEYS.LOCATION);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  },

  saveLocation: (loc) => {
    localStorage.setItem(KEYS.LOCATION, JSON.stringify(loc));
  },

  // Global Scans (for Stories, etc)
  getAllUserData: () => {
    const allData = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(KEYS.USER_DATA_PREFIX)) {
        const data = localStorage.getItem(key);
        if (data) {
          try {
            allData.push(JSON.parse(data));
          } catch (e) {}
        }
      }
    }
    return allData;
  },

  getCards: () => {
    try {
      const data = localStorage.getItem(KEYS.CARDS);
      return data ? JSON.parse(data) : [];
    } catch { return []; }
  },

  saveCards: (cards) => {
    localStorage.setItem(KEYS.CARDS, JSON.stringify(cards));
  }
};
