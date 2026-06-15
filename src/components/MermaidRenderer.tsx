import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { ZoomIn, ZoomOut, Maximize2, AlertTriangle, RefreshCw } from 'lucide-react';

interface MermaidRendererProps {
  mermaidCode: string;
}

// Unique renderer ID increment
let renderCount = 0;

export default function MermaidRenderer({ mermaidCode }: MermaidRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [rendering, setRendering] = useState<boolean>(false);

  // Zooming and panning state
  const [scale, setScale] = useState<number>(1);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Initialize mermaid configuration once
  useEffect(() => {
    try {
      mermaid.initialize({
        startOnLoad: false,
        theme: 'dark',
        securityLevel: 'loose', // allows HTML markup like <p> labels in node titles safely
        fontFamily: 'Inter, system-ui, sans-serif',
        flowchart: {
          curve: 'basis', // beautiful curved connectors
          htmlLabels: true,
          useMaxWidth: false,
        },
        themeVariables: {
          background: '#090d16', // sleek deep space black-slate
          primaryColor: '#2563eb', // elegant Sleek blue-600
          primaryTextColor: '#f8fafc', // high contrast off-white
          lineColor: '#3b82f6', // subtle Sleek blue-500 line
          secondaryColor: '#1e3a8a', // deep navy
          tertiaryColor: '#172554',
        }
      });
    } catch (e) {
      console.error('Failed to initialize mermaid', e);
    }
  }, []);

  // Primary rendering driver
  useEffect(() => {
    if (!mermaidCode) {
      setSvgContent('');
      setError(null);
      return;
    }

    let isSubscribed = true;
    setRendering(true);
    setError(null);

    const renderGraph = async () => {
      const renderId = `mermaid-render-${renderCount++}`;
      try {
        // Sanitize first/last visual classes to prevent rendering crash in default theme
        let processedCode = mermaidCode;
        if (!processedCode.includes('classDef')) {
          // If no design classes exist, we could add elegant defaults
        }

        // Render diagram asynchronously
        const { svg } = await mermaid.render(renderId, processedCode);
        
        if (isSubscribed) {
          // Wrap the SVG to remove hardcoded heights so it's fully responsive to zoom transforms
          const cleanedSvg = svg
            .replace(/width="100%"/g, '')
            .replace(/style="max-width:[^;"]+;"/g, 'style="width: 100%; height: auto;"');
            
          setSvgContent(cleanedSvg);
          setError(null);
          setRendering(false);
        }
      } catch (err: any) {
        console.error('Mermaid render error:', err);
        // Clean up broken elements if Mermaid injected something prior to crashing
        const badElement = document.getElementById(renderId);
        if (badElement) {
          badElement.remove();
        }
        
        if (isSubscribed) {
          setError(err.message || 'Syntax parser error: Please review the flowchart connectors or node definitions.');
          setRendering(false);
        }
      }
    };

    // Debounce the render slightly to prevent typewriter lag during editing/typing
    const timer = setTimeout(() => {
      renderGraph();
    }, 150);

    return () => {
      isSubscribed = false;
      clearTimeout(timer);
    };
  }, [mermaidCode]);

  // Reset zoom and pan settings
  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  // Zoom manipulation helper
  const adjustZoom = (factor: number) => {
    setScale(prev => Math.min(Math.max(prev * factor, 0.4), 4));
  };

  // Mouse drag triggers
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return; // Only trigger on left-click
    setIsDragging(true);
    dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y
    });
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const zoomIntensity = 0.08;
    const delta = e.deltaY < 0 ? 1 + zoomIntensity : 1 - zoomIntensity;
    adjustZoom(delta);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden relative group shadow-inner">
      {/* Header bar controls */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-950 border-b border-slate-800">
        <span className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${rendering ? 'bg-indigo-500 animate-pulse' : error ? 'bg-rose-500' : 'bg-emerald-500'}`}></span>
          {rendering ? 'Compiling graph...' : error ? 'Syntax Error' : 'Live Graph Canvas'}
        </span>
        
        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <button
            onClick={() => adjustZoom(1.2)}
            disabled={!!error}
            className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors disabled:opacity-30 disabled:pointer-events-none"
            title="Zoom In"
            id="btn-zoom-in"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => adjustZoom(1 / 1.2)}
            disabled={!!error}
            className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors disabled:opacity-30 disabled:pointer-events-none"
            title="Zoom Out"
            id="btn-zoom-out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <button
            onClick={handleReset}
            disabled={!!error}
            className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors font-mono text-xs font-medium px-2 flex items-center gap-1 disabled:opacity-30 disabled:pointer-events-none"
            title="Reset Viewport"
            id="btn-reset-view"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Main viewport canvas */}
      <div 
        ref={wrapperRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        onWheel={handleWheel}
        className={`flex-1 overflow-hidden relative cursor-grab select-none active:cursor-grabbing`}
        style={{ touchAction: 'none' }}
        id="mermaid-viewport-container"
      >
        {rendering && !svgContent && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900 bg-opacity-70 z-10 transition-opacity">
            <div className="flex flex-col items-center gap-3">
              <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
              <p className="text-sm font-mono text-slate-400">Rendering layout nodes...</p>
            </div>
          </div>
        )}

        {error ? (
          <div className="absolute inset-x-4 top-4 bg-rose-950/80 border border-rose-800/60 p-4 rounded-xl text-rose-200 text-sm flex items-start gap-3 backdrop-blur z-20">
            <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-rose-300">Mermaid Graph Parser Error</h4>
              <pre className="mt-1 text-xs font-mono overflow-x-auto whitespace-pre-wrap text-rose-200 bg-rose-950/60 p-3 rounded-lg border border-rose-900">
                {error}
              </pre>
              <p className="mt-2 text-xs text-rose-400">
                Tip: LangGraph nodes must be connected using arrow definition blocks e.g. <code className="bg-rose-950 px-1 py-0.5 rounded text-rose-300">nodeA --&gt; nodeB</code>. Ensure all nodes have matching closing brackets.
              </p>
            </div>
          </div>
        ) : null}

        {/* Scaled & panned SVGs container */}
        <div
          ref={containerRef}
          className="w-full h-full flex items-center justify-center p-8 transition-transform duration-75 ease-out origin-center"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
          }}
          dangerouslySetInnerHTML={{ __html: svgContent || `<div class="text-slate-500 text-sm font-mono">No diagram generated</div>` }}
          id="mermaid-diagram-payload"
        />

        {/* Context instruction helper overlay */}
        {!error && svgContent && (
          <div className="absolute bottom-3 left-3 bg-slate-950/70 backdrop-blur px-2.5 py-1.5 rounded-md border border-slate-800/80 pointer-events-none text-[10px] font-mono text-slate-400 transition-opacity opacity-0 group-hover:opacity-100">
            🖱️ Left-click & Drag to PAN &bull; Scroll to ZOOM
          </div>
        )}
      </div>

      {/* Code preview block at base */}
      {!error && svgContent && (
        <div className="bg-slate-950 border-t border-slate-800/70 p-2.5 text-[11px] font-mono text-slate-500 flex items-center justify-between">
          <span>Renderer: <strong>Mermaid (v11)</strong></span>
          <span className="text-slate-400 truncate max-w-[200px] sm:max-w-xs">{mermaidCode.split('\n').length} lines of code parsed</span>
        </div>
      )}
    </div>
  );
}
