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
    <div className="flex flex-col h-full bg-background">
      <div className="p-3 border-b border-border bg-background sticky top-0 z-10">
        <div className="relative group">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-muted group-focus-within:text-white transition-colors" />
          <input
            type="text"
            placeholder="SEARCH RECORDS..."
            className="w-full pl-9 pr-4 py-2 bg-surface border border-border rounded-full text-sm text-text-main placeholder:text-text-muted focus:outline-none focus:border-white focus:ring-0 transition-all font-medium uppercase tracking-wide"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar p-3">
        {Object.entries(groupedData).map(([group, items]) => (
          <div key={group} className="mb-6">
            {groupBy && (
              <h3 className="font-thunder text-lg font-bold text-white mb-3 px-1 sticky top-0 bg-background/95 backdrop-blur-sm py-2 border-b border-border flex justify-between items-center z-0">
                {group} <span className="text-xs font-mono font-normal text-text-muted bg-surface px-2 py-0.5 rounded-full">{items.length}</span>
              </h3>
            )}
            
            {items.length === 0 ? (
               <div className="text-center text-text-muted py-8 text-sm uppercase tracking-widest font-medium">No records found</div>
            ) : (
              <div className="space-y-3">
                {items.map((item, idx) => (
                  <div key={item.id || idx} className="bg-surface border border-border rounded-xl p-4 hover:border-white/20 transition-all duration-200 relative group">
                    <button 
                      onClick={() => onDelete(item.id)}
                      className="absolute top-3 right-3 text-text-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all transform hover:scale-110"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>

                    <div className="grid gap-2">
                      {columns.map((col) => (
                        <div key={col.key} className="flex flex-col sm:flex-row sm:items-baseline text-sm gap-1 sm:gap-0">
                          <span className="text-text-muted w-24 flex-shrink-0 text-[10px] uppercase tracking-widest font-bold">{col.label}</span>
                          <span className={clsx("font-medium truncate text-text-main", col.className)}>
                            {item[col.key] || <span className="text-text-muted opacity-30">-</span>}
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
