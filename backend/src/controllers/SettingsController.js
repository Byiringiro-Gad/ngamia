const { Setting } = require('../models');

// Public — customer app polls this to know if ordering is open
exports.getStatus = async (req, res) => {
  try {
    const setting = await Setting.getSetting();
    res.json({ is_open: setting.is_open, closed_message: setting.closed_message });
  } catch (error) {
    // If the table doesn't exist yet (migration pending), default to open
    res.json({ is_open: true, closed_message: null });
  }
};

// Protected — admin toggles open/close and sets optional message
exports.updateSettings = async (req, res) => {
  try {
    const { is_open, closed_message } = req.body;
    const setting = await Setting.getSetting();
    if (typeof is_open === 'boolean') setting.is_open = is_open;
    if (closed_message !== undefined) setting.closed_message = closed_message || null;
    await setting.save();
    res.json({ is_open: setting.is_open, closed_message: setting.closed_message });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
