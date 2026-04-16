const pool = require('../db');

exports.getEmployees = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM employees WHERE business_id = ? AND active = true',
      [req.params.businessId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.createEmployee = async (req, res) => {
  const { business_id, name, email, phone, base_salary } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO employees (business_id, name, email, phone, base_salary) VALUES (?, ?, ?, ?, ?)',
      [business_id, name, email, phone, base_salary || 0]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.updateEmployee = async (req, res) => {
  const { name, email, phone, base_salary } = req.body;
  try {
    await pool.query(
      'UPDATE employees SET name=?, email=?, phone=?, base_salary=? WHERE id=?',
      [name, email, phone, base_salary, req.params.id]
    );
    res.json({ message: 'Employee updated' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.deleteEmployee = async (req, res) => {
  try {
    await pool.query('UPDATE employees SET active = false WHERE id = ?', [req.params.id]);
    res.json({ message: 'Employee deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.addCommission = async (req, res) => {
  const { employee_id, appointment_id, amount } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO commissions (employee_id, appointment_id, amount) VALUES (?, ?, ?)',
      [employee_id, appointment_id, amount]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getCommissions = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT c.*, a.date, a.start_time, s.name as service_name
       FROM commissions c
       JOIN appointments a ON c.appointment_id = a.id
       JOIN services s ON a.service_id = s.id
       WHERE c.employee_id = ?
       ORDER BY a.date DESC`,
      [req.params.employeeId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.addPayment = async (req, res) => {
  const { employee_id, amount, notes } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO employee_payments (employee_id, amount, notes) VALUES (?, ?, ?)',
      [employee_id, amount, notes]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getPayments = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM employee_payments WHERE employee_id = ? ORDER BY paid_at DESC',
      [req.params.employeeId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getEmployeeSummary = async (req, res) => {
  try {
    const [employee] = await pool.query(
      'SELECT * FROM employees WHERE id = ?',
      [req.params.employeeId]
    );
    if (!employee[0]) return res.status(404).json({ error: 'Employee not found' });

    const [commissions] = await pool.query(
      'SELECT COALESCE(SUM(amount), 0) as total FROM commissions WHERE employee_id = ?',
      [req.params.employeeId]
    );

    const [payments] = await pool.query(
      'SELECT COALESCE(SUM(amount), 0) as total FROM employee_payments WHERE employee_id = ?',
      [req.params.employeeId]
    );

    const totalEarned = Number(employee[0].base_salary) + Number(commissions[0].total);
    const totalPaid = Number(payments[0].total);
    const balance = totalEarned - totalPaid;

    res.json({
      employee: employee[0],
      total_commissions: Number(commissions[0].total),
      total_paid: totalPaid,
      balance,
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};