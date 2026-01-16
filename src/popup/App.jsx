import React, { useState, useEffect } from 'react';
import { useSalesforceData } from '../hooks/useSalesforceData';
import { DataList } from '../components/DataList';
import { Download, Database, RefreshCw, AlertCircle } from 'lucide-react';
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
    { key: 'name', label: 'Name', className: 'text-blue-600' },
    { key: 'company', label: 'Company' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'leadSource', label: 'Source' },
    { key: 'leadStatus', label: 'Status' },
    { key: 'leadOwner', label: 'Owner' }
  ],
  contacts: [
    { key: 'name', label: 'Name', className: 'text-blue-600' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'accountName', label: 'Account' },
    { key: 'title', label: 'Title' },
    { key: 'contactOwner', label: 'Owner' },
    { key: 'mailingAddress', label: 'Address' }
  ],
  accounts: [
    { key: 'accountName', label: 'Account Name', className: 'text-blue-600' },
    { key: 'website', label: 'Website' },
    { key: 'phone', label: 'Phone' },
    { key: 'industry', label: 'Industry' },
    { key: 'type', label: 'Type' },
    { key: 'accountOwner', label: 'Owner' },
    { key: 'annualRevenue', label: 'Revenue' }
  ],
  opportunities: [
    { key: 'name', label: 'Name', className: 'text-blue-600' },
    { key: 'amount', label: 'Amount' },
    { key: 'stage', label: 'Stage' },
    { key: 'probability', label: 'Prob (%)' },
    { key: 'closeDate', label: 'Close Date' },
    { key: 'forecastCategory', label: 'Forecast' },
    { key: 'opportunityOwner', label: 'Owner' },
    { key: 'associatedAccount', label: 'Account' }
  ],
  tasks: [
    { key: 'subject', label: 'Subject', className: 'text-blue-600' },
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
  }, []);

  const handleExtract = async () => {
    setExtracting(true);
    setMessage(null);
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab) {
         setMessage({ type: 'error', text: 'No active tab.' });
         return;
      }
      
      // Send message to content script
      chrome.tabs.sendMessage(tab.id, { type: 'EXTRACT_CURRENT_OBJECT' }, (response) => {
        if (chrome.runtime.lastError) {
          setMessage({ type: 'error', text: 'Please reload the Salesforce page.' });
        } else {
          setMessage({ type: 'success', text: 'Extraction requested...' });
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

  if (loading) {
    return <div className="flex h-screen items-center justify-center text-gray-500">Loading data...</div>;
  }

  const getExtractLabel = () => {
    if (extracting) return 'Extracting...';
    if (pageContext) {
      const { object, type } = pageContext;
      const typeLabel = type === 'record' ? 'Record' : type === 'list' ? 'List' : 'Kanban';
      return `Extract ${object} ${typeLabel}`;
    }
    return 'Extract';
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
           <div className="p-1.5 bg-blue-600 rounded-md">
             <Database className="text-white w-4 h-4" />
           </div>
           <div>
             <h1 className="font-bold text-gray-800 text-sm leading-tight">SFDC Extractor</h1>
             <p className="text-[10px] text-gray-400">
               Synced: {data.lastSync?.[activeTab] ? format(data.lastSync[activeTab], 'MMM d, HH:mm') : 'Never'}
             </p>
           </div>
        </div>

        <button 
          onClick={handleExtract}
          disabled={extracting}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors disabled:opacity-50"
        >
          {extracting ? <RefreshCw className="animate-spin w-3 h-3" /> : <Download className="w-3 h-3" />}
          {getExtractLabel()}
        </button>
      </header>
      
      {/* Message Toast */}
      {message && (
        <div className={`px-4 py-2 text-xs text-center text-white ${message.type === 'error' ? 'bg-red-500' : 'bg-green-500'}`}>
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b bg-white overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-3 text-xs font-medium border-b-2 transition-colors whitespace-nowrap px-2
              ${activeTab === tab.id 
                ? 'border-blue-600 text-blue-600 bg-blue-50/50' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
          >
            {tab.label}
            <span className="ml-1.5 bg-gray-100 text-gray-600 py-0.5 px-1.5 rounded-full text-[10px]">
              {data[tab.id]?.length || 0}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      <main className="flex-1 overflow-hidden relative">
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
