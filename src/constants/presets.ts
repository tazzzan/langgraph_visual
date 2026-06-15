export interface PresetGraph {
  name: string;
  source: string;
  description: string;
}

export const PRESETS: PresetGraph[] = [
  {
    name: "Linear Research Pipeline (Default)",
    description: "4 Nodes · Short pipeline with linear layout defs",
    source: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>Workflow Graph</title>
<script src="https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js"></script>
<style>
  body { background:#111; color:#ddd; font-family:sans-serif; padding:20px; }
  .mermaid { background:#1a1a2e; padding:20px; border-radius:8px; }
  h1 { margin-bottom:10px; }
  .info { color:#888; font-size:14px; }
</style></head>
<body>
<h1>LangGraph Workflow</h1>
<p class="info">4 nodes · linear pipeline · memory: session‑based</p>
<pre class="mermaid">
---
config:
  flowchart:
    curve: linear
---
graph TD;
	__start__(<p>__start__</p>)
	retrieve_history(retrieve_history)
	research_job(research_job)
	research_candidate(research_candidate)
	classify_intent(classify_intent)
	generate_response(generate_response)
	__end__(<p>__end__</p>)
	__start__ --> retrieve_history;
	retrieve_history --> __end__;
	classDef default fill:#f2f0ff,line-height:1.2
	classDef first fill-opacity:0
	classDef last fill:#bfb6fc

</pre>
</body></html>`
  },
  {
    name: "Adaptive RAG (Retrieval-Augmented Generation)",
    description: "Multi-Route Router with Fallback Loops and Document Grading Evaluator",
    source: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>Adaptive RAG Graph</title></head>
<body>
<h1>Self-Corrective RAG Pipeline</h1>
<p class="info">6 nodes · conditional routing · fallback loops</p>
<pre class="mermaid">
graph TD;
    __start__(__start__) --> route_question{route_question}
    
    route_question -->|web_search| web_search_node(web_search)
    route_question -->|vectorstore| retrieve_node(retrieve)
    
    web_search_node --> grade_docs_node(grade_documents)
    retrieve_node --> grade_docs_node
    
    grade_docs_node --> decision_grade{does_doc_match}
    
    decision_grade -->|yes| generate_node(generate_answer)
    decision_grade -->|no| transform_query_node(transform_query)
    
    transform_query_node --> retrieve_node
    
    generate_node --> grade_generation{is_hallucination}
    
    grade_generation -->|no| __end__(__end__)
    grade_generation -->|yes| generate_node
    
    style __start__ fill:#3b82f6,color:#fff,stroke:#1d4ed8
    style __end__ fill:#ef4444,color:#fff,stroke:#b91c1c
    style route_question fill:#8b5cf6,color:#fff
    style decision_grade fill:#8b5cf6,color:#fff
    style grade_generation fill:#8b5cf6,color:#fff
</pre>
</body></html>`
  },
  {
    name: "Agentic Search Coordinator",
    description: "Two-Layer Master-Worker Orchestrator with parallel jobs",
    source: `<h1>Coordinator Multi-Agent Pattern</h1>
<p class="info">Parallel supervisor controller</p>
<pre class="mermaid">
graph TD;
    __start__(__start__) --> supervisor(supervisor_agent)
    
    supervisor -->|delegate_research| research_agent(researcher)
    supervisor -->|delegate_coding| billing_agent(coder_bot)
    
    research_agent --> compile_results(compile_results)
    billing_agent --> compile_results
    
    compile_results --> check_quality{meets_specs}
    
    check_quality -->|failed| supervisor
    check_quality -->|passed| format_output(format_report)
    
    format_output --> __end__(__end__)
    
    style supervisor fill:#ec4899,color:#fff
    style check_quality fill:#eab308,color:#333
</pre>`
  }
];
