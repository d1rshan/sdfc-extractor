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

  if (mode === 'o' && (path.includes('/list') || path.includes('/home'))) {
    // Check for Kanban specific elements to distinguish from standard list
    if (document.querySelector('.runtime_sales_pipelineboardPipelineViewColumn')) {
      return { object, type: 'kanban' };
    }
    return { object, type: 'list' };
  }

  return null;
}

function isVisible(el) {
  if (!el) return false;
  // Check if element or any ancestor is hidden from accessibility tree (often used by SF for background tabs)
  if (el.closest('[aria-hidden="true"]')) return false;
  
  return !!(
    el.offsetWidth ||
    el.offsetHeight ||
    el.getClientRects().length
  ) && window.getComputedStyle(el).visibility !== 'hidden';
}

async function waitForListViewRows(timeout = 10000) {
  return new Promise((resolve, reject) => {
    const listSelector = 'tbody tr';
    const kanbanSelector = '.runtime_sales_pipelineboardPipelineViewColumn';

    const check = () => {
      // Check if we accidentally found Kanban instead
      if (document.querySelector(kanbanSelector)) {
        return { success: false, error: "Detected Kanban instead of List View" };
      }

      const rows = document.querySelectorAll(listSelector);
      if (rows.length > 0) {
        return { success: true, data: rows };
      }
      return null; // Keep waiting
    };

    // 1. Immediate check
    const initial = check();
    if (initial) {
      if (initial.success) return resolve(initial.data);
      return reject(initial.error);
    }

    // 2. Observer
    const observer = new MutationObserver(() => {
      const result = check();
      if (result) {
        observer.disconnect();
        if (result.success) resolve(result.data);
        else reject(result.error);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // 3. Timeout
    setTimeout(() => {
      observer.disconnect();
      reject("List view rows not found");
    }, timeout);
  });
}

async function waitForKanbanBoard(timeout = 10000) {
  return new Promise((resolve, reject) => {
    const selector = '.runtime_sales_pipelineboardPipelineViewColumn';

    const check = () => {
      const columns = document.querySelectorAll(selector);
      if (columns.length > 0) return columns;
      return null;
    };

    if (check()) return resolve(check());

    const observer = new MutationObserver(() => {
      const result = check();
      if (result) {
        observer.disconnect();
        resolve(result);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    setTimeout(() => {
      observer.disconnect();
      reject("Kanban board not found");
    }, timeout);
  });
}

async function waitForRecordLayout(timeout = 10000) {
  return new Promise((resolve, reject) => {
    const check = () => {
      const lwcItems = document.querySelectorAll("records-record-layout-item");
      const auraItems = document.querySelectorAll(".forcePageBlockItem");
      if (lwcItems.length > 0 || auraItems.length > 0) return true;
      return false;
    };

    if (check()) return resolve(true);

    const observer = new MutationObserver(() => {
      if (check()) {
        observer.disconnect();
        resolve(true);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    setTimeout(() => {
      observer.disconnect();
      reject("Record layout not found");
    }, timeout);
  });
}

/**
 * Tries to find and click the 'Details' tab in a Record View.
 */
async function activateDetailsTab() {
  console.log("Attempting to switch to Details tab...");
  
  // Common selectors for the Details tab link/button in Lightning
  const selectors = [
    'li[title="Details"] > a',
    'a[data-label="Details"]',
    'a[title="Details"]',
    'div[role="tablist"] a[data-tab-value="detailTab"]',
    'button[title="Details"]' // sometimes it's a button
  ];

  let tabEl = null;
  for (const sel of selectors) {
    // We look for visible tabs
    const candidates = document.querySelectorAll(sel);
    for (const el of candidates) {
      if (isVisible(el)) {
        tabEl = el;
        break;
      }
    }
    if (tabEl) break;
  }

  if (!tabEl) {
    console.warn("⚠️ Could not find 'Details' tab. Proceeding without switching.");
    return;
  }

  // Check if already active
  // aria-selected is on the <a> or <button>, or class 'slds-is-active' on parent <li>
  const isAriaSelected = tabEl.getAttribute('aria-selected') === 'true';
  const parentLi = tabEl.closest('li');
  const isLiActive = parentLi && (parentLi.classList.contains('slds-is-active') || parentLi.classList.contains('active'));
  
  if (isAriaSelected || isLiActive) {
    console.log("✅ 'Details' tab is already active.");
    return;
  }

  // Click it
  tabEl.click();
  console.log("🖱️ Clicked 'Details' tab.");

  // Give it a moment to trigger the UI update. 
  // The actual element waiting is handled by waitForRecordLayout()
  await new Promise(resolve => setTimeout(resolve, 300));
}
