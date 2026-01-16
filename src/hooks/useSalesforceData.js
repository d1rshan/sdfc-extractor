import { useState, useEffect } from 'react';

const STORAGE_KEY = 'salesforce_data';

export const useSalesforceData = () => {
  const [data, setData] = useState({
    leads: [],
    contacts: [],
    accounts: [],
    opportunities: [],
    tasks: [],
    lastSync: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial fetch
    chrome.storage.local.get(STORAGE_KEY, (result) => {
      if (result[STORAGE_KEY]) {
        setData(result[STORAGE_KEY]);
      }
      setLoading(false);
    });

    // Listen for changes
    const listener = (changes, area) => {
      if (area === 'local' && changes[STORAGE_KEY]) {
        setData(changes[STORAGE_KEY].newValue);
      }
    };

    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, []);

  const deleteRecord = async (type, id) => {
    // type: 'leads', 'contacts', etc.
    const newData = { ...data };
    newData[type] = newData[type].filter(record => record.id !== id);
    
    // Optimistic update
    setData(newData);
    
    // Persist
    await chrome.storage.local.set({ [STORAGE_KEY]: newData });
  };

  return { data, loading, deleteRecord };
};
