import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Server, 
  Plus, 
  Trash2, 
  Clipboard, 
  Code, 
  FileCode2, 
  Database, 
  Layers, 
  HelpCircle, 
  Check, 
  ExternalLink, 
  Globe, 
  Sparkles, 
  Menu, 
  X, 
  RefreshCw, 
  Share2,
  AlertTriangle,
  FileText,
  Import,
  Play
} from 'lucide-react';
import { SavedServer, WorkflowGraph } from './types';
import { parseGraphContent } from './utils/graphParser';
import { PRESETS } from './constants/presets';
import MermaidRenderer from './components/MermaidRenderer';

export default function App() {
  // Persistence state: Saved servers
  const [savedServers, setSavedServers] = useState<SavedServer[]>([]);
  // Persistence state: Saved/Pasted graph records
  const [graphHistory, setGraphHistory] = useState<WorkflowGraph[]>([]);
  // Active viewing state
  const [activeGraph, setActiveGraph] = useState<WorkflowGraph | null>(null);

  // Input states
  const [pasteInput, setPasteInput] = useState<string>('');
  const [fetchUrl, setFetchUrl] = useState<string>('');
  const [newServerName, setNewServerName] = useState<string>('');
  const [newServerUrl, setNewServerUrl] = useState<string>('');

  // UI state
  const [activeTab, setActiveTab] = useState<'visualize' | 'code' | 'raw_source'>('visualize');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [showAddServerModal, setShowAddServerModal] = useState<boolean>(false);
  const [copiedGraphId, setCopiedGraphId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorHeader, setErrorHeader] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState<boolean>(false);

  // Initialize data on mount
  useEffect(() => {
    // 1. Core Servers
    const cachedServers = localStorage.getItem('langgraph_saved_servers');
    if (cachedServers) {
      try {
        setSavedServers(JSON.parse(cachedServers));
      } catch (e) {
        console.error('Failed to parse cached servers', e);
      }
    } else {
      // Default sample servers to get user started
      const defaults: SavedServer[] = [
        { id: 'srv-1', name: 'Localhost LangGraph', url: 'localhost:8000/graph', createdAt: new Date().toISOString() },
        { id: 'srv-2', name: 'Staging Cognitive Orchestrator', url: 'https://staging-api.agent-mesh.de/graph', createdAt: new Date().toISOString() }
      ];
      setSavedServers(defaults);
      localStorage.setItem('langgraph_saved_servers', JSON.stringify(defaults));
    }

    // 2. History of parsed graphs
    const cachedHistory = localStorage.getItem('langgraph_history');
    if (cachedHistory) {
      try {
        const parsedHistory = JSON.parse(cachedHistory);
        setGraphHistory(parsedHistory);
        if (parsedHistory.length > 0) {
          setActiveGraph(parsedHistory[0]);
        }
      } catch (e) {
        console.error('Failed to parse cached graph history', e);
      }
    }

    // If no history exists, load the first preset as initial default graph
    if (!cachedHistory || JSON.parse(cachedHistory).length === 0) {
      const defaultParsed = parseGraphContent(PRESETS[0].source);
      const initialGraph: WorkflowGraph = {
        id: 'preset-default',
        title: defaultParsed.title,
        mermaidCode: defaultParsed.mermaid,
        nodesCount: defaultParsed.nodesCount,
        description: defaultParsed.description,
        pastedAt: new Date().toISOString(),
        source: 'paste',
      };
      setGraphHistory([initialGraph]);
      setActiveGraph(initialGraph);
      localStorage.setItem('langgraph_history', JSON.stringify([initialGraph]));
    }
  }, []);

  // Update server list persistent engine
  const saveServersList = (list: SavedServer[]) => {
    setSavedServers(list);
    localStorage.setItem('langgraph_saved_servers', JSON.stringify(list));
  };

  // Update graph history persistent engine
  const saveGraphHistory = (list: WorkflowGraph[]) => {
    setGraphHistory(list);
    localStorage.setItem('langgraph_history', JSON.stringify(list));
  };

  // Adding a new custom server
  const handleAddServer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServerName.trim() || !newServerUrl.trim()) return;

    let cleanUrl = newServerUrl.trim();
    // Strip trailing slashes to prevent issues
    cleanUrl = cleanUrl.replace(/\/+$/, '');

    const newServer: SavedServer = {
      id: 'srv-' + Math.random().toString(36).substring(2, 9),
      name: newServerName.trim(),
      url: cleanUrl,
      createdAt: new Date().toISOString()
    };

    const updated = [...savedServers, newServer];
    saveServersList(updated);
    setNewServerName('');
    setNewServerUrl('');
    setShowAddServerModal(false);
  };

  // Deleting configured servers
  const handleDeleteServer = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const filtered = savedServers.filter(s => s.id !== id);
    saveServersList(filtered);
  };

  // Parsing pasted content or source codes
  const handleParsePastedContent = (text: string) => {
    if (!text.trim()) {
      setErrorHeader("Pasted source is empty. Please enter HTML code or direct Mermaid instructions.");
      return;
    }

    setLoading(true);
    setErrorHeader(null);

    try {
      const parsed = parseGraphContent(text);
      if (!parsed.mermaid) {
        throw new Error("Could not extract any valid Mermaid node graphs from the pasted snippet.");
      }

      const newGraph: WorkflowGraph = {
        id: 'graph-' + Math.random().toString(36).substring(2, 9),
        title: parsed.title || "Custom Graph Flow",
        description: parsed.description || "Parsed Mermaid snippet",
        nodesCount: parsed.nodesCount,
        mermaidCode: parsed.mermaid,
        pastedAt: new Date().toISOString(),
        source: 'paste'
      };

      const updatedHistory = [newGraph, ...graphHistory.filter(g => g.id !== 'preset-default')];
      saveGraphHistory(updatedHistory);
      setActiveGraph(newGraph);
      setPasteInput(''); // Clear input box on success
      setErrorHeader(null);
    } catch (err: any) {
      setErrorHeader(err.message || "Failed to process pasted content.");
    } finally {
      setLoading(false);
    }
  };

  // Fetching workflow definition using express backend proxy
  const handleFetchGraphFromServer = async (url: string) => {
    if (!url.trim()) {
      setErrorHeader("Please specify a target endpoint or select an active server config.");
      return;
    }

    setLoading(true);
    setErrorHeader(null);

    try {
      const targetUrl = url.trim();
      const res = await fetch(`/api/proxy-graph?url=${encodeURIComponent(targetUrl)}`);
      
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Remote server returned HTTP ${res.status}`);
      }

      const data = await res.json();
      const rawHtml = data.content;

      const parsed = parseGraphContent(rawHtml);
      if (!parsed.mermaid) {
        throw new Error("Target response was fetched successfully, but contained no Mermaid diagrams inside <pre class=\"mermaid\"> definition templates.");
      }

      const newGraph: WorkflowGraph = {
        id: 'graph-' + Math.random().toString(36).substring(2, 9),
        title: parsed.title || `Server Graph (${new URL(targetUrl.match(/^https?:\/\//) ? targetUrl : 'http://' + targetUrl).hostname})`,
        description: parsed.description || "Dynamically synchronized content",
        nodesCount: parsed.nodesCount,
        mermaidCode: parsed.mermaid,
        pastedAt: new Date().toISOString(),
        source: 'url',
        sourceUrl: targetUrl
      };

      const updatedHistory = [newGraph, ...graphHistory.filter(g => g.id !== 'preset-default')];
      saveGraphHistory(updatedHistory);
      setActiveGraph(newGraph);
      setErrorHeader(null);
    } catch (err: any) {
      setErrorHeader(`Network Error: ${err.message || "Endpoint has refused access or triggered a CORS failure."}`);
    } finally {
      setLoading(false);
    }
  };

  // Trigger preset loading
  const handleLoadPreset = (preset: typeof PRESETS[0]) => {
    handleParsePastedContent(preset.source);
  };

  // Editing active graph source directly on-screen
  const handleActiveMermaidEdit = (newMermaid: string) => {
    if (!activeGraph) return;
    const updated = { ...activeGraph, mermaidCode: newMermaid };
    setActiveGraph(updated);

    // Update inside stored history lists too
    const updatedHistory = graphHistory.map(g => g.id === activeGraph.id ? updated : g);
    saveGraphHistory(updatedHistory);
  };

  // Deleting records from list histories
  const handleDeleteHistory = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const filtered = graphHistory.filter(g => g.id !== id);
    saveGraphHistory(filtered);
    if (activeGraph?.id === id) {
      setActiveGraph(filtered.length > 0 ? filtered[0] : null);
    }
  };

  // Copy Mermaid syntax to clipboard helper
  const handleCopyCodeToClipboard = () => {
    if (!activeGraph) return;
    navigator.clipboard.writeText(activeGraph.mermaidCode);
    setCopiedGraphId(activeGraph.id);
    setTimeout(() => setCopiedGraphId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-955 bg-[radial-gradient(#1e293b_1px,transparent_1px)] bg-[size:24px_24px] text-slate-101 font-sans flex flex-col antialiased">
      
      {/* Header Panel */}
      <header className="bg-slate-900/50 border-b border-slate-800/80 sticky top-0 z-30 backdrop-blur-md" id="app-top-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 shrink-0">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-slate-800/85 text-slate-400 hover:text-white transition-colors"
              title="Toggle Sidebar navigation"
              id="sidebar-toggle-btn"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20 text-white font-bold shrink-0">
                <Layers className="w-4.5 h-4.5" />
              </div>
              <div>
                <h1 className="text-base font-bold tracking-tight text-white italic leading-none">
                  LangGraph <span className="text-blue-400 font-normal not-italic">Visualizer</span>
                </h1>
                <p className="text-[9px] font-mono text-blue-500 tracking-wider mt-1 uppercase font-semibold">
                  Runtime Workflow Simulator
                </p>
              </div>
            </div>
          </div>

          {/* Dynamic Sync URL Field in Header directly matching the Design layout pattern */}
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <div className="relative w-full group">
              <input 
                type="text" 
                placeholder="https://server.de/graph (Type & Enter to fetch)" 
                value={fetchUrl}
                onChange={(e) => setFetchUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleFetchGraphFromServer(fetchUrl);
                }}
                className="w-full bg-slate-905 border border-slate-800 rounded-full py-1.5 pl-4 pr-10 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/55 focus:border-blue-500 text-slate-100 transition-all placeholder:text-slate-650 focus:bg-slate-950 font-mono"
                id="header-manual-url-input"
              />
              <button 
                onClick={() => handleFetchGraphFromServer(fetchUrl)}
                disabled={loading || !fetchUrl}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-slate-500 hover:text-blue-350 disabled:opacity-30 transition-colors"
                id="btn-header-fetch-trigger"
              >
                {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-500" /> : <Globe className="w-3.5 h-3.5 animate-spin text-blue-500" />}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => {
                const manualMermaid = prompt("Paste raw /graph HTML or Mermaid specification code below:");
                if (manualMermaid) {
                  setPasteInput(manualMermaid);
                  handleParsePastedContent(manualMermaid);
                }
              }}
              className="px-3 py-1.5 rounded-lg border border-slate-800 hover:border-slate-705 bg-slate-900/40 hover:bg-slate-900 text-xs text-slate-300 transition-all font-semibold cursor-pointer"
              id="header-paste-alt-trigger"
            >
              Paste Mermaid
            </button>

            <button
              onClick={() => setShowHelp(!showHelp)}
              className="px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/50 hover:bg-slate-800 text-xs text-slate-300 transition-all flex items-center gap-1.5"
              id="help-modal-trigger"
            >
              <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
              <span>How it Works</span>
            </button>
            
            <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-blue-950/50 border border-blue-900/40 text-blue-300">
              UTC 2026
            </span>
          </div>
        </div>
      </header>

      {/* Main Workspace Frame container */}
      <div className="flex-1 max-w-7xl w-full mx-auto flex overflow-hidden">
        
        {/* SIDEBAR NAVIGATION PANEL */}
        <AnimatePresence initial={false}>
          {sidebarOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="bg-slate-950/70 border-r border-slate-900 shrink-0 overflow-y-auto hidden md:block"
              id="aside-navigation-rail"
            >
              <div className="p-4 space-y-6">
                
                {/* section: paste-box */}
                <div className="space-y-2.5">
                  <h3 className="text-[10px] uppercase tracking-widest text-slate-500 font-bold flex items-center justify-between">
                    <span>Direct Paste Input</span>
                    <Clipboard className="w-3.5 h-3.5 text-blue-500" />
                  </h3>
                  <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 focus-within:border-blue-500/50 transition-colors">
                    <textarea
                      value={pasteInput}
                      onChange={(e) => setPasteInput(e.target.value)}
                      placeholder="Paste your raw workflow HTML or /graph source code, or direct Mermaid definitions here..."
                      className="w-full h-20 bg-transparent outline-none border-none text-xs font-mono text-slate-300 resize-none placeholder:text-slate-600 leading-relaxed"
                      id="raw-paste-textarea"
                    />
                    <div className="flex justify-end gap-2 mt-2 pt-2 border-t border-slate-800/60">
                      <button
                        onClick={() => {
                          const userText = prompt("Paste full Mermaid flowchartTD text instantly:");
                          if (userText) setPasteInput(userText);
                        }}
                        className="text-[10px] text-slate-500 hover:text-slate-350 transition-colors font-mono mr-auto cursor-pointer"
                      >
                        Sample Template
                      </button>
                      <button
                        onClick={() => handleParsePastedContent(pasteInput)}
                        disabled={!pasteInput.trim() || loading}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 text-[11px] font-semibold text-white rounded-md transition-all flex items-center gap-1 cursor-pointer"
                        id="btn-trigger-parse"
                      >
                        {loading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3 fill-white" />}
                        <span>Visualize</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* section: server nodes sync */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[10px] uppercase tracking-widest text-slate-500 font-bold flex items-center gap-1.5">
                      <Server className="w-3.5 h-3.5 text-slate-500" />
                      <span>Endpoints Registry</span>
                    </h3>
                    <button
                      onClick={() => setShowAddServerModal(true)}
                      className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-[10px] text-blue-400 border border-slate-850 flex items-center gap-0.5 font-semibold cursor-pointer"
                      title="Add Custom server"
                      id="add-server-btn"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add</span>
                    </button>
                  </div>

                  {/* List of addable servers */}
                  <div className="space-y-2">
                    {savedServers.length === 0 ? (
                      <p className="text-xs text-slate-600 italic">No custom endpoints configured.</p>
                    ) : (
                      savedServers.map((server) => {
                        const isSelected = fetchUrl === server.url;
                        return (
                          <div
                            key={server.id}
                            onClick={() => {
                              setFetchUrl(server.url);
                              handleFetchGraphFromServer(server.url);
                            }}
                            className={`group cursor-pointer rounded-lg border p-2.5 flex flex-col gap-1 transition-all ${
                              isSelected 
                                ? 'bg-blue-500/10 border-blue-500/35 text-white shadow-[0_0_12px_rgba(59,130,246,0.08)]' 
                                : 'bg-slate-900/40 border-slate-850 hover:bg-slate-800/70 hover:border-slate-700/80 text-slate-350'
                            }`}
                            id={`server-card-${server.id}`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs group-hover:text-blue-400 transition-colors flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-blue-500 animate-pulse' : 'bg-slate-600'}`}></span>
                                {server.name}
                              </span>
                              <button
                                onClick={(e) => handleDeleteServer(server.id, e)}
                                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-slate-800 text-slate-500 hover:text-rose-400 transition-all cursor-pointer"
                                title="Remove Server"
                                id={`delete-server-${server.id}`}
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                            <span className="text-[10px] font-mono text-slate-500 truncate flex items-center gap-1 pl-4">
                              <Globe className="w-3 h-3 text-slate-700 shrink-0" />
                              {server.url}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Manual URL quick field */}
                  <div className="pt-1 flex gap-1.5">
                    <input
                      type="text"
                      placeholder="Or enter server.de/graph"
                      value={fetchUrl}
                      onChange={(e) => setFetchUrl(e.target.value)}
                      className="flex-1 bg-slate-900/70 border border-slate-850 text-xs px-2.5 py-1.5 rounded-lg font-mono outline-none focus:border-slate-700 text-slate-300 placeholder:text-slate-600"
                      id="manual-url-input"
                    />
                    <button
                      onClick={() => handleFetchGraphFromServer(fetchUrl)}
                      disabled={loading || !fetchUrl}
                      className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 transition-colors p-2 rounded-lg text-white cursor-pointer"
                      title="Fetch Endpoint"
                      id="btn-fetch-manual"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* section: history */}
                <div className="space-y-3">
                  <h3 className="text-[10px] uppercase tracking-widest text-slate-500 font-bold flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-slate-500" />
                    <span>Diagram Archives</span>
                  </h3>
                  <div className="space-y-2">
                    {graphHistory.map((graph) => {
                      const isActive = activeGraph?.id === graph.id;
                      return (
                        <div
                          key={graph.id}
                          onClick={() => {
                            setActiveGraph(graph);
                            setErrorHeader(null);
                          }}
                          className={`group cursor-pointer rounded-lg border p-2.5 flex items-center justify-between transition-all ${
                            isActive 
                              ? 'bg-blue-500/5 border-blue-500/25 text-white shadow-[0_0_12px_rgba(59,130,246,0.06)]' 
                              : 'bg-slate-900/20 border-slate-850 hover:bg-slate-900/50'
                          }`}
                          id={`history-row-${graph.id}`}
                        >
                          <div className="min-w-0 flex-1 flex flex-col">
                            <span className="font-semibold text-xs text-slate-300 truncate group-hover:text-white">
                              {graph.title}
                            </span>
                            <span className="text-[9px] font-mono text-slate-500 mt-0.5 flex items-center gap-1.5">
                              <span className="bg-slate-800 px-1 py-0.2 rounded text-slate-400">{graph.nodesCount || '?'} nodes</span>
                              <span>&bull;</span>
                              <span>{new Date(graph.pastedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </span>
                          </div>
                          <button
                            onClick={(e) => handleDeleteHistory(graph.id, e)}
                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-slate-900 text-slate-500 hover:text-rose-450 transition-all shrink-0 ml-1 cursor-pointer"
                            title="Delete History entry"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* section: Presets */}
                <div className="space-y-2 pt-3 border-t border-slate-900">
                  <h4 className="text-[10px] uppercase tracking-widest text-blue-400 font-bold flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 shrink-0 text-blue-500" />
                    <span>Explore presets templates</span>
                  </h4>
                  <div className="grid grid-cols-1 gap-1.5">
                    {PRESETS.map((pst, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleLoadPreset(pst)}
                        className="text-left p-2 rounded-lg bg-slate-900/30 border border-slate-850 hover:border-slate-700/80 text-xs hover:bg-slate-900/60 transition-all flex flex-col gap-0.5 cursor-pointer"
                        id={`btn-preset-${idx}`}
                      >
                        <span className="font-semibold text-slate-300">{pst.name}</span>
                        <span className="text-[10px] text-slate-500 truncate">{pst.description}</span>
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              {/* Current Session HUD Card from design */}
              <div className="mt-auto p-4 border-t border-slate-900 sticky bottom-0 bg-slate-950/90 backdrop-blur-md">
                <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-850">
                  <p className="text-[9px] text-slate-500 font-bold tracking-widest mb-1.5">CURRENT WORKFLOW SESSION</p>
                  <p className="text-xs font-semibold text-slate-300">{graphHistory.length} Live Diagrams Loaded</p>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* WORKSPACE & CANVAS CENTER */}
        <main className="flex-1 min-w-0 flex flex-col p-4 md:p-6 space-y-4" id="primary-workspace-window">
          
          {/* Header notifications if fetch failed or parsed errors */}
          {errorHeader && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-rose-950/40 border border-rose-800/50 p-4 rounded-xl flex items-start gap-3 text-rose-200 text-sm"
              id="top-error-banner"
            >
              <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-bold text-rose-300">Connection or Parsing Issue</h4>
                <p className="mt-1 text-xs text-rose-200/90 font-mono">{errorHeader}</p>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => {
                        setPasteInput(PRESETS[0].source);
                        setErrorHeader(null);
                    }}
                    className="text-[11px] text-rose-300 hover:text-white underline font-mono cursor-pointer"
                  >
                    Load dynamic fallback template instead
                  </button>
                  <span className="text-rose-500 text-xs font-mono">|</span>
                  <button
                    onClick={() => setErrorHeader(null)}
                    className="text-[11px] text-rose-400 hover:text-white underline font-mono cursor-pointer"
                  >
                    Acknowledge
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Active Graph Info Strip */}
          {activeGraph ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/25 border border-slate-850 p-4 rounded-xl backdrop-blur-md">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base font-bold text-white tracking-tight">
                    {activeGraph.title}
                  </h2>
                  <span className={`text-[9px] font-mono px-2 py-0.5 rounded-md ${activeGraph.source === 'url' ? 'bg-emerald-950 text-emerald-400 border border-emerald-900/60' : 'bg-blue-950/40 text-blue-400 border border-blue-900/30'}`}>
                    {activeGraph.source === 'url' ? 'Live Server Sync' : 'Pasted Source'}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-2 flex-wrap text-slate-400 text-xs text-slate-350">
                  <span className="font-semibold">
                    {activeGraph.description || "Interactive dynamic graph layout"}
                  </span>
                  {activeGraph.sourceUrl && (
                    <>
                      <span className="text-slate-700">&bull;</span>
                      <a 
                        href={activeGraph.sourceUrl.match(/^https?:\/\//) ? activeGraph.sourceUrl : 'http://' + activeGraph.sourceUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-xs text-blue-450 hover:text-blue-400 inline-flex items-center gap-0.5 transition-colors underline font-medium"
                      >
                        <Globe className="w-3.5 h-3.5" />
                        <span>Source Link</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </>
                  )}
                </div>
              </div>

              {/* Exact Pipeline specs left-aligned metadata from layout design */}
              <div className="flex gap-6 mt-1 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-t-0 sm:border-l border-slate-800/80 sm:pl-6 overflow-x-auto shrink-0 w-full sm:w-auto">
                <div className="flex flex-col shrink-0">
                  <span className="text-[10px] text-slate-500 uppercase tracking-tight font-bold">Pipeline Type</span>
                  <span className="text-xs text-slate-200 font-semibold mt-0.5">
                    {activeGraph.title.includes('RAG') ? 'Adaptive RAG' : activeGraph.description || 'Linear Sequential'}
                  </span>
                </div>
                <div className="flex flex-col border-l border-slate-800/60 pl-6 shrink-0">
                  <span className="text-[10px] text-slate-500 uppercase tracking-tight font-bold">Total Nodes</span>
                  <span className="text-xs text-slate-200 font-mono font-bold mt-0.5">{activeGraph.nodesCount || '?'} Units</span>
                </div>
                <div className="flex flex-col border-l border-slate-800/60 pl-6 shrink-0">
                  <span className="text-[10px] text-slate-500 uppercase tracking-tight font-bold">Checkpointing</span>
                  <span className="text-xs text-emerald-400 font-semibold uppercase tracking-wider flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping shrink-0"></span>
                    Enabled
                  </span>
                </div>
              </div>

              {/* View options / toggle tabs */}
              <div className="flex items-center gap-1.5 shrink-0 bg-slate-900/50 border border-slate-850 p-1.5 rounded-lg self-stretch sm:self-auto">
                <button
                  onClick={() => setActiveTab('visualize')}
                  className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${activeTab === 'visualize' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10' : 'text-slate-400 hover:text-slate-200'}`}
                  id="tab-btn-visualize"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Visual Graph</span>
                </button>
                <button
                  onClick={() => setActiveTab('code')}
                  className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${activeTab === 'code' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10' : 'text-slate-400 hover:text-slate-200'}`}
                  id="tab-btn-code"
                >
                  <Code className="w-3.5 h-3.5" />
                  <span>Live Editor</span>
                </button>
                <button
                  onClick={() => setActiveTab('raw_source')}
                  className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${activeTab === 'raw_source' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10' : 'text-slate-400 hover:text-slate-200'}`}
                  id="tab-btn-raw"
                >
                  <FileCode2 className="w-3.5 h-3.5" />
                  <span>HTML Source</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 bg-slate-900/20 border border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center p-8 text-center" id="empty-workspace-state">
              <Layers className="w-12 h-12 text-slate-600 mb-4 animate-bounce" />
              <h3 className="text-lg font-bold text-slate-300">No active work flowchart</h3>
              <p className="text-sm text-slate-400 max-w-sm mt-1">
                Paste raw HTML snippets in the sidebar or connect dynamic server configurations to render and map workflows.
              </p>
              <button
                onClick={() => setSidebarOpen(true)}
                className="mt-6 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-semibold text-white transition-all shadow-lg"
              >
                Configure Inputs
              </button>
            </div>
          )}

          {/* ACTIVE CONTENT VIEWPORT PANEL */}
          {activeGraph && (
            <div className="flex-1 min-h-0 relative">
              <AnimatePresence mode="wait">
                
                {/* 1. VISUALLY RENDER GRAPH */}
                {activeTab === 'visualize' && (
                  <motion.div
                    key="visualize"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="h-full"
                  >
                    <MermaidRenderer mermaidCode={activeGraph.mermaidCode} />
                  </motion.div>
                )}

                {/* 2. DIRECT TYPEWRITER SOURCE CODE EDITOR */}
                {activeTab === 'code' && (
                  <motion.div
                    key="code"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="h-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col relative"
                    id="live-editor-container"
                  >
                    <div className="bg-slate-950 p-3.5 border-b border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Code className="w-4 h-4 text-indigo-400" />
                        <span className="text-xs font-mono text-slate-300">Mermaid Live Flowchart Definitions</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleCopyCodeToClipboard}
                          className="px-2.5 py-1 text-xs font-mono text-slate-400 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-md transition-all flex items-center gap-1.5 cursor-pointer"
                          id="btn-copy-syntax"
                        >
                          {copiedGraphId === activeGraph.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Clipboard className="w-3.5 h-3.5" />
                              <span>Copy Code</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 min-h-0 divide-y lg:divide-y-0 lg:divide-x divide-slate-800">
                      {/* Interactive Code Editor (Left panel) */}
                      <div className="p-4 flex flex-col h-full bg-slate-950/30">
                        <label className="text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-2 block">
                          Edit Mermaid definitions below to compile live updates:
                        </label>
                        <textarea
                          value={activeGraph.mermaidCode}
                          onChange={(e) => handleActiveMermaidEdit(e.target.value)}
                          className="flex-1 w-full bg-slate-950/60 font-mono text-xs p-4 rounded-lg border border-slate-800 outline-none text-indigo-200 focus:border-indigo-500/50 resize-none leading-relaxed"
                          spellCheck="false"
                          id="active-editor-textarea"
                        />
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-[10px] text-slate-600 font-mono">
                            Press backspace or add loops like <code className="bg-slate-900 text-slate-400 px-1 rounded">A --&gt; B</code>
                          </span>
                          <span className="text-[10px] text-slate-400 font-semibold uppercase flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                            Auto Compiling
                          </span>
                        </div>
                      </div>

                      {/* Fast Render Panel Preview (Right panel) */}
                      <div className="p-4 bg-slate-900/60 overflow-hidden flex flex-col h-full">
                        <label className="text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-2 block">
                          Instant Render Output:
                        </label>
                        <div className="flex-1 min-h-0">
                          <MermaidRenderer mermaidCode={activeGraph.mermaidCode} />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* 3. ORIGINAL RAW IMPORT / HTML ARCHIVE */}
                {activeTab === 'raw_source' && (
                  <motion.div
                    key="raw_source"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="h-full bg-slate-900 border border-slate-805 rounded-xl overflow-hidden flex flex-col"
                  >
                    <div className="bg-slate-950 p-4 border-b border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileCode2 className="w-4 h-4 text-slate-400" />
                        <span className="text-xs font-mono text-slate-300">Originally Extracted HTML Content</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500">Read-Only Backup</span>
                    </div>
                    <div className="flex-1 p-4 bg-slate-950/40">
                      <textarea
                        readOnly
                        value={`<!-- Snapshot of loaded file source -->\n<!-- Timestamp: ${activeGraph.pastedAt} -->\n\n${activeGraph.mermaidCode}`}
                        className="w-full h-full bg-slate-950/60 font-mono text-xs p-4 rounded-lg border border-slate-850 outline-none text-slate-400 resize-none leading-relaxed"
                      />
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
          )}

        </main>
      </div>

      {/* FOOTER BAR FROM THE SLEEK DESIGN */}
      <footer className="h-10 border-t border-slate-900 bg-slate-950/70 px-4 flex items-center justify-between text-[11px] font-mono text-slate-500 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-2.5">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
            <span className="text-slate-400 font-semibold">Status: Connected</span>
          </span>
          <span className="text-slate-800">|</span>
          <span>Mermaid Core v11.2.0</span>
        </div>
        <div className="flex items-center gap-2.5">
          <span>Latency: 14ms</span>
          <span className="text-slate-800">|</span>
          <span className="text-blue-500">v1.4.2-stable</span>
        </div>
      </footer>

      {/* DIALOG 1: ADD NEW ENDPOINT SERVER */}
      <AnimatePresence>
        {showAddServerModal && (
          <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-sm shadow-2xl space-y-4"
              id="server-add-dialog-container"
            >
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <h3 className="text-sm font-semibold text-slate-200">Register Custom LangGraph Server</h3>
                <button
                  onClick={() => setShowAddServerModal(false)}
                  className="p-1 rounded hover:bg-slate-800 text-slate-400 transition-colors cursor-pointer"
                  id="close-add-server-modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddServer} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-slate-450 block font-semibold">Server Visual Label</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Production Cluster"
                    value={newServerName}
                    onChange={(e) => setNewServerName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-300 outline-none focus:border-blue-500"
                    id="new-server-name-input"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-slate-450 block font-semibold">Diagram Endpoint (/graph URL)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. staging.company.de/graph"
                    value={newServerUrl}
                    onChange={(e) => setNewServerUrl(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-300 outline-none font-mono focus:border-blue-500"
                    id="new-server-url-input"
                  />
                  <span className="text-[10px] text-slate-500 leading-normal block">
                    Our backend will securely query this address and parse the response HTML bypassing local browser CORS blocks.
                  </span>
                </div>

                <div className="pt-2 flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowAddServerModal(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700/80 text-xs font-semibold rounded-lg text-slate-300 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-xs font-semibold rounded-lg text-white transition-all shadow-lg cursor-pointer"
                    id="btn-confirm-add-server"
                  >
                    Add Server
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DIALOG 2: HOW IT WORKS EXPLAINER */}
      <AnimatePresence>
        {showHelp && (
          <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-lg shadow-2xl relative"
            >
              <button
                onClick={() => setShowHelp(false)}
                className="absolute top-4 right-4 p-1 rounded-md hover:bg-slate-800 text-slate-400 transition-colors cursor-pointer"
                id="close-help-modal"
              >
                <X className="w-4.5 h-4.5" />
              </button>

              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                  <Sparkles className="w-4.5 h-4.5 text-blue-450" />
                  <h3 className="text-sm font-bold text-slate-100">Workflow Graph Visualizer Guide</h3>
                </div>

                <div className="space-y-3.5 text-xs text-slate-300 leading-relaxed overflow-y-auto max-h-[70vh]">
                  <p>
                    This utility acts as an on-demand renderer for **LangGraph** workflows. When compiling agents, LangGraph outputs an elegant diagram structure embedded into a custom <code className="bg-slate-950 text-blue-400 px-1 py-0.5 rounded">.html</code> file with Mermaid.js.
                  </p>

                  <div className="bg-slate-955 rounded-lg p-3 space-y-2 border border-slate-850">
                    <h4 className="font-semibold text-slate-200 uppercase tracking-wide text-[10px] text-blue-450">Supported Methods:</h4>
                    <ul className="list-disc pl-4 space-y-1">
                      <li><strong>Direct Pasting:</strong> View the source of your exported `/graph` HTML file, paste the entire lines here, and click <strong>"Visualize"</strong>.</li>
                      <li><strong>Endpoint Fetching:</strong> Register custom server addresses (e.g. <code className="bg-slate-900 px-1 rounded">server.de/graph</code>). The backend route requests the live file, extract the flow definitions, and maps them instantly.</li>
                    </ul>
                  </div>

                  <div className="bg-slate-955 rounded-lg p-3 space-y-2 border border-slate-850">
                    <h4 className="font-semibold text-slate-200 uppercase tracking-wide text-[10px] text-emerald-400">Main Interactive Controls:</h4>
                    <ul className="list-disc pl-4 space-y-1">
                      <li><strong>Drag & Pan:</strong> Grab anywhere on the visualizer canvas to center complex flows.</li>
                      <li><strong>Zoom Scale:</strong> Use mouse wheel or the header buttons to stretch/magnify paths.</li>
                      <li><strong>Live Editor:</strong> Toggle the <strong>Live Editor</strong> to change node names or join new connections in real-time.</li>
                    </ul>
                  </div>

                  <p className="text-slate-500 font-mono text-[10px]">
                    Note: To allow rendering HTML-infused label tags securely, our Mermaid instance compiles graphs with safety levels optimized for dynamic client-side node rendering. Passed connections are auto-saved to local history.
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-800 flex justify-end">
                  <button
                    onClick={() => setShowHelp(false)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-xs font-semibold rounded-lg text-white transition-colors cursor-pointer"
                  >
                    Got it, close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
