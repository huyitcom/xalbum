import { app } from './api-server.ts';
import path from 'path';
import fs from 'fs';
import express from 'express';

async function startServer() {
  const PORT = 3000;

  // Resolve distPath whether running as tsx (from root) or compiled in dist/server.cjs
  const distPath = (typeof __dirname !== 'undefined' && fs.existsSync(path.join(__dirname, 'index.html')))
    ? __dirname
    : path.join(process.cwd(), 'dist');

  // Detect if running the compiled bundle in dist/ or explicitly in production
  const isCompiledBundle = (typeof __filename !== 'undefined' && __filename.includes('dist')) ||
                           (typeof __dirname !== 'undefined' && __dirname.includes('dist'));
  const isProduction = process.env.NODE_ENV === 'production' || isCompiledBundle;

  if (isProduction) {
    process.env.NODE_ENV = 'production';
  }

  if (!isProduction && !process.env.VERCEL) {
    // Development mode: attach Vite middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR === 'true' ? false : undefined,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else if (!process.env.VERCEL) {
    // Production mode: serve pre-built static assets
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send('Application build not found.');
      }
    });
  }

  if (!process.env.VERCEL) {
    // Primary listener on port 3000 (required by AI Studio proxy & dev environment)
    const primaryServer = app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server successfully listening on http://0.0.0.0:${PORT} (isProduction: ${isProduction})`);
    });

    primaryServer.on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`Port ${PORT} is already in use, continuing.`);
      } else {
        console.error(`Error on port ${PORT}:`, err);
      }
    });
  }
}

startServer();
export { app };
export default app;
