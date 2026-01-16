async function extractRecord(object, fieldMap, schema) {
  // Ensure the utility function is available
  if (typeof waitForRecordLayout !== 'function') {
    throw new Error("Utility waitForRecordLayout is missing");
  }
  
  // Try to switch to Details tab first to ensure fields are in DOM
  if (typeof activateDetailsTab === 'function') {
     await activateDetailsTab();
  }

  await waitForRecordLayout();

  const extractedData = {};
  
  // Strategy 1: LWC (Standard Objects)
  const lwcItems = document.querySelectorAll("records-record-layout-item");
  lwcItems.forEach((item) => {
    if (!isVisible(item)) return;

    const labelEl = item.querySelector(".test-id__field-label");
    const valueEl = item.querySelector(".test-id__field-value");

    if (labelEl && valueEl) {
      const label = labelEl.innerText.trim();
      const value = valueEl.innerText.trim();
      if (fieldMap[label]) extractedData[fieldMap[label]] = value;
      return; 
    }

    // Fallback slot-based
    const labelElFallback = item.querySelector("span[title]");
    const valueElFallback = item.querySelector("slot slot");
    if (labelElFallback && valueElFallback) {
       const label = labelElFallback.textContent.trim();
       const value = valueElFallback.textContent.trim();
       if (fieldMap[label]) extractedData[fieldMap[label]] = value;
    }
  });

  // Strategy 2: Aura (Tasks / Older Objects)
  const auraItems = document.querySelectorAll(".forcePageBlockItem");
  auraItems.forEach((item) => {
    if (!isVisible(item)) return;

    const labelEl = item.querySelector(".test-id__field-label");
    const valueEl = item.querySelector(".test-id__field-value");

    if (labelEl && valueEl) {
      const label = labelEl.innerText.trim();
      // Aura values often have nested spans or hidden text, try to get clean text
      const value = valueEl.innerText.trim();
      
      if (fieldMap[label]) {
        extractedData[fieldMap[label]] = value;
      }
    }
  });

  // Extract ID from URL
  // URL pattern: /lightning/r/Object/ID/view
  const urlParts = location.pathname.split('/');
  const idIndex = urlParts.indexOf('r') + 2; // 'r' is followed by Object, then ID
  const recordId = (idIndex > 1 && idIndex < urlParts.length) ? urlParts[idIndex] : null;

  // Normalize to schema
  const data = {};
  schema.forEach(key => {
    data[key] = extractedData[key] ?? null;
  });

  // Ensure ID is present
  if (!data.id && recordId) {
    data.id = recordId;
  }

  return {
    object,
    ...data,
    url: location.href,
    extractedAt: Date.now()
  };
}

async function extractListView(object, fieldMap, schema) {
  if (typeof waitForListViewRows !== 'function') {
     throw new Error("Utility waitForListViewRows is missing");
  }

  await waitForListViewRows();

  const rows = document.querySelectorAll('tbody tr');
  const records = [];

  rows.forEach((row) => {
    const recordRaw = {};
    let recordId = row.getAttribute('data-row-key-value');

    if (object === 'Task') {
      // Special handling for Task List View (Aura based, missing data-label)
      const cells = row.querySelectorAll("td, th");
      cells.forEach(cell => {
        // Try to find the edit button which contains the field name in its title
        // Format: "Edit Subject: Item [Value]" or "Edit Due Date: Item [Value]"
        const editBtn = cell.querySelector('button[title^="Edit "]');
        if (editBtn) {
          const title = editBtn.getAttribute('title');
          const match = title.match(/Edit (.*?):/);
          if (match) {
            const label = match[1].trim(); // e.g., "Subject", "Due Date"
            // The value is usually in the same cell, often in .uiOutputText or .uiOutputDate
            // Or just cell.innerText (but cell innerText includes the button text sometimes)
            // Let's try to find a specific output element first
            const outputEl = cell.querySelector('.uiOutputText, .uiOutputDate, .outputLookupLink');
            let value = outputEl ? outputEl.innerText.trim() : cell.innerText.replace(title, '').trim();
            
            // Clean up common "Edit ..." noise if innerText fallback was used
            if (!outputEl) {
               value = value.replace(/Edit .*/, '').trim();
            }

            if (label) recordRaw[label] = value;
          }
        }
        
        // Also look for ID if not found yet (usually in the primary link)
        if (!recordId) {
          const link = cell.querySelector('a[data-recordid]');
          if (link) recordId = link.getAttribute('data-recordid');
        }
      });

    } else {
      // Standard LWC List View
      const cells = row.querySelectorAll("td[data-label], th[data-label]");
      cells.forEach((cell) => {
        const label = cell.getAttribute("data-label");
        if (label) {
          recordRaw[label] = cell.innerText.trim() || null;
        }
      });
    }

    const normalized = { object };
    const mappedData = {};

    Object.entries(fieldMap).forEach(([label, key]) => {
      // Loose matching for Tasks (e.g. "Subject" vs "Subject")
      if (recordRaw[label] !== undefined) {
        mappedData[key] = recordRaw[label];
      }
    });

    schema.forEach(key => {
      normalized[key] = mappedData[key] ?? null;
    });

    // Ensure ID is present
    if (!normalized.id && recordId) {
      normalized.id = recordId;
    }

    normalized.extractedAt = Date.now();
    records.push(normalized);
  });

  return records;
}

async function extractKanbanBoard(object, fieldMap, schema) {
  if (typeof waitForKanbanBoard !== 'function') {
     throw new Error("Utility waitForKanbanBoard is missing");
  }

  await waitForKanbanBoard();

  const records = [];
  const columns = document.querySelectorAll('.runtime_sales_pipelineboardPipelineViewColumn');

  columns.forEach(column => {
    // 1. Extract Stage/Status from Column Header
    const headerEl = column.querySelector('.stageHeaderLabel') || column.querySelector('.runtime_sales_pipelineboardPipelineViewColumnHeader');
    const stageName = headerEl ? headerEl.innerText.trim() : null;

    // 2. Extract Cards in this Column
    const cards = column.querySelectorAll('.pipelineViewCard');
    
    cards.forEach(card => {
      const extractedData = {};
      
      // -- Name (Primary Field) --
      const nameEl = card.querySelector('.primaryDisplayField a');
      let recordId = null;

      if (nameEl) {
        extractedData['name'] = nameEl.innerText.trim();
        // Extract ID from href (e.g., /lightning/r/006...)
        const href = nameEl.getAttribute('href');
        if (href) {
          const match = href.match(/\/([a-zA-Z0-9]{15,18})(\/|$)/);
          if (match) recordId = match[1];
        }
        // Task Kanban specific: ID might be in data-recordid of the link
        if (!recordId && nameEl.hasAttribute('data-recordid')) {
           recordId = nameEl.getAttribute('data-recordid');
        }
      }

      // -- Stage (From Column) --
      // Map standard "Stage" or "Status" keys if present in schema
      if (schema.includes('stage')) extractedData['stage'] = stageName;
      if (schema.includes('status')) extractedData['status'] = stageName;

      // -- Amount (Opportunity specific) --
      const amountEl = card.querySelector('.sfaOpportunityDealMotionAmount') || card.querySelector('.uiOutputNumber');
      if (amountEl) extractedData['amount'] = amountEl.innerText.trim();

      // -- Close Date (Opportunity specific) --
      const dateEl = card.querySelector('.sfaOpportunityDealMotionCloseDate .uiOutputDate') || card.querySelector('.uiOutputDate');
      if (dateEl) extractedData['closeDate'] = dateEl.innerText.trim();
      
      // -- Task Specifics --
      if (object === 'Task') {
         // Due Date often is the only date shown
         const taskDate = card.querySelector('.uiOutputDate');
         if (taskDate) extractedData['dueDate'] = taskDate.innerText.trim();
         
         // Subject is usually the name
         if (extractedData['name']) extractedData['subject'] = extractedData['name'];
      }

      // -- Account Name (Often the second link in the card) --
      // We look for links that are NOT the primary field.
      const links = card.querySelectorAll('a.forceOutputLookup');
      links.forEach(link => {
        if (link !== nameEl) {
          // This is likely the Account or Related To link
          extractedData['accountName'] = link.innerText.trim();
          extractedData['relatedTo'] = link.innerText.trim(); // For tasks
          extractedData['associatedAccount'] = link.innerText.trim();
        }
      });
      
      // Normalize to schema
      const normalized = { object };
      schema.forEach(key => {
        // If we found data for this key, use it.
        // Otherwise, it remains null.
        if (extractedData[key] !== undefined) {
           normalized[key] = extractedData[key];
        } else {
           normalized[key] = null;
        }
      });

      // Ensure ID is present
      if (!normalized.id && recordId) {
        normalized.id = recordId;
      }

      normalized.extractedAt = Date.now();
      records.push(normalized);
    });
  });

  return records;
}
