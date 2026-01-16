console.log("🔥 SCRIPT LOADED 🔥");

chrome.runtime.onMessage.addListener(async (message) => {
  if (message.type !== "EXTRACT_CURRENT_OBJECT") return;

  try {
    const context = getPageContext();
    
    if (!context) {
      console.warn("❌ Unknown Salesforce page context.");
      return;
    }

    const { object, type } = context;
    const mapping = FIELD_MAPPINGS[object];
    const schema = OBJECT_SCHEMAS[object];

    if (!mapping || !schema) {
      console.warn(`❌ No configuration found for object: ${object}`);
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

  } catch (err) {
    console.error("Extraction failed:", err);
  }
});
