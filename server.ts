import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Proxy route to fetch remote graph endpoints
  app.get("/api/proxy-graph", async (req, res) => {
    const targetUrl = req.query.url as string;
    if (!targetUrl) {
      return res.status(400).json({ error: "URL is required" });
    }

    try {
      let urlStr = targetUrl.trim();
      if (!/^https?:\/\//i.test(urlStr)) {
        urlStr = "http://" + urlStr;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const response = await fetch(urlStr, {
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) LangGraph-Visualizer/1.0"
        }
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        return res.status(response.status).json({
          error: `HTTP Error ${response.status}: Failed to retrieve graph data.`,
        });
      }

      const text = await response.text();
      res.json({ content: text });
    } catch (error: any) {
      const errorMessage = error.name === 'AbortError' 
        ? "Request timed out after 10 seconds" 
        : error.message || "Failed to contact the remote endpoint";
      res.status(500).json({ error: errorMessage });
    }
  });

  // Serve static UI assets and handle dev/prod builds
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
