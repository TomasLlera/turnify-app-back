const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host:     process.env.DB_HOST,
  port:     process.env.DB_PORT,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  // Filess (hosting gratuito) limita a 5 conexiones totales de la cuenta.
  // Con 2 evitamos saturar el límite aunque haya varias requests simultáneas.
  connectionLimit: 2,

  // Las requests que lleguen mientras las 2 conexiones están ocupadas
  // esperan en cola en lugar de tirar error inmediatamente.
  waitForConnections: true,
  queueLimit: 0,
  connectTimeout: 10000,
});

module.exports = pool;