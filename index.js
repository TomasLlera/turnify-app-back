const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./src/routes/auth');
const businessRoutes = require('./src/routes/business');
const serviceRoutes = require('./src/routes/services');
const scheduleRoutes = require('./src/routes/schedules');
const appointmentRoutes = require('./src/routes/appointments');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/business', businessRoutes);
app.use('/services', serviceRoutes);
app.use('/schedules', scheduleRoutes);
app.use('/appointments', appointmentRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));