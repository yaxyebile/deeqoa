import mongoose from 'mongoose';

const busSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  adminId: { type: String, required: true },
  name: { type: String, required: true },
  busNumber: { type: String, required: true },
  totalSeats: { type: Number, required: true },
  from: { type: String, required: true },
  to: { type: String, required: true },
  departureTime: { type: String, required: true },
  departureDate: { type: String, required: true },
  ticketPrice: { type: Number, required: true },
  imageUrl: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
}, { _id: true, id: true });

busSchema.set('toJSON', { virtuals: true });
busSchema.set('toObject', { virtuals: true });
busSchema.virtual('id').get(function () { return this._id; });

export const Bus = mongoose.model('Bus', busSchema);
