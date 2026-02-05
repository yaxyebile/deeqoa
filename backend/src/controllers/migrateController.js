import { User } from '../models/User.js';
import { Bus } from '../models/Bus.js';
import { Booking } from '../models/Booking.js';
import { SavedRoute } from '../models/SavedRoute.js';

function normalizeDate(v) {
  if (!v) return new Date();
  if (typeof v === 'string') return new Date(v);
  return v;
}

export async function migrateFromLocalStorage(req, res) {
  try {
    const { users = [], buses = [], bookings = [], savedRoutes = [] } = req.body;

    const results = { users: 0, buses: 0, bookings: 0, savedRoutes: 0, errors: [] };

    for (const u of users) {
      try {
        const _id = u.id || u._id || `user_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        await User.updateOne(
          { _id },
          {
            $set: {
              _id,
              name: u.name,
              email: u.email,
              phone: u.phone,
              password: u.password,
              role: u.role,
              status: u.status || 'pending',
              createdAt: normalizeDate(u.createdAt),
            },
          },
          { upsert: true }
        );
        results.users++;
      } catch (e) {
        results.errors.push({ type: 'user', id: u.id, message: e.message });
      }
    }

    for (const b of buses) {
      try {
        const _id = b.id || b._id || `bus_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        await Bus.updateOne(
          { _id },
          {
            $set: {
              _id,
              adminId: b.adminId,
              name: b.name,
              busNumber: b.busNumber,
              totalSeats: b.totalSeats,
              from: b.from,
              to: b.to,
              departureTime: b.departureTime,
              departureDate: b.departureDate,
              ticketPrice: b.ticketPrice,
              imageUrl: b.imageUrl || b.image || '',
              createdAt: normalizeDate(b.createdAt),
            },
          },
          { upsert: true }
        );
        results.buses++;
      } catch (e) {
        results.errors.push({ type: 'bus', id: b.id, message: e.message });
      }
    }

    for (const b of bookings) {
      try {
        const _id = b.id || b._id || `booking_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        await Booking.updateOne(
          { _id },
          {
            $set: {
              _id,
              busId: b.busId,
              userId: b.userId,
              userName: b.userName,
              seatNumbers: b.seatNumbers || [],
              passengers: b.passengers || [],
              totalAmount: b.totalAmount,
              status: b.status,
              bookingDate: b.bookingDate,
              createdAt: normalizeDate(b.createdAt),
            },
          },
          { upsert: true }
        );
        results.bookings++;
      } catch (e) {
        results.errors.push({ type: 'booking', id: b.id, message: e.message });
      }
    }

    for (const r of savedRoutes) {
      try {
        const _id = r.id || r._id || `route_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        await SavedRoute.updateOne(
          { _id },
          {
            $set: {
              _id,
              userId: r.userId,
              from: r.from,
              to: r.to,
              createdAt: normalizeDate(r.createdAt),
            },
          },
          { upsert: true }
        );
        results.savedRoutes++;
      } catch (e) {
        results.errors.push({ type: 'savedRoute', id: r.id, message: e.message });
      }
    }

    res.status(200).json({ success: true, ...results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
