const pool = require('../db');

exports.getFinances = async (req, res) => {
  const { businessId } = req.params;
  const { month, year } = req.query;
  try {
    let query = `SELECT * FROM finances WHERE business_id = ?`;
    const params = [businessId];

    if (month && year) {
      query += ` AND MONTH(date) = ? AND YEAR(date) = ?`;
      params.push(month, year);
    }

    query += ` ORDER BY date ASC`;

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error('getFinances error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.createFinance = async (req, res) => {
  const { business_id, type, amount, description, date } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO finances (business_id, type, amount, description, date) VALUES (?, ?, ?, ?, ?)',
      [business_id, type, amount, description, date]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    console.error('createFinance error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.deleteFinance = async (req, res) => {
  try {
    await pool.query('DELETE FROM finances WHERE id = ?', [req.params.id]);
    res.json({ message: 'Finance record deleted' });
  } catch (err) {
    console.error('deleteFinance error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getFinanceSummary = async (req, res) => {
  const { businessId } = req.params;
  const { month, year } = req.query;
  try {
    const params = [businessId, businessId];
    let dateFilter = '';

    if (month && year) {
      dateFilter = `AND MONTH(date) = ${pool.escape(month)} AND YEAR(date) = ${pool.escape(year)}`;
    }

    const [rows] = await pool.query(
      `SELECT 
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expense
       FROM finances 
       WHERE business_id = ? ${dateFilter}`,
      [businessId]
    );

    const [daily] = await pool.query(
      `SELECT date,
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as expense
       FROM finances
       WHERE business_id = ? ${dateFilter}
       GROUP BY date
       ORDER BY date ASC`,
      [businessId]
    );

    res.json({
      total_income: Number(rows[0].total_income),
      total_expense: Number(rows[0].total_expense),
      balance: Number(rows[0].total_income) - Number(rows[0].total_expense),
      daily,
    });
  } catch (err) {
    console.error('getFinanceSummary error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};