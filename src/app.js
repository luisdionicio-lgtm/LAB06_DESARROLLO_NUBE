require('dotenv').config();

const express = require('express');
const path = require('path');
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
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use('/docs', express.static(path.join(__dirname, '..', 'docs')));

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
