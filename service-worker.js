const STORAGE_KEY = 'salesforce_data';
const LOCK_NAME = 'salesforce_storage_lock';

// Map Salesforce Object Names to Schema Keys
const OBJECT_TO_KEY = {
  'Lead': 'leads',
  'Contact': 'contacts',
  'Account': 'accounts',
  'Opportunity': 'opportunities',
  'Task': 'tasks'
};

/**
 * Initializes the storage if it doesn't exist.
 */
async function initStorage() {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  if (!result[STORAGE_KEY]) {
    const initialData = {
      leads: [],
      contacts: [],
      accounts: [],
      opportunities: [],
      tasks: [],
      lastSync: {
        leads: 0,
        contacts: 0,
        accounts: 0,
        opportunities: 0,
        tasks: 0
      }
    };
    await chrome.storage.local.set({ [STORAGE_KEY]: initialData });
  }
}

/**
 * Merges new records into existing records, handling deduplication via ID.
 * @param {Array} existingRecords 
 * @param {Array} newRecords 
 */
function mergeRecords(existingRecords, newRecords) {
  const map = new Map();
  const noIdRecords = [];
  
  // Index existing records by ID
  existingRecords.forEach(record => {
    if (record.id) {
      map.set(record.id, record);
    } else {
      noIdRecords.push(record);
    }
  });

  // Merge or add new records
  newRecords.forEach(record => {
    if (record.id) {
      // Update existing or add new
      map.set(record.id, { ...(map.get(record.id) || {}), ...record });
    } else {
      // If no ID, we can't easily dedupe, so strictly speaking we might append
      // OR we generate a temporary ID. For now, let's append but warn.
      console.warn('Record without ID encountered:', record);
      noIdRecords.push(record);
    }
  });

  return [...Array.from(map.values()), ...noIdRecords];
}

chrome.runtime.onInstalled.addListener(() => {
  initStorage();
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "SAVE_EXTRACTED_DATA") {
    const { object, data } = message.payload;
    const schemaKey = OBJECT_TO_KEY[object];

    if (!schemaKey) {
      console.error(`Unknown object type: ${object}`);
      sendResponse({ success: false, error: "Unknown object type" });
      return;
    }

    // Wrap the read-modify-write operation in a lock to prevent race conditions
    // across multiple tabs or concurrent operations.
    navigator.locks.request(LOCK_NAME, async (lock) => {
      try {
        const result = await chrome.storage.local.get(STORAGE_KEY);
        let storageData = result[STORAGE_KEY] || {
          leads: [],
          contacts: [],
          accounts: [],
          opportunities: [],
          tasks: [],
          lastSync: {
            leads: 0,
            contacts: 0,
            accounts: 0,
            opportunities: 0,
            tasks: 0
          }
        };

        // Migration: If lastSync is a number (old format), convert to object
        if (typeof storageData.lastSync !== 'object') {
          storageData.lastSync = {
            leads: 0,
            contacts: 0,
            accounts: 0,
            opportunities: 0,
            tasks: 0
          };
        }

        const incomingData = Array.isArray(data) ? data : [data];
        const currentRecords = storageData[schemaKey] || [];
        
        const updatedRecords = mergeRecords(currentRecords, incomingData);
        
        storageData[schemaKey] = updatedRecords;
        
        // Update specific object sync time
        storageData.lastSync[schemaKey] = Date.now();

        await chrome.storage.local.set({ [STORAGE_KEY]: storageData });
        
        console.log(`✅ Saved ${incomingData.length} ${object}(s). Total ${schemaKey}: ${updatedRecords.length}`);
        
        // Notify popup or other listeners if needed
        chrome.runtime.sendMessage({ type: "DATA_UPDATED", payload: storageData }).catch(() => {});

      } catch (err) {
        console.error("Failed to save data:", err);
      }
    });

    sendResponse({ success: true, status: "processing" });
    return true; // Keep message channel open for async response if needed (though we responded "processing")
  }
});