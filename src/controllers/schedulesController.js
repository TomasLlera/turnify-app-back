const pool = require('../db');

exports.getSchedules = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM schedules WHERE business_id = ?',
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