console.log("🔥 SCRIPT LOADED 🔥");

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GET_PAGE_CONTEXT") {
    const context = getPageContext();
    sendResponse(context);
    return;
  }

  if (message.type === "EXTRACT_CURRENT_OBJECT") {
    (async () => {
      const ui = window.ExtractionUI;
      
      try {
        const context = getPageContext();
        
        if (!context) {
          console.warn("❌ Unknown Salesforce page context.");
          ui.show('error', 'Context Not Found', 'Could not detect Salesforce object or view.');
          sendResponse({ success: false, error: "Unknown Salesforce page context." });
          return;
        }

        const { object, type } = context;
        ui.show('loading', `Scanning ${object}...`, `Extracting from ${type} view`);

        const mapping = FIELD_MAPPINGS[object];
        const schema = OBJECT_SCHEMAS[object];

        if (!mapping || !schema) {
          console.warn(`❌ No configuration found for object: ${object}`);
          ui.show('error', 'Configuration Missing', `No mapping found for ${object}`);
          sendResponse({ success: false, error: `No configuration found for object: ${object}` });
          return;
        }

        let data;
        if (type === 'record') {
          data = await extractRecord(object, mapping, schema);
        } else if (type === 'list') {
          data = await extractListView(object, mapping, schema);
        } else if (type === 'kanban') {
          data = await extractKanbanBoard(object, mapping, schema);
        }

        console.log(`✅ ${type} extracted (${object}):`, data);

        chrome.runtime.sendMessage({
          type: "SAVE_EXTRACTED_DATA",
          payload: { object, data }
        });

        const count = Array.isArray(data) ? data.length : 1;
        ui.show('success', 'Extraction Complete', `Saved ${count} ${object} record(s)`);
        sendResponse({ success: true, count });

      } catch (err) {
        console.error("Extraction failed:", err);
        ui.show('error', 'Extraction Failed', err.message || 'Unknown error occurred');
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true; // Keep the message channel open for async response
  }
});
