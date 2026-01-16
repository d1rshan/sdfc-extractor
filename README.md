# Salesforce CRM Data Extractor

A high-performance Chrome Extension (Manifest V3) designed to scrape and manage Salesforce CRM data. Built with React 19, TailwindCSS, and a robust DOM-scraping engine capable of handling dynamic Lightning Experience layouts.

## 🚀 Getting Started

### Installation

1. **Clone the repository**:

```bash
git clone https://github.com/d1rshan/sdfc-extractor.git
cd sdfc-extractor
```

1. **Install dependencies**:

```bash
npm install
```

1. **Build the extension**:

```bash
npm run build
```

1. **Load into Chrome**:

* Open `chrome://extensions/`
* Enable **Developer mode**
* Click **Load unpacked** and select the `dist` folder.

### Usage

1. Open any Salesforce record (Lead, Contact, Account, Opportunity, or Task).
2. The extension automatically detects the object type via URL and DOM metadata.
3. Click the extension icon to open the **React Dashboard**.
4. Use the context-aware **"Extract [Object]"** button to pull data.
5. Manage, filter, or export your data as CSV/JSON directly from the popup.

---

## 🛠 Technical Architecture

### 1. Data Extraction Engine

The engine handles the complexities of the Salesforce Single-Page Application (SPA) using a multi-layered strategy:

* **MutationObserver Integration**: To handle Salesforce’s asynchronous LWC (Lightning Web Component) loading, a `MutationObserver` monitors the DOM. This ensures extraction triggers only when the target record fields are fully rendered and stable, preventing "empty" scrapes.
* **Context Detection**: The engine parses the URL and internal metadata to distinguish between **Record Detail pages**, **List Views**, and **Kanban Boards**.
* **DOM Selection Strategy**:
  * **LWC Handling**: Targets `records-record-layout-item` and `lightning-formatted-text`.
  * **Aura Handling**: Uses legacy selectors like `.forcePageBlockItem` for older components (e.g., Tasks).
  * **Visibility Filtering**: Incorporates checks for `aria-hidden` and `offsetParent` to ensure data is only pulled from the active tab.

### 2. Storage Layer & Schema

Data integrity is maintained using `chrome.storage.local` with an atomic update pattern.

* **Race Condition Management**: Uses the **Web Locks API** (`navigator.locks`) within the service worker to prevent data corruption when multiple tabs trigger extractions simultaneously.
* **Deduplication**: Records are indexed by their unique 18-character Salesforce ID to prevent duplicate entries.

**Schema Structure:**

```json
{
  "salesforce_data": {
    "leads": [],
    "contacts": [],
    "accounts": [],
    "opportunities": [],
    "tasks": [],
    "lastSync": 1737145000000
  }
}
```

### 3. UI & Visual Feedback

* **Dashboard**: A React-based interface using TailwindCSS for a modern, responsive feel.
* **Shadow DOM Injection**: Extraction progress and status toasts are injected directly into the Salesforce UI via a **Shadow Root** to prevent style bleeding from the Salesforce Lightning Design System (SLDS).

---

## ✨ Features

* Automated extraction for Leads, Contacts, Accounts, Opportunities, and Tasks.
* Dynamic DOM handling using `MutationObserver` for LWC/Aura stability.
* React 19 dashboard with tabbed views for different CRM objects.
* Shadow DOM isolated status indicators for real-time extraction feedback.
* Local persistence with automatic deduplication based on Salesforce IDs.
* Support for Record Details, List Views, and Kanban (Pipeline Inspection) layouts.

---

## 🌟 Bonus Features

* **Export to CSV/JSON**: Full portability of extracted data for external analysis.
* **Real-time Sync**: Dashboard updates instantly across all tabs using `chrome.storage.onChanged`.
* **Context-Aware Button**: Popup button dynamically labels itself (e.g., "Extract Lead") based on the detected active tab object.

---

## 📂 Project Structure

* `/content`: Content scripts (DOM Scraping, `MutationObserver`, Shadow DOM injection).
* `/src`: React source code (Popup UI, Dashboard, Hooks).
* `/background`: Service worker (Storage locks, message passing).
* `/public`: Manifest V3 and assets.

