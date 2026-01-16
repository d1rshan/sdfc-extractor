import React, { useState, useEffect, useRef } from 'react';
import { useSalesforceData } from '../hooks/useSalesforceData';
import { DataList } from '../components/DataList';
import { Download, Database, RefreshCw, AlertCircle, FileJson, FileSpreadsheet, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';

const TABS = [
  { id: 'leads', label: 'Leads' },
  { id: 'contacts', label: 'Contacts' },
  { id: 'accounts', label: 'Accounts' },
  { id: 'opportunities', label: 'Opportunities' },
  { id: 'tasks', label: 'Tasks' },
];

const COLUMNS = {
  leads: [
    { key: 'name', label: 'Name', className: 'text-white font-medium' },
    { key: 'company', label: 'Company' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'leadSource', label: 'Source' },
    { key: 'leadStatus', label: 'Status' },
    { key: 'leadOwner', label: 'Owner' }
  ],
  contacts: [
    { key: 'name', label: 'Name', className: 'text-white font-medium' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'accountName', label: 'Account' },
    { key: 'title', label: 'Title' },
    { key: 'contactOwner', label: 'Owner' },
    { key: 'mailingAddress', label: 'Address' }
  ],
  accounts: [
    { key: 'accountName', label: 'Account Name', className: 'text-white font-medium' },
    { key: 'website', label: 'Website' },
    { key: 'phone', label: 'Phone' },
    { key: 'industry', label: 'Industry' },
    { key: 'type', label: 'Type' },
    { key: 'accountOwner', label: 'Owner' },
    { key: 'annualRevenue', label: 'Revenue' }
  ],
  opportunities: [
    { key: 'name', label: 'Name', className: 'text-white font-medium' },
    { key: 'amount', label: 'Amount' },
    { key: 'stage', label: 'Stage' },
    { key: 'probability', label: 'Prob (%)' },
    { key: 'closeDate', label: 'Close Date' },
    { key: 'forecastCategory', label: 'Forecast' },
    { key: 'opportunityOwner', label: 'Owner' },
    { key: 'associatedAccount', label: 'Account' }
  ],
  tasks: [
    { key: 'subject', label: 'Subject', className: 'text-white font-medium' },
    { key: 'status', label: 'Status' },
    { key: 'dueDate', label: 'Due Date' },
    { key: 'priority', label: 'Priority' },
    { key: 'relatedTo', label: 'Related To' },
    { key: 'assignedTo', label: 'Assigned' }
  ]
};

function App() {
  const { data, loading, deleteRecord } = useSalesforceData();
  const [activeTab, setActiveTab] = useState('leads');
  const [extracting, setExtracting] = useState(false);
  const [message, setMessage] = useState(null);
  const [pageContext, setPageContext] = useState(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef(null);

  useEffect(() => {
    const fetchContext = async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.id) {
          chrome.tabs.sendMessage(tab.id, { type: 'GET_PAGE_CONTEXT' }, (response) => {
            if (!chrome.runtime.lastError && response) {
              setPageContext(response);
            }
          });
        }
      } catch (e) {
        console.error("Failed to fetch context", e);
      }
    };
    fetchContext();

    // Close export menu on click outside
    const handleClickOutside = (event) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExtract = async () => {
    setExtracting(true);
    setMessage(null);
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab) {
         setMessage({ type: 'error', text: 'No active tab.' });
         setExtracting(false);
         return;
      }
      
      // Send message to content script
      chrome.tabs.sendMessage(tab.id, { type: 'EXTRACT_CURRENT_OBJECT' }, (response) => {
        if (chrome.runtime.lastError) {
          setMessage({ type: 'error', text: 'Please reload the Salesforce page.' });
        } else if (response && response.success) {
          setMessage({ type: 'success', text: `Extracted ${response.count} record(s)!` });
        } else {
          setMessage({ type: 'error', text: response?.error || 'Extraction failed.' });
        }
        setExtracting(false);
        // Clear message after 3s
        setTimeout(() => setMessage(null), 3000);
      });
    } catch (err) {
      console.error(err);
      setExtracting(false);
      setMessage({ type: 'error', text: 'Failed to trigger extraction.' });
    }
  };

  const handleExport = (exportFormat) => {
    const currentData = data[activeTab] || [];
    if (currentData.length === 0) {
      setMessage({ type: 'error', text: 'No data to export.' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    let content = '';
    let mimeType = '';
    let extension = '';

    if (exportFormat === 'json') {
      content = JSON.stringify(currentData, null, 2);
      mimeType = 'application/json';
      extension = 'json';
    } else if (exportFormat === 'csv') {
      const cols = COLUMNS[activeTab];
      const headers = cols.map(c => c.label).join(',');
      const rows = currentData.map(row => {
        return cols.map(col => {
          const val = row[col.key] || '';
          // Escape quotes and wrap in quotes if needed
          const stringVal = String(val).replace(/"/g, '""');
          return `"${stringVal}"`;
        }).join(',');
      }).join('\n');
      content = `${headers}\n${rows}`;
      mimeType = 'text/csv';
      extension = 'csv';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `salesforce_${activeTab}_${format(new Date(), 'yyyyMMdd_HHmm')}.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setMessage({ type: 'success', text: `Exported ${activeTab} as ${exportFormat.toUpperCase()}` });
    setTimeout(() => setMessage(null), 3000);
    setShowExportMenu(false);
  };

  if (loading) {
    return <div className="flex h-screen items-center justify-center bg-background text-text-muted">Loading data...</div>;
  }

  const getExtractLabel = () => {
    if (extracting) return 'EXTRACTING...';
    if (!pageContext) return 'NO CONTEXT';
    if (pageContext) {
      const { object, type } = pageContext;
      const typeLabel = type.charAt(0).toUpperCase() + type.slice(1);
      return `EXTRACT ${object} ${typeLabel}`;
    }
    return 'EXTRACT DATA';
  };

  return (
    <div className="flex flex-col h-screen bg-background text-text-main font-sans selection:bg-white selection:text-black">
      {/* Header */}
      <header className="bg-background/95 backdrop-blur-sm border-b border-border px-5 py-4 flex items-center justify-between z-20 sticky top-0">
        <div className="flex items-center gap-3">
           <div className="p-2 bg-white rounded-full">
             <Database className="text-black w-4 h-4" />
           </div>
           <div>
             <h1 className="font-thunder text-2xl font-bold text-white uppercase tracking-wider leading-none">SFDC Extractor</h1>
             <p className="text-[10px] text-text-muted uppercase tracking-widest mt-0.5 font-medium">
               Synced: {data.lastSync?.[activeTab] ? format(data.lastSync[activeTab], 'MMM d, HH:mm') : 'NEVER'}
             </p>
           </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Export Dropdown */}
          <div className="relative" ref={exportMenuRef}>
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center gap-1.5 bg-surface hover:bg-border text-text-main border border-border px-4 py-2 rounded-full text-sm font-thunder uppercase tracking-wide transition-all duration-200"
            >
              Export
              <ChevronDown className="w-3 h-3 text-text-muted" />
            </button>
            
            {showExportMenu && (
              <div className="absolute right-0 top-full mt-2 bg-surface border border-border rounded-xl shadow-xl z-30 w-36 overflow-hidden">
                <button 
                  onClick={() => handleExport('csv')}
                  className="flex items-center gap-2 w-full px-4 py-3 text-xs text-text-main hover:bg-border/50 text-left transition-colors font-medium"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-text-muted" />
                  <span>CSV</span>
                </button>
                <button 
                  onClick={() => handleExport('json')}
                  className="flex items-center gap-2 w-full px-4 py-3 text-xs text-text-main hover:bg-border/50 text-left transition-colors font-medium border-t border-border"
                >
                  <FileJson className="w-3.5 h-3.5 text-text-muted" />
                  <span>JSON</span>
                </button>
              </div>
            )}
          </div>

          <button 
            onClick={handleExtract}
            disabled={extracting || !pageContext}
            className="flex items-center gap-1.5 bg-white hover:bg-gray-200 text-black px-5 py-2 rounded-full text-sm font-bold font-thunder uppercase tracking-wide transition-all shadow-lg shadow-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {extracting ? <RefreshCw className="animate-spin w-3 h-3" /> : <Download className="w-3 h-3" />}
            {getExtractLabel()}
          </button>
        </div>
      </header>
      
      {/* Message Toast */}
      {message && (
        <div className={`px-4 py-3 text-xs font-bold text-center text-white font-thunder uppercase tracking-wide ${message.type === 'error' ? 'bg-red-600' : 'bg-green-600'}`}>
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-border bg-background overflow-x-auto px-4 py-3 gap-2 no-scrollbar">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-xs font-bold font-thunder uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 rounded-full
              ${activeTab === tab.id 
                ? 'bg-white text-black shadow-md transform scale-105' 
                : 'bg-transparent text-text-muted hover:bg-surface hover:text-white'}`}
          >
            {tab.label}
            <span className={`py-0.5 px-1.5 rounded-full text-[10px] font-sans font-medium tracking-normal
              ${activeTab === tab.id ? 'bg-black text-white' : 'bg-surface text-text-muted'}`}>
              {data[tab.id]?.length || 0}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      <main className="flex-1 overflow-hidden relative bg-background">
        <DataList 
          data={data[activeTab] || []}
          columns={COLUMNS[activeTab]}
          onDelete={(id) => deleteRecord(activeTab, id)}
          groupBy={activeTab === 'opportunities' ? 'stage' : null}
        />
      </main>
    </div>
  );
}

export default App;
