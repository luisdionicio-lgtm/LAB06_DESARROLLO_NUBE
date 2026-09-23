const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (error) => {
  console.error('Error inesperado en PostgreSQL:', error.message);
});

async function probarConexion() {
  const resultado = await pool.query('SELECT NOW() AS ahora');
  return resultado.rows[0].ahora;
}

module.exports = { pool, probarConexion };

