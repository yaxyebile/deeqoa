import { Booking } from '../models/Booking.js';
import { Bus } from '../models/Bus.js';

export async function getAllBookings(req, res) {
  try {
    const bookings = await Booking.find().lean();
    res.json(bookings.map((b) => ({ ...b, id: b._id })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function getBookingById(req, res) {
  try {
    const booking = await Booking.findById(req.params.id).lean();
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    res.json({ ...booking, id: booking._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function getBookingsByUserId(req, res) {
  try {
    const bookings = await Booking.find({ userId: req.params.userId }).lean();
    res.json(bookings.map((b) => ({ ...b, id: b._id })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function getBookingsByBusId(req, res) {
  try {
    const bookings = await Booking.find({ busId: req.params.busId }).lean();
    res.json(bookings.map((b) => ({ ...b, id: b._id })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function getBookedSeats(req, res) {
  try {
    const bookings = await Booking.find({
      busId: req.params.busId,
      status: { $ne: 'cancelled' },
    }).lean();
    const seats = bookings.flatMap((b) => b.seatNumbers || []);
    res.json(seats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function createBooking(req, res) {
  try {
    const { id, ...body } = req.body;
    const _id = id || `booking_${Date.now()}`;
    const doc = await Booking.create({ _id, ...body });
    const booking = doc.toObject();
    res.status(201).json({ ...booking, id: booking._id });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export async function updateBooking(req, res) {
  try {
    const updated = await Booking.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).lean();
    if (!updated) return res.status(404).json({ error: 'Booking not found' });
    res.json({ ...updated, id: updated._id });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export async function updateBookingStatus(req, res) {
  try {
    const { status } = req.body;
    const updated = await Booking.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).lean();
    if (!updated) return res.status(404).json({ error: 'Booking not found' });
    res.json({ ...updated, id: updated._id });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export async function deleteBooking(req, res) {
  try {
    const deleted = await Booking.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Booking not found' });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function cancelBooking(req, res) {
  try {
    const booking = await Booking.findById(req.params.id).lean();
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.status === 'cancelled') {
      return res.status(400).json({ error: 'Booking already cancelled', refundAmount: 0 });
    }
    const bus = await Bus.findById(booking.busId).lean();
    if (!bus) return res.status(404).json({ error: 'Bus not found', refundAmount: 0 });
    const now = new Date();
    const [hours, minutes] = bus.departureTime.split(':').map(Number);
    const busDateTime = new Date(bus.departureDate);
    busDateTime.setHours(hours, minutes, 0, 0);
    if (now > busDateTime) {
      return res.status(400).json({ error: 'Cannot cancel after departure', refundAmount: 0 });
    }
    const hoursUntilDeparture = (busDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    const refundPercent = hoursUntilDeparture >= 24 ? 100 : 50;
    const refundAmount = (booking.totalAmount * refundPercent) / 100;
    await Booking.findByIdAndUpdate(req.params.id, { status: 'cancelled' });
    res.json({ success: true, refundAmount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
