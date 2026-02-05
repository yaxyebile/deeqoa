import { Router } from 'express';
import * as bookingController from '../controllers/bookingController.js';

const router = Router();

router.get('/', bookingController.getAllBookings);
router.get('/user/:userId', bookingController.getBookingsByUserId);
router.get('/bus/:busId', bookingController.getBookingsByBusId);
router.get('/bus/:busId/booked-seats', bookingController.getBookedSeats);
router.get('/:id', bookingController.getBookingById);
router.post('/', bookingController.createBooking);
router.patch('/:id', bookingController.updateBooking);
router.patch('/:id/status', bookingController.updateBookingStatus);
router.post('/:id/cancel', bookingController.cancelBooking);
router.delete('/:id', bookingController.deleteBooking);

export default router;
