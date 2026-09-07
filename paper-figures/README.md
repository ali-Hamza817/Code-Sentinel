# CodeSentinel — Interface Capture Set

High-resolution screenshots of the CodeSentinel desktop application (Electron + React)
for use as figures in the research paper.

- **Boot sequence** (`00-startup-*`): 3024 × 1890 px (2× device scale).
- **Module interfaces** (`01`–`12`): 2880 × 1800 px (2× device scale), captured after a
  design-system pass that unified the UI — one page-header pattern, one metric-card and
  panel style, a single blue accent with slate neutrals, calmer typography, and shared
  chart theming across every screen.

## Sample project

Every module screenshot is taken against **Vellum — A High Precision RAG Bot**, a
self-contained sample workspace defined in `src/renderer/src/lib/demo.ts`:

- 47 source files, average cyclomatic complexity 7.8, 214 decision branches
- 20 findings — 2 critical, 4 high, 7 medium, 5 low, 2 info — themed around a
  retrieval-augmented-generation service (prompt injection, unbounded context,
  pickle deserialisation, SSRF in the loader, SQL injection in the metadata filter,
  unauthenticated admin reindex, cache eviction, reranker determinism, PII in logs …)
- A Python file tree (`api/`, `ingestion/`, `embeddings/`, `retrieval/`, `generation/`,
  `eval/`, `core/`, `tests/`) with representative source for the files that carry findings
- Cyclomatic hot-spots (`HybridRetriever.retrieve` CC 26, `PromptBuilder.assemble` CC 21 …)
- Build / eval transcript (`ruff`, `mypy`, `pytest`, golden-set Precision@5 = 0.94)
- Runtime benchmarks: build 18.42 s, cold start 0.94 s, 241 MiB / 628 MiB, FAISS index of
  128,540 vectors
- An AI-review conversation about `prompt_builder.py`

The project store surfaces it as the active workspace whenever `DEMO_MODE` (top of
`demo.ts`) is `true`. It is never written to disk and never overwrites real analysis
results — set `DEMO_MODE = false` to return the app to normal.

## Boot / initialization sequence

| File | Stage shown |
|------|-------------|
| `00-startup-1-hardware-verification.png` | Cold start — "Initializing Core Suite". Hardware Verification running; the rest pending. |
| `00-startup-2-docker-runtime.png` | Hardware verified; Docker Runtime check in progress. |
| `00-startup-3-ai-container-pulse.png` | Hardware + Docker verified; AI Container Pulse provisioning the Ollama runtime. |
| `00-startup-4-llama-model-pull.png` | First three checks complete; Llama 3.2 model being pulled into the sandbox. |

## Module interfaces

| File | Module | What it shows |
|------|--------|---------------|
| `01-dashboard-security-analytics.png` | Dashboard | KPI tiles, vulnerability-distribution donut, AI insight cards, security summary. |
| `02-repository-project-intake.png` | Repository | Workspace orchestrator — repo connect, single-file audit, project ledger. |
| `03-static-analysis-code-scanning.png` | Static Analysis | Python file tree, `prompt_builder.py` source, per-file findings with fix guidance. |
| `04-dynamic-analysis-sandbox-execution.png` | Dynamic Analysis | Build / startup / CPU / uptime, Docker engine log, memory allocation, performance summary. |
| `05-vulnerabilities-findings-register.png` | Vulnerabilities | Security registry — critical / AI-reasoning / total counts, audit trail. |
| `06-complexity-metrics-engine.png` | Complexity | Avg complexity, branching-trend area chart, cyclomatic hot-spot list, refactor advice. |
| `07-ai-review-llama3-reasoning.png` | AI Review | AI Architect chat — a review of `prompt_builder.py` (quick / deep-audit modes). |
| `08-build-ci-pipeline.png` | Build & CI | Pipeline orchestrator — build tool, cycle duration, state, live build/eval stream. |
| `09-container-insights-runtime.png` | Container Insights | Severity-distribution bar chart, top vulnerable files, recent findings. |
| `10-risk-scoring-model.png` | Risk Scoring | Project health index gauge, component breakdown, AI reasoning summary. |
| `11-reports-pdf-export.png` | Reports | Archival summary, AI reasoning ledger, finding ledger, PDF export. |
| `12-settings-configuration.png` | Settings | Privacy & security toggles, Docker and AI-model configuration. |

## Notes

- Captured via the Chrome DevTools Protocol against the running Electron renderer, so images
  are clean window content with no OS chrome or background applications.
- Panels that would otherwise be empty before a run render representative placeholder content
  from `demo.ts`; it is shown only when no real analysis data is present.
