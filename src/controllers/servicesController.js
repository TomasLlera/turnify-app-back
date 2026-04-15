const pool = require('../db');

exports.getServices = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM services WHERE business_id = ? AND active = true',
      [req.params.businessId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.createService = async (req, res) => {
  const { business_id, name, duration_minutes, price } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO services (business_id, name, duration_minutes, price) VALUES (?, ?, ?, ?)',
      [business_id, name, duration_minutes, price]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.updateService = async (req, res) => {
  const { name, duration_minutes, price, active } = req.body;
  try {
    await pool.query(
      'UPDATE services SET name=?, duration_minutes=?, price=?, active=? WHERE id=? ',
      [name, duration_minutes, price, active, req.params.id]
    );
    res.json({ message: 'Service updated' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.deleteService = async (req, res) => {
  try {
    await pool.query('DELETE FROM services WHERE id = ?', [req.params.id]);
    res.json({ message: 'Service deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};