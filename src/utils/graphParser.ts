import { ParsedGraphResult } from '../types';

/**
 * Decodes HTML entities commonly found inside code snippets or blocks.
 */
function decodeEntities(html: string): string {
  const el = document.createElement('textarea');
  el.innerHTML = html;
  return el.value;
}

/**
 * Sanitizes and extracts components of a LangGraph `/graph` HTML response
 * or direct Mermaid diagram specifications.
 */
export function parseGraphContent(rawInput: string): ParsedGraphResult {
  const trimmed = rawInput.trim();
  
  // 1. Check if the input is HTML
  const isHtml = /<html/i.test(trimmed) || /<!DOCTYPE/i.test(trimmed) || /<body/i.test(trimmed) || /<div/i.test(trimmed);

  if (!isHtml) {
    // Treat as direct Mermaid code
    // Try to guess a nodes count
    const nodeLines = trimmed.split('\n').filter(line => {
      const l = line.trim();
      return l && !l.startsWith('graph') && !l.startsWith('flowchart') && !l.startsWith('---') && !l.startsWith('config:') && !l.startsWith('classDef') && !l.startsWith('style') && l.includes('-->');
    });

    const nodeCandidates = new Set<string>();
    trimmed.split('\n').forEach(line => {
      const match = line.match(/([a-zA-Z0-9__\-\/]+)(\s*\(.*?\))?(\s*-->)?/g);
      if (match) {
        match.forEach(m => {
          const cleanName = m.replace(/[()\-\->\s]/g, '').trim();
          if (cleanName && !['graph', 'TD', 'LR', 'BT', 'RL', 'classDef', 'default', 'first', 'last'].includes(cleanName)) {
            nodeCandidates.add(cleanName);
          }
        });
      }
    });

    return {
      title: "Direct Mermaid Input",
      mermaid: trimmed,
      description: "Direct pasted Mermaid flow specification",
      nodesCount: nodeCandidates.size || 5
    };
  }

  // 2. Parse HTML using regex or DOM Parser
  let title = "LangGraph Workflow";
  let description = "Linear pipeline";
  let mermaidCode = "";
  let nodesCount = 0;

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(trimmed, 'text/html');

    // Extract title
    const h1El = doc.querySelector('h1');
    const titleEl = doc.querySelector('title');
    if (h1El && h1El.textContent) {
      title = h1El.textContent.trim();
    } else if (titleEl && titleEl.textContent) {
      title = titleEl.textContent.trim();
    }

    // Extract info / description
    const infoEl = doc.querySelector('.info, p[class*="info"], p');
    if (infoEl && infoEl.textContent) {
      description = infoEl.textContent.trim();
      // Try to parse number of nodes from description text e.g., "4 nodes · linear pipeline"
      const nodesMatch = description.match(/(\d+)\s*nodes?/i);
      if (nodesMatch) {
        nodesCount = parseInt(nodesMatch[1], 10);
      }
    }

    // Extract Mermaid block
    const preMermaid = doc.querySelector('.mermaid, pre.mermaid, div.mermaid');
    if (preMermaid) {
      mermaidCode = preMermaid.textContent || '';
    } else {
      // Fallback: search for text container inside code/pre blocks
      const preEl = doc.querySelector('pre, code');
      if (preEl) {
        mermaidCode = preEl.textContent || '';
      } else {
        // Regex fallback
        const match = trimmed.match(/<pre[^>]*class="mermaid"[^>]*>([\s\S]*?)<\/pre>/i) 
          || trimmed.match(/<div[^>]*class="mermaid"[^>]*>([\s\S]*?)<\/div>/i);
        if (match) {
          mermaidCode = match[1];
        }
      }
    }
  } catch (err) {
    // Robust Regex parser in case DOMParser fails in certain environments
    const titleMatch = trimmed.match(/<h1>(.*?)<\/h1>/i) || trimmed.match(/<title>(.*?)<\/title>/i);
    if (titleMatch) title = titleMatch[1];

    const infoMatch = trimmed.match(/<p[^>]*class="info"[^>]*>(.*?)<\/p>/i) || trimmed.match(/<p>(.*?)<\/p>/i);
    if (infoMatch) description = infoMatch[1];

    const mermaidMatch = trimmed.match(/<pre[^>]*class="mermaid"[^>]*>([\s\S]*?)<\/pre>/i) 
      || trimmed.match(/<div[^>]*class="mermaid"[^>]*>([\s\S]*?)<\/div>/i);
    if (mermaidMatch) {
      mermaidCode = mermaidMatch[1];
    }
  }

  // Cleanup mermaid code
  mermaidCode = decodeEntities(mermaidCode).trim();

  // If we couldn't find nodes count yet, calculate from parsing mermaid arrows
  if (nodesCount === 0 && mermaidCode) {
    const uniqueNodes = new Set<string>();
    const lines = mermaidCode.split('\n');
    lines.forEach(line => {
      const match = line.match(/([a-zA-Z0-9__\-\/]+)(\([^\)]*\))?/g);
      if (match) {
        match.forEach(m => {
          const cleanName = m.replace(/\(.*?\)/g, '').trim();
          if (cleanName && !['graph', 'TD', 'LR', 'BT', 'RL', 'classDef', 'default', 'first', 'last'].includes(cleanName)) {
            uniqueNodes.add(cleanName);
          }
        });
      }
    });
    nodesCount = uniqueNodes.size;
  }

  return {
    title,
    mermaid: mermaidCode,
    description,
    nodesCount
  };
}
