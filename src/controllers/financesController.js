const pool = require('../db');

exports.getFinances = async (req, res) => {
  const { businessId } = req.params;
  const { month, year } = req.query;
  try {
    let query = 'SELECT * FROM finances WHERE business_id = ?';
    const params = [businessId];

    if (month && year) {
      query += ' AND MONTH(date) = ? AND YEAR(date) = ?';
      params.push(month, year);
    }

    query += ' ORDER BY date DESC';

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
    // Construir filtro de fecha si aplica
    const params = [businessId];
    let dateFilter = '';
    if (month && year) {
      dateFilter = ' AND MONTH(date) = ? AND YEAR(date) = ?';
      params.push(month, year);
    }

    const [rows] = await pool.query(
      `SELECT
        COALESCE(SUM(CASE WHEN type = 'income'  THEN amount ELSE 0 END), 0) AS total_income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS total_expense
       FROM finances
       WHERE business_id = ?${dateFilter}`,
      params
    );

    // Para el daily usamos los mismos params
    const [daily] = await pool.query(
      `SELECT
        date,
        COALESCE(SUM(CASE WHEN type = 'income'  THEN amount ELSE 0 END), 0) AS income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS expense
       FROM finances
       WHERE business_id = ?${dateFilter}
       GROUP BY date
       ORDER BY date ASC`,
      params
    );

    const totalIncome  = Number(rows[0].total_income);
    const totalExpense = Number(rows[0].total_expense);

    res.json({
      total_income:  totalIncome,
      total_expense: totalExpense,
      balance:       totalIncome - totalExpense,
      daily,
    });
  } catch (err) {
    console.error('getFinanceSummary error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};