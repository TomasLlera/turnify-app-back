const pool = require('../db');

exports.getServices = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM services WHERE business_id = ? AND active = true',
      [req.params.businessId]
    );
    res.json(rows);
  } catch (err) {
    console.error('getServices error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.createService = async (req, res) => {
  const { business_id, name, duration_minutes, price } = req.body;

  if (!business_id || !name || !duration_minutes || price === undefined) {
    return res.status(400).json({ error: 'Missing required fields: business_id, name, duration_minutes, price' });
  }

  try {
    const [result] = await pool.query(
      // active = true explícito para no depender del DEFAULT de la tabla
      'INSERT INTO services (business_id, name, duration_minutes, price, active) VALUES (?, ?, ?, ?, true)',
      [business_id, name, duration_minutes, price]
    );
    res.status(201).json({ id: result.insertId, business_id, name, duration_minutes, price });
  } catch (err) {
    console.error('createService error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.updateService = async (req, res) => {
  const { name, duration_minutes, price, active } = req.body;
  try {
    await pool.query(
      'UPDATE services SET name=?, duration_minutes=?, price=?, active=? WHERE id=?',
      [name, duration_minutes, price, active ?? true, req.params.id]
    );
    res.json({ message: 'Service updated' });
  } catch (err) {
    console.error('updateService error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.deleteService = async (req, res) => {
  try {
    // Soft delete para no romper appointments existentes que referencian este servicio
    await pool.query('UPDATE services SET active = false WHERE id = ?', [req.params.id]);
    res.json({ message: 'Service deleted' });
  } catch (err) {
    console.error('deleteService error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};