async function extractRecord(object, fieldMap, schema) {
  // Ensure the utility function is available
  if (typeof waitForRecordLayout !== 'function') {
    throw new Error("Utility waitForRecordLayout is missing");
  }
  
  await waitForRecordLayout();

  const extractedData = {};
  const items = document.querySelectorAll("records-record-layout-item");

  items.forEach((item) => {
    // Strategy 1: Look for standard Lightning classes (most reliable)
    const labelEl = item.querySelector(".test-id__field-label");
    const valueEl = item.querySelector(".test-id__field-value");

    if (labelEl && valueEl) {
      const label = labelEl.innerText.trim();
      const value = valueEl.innerText.trim();
      
      if (fieldMap[label]) {
        extractedData[fieldMap[label]] = value;
      }
      return; 
    }

    // Strategy 2: Fallback to the slot-based approach
    const labelElFallback = item.querySelector("span[title]");
    const valueElFallback = item.querySelector("slot slot");
    
    if (labelElFallback && valueElFallback) {
       const label = labelElFallback.textContent.trim();
       const value = valueElFallback.textContent.trim();
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

  const rows = document.querySelectorAll('tbody tr[data-row-key-value]');
  const records = [];

  rows.forEach((row) => {
    const recordRaw = {};
    const cells = row.querySelectorAll("td[data-label], th[data-label]");

    // Extract ID from row attribute
    const recordId = row.getAttribute('data-row-key-value');

    cells.forEach((cell) => {
      const label = cell.getAttribute("data-label");
      if (label) {
        recordRaw[label] = cell.innerText.trim() || null;
      }
    });

    const normalized = { object };
    const mappedData = {};

    Object.entries(fieldMap).forEach(([label, key]) => {
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
      
      // -- Owner -- 
      // Sometimes in an image alt or specific field
      // For now, we might leave null or try to find a user avatar
      const ownerImg = card.querySelector('img[title], span[title]'); // simple heuristic
      // This is unreliable without specific selectors, skipping for now to avoid bad data.

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
