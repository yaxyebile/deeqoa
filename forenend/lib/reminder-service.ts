// Automatic Reminder Service - Sends SMS 1 hour before departure

import { getBookings, getBusById, getUserById, type Booking } from './storage';
import { sendTripReminderSMS } from './sms-service';

// Storage key for tracking sent reminders
const SENT_REMINDERS_KEY = 'bus_booking_sent_reminders';

// Get list of booking IDs that have already received reminders
function getSentReminders(): string[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(SENT_REMINDERS_KEY);
  return data ? JSON.parse(data) : [];
}

// Mark a booking as having received a reminder
function markReminderSent(bookingId: string): void {
  if (typeof window === 'undefined') return;
  const sent = getSentReminders();
  if (!sent.includes(bookingId)) {
    sent.push(bookingId);
    localStorage.setItem(SENT_REMINDERS_KEY, JSON.stringify(sent));
  }
}

// Check if a reminder has already been sent for this booking
function hasReminderBeenSent(bookingId: string): boolean {
  return getSentReminders().includes(bookingId);
}

// Get bookings that need reminders (1 hour before departure)
export function getBookingsNeedingReminders(): Booking[] {
  const bookings = getBookings();
  const now = new Date();
  
  return bookings.filter(booking => {
    // Skip cancelled bookings
    if (booking.status === 'cancelled') return false;
    
    // Skip if reminder already sent
    if (hasReminderBeenSent(booking.id)) return false;
    
    const bus = getBusById(booking.busId);
    if (!bus) return false;
    
    // Parse departure date and time
    const [hours, minutes] = bus.departureTime.split(':').map(Number);
    const departureDate = new Date(bus.departureDate);
    departureDate.setHours(hours, minutes, 0, 0);
    
    // Calculate time until departure in milliseconds
    const timeUntilDeparture = departureDate.getTime() - now.getTime();
    
    // Convert to minutes
    const minutesUntilDeparture = timeUntilDeparture / (1000 * 60);
    
    // Send reminder if between 55-65 minutes before departure (1 hour window)
    return minutesUntilDeparture >= 55 && minutesUntilDeparture <= 65;
  });
}

// Send reminder for a single booking
export async function sendReminderForBooking(booking: Booking): Promise<boolean> {
  const bus = getBusById(booking.busId);
  const user = getUserById(booking.userId);
  
  if (!bus || !user || !user.phone) {
    console.log('[Reminder] Missing bus or user data for booking:', booking.id);
    return false;
  }
  
  try {
    const result = await sendTripReminderSMS(
      user.phone,
      user.name,
      bus.name,
      bus.from,
      bus.to,
      bus.departureTime,
      booking.seatNumbers
    );
    
    if (result.success) {
      markReminderSent(booking.id);
      console.log('[Reminder] SMS sent successfully for booking:', booking.id);
      return true;
    } else {
      console.log('[Reminder] Failed to send SMS for booking:', booking.id);
      return false;
    }
  } catch (error) {
    console.error('[Reminder] Error sending reminder:', error);
    return false;
  }
}

// Check and send all pending reminders
export async function checkAndSendReminders(): Promise<{ sent: number; failed: number }> {
  const bookingsNeedingReminders = getBookingsNeedingReminders();
  
  let sent = 0;
  let failed = 0;
  
  for (const booking of bookingsNeedingReminders) {
    const success = await sendReminderForBooking(booking);
    if (success) {
      sent++;
    } else {
      failed++;
    }
  }
  
  return { sent, failed };
}

// Clean up old reminder records (reminders for bookings more than 24 hours old)
export function cleanupOldReminders(): void {
  if (typeof window === 'undefined') return;
  
  const sent = getSentReminders();
  const bookings = getBookings();
  const now = new Date();
  
  const validReminders = sent.filter(bookingId => {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return false;
    
    const bus = getBusById(booking.busId);
    if (!bus) return false;
    
    const [hours, minutes] = bus.departureTime.split(':').map(Number);
    const departureDate = new Date(bus.departureDate);
    departureDate.setHours(hours, minutes, 0, 0);
    
    // Keep reminders for bookings within the last 24 hours
    const hoursSinceDeparture = (now.getTime() - departureDate.getTime()) / (1000 * 60 * 60);
    return hoursSinceDeparture < 24;
  });
  
  localStorage.setItem(SENT_REMINDERS_KEY, JSON.stringify(validReminders));
}
