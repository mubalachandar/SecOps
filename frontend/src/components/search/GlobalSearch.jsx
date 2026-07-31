import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, Clock, AlertTriangle, Activity, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { alertsApi, cloudtrailApi, rulesApi } from '../../services/api';
import { formatDistanceToNow } from 'date-fns';
import Badge from '../ui/Badge';
import Spinner from '../ui/Spinner';
import { useUIStore } from '../../store/uiStore';

export default function GlobalSearch({ isOpen, onClose }) {
  const navigate = useNavigate();
  const openSearch = useUIStore(state => state.openSearch);
  const [query, setQuery] = useState('');
  const [debouncedKeyword, setDebouncedKeyword] = useState('');
  const [results, setResults] = useState({ alerts: [], events: [], rules: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [recentSearches, setRecentSearches] = useState([]);
  
  const inputRef = useRef(null);

  useEffect(() => {
    const timeoutId = setTimeout(() => setDebouncedKeyword(query.trim()), 300);
    return () => clearTimeout(timeoutId);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        e.stopPropagation();
        openSearch();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [openSearch]);
  
  useEffect(() => {
    if (isOpen) {
      const stored = localStorage.getItem('secops_recent_searches');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setRecentSearches(parsed);
          }
        } catch (e) {
          // ignore parsing error
        }
      }
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);
  
  // Search logic
  useEffect(() => {
    if (!isOpen) return;
    
    if (debouncedKeyword.length < 2) {
      setResults({ alerts: [], events: [], rules: [] });
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const search = async () => {
      try {
        const [alertsRes, eventsRes, rulesRes] = await Promise.allSettled([
          alertsApi.getAlerts({ search: debouncedKeyword, limit: 5 }),
          cloudtrailApi.getEvents({ search: debouncedKeyword, limit: 5 }),
          rulesApi.getRules({ search: debouncedKeyword, limit: 5 })
        ]);

        const alertResults = alertsRes.status === 'fulfilled'
          ? (alertsRes.value?.data?.alerts ?? alertsRes.value?.alerts ?? [])
          : [];
        const ruleResults = rulesRes.status === 'fulfilled'
          ? (rulesRes.value?.data ?? rulesRes.value?.rules ?? [])
          : [];
        const eventResults = eventsRes.status === 'fulfilled'
          ? (eventsRes.value?.data?.events ?? eventsRes.value?.events ?? [])
          : [];

        setResults({
          alerts: alertResults,
          events: eventResults,
          rules: ruleResults
        });
      } finally {
        setIsLoading(false);
      }
    };

    search();
  }, [debouncedKeyword, isOpen]);
  
  const saveToRecentSearches = (searchTerm) => {
    const term = searchTerm.trim();
    if (!term) return;
    
    let existing = [];
    const stored = localStorage.getItem('secops_recent_searches');
    if (stored) {
      try { 
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          existing = parsed;
        }
      } catch (e) { /* ignore parsing error */ }
    }
    
    const updated = [term, ...existing.filter(t => t !== term)].slice(0, 5);
    localStorage.setItem('secops_recent_searches', JSON.stringify(updated));
    setRecentSearches(updated);
  };
  
  const removeRecentSearch = (termToRemove, e) => {
    e.stopPropagation();
    const updated = recentSearches.filter(t => t !== termToRemove);
    localStorage.setItem('secops_recent_searches', JSON.stringify(updated));
    setRecentSearches(updated);
  };
  
  // Keyboard navigation logic
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const resultRefs = useRef([]);
  
  // Need a flattened list of visible items to navigate through
  let visibleItems = [];
  
  if (query.length === 0) {
    visibleItems = recentSearches.map(term => ({ type: 'recent', term }));
  } else if (!isLoading && (results.alerts.length > 0 || results.events.length > 0 || results.rules.length > 0)) {
    if (activeCategory === 'all' || activeCategory === 'alerts') {
      visibleItems.push(...results.alerts.map(a => ({ type: 'alert', item: a })));
    }
    if (activeCategory === 'all' || activeCategory === 'events') {
      visibleItems.push(...results.events.map(e => ({ type: 'event', item: e })));
    }
    if (activeCategory === 'all' || activeCategory === 'rules') {
      visibleItems.push(...results.rules.map(r => ({ type: 'rule', item: r })));
    }
  }
  
  useEffect(() => {
    setFocusedIndex(-1);
  }, [query, activeCategory, results, isLoading, isOpen]);
  
  useEffect(() => {
    if (!isOpen) return;
    
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIndex(prev => (prev < visibleItems.length - 1 ? prev + 1 : prev));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIndex(prev => (prev > 0 ? prev - 1 : prev));
      } else if (e.key === 'Enter') {
        if (focusedIndex >= 0 && focusedIndex < visibleItems.length) {
          e.preventDefault();
          const target = visibleItems[focusedIndex];
          if (target.type === 'recent') {
            setQuery(target.term);
          } else if (target.type === 'alert') {
            handleAlertClick(target.item);
          } else if (target.type === 'event') {
            handleEventClick(target.item);
          } else if (target.type === 'rule') {
            handleRuleClick(target.item);
          }
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, visibleItems, focusedIndex, onClose]);
  
  useEffect(() => {
    if (focusedIndex >= 0 && resultRefs.current[focusedIndex]) {
      resultRefs.current[focusedIndex].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [focusedIndex]);
  
  const handleAlertClick = (alert) => {
    saveToRecentSearches(query);
    navigate(`/alerts?id=${alert.id}`);
    onClose();
  };
  
  const handleEventClick = (event) => {
    saveToRecentSearches(query);
    navigate('/cloudtrail');
    onClose();
  };
  
  const handleRuleClick = (rule) => {
    saveToRecentSearches(query);
    navigate('/rules');
    onClose();
  };
  
  const HighlightText = ({ text, highlight }) => {
    if (!highlight || !highlight.trim()) return <span>{text}</span>;
    const regex = new RegExp(`(${highlight})`, 'gi');
    const parts = text.split(regex);
    return (
      <span>
        {parts.map((part, i) => 
          regex.test(part) ? <span key={i} className="bg-blue-500/30 text-blue-300">{part}</span> : part
        )}
      </span>
    );
  };
  
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-amber-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-slate-500';
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="relative z-[999]">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      
      <div className="fixed sm:top-20 top-0 left-0 sm:left-1/2 sm:-translate-x-1/2 w-full sm:max-w-2xl h-full sm:h-auto bg-white dark:bg-[#13151b] border-none sm:border border-gray-200 dark:border-[#1f2229] sm:rounded-2xl shadow-none sm:shadow-2xl sm:shadow-black overflow-hidden max-h-screen sm:max-h-[70vh] flex flex-col animate-in slide-in-from-top-4 duration-200">
        
        {/* SEARCH INPUT SECTION */}
        <div className="px-4 py-3 border-b border-gray-200 dark:border-[#1f2229] flex items-center gap-3 shrink-0">
          <Search className="w-5 h-5 text-gray-400 dark:text-slate-500" />
          <input 
            ref={inputRef}
            type="text" 
            placeholder="Search alerts, events, rules..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-gray-900 dark:text-slate-100 text-sm placeholder-gray-500 dark:placeholder-slate-500 outline-none"
          />
          {query.length > 0 ? (
            <button onClick={() => setQuery('')} className="p-1 text-gray-400 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200">
              <X className="w-4 h-4" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-block bg-gray-100 dark:bg-[#191c24] text-gray-500 dark:text-slate-500 text-xs px-1.5 py-0.5 rounded font-sans border border-gray-200 dark:border-[#1f2229]">
              ESC
            </kbd>
          )}
          <button onClick={onClose} className="sm:hidden p-1 text-gray-400 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* CATEGORY FILTER ROW */}
        <div className="px-4 py-2 border-b border-gray-200 dark:border-[#1f2229] flex gap-2 shrink-0 overflow-x-auto hide-scrollbar">
          <button 
            onClick={() => setActiveCategory('all')}
            className={activeCategory === 'all' ? "bg-accent text-white text-xs px-3 py-1 rounded-full whitespace-nowrap" : "bg-gray-100 dark:bg-[#191c24] text-gray-600 dark:text-slate-400 text-xs px-3 py-1 rounded-full hover:bg-gray-200 dark:hover:bg-[#1f2229] whitespace-nowrap transition-colors"}
          >
            All
          </button>
          <button 
            onClick={() => setActiveCategory('alerts')}
            className={activeCategory === 'alerts' ? "bg-accent text-white text-xs px-3 py-1 rounded-full whitespace-nowrap" : "bg-gray-100 dark:bg-[#191c24] text-gray-600 dark:text-slate-400 text-xs px-3 py-1 rounded-full hover:bg-gray-200 dark:hover:bg-[#1f2229] whitespace-nowrap transition-colors"}
          >
            Alerts {results.alerts.length > 0 && `(${results.alerts.length})`}
          </button>
          <button 
            onClick={() => setActiveCategory('events')}
            className={activeCategory === 'events' ? "bg-accent text-white text-xs px-3 py-1 rounded-full whitespace-nowrap" : "bg-gray-100 dark:bg-[#191c24] text-gray-600 dark:text-slate-400 text-xs px-3 py-1 rounded-full hover:bg-gray-200 dark:hover:bg-[#1f2229] whitespace-nowrap transition-colors"}
          >
            CloudTrail {results.events.length > 0 && `(${results.events.length})`}
          </button>
          <button 
            onClick={() => setActiveCategory('rules')}
            className={activeCategory === 'rules' ? "bg-accent text-white text-xs px-3 py-1 rounded-full whitespace-nowrap" : "bg-gray-100 dark:bg-[#191c24] text-gray-600 dark:text-slate-400 text-xs px-3 py-1 rounded-full hover:bg-gray-200 dark:hover:bg-[#1f2229] whitespace-nowrap transition-colors"}
          >
            Rules {results.rules.length > 0 && `(${results.rules.length})`}
          </button>
        </div>
        
        {/* RESULTS SECTION */}
        <div className="flex-1 overflow-y-auto bg-white dark:bg-[#13151b]">
          
          {query.length === 0 ? (
            <div>
              <div className="text-gray-500 dark:text-slate-500 text-[10px] font-semibold uppercase tracking-wider px-4 py-3">Recent Searches</div>
              {recentSearches.length > 0 ? (
                recentSearches.map((term, idx) => {
                  const globalIdx = visibleItems.findIndex(v => v.type === 'recent' && v.term === term);
                  return (
                    <div 
                      key={idx}
                      ref={el => resultRefs.current[globalIdx] = el}
                      onClick={() => setQuery(term)}
                      className={`px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-[#191c24] cursor-pointer transition-colors ${focusedIndex === globalIdx ? 'bg-gray-100 dark:bg-[#191c24]' : ''}`}
                    >
                      <Clock className="w-4 h-4 text-gray-400 dark:text-slate-600" />
                      <span className="text-gray-700 dark:text-slate-300 text-sm flex-1 font-medium">{term}</span>
                      <button onClick={(e) => removeRecentSearch(term, e)} className="text-gray-400 dark:text-slate-500 hover:text-gray-900 dark:hover:text-slate-300 p-1 transition-colors rounded-lg hover:bg-gray-200 dark:hover:bg-[#2a2e38]">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center py-16">
                  <Search className="w-8 h-8 text-gray-200 dark:text-[#1f2229] mb-3" />
                  <span className="text-gray-500 dark:text-slate-600 text-sm font-medium">Start typing to search</span>
                </div>
              )}
            </div>
          ) : isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center">
              <Spinner className="w-6 h-6 text-accent mb-3" />
              <span className="text-gray-500 dark:text-slate-400 text-sm font-medium">Searching...</span>
            </div>
          ) : visibleItems.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center text-center px-4">
              <Search className="w-10 h-10 text-gray-300 dark:text-[#2a2e38]" />
              <p className="text-gray-900 dark:text-slate-300 text-sm font-medium mt-4">No results for "{query}"</p>
              <p className="text-gray-500 dark:text-slate-500 text-xs mt-1.5">Try searching for event names, IP addresses, or rule names</p>
            </div>
          ) : (
            <div>
              {(activeCategory === 'all' || activeCategory === 'alerts') && results.alerts.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-[#0e1015] border-y border-gray-100 dark:border-[#1f2229]">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-gray-500 dark:text-slate-500 text-[10px] font-semibold uppercase tracking-wider">Alerts</span>
                    <span className="bg-gray-200 dark:bg-[#1f2229] text-gray-700 dark:text-slate-300 text-[10px] px-1.5 py-0.5 rounded-md font-medium">{results.alerts.length}</span>
                  </div>
                  {results.alerts.map((alert) => {
                    const globalIdx = visibleItems.findIndex(v => v.type === 'alert' && v.item.id === alert.id);
                    return (
                      <div 
                        key={alert.id}
                        ref={el => resultRefs.current[globalIdx] = el}
                        onClick={() => handleAlertClick(alert)}
                        className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-[#191c24] cursor-pointer border-b border-gray-100 dark:border-[#1f2229] flex items-start gap-3 transition-colors ${focusedIndex === globalIdx ? 'bg-gray-100 dark:bg-[#191c24]' : ''}`}
                      >
                        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${getSeverityColor(alert.severity)}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-900 dark:text-slate-200 text-sm font-medium truncate"><HighlightText text={alert.title} highlight={query} /></p>
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <Badge variant={alert.severity}>{alert.severity}</Badge>
                            <Badge variant="outline">{alert.status}</Badge>
                            <span className="text-gray-500 dark:text-slate-500 text-[11px]">{formatDistanceToNow(new Date(alert.created_at || alert.timestamp), { addSuffix: true })}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              
              {(activeCategory === 'all' || activeCategory === 'events') && results.events.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-[#0e1015] border-y border-gray-100 dark:border-[#1f2229]">
                    <Activity className="w-3.5 h-3.5 text-accent" />
                    <span className="text-gray-500 dark:text-slate-500 text-[10px] font-semibold uppercase tracking-wider">CloudTrail Events</span>
                    <span className="bg-gray-200 dark:bg-[#1f2229] text-gray-700 dark:text-slate-300 text-[10px] px-1.5 py-0.5 rounded-md font-medium">{results.events.length}</span>
                  </div>
                  {results.events.map((event) => {
                    const globalIdx = visibleItems.findIndex(v => v.type === 'event' && v.item.id === event.id);
                    return (
                      <div 
                        key={event.id}
                        ref={el => resultRefs.current[globalIdx] = el}
                        onClick={() => handleEventClick(event)}
                        className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-[#191c24] cursor-pointer border-b border-gray-100 dark:border-[#1f2229] flex flex-col transition-colors ${focusedIndex === globalIdx ? 'bg-gray-100 dark:bg-[#191c24]' : ''}`}
                      >
                        <p className="text-accent text-sm font-mono font-medium truncate"><HighlightText text={event.event_name} highlight={query} /></p>
                        <p className="text-gray-500 dark:text-slate-500 text-[11px] mt-1.5 truncate">
                          {(event.event_source || '').replace('.amazonaws.com', '')} &bull; {event.aws_region} &bull; {formatDistanceToNow(new Date(event.event_time), { addSuffix: true })}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
              
              {(activeCategory === 'all' || activeCategory === 'rules') && results.rules.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-[#0e1015] border-y border-gray-100 dark:border-[#1f2229]">
                    <Shield className="w-3.5 h-3.5 text-success" />
                    <span className="text-gray-500 dark:text-slate-500 text-[10px] font-semibold uppercase tracking-wider">Detection Rules</span>
                    <span className="bg-gray-200 dark:bg-[#1f2229] text-gray-700 dark:text-slate-300 text-[10px] px-1.5 py-0.5 rounded-md font-medium">{results.rules.length}</span>
                  </div>
                  {results.rules.map((rule) => {
                    const globalIdx = visibleItems.findIndex(v => v.type === 'rule' && v.item.id === rule.id);
                    return (
                      <div 
                        key={rule.id}
                        ref={el => resultRefs.current[globalIdx] = el}
                        onClick={() => handleRuleClick(rule)}
                        className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-[#191c24] cursor-pointer border-b border-gray-100 dark:border-[#1f2229] flex items-start gap-3 transition-colors ${focusedIndex === globalIdx ? 'bg-gray-100 dark:bg-[#191c24]' : ''}`}
                      >
                        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${rule.is_active ? 'bg-success' : 'bg-gray-400 dark:bg-[#2a2e38]'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-900 dark:text-slate-200 text-sm font-medium truncate"><HighlightText text={rule.name} highlight={query} /></p>
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <Badge variant={rule.severity}>{rule.severity}</Badge>
                            <span className="text-gray-500 dark:text-slate-500 text-[11px] font-mono">{rule.mitre_tactic} &bull; {rule.mitre_technique}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* FOOTER */}
        <div className="hidden sm:flex px-4 py-2.5 border-t border-gray-200 dark:border-[#1f2229] justify-between items-center shrink-0 bg-gray-50 dark:bg-[#0e1015]">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-gray-500 dark:text-slate-500 text-xs font-medium">
              <kbd className="bg-white dark:bg-[#191c24] border border-gray-200 dark:border-[#2a2e38] px-1.5 py-0.5 rounded shadow-sm font-sans text-[10px]">↑↓</kbd> to navigate
            </span>
            <span className="flex items-center gap-1.5 text-gray-500 dark:text-slate-500 text-xs font-medium">
              <kbd className="bg-white dark:bg-[#191c24] border border-gray-200 dark:border-[#2a2e38] px-1.5 py-0.5 rounded shadow-sm font-sans text-[10px]">↵</kbd> to select
            </span>
            <span className="flex items-center gap-1.5 text-gray-500 dark:text-slate-500 text-xs font-medium">
              <kbd className="bg-white dark:bg-[#191c24] border border-gray-200 dark:border-[#2a2e38] px-1.5 py-0.5 rounded shadow-sm font-sans text-[10px]">ESC</kbd> to close
            </span>
          </div>
          <span className="text-gray-400 dark:text-slate-600 text-[11px] font-semibold tracking-wide uppercase">Powered by SecOps AI</span>
        </div>
        
      </div>
    </div>,
    document.body
  );
}
