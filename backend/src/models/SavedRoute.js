import mongoose from 'mongoose';

const savedRouteSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  userId: { type: String, required: true },
  from: { type: String, required: true },
  to: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
}, { _id: true, id: true });

savedRouteSchema.set('toJSON', { virtuals: true });
savedRouteSchema.set('toObject', { virtuals: true });
savedRouteSchema.virtual('id').get(function () { return this._id; });

export const SavedRoute = mongoose.model('SavedRoute', savedRouteSchema);
