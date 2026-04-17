const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host:            process.env.DB_HOST,
  port:            process.env.DB_PORT,
  user:            process.env.DB_USER,
  password:        process.env.DB_PASSWORD,
  database:        process.env.DB_NAME,
  connectionLimit: 2,
  waitForConnections: true,
  queueLimit:      0,
  connectTimeout:  10000,
  // Cierra conexiones idle después de 30s para liberar el límite de Filess
  idleTimeout:     30000,
  maxIdle:         1,
});

// Cerrar el pool limpiamente al apagar el servidor
// Esto evita conexiones "zombie" en Filess al reiniciar con nodemon
process.on('SIGINT',  () => pool.end().then(() => process.exit(0)));
process.on('SIGTERM', () => pool.end().then(() => process.exit(0)));

module.exports = pool;