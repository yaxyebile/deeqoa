import { SavedRoute } from '../models/SavedRoute.js';

export async function getAllSavedRoutes(req, res) {
  try {
    const routes = await SavedRoute.find().lean();
    res.json(routes.map((r) => ({ ...r, id: r._id })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function getSavedRoutesByUserId(req, res) {
  try {
    const routes = await SavedRoute.find({ userId: req.params.userId }).lean();
    res.json(routes.map((r) => ({ ...r, id: r._id })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function createSavedRoute(req, res) {
  try {
    const { id, ...body } = req.body;
    const _id = id || `route_${Date.now()}`;
    const doc = await SavedRoute.create({ _id, ...body });
    const route = doc.toObject();
    res.status(201).json({ ...route, id: route._id });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export async function deleteSavedRoute(req, res) {
  try {
    const deleted = await SavedRoute.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Saved route not found' });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
