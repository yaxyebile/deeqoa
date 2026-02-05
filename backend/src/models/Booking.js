import mongoose from 'mongoose';

const passengerInfoSchema = new mongoose.Schema({
  seatNumber: { type: Number, required: true },
  passengerName: { type: String, required: true },
}, { _id: false });

const bookingSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  busId: { type: String, required: true },
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  seatNumbers: [{ type: Number }],
  passengers: [passengerInfoSchema],
  totalAmount: { type: Number, required: true },
  status: { type: String, enum: ['booked', 'confirmed', 'cancelled'], required: true },
  bookingDate: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
}, { _id: true, id: true });

bookingSchema.set('toJSON', { virtuals: true });
bookingSchema.set('toObject', { virtuals: true });
bookingSchema.virtual('id').get(function () { return this._id; });

export const Booking = mongoose.model('Booking', bookingSchema);
