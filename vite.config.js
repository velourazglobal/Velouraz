import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import fs from 'fs';
import path from 'path';

function apiDevServerPlugin(env) {
  // Inject loaded environment variables into process.env so API handlers can access SMTP credentials
  Object.assign(process.env, env);

  const routeAliases = {
    '/api/create-razorpay-order': { file: 'create-order.js' },
    '/api/order-status': { file: 'verify-payment.js' },
    '/api/send-otp': { file: 'otp.js', query: { action: 'send' } },
    '/api/verify-otp': { file: 'otp.js', query: { action: 'verify' } },
    '/api/send-order-email': { file: 'send-email.js', query: { type: 'order' } },
    '/api/send-admin-credentials': { file: 'send-email.js', query: { type: 'admin' } },
    '/api/cloudinary/delete': { file: 'cloudinary-delete.js' },
  };

  return {
    name: 'api-dev-server',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url && req.url.startsWith('/api/')) {
          const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
          const urlPath = parsedUrl.pathname;
          
          let targetFile = null;
          if (routeAliases[urlPath]) {
            targetFile = routeAliases[urlPath].file;
            if (routeAliases[urlPath].query) {
              Object.entries(routeAliases[urlPath].query).forEach(([k, v]) => {
                if (!parsedUrl.searchParams.has(k)) parsedUrl.searchParams.set(k, v);
              });
            }
          } else {
            const relativePath = urlPath.replace(/^\/api\//, '');
            targetFile = `${relativePath}.js`;
          }

          const jsFilePath = path.resolve(process.cwd(), 'api', targetFile);

          if (fs.existsSync(jsFilePath)) {
            try {
              let rawBody = '';
              req.on('data', chunk => { rawBody += chunk; });
              req.on('end', async () => {
                req.rawBody = rawBody;
                req.body = rawBody;
                req.query = Object.fromEntries(parsedUrl.searchParams);
                if (!res.json) {
                  res.json = (data) => {
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify(data));
                  };
                }
                if (!res.status) {
                  res.status = (code) => {
                    res.statusCode = code;
                    return res;
                  };
                }
                try {
                  const mod = await server.ssrLoadModule(`./api/${targetFile}`);
                  const handler = mod.default || mod;
                  await handler(req, res);
                } catch (handlerErr) {
                  console.error(`[API Dev Server Error] ${req.url}:`, handlerErr);
                  if (!res.headersSent) {
                    res.status(500).json({ error: handlerErr.message });
                  }
                }
              });
              return;
            } catch (err) {
              console.error(`[API Dev Server Middleware Error] ${req.url}:`, err);
            }
          }
        }
        next();
      });
    }
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), tailwindcss(), apiDevServerPlugin(env)],
  };
});
