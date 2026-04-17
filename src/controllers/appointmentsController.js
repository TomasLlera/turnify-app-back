const pool = require('../db');

// Slots filtrados por empleado — si se pasa employeeId, solo considera los turnos de ese empleado
exports.getAvailableSlots = async (req, res) => {
  const { businessId, date, serviceId, employeeId } = req.query;
  try {
    const dayOfWeek = new Date(date + 'T00:00:00').getDay();

    const [schedules] = await pool.query(
      'SELECT * FROM schedules WHERE business_id = ? AND day_of_week = ?',
      [businessId, dayOfWeek]
    );
    if (!schedules[0]) return res.json([]);

    const [service] = await pool.query('SELECT * FROM services WHERE id = ?', [serviceId]);
    if (!service[0]) return res.status(404).json({ error: 'Service not found' });

    const duration = service[0].duration_minutes;
    const { start_time, end_time } = schedules[0];

    // Si hay empleado seleccionado → solo bloquear slots ocupados POR ESE empleado
    // Si no hay empleado → comportamiento original (bloquear cualquier ocupado del negocio)
    let appointmentsQuery, appointmentsParams;
    if (employeeId) {
      appointmentsQuery = `SELECT start_time, end_time FROM appointments 
        WHERE business_id = ? AND date = ? AND status != 'cancelled' AND employee_id = ?`;
      appointmentsParams = [businessId, date, employeeId];
    } else {
      appointmentsQuery = `SELECT start_time, end_time FROM appointments 
        WHERE business_id = ? AND date = ? AND status != 'cancelled'`;
      appointmentsParams = [businessId, date];
    }

    const [appointments] = await pool.query(appointmentsQuery, appointmentsParams);

    const slots = [];
    let current = start_time;
    while (addMinutes(current, duration) <= end_time) {
      const slotEnd = addMinutes(current, duration);
      const isTaken = appointments.some(a => a.start_time < slotEnd && a.end_time > current);
      if (!isTaken) slots.push({ start: current, end: slotEnd });
      current = slotEnd;
    }
    res.json(slots);
  } catch (err) {
    console.error('getAvailableSlots error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

function addMinutes(time, minutes) {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + minutes;
  const hh = String(Math.floor(total / 60)).padStart(2, '0');
  const mm = String(total % 60).padStart(2, '0');
  return `${hh}:${mm}`;
}

exports.getAppointments = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT a.*, s.name as service_name, s.price,
              e.name as employee_name
       FROM appointments a
       JOIN services s ON a.service_id = s.id
       LEFT JOIN employees e ON a.employee_id = e.id
       WHERE a.business_id = ?
       ORDER BY a.date DESC, a.start_time ASC`,
      [req.params.businessId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.createAppointment = async (req, res) => {
  const {
    business_id, service_id, employee_id,
    client_name, client_email, client_phone, client_dni,
    date, start_time, end_time, notes,
  } = req.body;

  try {
    // Verificar conflicto — si hay empleado, solo verificar conflictos de ese empleado
    let conflictQuery, conflictParams;
    if (employee_id) {
      conflictQuery = `SELECT id FROM appointments 
        WHERE business_id = ? AND date = ? AND status != 'cancelled'
        AND employee_id = ? AND start_time < ? AND end_time > ?`;
      conflictParams = [business_id, date, employee_id, end_time, start_time];
    } else {
      conflictQuery = `SELECT id FROM appointments 
        WHERE business_id = ? AND date = ? AND status != 'cancelled'
        AND employee_id IS NULL AND start_time < ? AND end_time > ?`;
      conflictParams = [business_id, date, end_time, start_time];
    }

    const [conflict] = await pool.query(conflictQuery, conflictParams);
    if (conflict.length > 0) return res.status(409).json({ error: 'Time slot already taken' });

    const [result] = await pool.query(
      `INSERT INTO appointments 
       (business_id, service_id, employee_id, client_id, client_name, client_email, client_phone, client_dni, date, start_time, end_time, notes) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [business_id, service_id, employee_id || null, req.userId || null,
       client_name, client_email, client_phone, client_dni,
       date, start_time, end_time, notes]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    console.error('createAppointment error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.updateAppointmentStatus = async (req, res) => {
  const { status } = req.body;
  const appointmentId = req.params.id;

  try {
    const [rows] = await pool.query(
      `SELECT a.*, s.price, s.name as service_name,
              e.commission_rate, e.name as employee_name
       FROM appointments a
       JOIN services s ON a.service_id = s.id
       LEFT JOIN employees e ON a.employee_id = e.id
       WHERE a.id = ?`,
      [appointmentId]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Appointment not found' });

    const appt = rows[0];
    const prevStatus = appt.status;

    await pool.query('UPDATE appointments SET status = ? WHERE id = ?', [status, appointmentId]);

    // Turno completado → registrar ingreso en finances + comisión automática al empleado
    if (status === 'completed' && prevStatus !== 'completed') {
      // 1. Ingreso en finances
      const incomeDesc = `Appointment: ${appt.service_name} — ${appt.client_name}`;
      await pool.query(
        'INSERT INTO finances (business_id, type, amount, description, date) VALUES (?, ?, ?, ?, ?)',
        [appt.business_id, 'income', appt.price, incomeDesc, appt.date]
      );

      // 2. Comisión automática si el turno tiene empleado asignado con commission_rate > 0
      if (appt.employee_id && appt.commission_rate > 0) {
        const commissionAmount = Number(
          ((appt.price * appt.commission_rate) / 100).toFixed(2)
        );
        await pool.query(
          'INSERT INTO commissions (employee_id, appointment_id, amount) VALUES (?, ?, ?)',
          [appt.employee_id, appointmentId, commissionAmount]
        );
      }
    }

    // Si se revierte desde completed → eliminar ingreso y comisión automáticos
    if (prevStatus === 'completed' && status !== 'completed') {
      const incomeDesc = `Appointment: ${appt.service_name} — ${appt.client_name}`;
      await pool.query(
        `DELETE FROM finances WHERE business_id = ? AND type = 'income' 
         AND description = ? AND date = ? ORDER BY id DESC LIMIT 1`,
        [appt.business_id, incomeDesc, appt.date]
      );
      if (appt.employee_id) {
        await pool.query(
          'DELETE FROM commissions WHERE appointment_id = ? ORDER BY id DESC LIMIT 1',
          [appointmentId]
        );
      }
    }

    res.json({ message: 'Appointment updated' });
  } catch (err) {
    console.error('updateAppointmentStatus error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getStats = async (req, res) => {
  const { businessId } = req.params;
  try {
    const [daily] = await pool.query(
      `SELECT DATE(date) as day, COUNT(*) as total, SUM(s.price) as revenue
       FROM appointments a
       JOIN services s ON a.service_id = s.id
       WHERE a.business_id = ? AND a.status = 'completed'
       AND date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
       GROUP BY DATE(date) ORDER BY day ASC`,
      [businessId]
    );
    const [monthly] = await pool.query(
      `SELECT MONTH(date) as month, YEAR(date) as year,
       COUNT(*) as total, SUM(s.price) as revenue
       FROM appointments a
       JOIN services s ON a.service_id = s.id
       WHERE a.business_id = ? AND a.status = 'completed'
       GROUP BY YEAR(date), MONTH(date) ORDER BY year ASC, month ASC`,
      [businessId]
    );
    res.json({ daily, monthly });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getByDni = async (req, res) => {
  const { dni } = req.params;
  try {
    const [rows] = await pool.query(
      `SELECT a.*, s.name as service_name, s.price, b.name as business_name,
              e.name as employee_name
       FROM appointments a
       JOIN services s ON a.service_id = s.id
       JOIN businesses b ON a.business_id = b.id
       LEFT JOIN employees e ON a.employee_id = e.id
       WHERE a.client_dni = ? AND a.status = 'pending'
       ORDER BY a.date ASC, a.start_time ASC`,
      [dni]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.cancelByClient = async (req, res) => {
  const { id } = req.params;
  const { dni } = req.body;
  try {
    const [rows] = await pool.query(
      'SELECT * FROM appointments WHERE id = ? AND client_dni = ?',
      [id, dni]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Appointment not found' });
    await pool.query('UPDATE appointments SET status = ? WHERE id = ?', ['cancelled', id]);
    res.json({ message: 'Appointment cancelled' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};