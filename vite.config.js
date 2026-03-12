import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { spawn, exec }  from 'child_process';
import { resolve }      from 'path';

let pbProcess = null;

function pbControlPlugin() {
  return {
    name: 'pb-control',
    configureServer(server) {
      server.middlewares.use('/pb-control', (req, res) => {
        res.setHeader('Content-Type', 'application/json');

        if (req.url === '/start' && req.method === 'POST') {
          if (pbProcess) {
            res.end(JSON.stringify({ ok: true, msg: 'already running' }));
            return;
          }
          try {
            const pbBin = resolve('./pb_server/pocketbase');
            pbProcess = spawn(pbBin, [
              'serve',
              '--dir',           resolve('./pb_data'),
              '--migrationsDir', resolve('./pb_migrations'),
              '--hooksDir',      resolve('./pb_hooks'),
            ]);
            pbProcess.on('exit', () => { pbProcess = null; });
            res.end(JSON.stringify({ ok: true }));
          } catch (e) {
            res.statusCode = 500;
            res.end(JSON.stringify({ ok: false, msg: e.message }));
          }

        } else if (req.url === '/stop' && req.method === 'POST') {
          exec("lsof -ti :8090 | xargs kill -9 2>/dev/null; echo done", () => {
            pbProcess = null;
            res.end(JSON.stringify({ ok: true }));
          });

        } else {
          res.statusCode = 404;
          res.end(JSON.stringify({ ok: false }));
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), pbControlPlugin()],
  server: {
    port: 3000,
    // Proxy les appels /api vers PocketBase en dev
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8090',
        changeOrigin: true,
      },
      '/_': {
        target: 'http://127.0.0.1:8090',
        changeOrigin: true,
      },
    },
  },
});
