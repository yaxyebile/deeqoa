import { User } from '../models/User.js';

export async function getAllUsers(req, res) {
  try {
    const users = await User.find().lean();
    const withId = users.map((u) => ({ ...u, id: u._id }));
    res.json(withId);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function getUserById(req, res) {
  try {
    const user = await User.findById(req.params.id).lean();
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ ...user, id: user._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function getUserByEmail(req, res) {
  try {
    const user = await User.findOne({ email: req.query.email }).lean();
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ ...user, id: user._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function createUser(req, res) {
  try {
    const { id, ...body } = req.body;
    const _id = id || `user_${Date.now()}`;
    const doc = await User.create({ _id, ...body });
    const user = doc.toObject();
    res.status(201).json({ ...user, id: user._id });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export async function updateUser(req, res) {
  try {
    const updated = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).lean();
    if (!updated) return res.status(404).json({ error: 'User not found' });
    res.json({ ...updated, id: updated._id });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export async function updateUserStatus(req, res) {
  try {
    const { status } = req.body;
    const updated = await User.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).lean();
    if (!updated) return res.status(404).json({ error: 'User not found' });
    res.json({ ...updated, id: updated._id });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export async function deleteUser(req, res) {
  try {
    const deleted = await User.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'User not found' });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function getPendingBusAdmins(req, res) {
  try {
    const users = await User.find({ role: 'bus_admin', status: 'pending' }).lean();
    res.json(users.map((u) => ({ ...u, id: u._id })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
