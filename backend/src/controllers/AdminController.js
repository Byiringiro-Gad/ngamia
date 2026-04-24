const { User } = require('../models');
const bcrypt = require('bcryptjs');
const { generateToken } = require('../utils/auth');
const PDFService = require('../services/PDFService');

exports.loginAdmin = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ where: { username } });
    if (user && (await bcrypt.compare(password, user.password_hash))) {
      res.json({ id: user.id, username: user.username, token: generateToken(user.id) });
    } else {
      res.status(401).json({ error: 'Invalid username or password' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    res.json(req.user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.exportDailyManifest = async (req, res) => {
  try {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=daily-manifest.pdf');
    await PDFService.generateDailyManifest(res);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.seedAdmin = async (req, res) => {
  try {
    const count = await User.count();
    if (count > 0) return res.status(400).json({ error: 'Admin already exists' });
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash('admin123', salt);
    const admin = await User.create({ username: 'admin', password_hash });
    res.status(201).json({ message: 'Admin seeded', username: admin.username });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.resetAdminPassword = async (req, res) => {
  try {
    const user = await User.findOne({ where: { username: 'admin' } });
    if (!user) return res.status(404).json({ error: 'Admin not found. Use /seed first.' });
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash('admin123', salt);
    await user.update({ password_hash });
    res.json({ message: 'Password reset to admin123' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
