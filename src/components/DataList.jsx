import React, { useState, useMemo } from 'react';
import { Search, Trash2, ExternalLink } from 'lucide-react';
import { clsx } from 'clsx';

export const DataList = ({ data, columns, onDelete, groupBy }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    const lower = searchTerm.toLowerCase();
    return data.filter(item => 
      Object.values(item).some(val => 
        String(val).toLowerCase().includes(lower)
      )
    );
  }, [data, searchTerm]);

  const groupedData = useMemo(() => {
    if (!groupBy) return { 'All': filteredData };
    
    return filteredData.reduce((acc, item) => {
      const key = item[groupBy] || 'Uncategorized';
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});
  }, [filteredData, groupBy]);

  return (
    <div className="flex flex-col h-full">
      <div className="p-2 border-b bg-white sticky top-0 z-10">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            className="w-full pl-8 pr-4 py-2 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar p-2">
        {Object.entries(groupedData).map(([group, items]) => (
          <div key={group} className="mb-4">
            {groupBy && (
              <h3 className="font-semibold text-gray-700 mb-2 px-1 sticky top-0 bg-gray-50 py-1 border-b">
                {group} <span className="text-xs font-normal text-gray-500">({items.length})</span>
              </h3>
            )}
            
            {items.length === 0 ? (
               <div className="text-center text-gray-400 py-4 text-sm">No records found.</div>
            ) : (
              <div className="space-y-2">
                {items.map((item, idx) => (
                  <div key={item.id || idx} className="bg-white border rounded-md p-3 shadow-sm hover:shadow-md transition-shadow relative group">
                    <button 
                      onClick={() => onDelete(item.id)}
                      className="absolute top-2 right-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>

                    <div className="grid gap-1">
                      {columns.map((col) => (
                        <div key={col.key} className="flex items-baseline text-sm">
                          <span className="text-gray-500 w-24 flex-shrink-0 text-xs uppercase tracking-wider">{col.label}:</span>
                          <span className={clsx("font-medium truncate", col.className)}>
                            {item[col.key] || '-'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
