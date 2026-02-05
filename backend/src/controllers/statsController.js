import { User } from '../models/User.js';
import { Bus } from '../models/Bus.js';
import { Booking } from '../models/Booking.js';

export async function getStats(req, res) {
  try {
    const [users, buses, bookings] = await Promise.all([
      User.find().lean(),
      Bus.find().lean(),
      Booking.find().lean(),
    ]);
    const totalUsers = users.filter((u) => u.role === 'user').length;
    const totalBusAdmins = users.filter((u) => u.role === 'bus_admin').length;
    const confirmedBookings = bookings.filter((b) => b.status === 'confirmed').length;
    const pendingBookings = bookings.filter((b) => b.status === 'booked').length;
    const totalRevenue = bookings
      .filter((b) => b.status !== 'cancelled')
      .reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    res.json({
      totalUsers,
      totalBusAdmins,
      totalBuses: buses.length,
      totalBookings: bookings.length,
      confirmedBookings,
      pendingBookings,
      totalRevenue,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
