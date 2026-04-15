const pool = require('../db');

exports.getBusiness = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM businesses WHERE admin_id = ?',
      [req.userId]
    );
    res.json(rows[0] || null);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getBusinessById = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM businesses WHERE id = ?',
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Business not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.createBusiness = async (req, res) => {
  const { name, description, address, phone, photo_url, primary_color, secondary_color } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO businesses (admin_id, name, description, address, phone, photo_url, primary_color, secondary_color) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [req.userId, name, description, address, phone, photo_url, primary_color || '#3B82F6', secondary_color || '#1E40AF']
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.updateBusiness = async (req, res) => {
  const { name, description, address, phone, photo_url, primary_color, secondary_color } = req.body;
  try {
    await pool.query(
      'UPDATE businesses SET name=?, description=?, address=?, phone=?, photo_url=?, primary_color=?, secondary_color=? WHERE admin_id=?',
      [name, description, address, phone, photo_url, primary_color, secondary_color, req.userId]
    );
    res.json({ message: 'Business updated' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};