const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const publicDir = path.join(__dirname, 'public');
const staticDir = fs.existsSync(publicDir) ? publicDir : __dirname;
app.use(express.static(staticDir));

app.get('/', (req, res) => {
  res.sendFile(path.join(staticDir, 'index.html'));
});

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB error:', err));

// Schema
const habitLogSchema = new mongoose.Schema({
  date: { type: String, required: true }, // YYYY-MM-DD
  habits: { type: Object, default: {} },  // { habitId: true/false }
  notes: { type: String, default: '' }
}, { timestamps: true });

const HabitLog = mongoose.model('HabitLog', habitLogSchema);

const habitConfigSchema = new mongoose.Schema({
  habits: { type: Array, default: [] }
});
const HabitConfig = mongoose.model('HabitConfig', habitConfigSchema);

// Default habits
const DEFAULT_HABITS = [
  { id: 'dsa',       name: '2 DSA Problems',        tier: 1, icon: '⚔️',  target: 7 },
  { id: 'sql',       name: 'SQL Practice',           tier: 1, icon: '🗄️',  target: 7 },
  { id: 'workout',   name: '20 Min Workout',         tier: 1, icon: '💪',  target: 7 },
  { id: 'reading',   name: '2 Pages Reading',        tier: 1, icon: '📖',  target: 7 },
  { id: 'appdesign', name: 'App / Project Work',     tier: 2, icon: '🛠️',  target: 5 },
  { id: 'handwrite', name: 'Handwriting Practice',   tier: 2, icon: '✍️',  target: 5 },
  { id: 'drawing',   name: 'Drawing',                tier: 2, icon: '🎨',  target: 3 },
  { id: 'social',    name: 'Social Media < 1hr',     tier: 3, icon: '📵',  target: 7 },
];

// Routes

// Get config
app.get('/api/config', async (req, res) => {
  let config = await HabitConfig.findOne();
  if (!config) {
    config = await HabitConfig.create({ habits: DEFAULT_HABITS });
  }
  res.json(config);
});

// Update config
app.put('/api/config', async (req, res) => {
  let config = await HabitConfig.findOne();
  if (!config) config = new HabitConfig();
  config.habits = req.body.habits;
  await config.save();
  res.json(config);
});

// Get logs for a month
app.get('/api/logs/:year/:month', async (req, res) => {
  const { year, month } = req.params;
  const prefix = `${year}-${month.padStart(2, '0')}`;
  const logs = await HabitLog.find({ date: { $regex: `^${prefix}` } });
  const map = {};
  logs.forEach(l => { map[l.date] = { habits: l.habits, notes: l.notes }; });
  res.json(map);
});

// Save/update a day's log
app.post('/api/logs', async (req, res) => {
  const { date, habits, notes } = req.body;
  let log = await HabitLog.findOne({ date });
  if (!log) log = new HabitLog({ date });
  log.habits = habits;
  log.notes = notes || '';
  await log.save();
  res.json(log);
});

// Get streak and stats
app.get('/api/stats', async (req, res) => {
  const logs = await HabitLog.find().sort({ date: -1 }).limit(90);
  let config = await HabitConfig.findOne();
  if (!config) config = { habits: DEFAULT_HABITS };

  const today = new Date().toISOString().split('T')[0];
  let streak = 0;
  let d = new Date();

  while (true) {
    const dateStr = d.toISOString().split('T')[0];
    const log = logs.find(l => l.date === dateStr);
    const tier1 = config.habits.filter(h => h.tier === 1);
    if (!log) break;
    const allTier1Done = tier1.every(h => log.habits[h.id]);
    if (!allTier1Done) break;
    streak++;
    d.setDate(d.getDate() - 1);
  }

  // Last 30 days completion
  const last30 = logs.slice(0, 30);
  const totalPossible = config.habits.length * Math.min(last30.length, 30);
  const totalDone = last30.reduce((acc, log) => {
    return acc + Object.values(log.habits).filter(Boolean).length;
  }, 0);
  const completion = totalPossible > 0 ? Math.round((totalDone / totalPossible) * 100) : 0;

  res.json({ streak, completion, totalLogs: logs.length });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
