const pool = require('../db');

// ── Horarios base ────────────────────────────────────────────────────────────

exports.getSchedules = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM schedules WHERE business_id = ? ORDER BY day_of_week ASC',
      [req.params.businessId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.createSchedule = async (req, res) => {
  const { business_id, day_of_week, start_time, end_time } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO schedules (business_id, day_of_week, start_time, end_time) VALUES (?, ?, ?, ?)',
      [business_id, day_of_week, start_time, end_time]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.updateSchedule = async (req, res) => {
  const { day_of_week, start_time, end_time } = req.body;
  try {
    await pool.query(
      'UPDATE schedules SET day_of_week=?, start_time=?, end_time=? WHERE id=?',
      [day_of_week, start_time, end_time, req.params.id]
    );
    res.json({ message: 'Schedule updated' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.deleteSchedule = async (req, res) => {
  try {
    await pool.query('DELETE FROM schedules WHERE id = ?', [req.params.id]);
    res.json({ message: 'Schedule deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// ── Excepciones ──────────────────────────────────────────────────────────────

exports.getExceptions = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM schedule_exceptions 
       WHERE business_id = ? AND date >= CURDATE()
       ORDER BY date ASC`,
      [req.params.businessId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.createException = async (req, res) => {
  const { business_id, date, is_closed, start_time, end_time, reason } = req.body;
  try {
    // UPSERT — si ya existe una excepción para esa fecha, la reemplaza
    await pool.query(
      `INSERT INTO schedule_exceptions (business_id, date, is_closed, start_time, end_time, reason)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         is_closed = VALUES(is_closed),
         start_time = VALUES(start_time),
         end_time = VALUES(end_time),
         reason = VALUES(reason)`,
      [business_id, date, is_closed ? 1 : 0, is_closed ? null : start_time, is_closed ? null : end_time, reason || null]
    );
    res.status(201).json({ message: 'Exception saved' });
  } catch (err) {
    console.error('createException error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.deleteException = async (req, res) => {
  try {
    await pool.query('DELETE FROM schedule_exceptions WHERE id = ?', [req.params.id]);
    res.json({ message: 'Exception deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};