import { Bus } from '../models/Bus.js';

export async function getAllBuses(req, res) {
  try {
    const { from, to, date } = req.query;
    let query = {};
    if (from) query.from = new RegExp(from, 'i');
    if (to) query.to = new RegExp(to, 'i');
    if (date) query.departureDate = date;
    const buses = await Bus.find(query).lean();
    res.json(buses.map((b) => ({ ...b, id: b._id })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function getBusById(req, res) {
  try {
    const bus = await Bus.findById(req.params.id).lean();
    if (!bus) return res.status(404).json({ error: 'Bus not found' });
    res.json({ ...bus, id: bus._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function getBusesByAdminId(req, res) {
  try {
    const buses = await Bus.find({ adminId: req.params.adminId }).lean();
    res.json(buses.map((b) => ({ ...b, id: b._id })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function createBus(req, res) {
  try {
    const { id, ...body } = req.body;
    const _id = id || `bus_${Date.now()}`;
    const doc = await Bus.create({ _id, ...body });
    const bus = doc.toObject();
    res.status(201).json({ ...bus, id: bus._id });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export async function updateBus(req, res) {
  try {
    const updated = await Bus.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).lean();
    if (!updated) return res.status(404).json({ error: 'Bus not found' });
    res.json({ ...updated, id: updated._id });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export async function deleteBus(req, res) {
  try {
    const deleted = await Bus.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Bus not found' });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
