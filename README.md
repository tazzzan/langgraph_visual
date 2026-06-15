# LangGraph Visualizer 🚀

An interactive, high-fidelity utility to retrieve, parse, and visualize **LangGraph** workflow diagrams from HTML output snippets, custom server endpoints, or raw Mermaid.js specifications.

---

## 🎨 Technology Stack

- **Frontend:** React 19, Vite, Tailwind CSS v4, Motion (formerly framer-motion), Lucide Icons
- **Workflow Rendering Engine:** Mermaid.js Core
- **Backend Server:** Node.js, Express, tsx, esbuild (for lightweight Node compile/bundling to CJS)
- **Containerization:** Docker, Docker Compose (multi-stage non-root optimized image)

---

## 📋 Prerequisites

Before running the application, make sure you have the following installed on your machine:

- **Node.js** (v22.x recommended)
- **npm** (v10.x or newer)
- **Docker** & **Docker Compose** (for containerized environments)

---

## ⚙️ Environment Configuration

The application references target credentials and settings from an environment file.

1. Copy the `.env.example` configuration file to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Open the newly created `.env` file and define any variables, such as:
   ```env
   NODE_ENV=development
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

---

## 🚀 Running Locally (with Node.js)

Follow these steps to build and run the system natively:

### 1. Install Dependencies
Restore all packages cleanly using the exact project lockfile:
```bash
npm ci
```

### 2. Live Development Server
Launch the full-stack server using `tsx`. The server boots on port `3000` with the Vite HMR asset-serving client active:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Production Compilation & Build
To bundle the frontend application assets and compile the Express server code into a self-contained production bundle, run:
```bash
npm run build
```
This produces all compiled output in the `/dist` listing and bundles `server.ts` into a fast, portable CommonJS format (`dist/server.cjs`) using `esbuild`.

### 4. Running Production Bundle
Start the compiled standalone node instance on port `3050` or standard container layout:
```bash
npm start
```

---

## 🐳 Running with Docker & Docker Compose

For seamless environment management, spin up the visualizer utilizing Docker containers.

### Setup and Start Containers

To automatically build the lightweight alpine environment and start the service in daemon mode:
```bash
docker compose up --build -d
```

Once running successfully, the container map hooks port `3000` from your host to the server running inside the container:
- **Visualizer Landing Page:** Browse [http://localhost:3000](http://localhost:3000)

### Monitor Logs
Keep track of live backend sync fetches or general pipeline latency indicators:
```bash
docker compose logs -f
```

### Stopping Environment
To spin down containers without destroying cache elements:
```bash
docker compose down
```

---

## 🛠️ Main Features Guide

### 1. Direct Text Paste
Click on **"Paste Mermaid"** in the header or use the **"Direct Paste Input"** sidebar text area. Insert a Mermaid workflow string (e.g., `graph TD` flow charts) to render elements instantly on the live canvas.

### 2. Endpoints Registry (Servers Sync)
Register recurring internal servers (e.g., development agent backend at `http://localhost:8000/graph`). Type the URI into the endpoint selector and hit Enter to pull live graphs over active pipelines with auto-refresh states.

### 3. Integrated Demos
Select any predefined pipeline flow from the **"Explore presets templates"** sidebar module (e.g., *Adaptive RAG Pattern* or *Routing Workflow*) to view canvas orchestration layouts, zooming, and pan mechanics.
