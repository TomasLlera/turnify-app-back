const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes       = require('./src/routes/auth');
const businessRoutes   = require('./src/routes/business');
const serviceRoutes    = require('./src/routes/services');
const scheduleRoutes   = require('./src/routes/schedules');
const appointmentRoutes = require('./src/routes/appointments');
const employeeRoutes   = require('./src/routes/employees');
const financeRoutes    = require('./src/routes/finances');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/auth',         authRoutes);
app.use('/business',     businessRoutes);
app.use('/services',     serviceRoutes);
app.use('/schedules',    scheduleRoutes);
app.use('/appointments', appointmentRoutes);
app.use('/employees',    employeeRoutes);
app.use('/finances',     financeRoutes);

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Cerrar servidor y pool limpiamente — evita conexiones zombie en Filess
const pool = require('./src/db');
const shutdown = async () => {
  console.log('Closing server...');
  server.close(async () => {
    await pool.end();
    console.log('Pool closed.');
    process.exit(0);
  });
};
process.on('SIGINT',  shutdown);
process.on('SIGTERM', shutdown);