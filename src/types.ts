export interface SavedServer {
  id: string;
  name: string;
  url: string;
  createdAt: string;
}

export interface WorkflowGraph {
  id: string;
  title: string;
  mermaidCode: string;
  nodesCount?: number;
  description?: string;
  pastedAt: string;
  source: 'paste' | 'url';
  sourceUrl?: string;
}

export interface ParsedGraphResult {
  title: string;
  mermaid: string;
  description: string;
  nodesCount: number;
}
