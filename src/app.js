require('dotenv').config();

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { probarConexion, pool } = require('./config/db');
const authRoutes = require('./routes/auth.routes');
const usuarioRoutes = require('./routes/usuario.routes');
const documentoRoutes = require('./routes/documento.routes');
const auditoriaRoutes = require('./routes/auditoria.routes');
const { rutaNoEncontrada, manejarError } = require('./middleware/error.middleware');

if (!process.env.JWT_SECRET || !process.env.DB_HOST || !process.env.DB_NAME) {
  throw new Error('Faltan variables de entorno obligatorias');
}

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(cors());
app.use(express.json({ limit: '100kb' }));
app.use(morgan(process.env.NODE_ENV === 'test' ? 'tiny' : 'combined'));

app.get('/', (req, res) => {
  res.type('html').send(`<!doctype html>
  <html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>SecureDocs API</title><style>
  :root{color-scheme:dark}*{box-sizing:border-box}body{margin:0;font:16px system-ui;background:#07111f;color:#dce8f5;min-height:100vh;display:grid;place-items:center}
  main{width:min(760px,92vw);padding:48px;border:1px solid #27415e;border-radius:22px;background:linear-gradient(145deg,#0d2036,#0a1727);box-shadow:0 30px 80px #0008}
  .tag{color:#55d6be;font-weight:700;letter-spacing:.12em;text-transform:uppercase;font-size:.78rem}h1{font-size:clamp(2.5rem,7vw,5rem);margin:.2em 0}.lead{color:#9fb2c8;font-size:1.15rem;line-height:1.7}
  .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px;margin-top:30px}.card{padding:18px;border-radius:14px;background:#112b46;border:1px solid #234766}.card b{color:#fff;display:block;margin-bottom:6px}code{color:#7ee3cf}
  </style></head><body><main><div class="tag">Cloud Security Laboratory</div><h1>SecureDocs</h1>
  <p class="lead">API REST para documentos empresariales con autenticacion JWT, permisos RBAC, politicas ABAC centralizadas y trazabilidad completa.</p>
  <section class="grid"><div class="card"><b>Estado</b><code>GET /health</code></div><div class="card"><b>Autenticacion</b><code>POST /auth/login</code></div><div class="card"><b>Documentos</b><code>/documentos</code></div></section></main></body></html>`);
});

app.get('/health', async (req, res, next) => {
  try {
    const databaseTime = await probarConexion();
    res.json({ status: 'ok', service: 'securedocs-api', database: 'connected', databaseTime });
  } catch (error) {
    next(error);
  }
});

app.use('/auth', authRoutes);
app.use('/usuarios', usuarioRoutes);
app.use('/documentos', documentoRoutes);
app.use('/auditoria', auditoriaRoutes);
app.use(rutaNoEncontrada);
app.use(manejarError);

const port = Number(process.env.PORT || 3000);
let server;

async function iniciar() {
  await probarConexion();
  server = app.listen(port, () => console.log(`SecureDocs disponible en http://localhost:${port}`));
}

async function cerrar(signal) {
  console.log(`${signal}: cerrando SecureDocs`);
  if (server) await new Promise((resolve) => server.close(resolve));
  await pool.end();
  process.exit(0);
}

if (require.main === module) {
  iniciar().catch((error) => {
    console.error('No se pudo iniciar SecureDocs:', error.message);
    process.exit(1);
  });
  process.on('SIGTERM', () => cerrar('SIGTERM'));
  process.on('SIGINT', () => cerrar('SIGINT'));
}

module.exports = app;

