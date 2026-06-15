# Changelog & Version History 📌

All major iterations, feature extensions, and deployment releases of the **LangGraph Visualizer** are tracked here.

---

## 🚀 [v1.4.2] - 2026-06-15 (Stable Release)
### Added
- **Docker Compose Integration:** Added an optimized, lightweight multi-stage `Dockerfile` and `docker-compose.yml` configurations for simple development and production staging environments.
- **Dockerignore Rules:** Created `.dockerignore` to streamline Docker builds, excluding high-volume local noise, assets cache, and build items.
- **Project Documentation:** Compiled comprehensive `README.md` and `VERSIONS.md` files guiding engineers upon local runtimes and backend syncing routines.

### Changed
- Refined primary dark theme UI highlights with sleek ocean blue styling, glowing HUD session indicators in sidebar, and a live core status bar on the footer layout.

---

## 🔄 [v1.3.0] - 2026-05-18
### Added
- **Live Server Endpoint Registry:** Implemented persistence layers for developer target backend server nodes (with title-checking label tags, custom URL endpoints, and fast deletion nodes).
- **Direct Global Paste Portal:** Embedded an intuitive quick-trigger paste prompt accessible from the navigation header.
- **Sleek Layout Navigation Sidebar:** Embedded a responsive slider drawer that isolates complex configuration settings cleanly from the main canvas viewport.

### Changed
- Upgraded UI interactions to support smooth framer-motion slide alignments for both desktop rails and mobile menus.

---

## 🛠️ [v1.1.0] - 2026-04-09
### Added
- **Preset Catalogs:** Provided built-in diagram templates highlighting advanced multi-agent orchestrations:
  - Adaptive RAG Pattern (Sequential retrieval paths)
  - Standard Routing Flow (Conditional edges & node decision logic)
- **Local Diagram Archives:** Built automated client-side history saving with quick-activation sidebar rows indicating node counts and time-stamped visual tags.

---

## 🌱 [v1.0.0] - 2026-03-01
### Added
- **Core Workspace Canvas:** Enabled interactive workspace panels matching state toggles between:
  - **Visualize View:** Pan, zoom, and fit-view controls for rendered Mermaid flowchart units.
  - **Code View:** Source code highlight viewer for quick audits.
  - **Raw Source View:** Native HTML layout inspector.
- **Mermaid.js Core Integration:** Configured baseline tokenization logic resolving structured output formats cleanly into high-contrast pipeline cards.
