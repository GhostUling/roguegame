import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import path from 'path';
import {defineConfig, type Plugin} from 'vite';

/**
 * Dev-only sink for the in-game runtime trace. The client POSTs JSON lines to
 * `/__trace` and they are appended to debug-trace.log so the trace can be read
 * without screenshots. `apply: 'serve'` keeps it out of the production build.
 */
function traceLogPlugin(): Plugin {
  return {
    name: 'debug-trace-log',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__trace', (req: IncomingMessage, res: ServerResponse) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end();
          return;
        }

        let body = '';
        req.on('data', (chunk) => {
          body += chunk;
          if (body.length > 128 * 1024) req.destroy();
        });
        req.on('end', () => {
          try {
            fs.appendFileSync(path.resolve(__dirname, 'debug-trace.log'), body + '\n');
            res.statusCode = 204;
          } catch {
            res.statusCode = 500;
          }
          res.end();
        });
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), traceLogPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
