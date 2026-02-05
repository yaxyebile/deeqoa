import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { User } from '../models/User.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

function getSeedUsers() {
  const path = join(__dirname, '../data/seed-users.json');
  const data = readFileSync(path, 'utf8');
  return JSON.parse(data);
}

/**
 * Create admin users from backend/src/data/seed-users.json.
 * Call POST /api/seed when using a new database.
 */
export async function seedDatabase(req, res) {
  try {
    const users = getSeedUsers();
    if (!Array.isArray(users) || users.length === 0) {
      return res.status(400).json({ error: 'seed-users.json must contain an array of users' });
    }

    const created = [];
    const skipped = [];

    for (const u of users) {
      const existing = await User.findById(u._id).lean();
      if (existing) {
        skipped.push({ _id: u._id, email: u.email });
        continue;
      }
      await User.create(u);
      created.push({ _id: u._id, email: u.email, password: u.password });
    }

    res.status(201).json({
      success: true,
      message: `Seeded: ${created.length} created, ${skipped.length} already existed.`,
      created,
      skipped,
      collections: ['users', 'buses', 'bookings', 'savedroutes'],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
