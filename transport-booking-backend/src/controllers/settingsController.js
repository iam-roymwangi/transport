const prisma = require("../config/db");

async function getSystemSettings() {
  let settings = await prisma.systemSettings.findUnique({
    where: { id: "singleton" },
  });
  if (!settings) {
    settings = await prisma.systemSettings.create({
      data: { id: "singleton", bookingsOpen: true },
    });
  }
  return settings;
}

async function getSettings(req, res, next) {
  try {
    const settings = await getSystemSettings();
    return res.json({ success: true, settings });
  } catch (err) {
    next(err);
  }
}

async function toggleBookingsOpen(req, res, next) {
  try {
    const settings = await getSystemSettings();
    const updated = await prisma.systemSettings.update({
      where: { id: "singleton" },
      data: { bookingsOpen: !settings.bookingsOpen },
    });
    return res.json({ success: true, settings: updated });
  } catch (err) {
    next(err);
  }
}

async function saveAutomationRules(req, res, next) {
  const { rules } = req.body;
  try {
    await getSystemSettings();
    const updated = await prisma.systemSettings.update({
      where: { id: "singleton" },
      data: { automationRules: rules },
    });
    return res.json({ success: true, settings: updated });
  } catch (err) {
    next(err);
  }
}

module.exports = { getSettings, toggleBookingsOpen, saveAutomationRules, getSystemSettings };
