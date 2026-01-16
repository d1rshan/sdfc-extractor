/**
 * Detects the current page context (Object type and View type) from the URL.
 * Returns { object: string, type: 'record' | 'list' | 'kanban' } or null.
 */
function getPageContext() {
  const path = location.pathname;

  // Match /lightning/r/Lead/ or /lightning/o/Lead/
  const match = path.match(/\/lightning\/(r|o)\/([^/]+)\//);
  
  if (!match) return null;

  const mode = match[1]; // 'r' or 'o'
  const object = match[2];

  if (mode === 'r' && path.includes('/view')) {
    return { object, type: 'record' };
  }

  if (mode === 'o' && path.includes('/list')) {
    // Check for Kanban specific elements to distinguish from standard list
    if (document.querySelector('.runtime_sales_pipelineboardPipelineViewColumn')) {
       return { object, type: 'kanban' };
    }
    return { object, type: 'list' };
  }

  return null;
}

async function waitForListViewRows(timeout = 10000) {
  const start = Date.now();

  return new Promise((resolve, reject) => {
    const check = () => {
      const rows = document.querySelectorAll('tbody tr[data-row-key-value]');
      if (rows.length > 0) return resolve(rows);
      
      // Also check if we might have misidentified and it's actually Kanban (fallback)
      if (document.querySelector('.runtime_sales_pipelineboardPipelineViewColumn')) {
         reject("Detected Kanban instead of List View"); 
         return;
      }

      if (Date.now() - start > timeout) {
        reject("List view rows not found");
        return;
      }
      setTimeout(check, 300);
    };
    check();
  });
}

async function waitForKanbanBoard(timeout = 10000) {
  const start = Date.now();

  return new Promise((resolve, reject) => {
    const check = () => {
      const columns = document.querySelectorAll('.runtime_sales_pipelineboardPipelineViewColumn');
      if (columns.length > 0) return resolve(columns);

      if (Date.now() - start > timeout) {
        reject("Kanban board not found");
        return;
      }
      setTimeout(check, 300);
    };
    check();
  });
}

async function waitForRecordLayout(timeout = 10000) {
  const start = Date.now();

  return new Promise((resolve, reject) => {
    const check = () => {
      const items = document.querySelectorAll("records-record-layout-item");
      if (items.length > 0) return resolve(items);

      if (Date.now() - start > timeout) {
        reject("Record layout not found");
        return;
      }
      setTimeout(check, 300);
    };
    check();
  });
}