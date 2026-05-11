const { Setting } = require('../models');

// Public — customer app polls this to know if ordering is open
exports.getStatus = async (req, res) => {
  try {
    const setting = await Setting.getSetting();
    res.json({ is_open: setting.is_open, closed_message: setting.closed_message });
  } catch (error) {
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

// Emergency open — no login required, protected by a secret key in .env
// Usage: GET /api/settings/emergency-open?key=YOUR_SECRET
// Use this if you closed the platform and lost your browser session.
exports.emergencyOpen = async (req, res) => {
  try {
    const emergencyKey = process.env.ADMIN_EMERGENCY_KEY;
    if (!emergencyKey) {
      return res.status(503).json({ error: 'Emergency key not configured on server.' });
    }
    if (req.query.key !== emergencyKey) {
      return res.status(403).json({ error: 'Invalid key.' });
    }
    const setting = await Setting.getSetting();
    setting.is_open = true;
    setting.closed_message = null;
    await setting.save();
    // Return a plain HTML page so you can use it directly in a browser
    res.send(`
      <!DOCTYPE html>
      <html>
        <head><title>Platform Opened</title></head>
        <body style="font-family:sans-serif;text-align:center;padding:60px;background:#f0fdf4">
          <h1 style="color:#16a34a">✅ Platform is now OPEN</h1>
          <p>Customers can place orders again.</p>
          <p style="color:#6b7280;font-size:14px">You can close this tab.</p>
        </body>
      </html>
    `);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
