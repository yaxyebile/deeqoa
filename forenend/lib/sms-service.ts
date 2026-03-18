// SMS Service - calls our API route to avoid CORS issues

interface SMSResponse {
  success: boolean;
  error?: string;
}

export async function sendSMS(phoneNumber: string, message: string): Promise<SMSResponse> {
  try {
    const response = await fetch('/api/sms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phoneNumber, message }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('SMS sending error:', error);
    return { success: false, error: 'Network error while sending SMS' };
  }
}

// Welcome message for new user registration
export async function sendWelcomeSMS(phoneNumber: string, userName: string): Promise<SMSResponse> {
  const message = `[Deeqo Bus] Soo dhawoow ${userName}! Ku mahadsan tahay is-diiwaan gelintaada. Hadda waxaad diyaar u tahay inaad tigidhkaaga online ku goosato. Safar wanaagsan!`;
  return sendSMS(phoneNumber, message);
}

export interface PassengerSMS {
  seatNumber: number;
  passengerName: string;
}

// Trip reminder message (sent before departure)
export async function sendTripReminderSMS(
  phoneNumber: string,
  userName: string,
  busName: string,
  from: string,
  to: string,
  departureTime: string,
  seatNumbers: number[]
): Promise<SMSResponse> {
  const message = `[Deeqo Bus] Xusuusin Safar! Salaamu Calaykum ${userName}, safarkaagu wuu soo dhow yahay! BAS: ${busName}, SAFAR: ${from} - ${to}, WAQTI: ${departureTime}, KURSI: ${seatNumbers.sort((a, b) => a - b).join(', ')}. Fadlan 30 daqiiqo ka hor soo gaadh.`;
  
  return sendSMS(phoneNumber, message);
}

// Cancellation confirmation message
export async function sendCancellationSMS(
  phoneNumber: string,
  userName: string,
  busName: string,
  from: string,
  to: string,
  refundAmount: number
): Promise<SMSResponse> {
  const message = `[Deeqo Bus] Joojinta Booking! Salaamu Calaykum ${userName}, dalabkaagii baska ${busName} (${from}-${to}) waa la joojiyay. Refund: $${refundAmount.toFixed(2)}. Mahadsanid.`;
  
  return sendSMS(phoneNumber, message);
}

// Booking confirmation message
export async function sendBookingConfirmationSMS(
  phoneNumber: string,
  userName: string,
  busName: string,
  from: string,
  to: string,
  departureDate: string,
  departureTime: string,
  seatNumbers: number[],
  totalAmount: number,
  passengers?: PassengerSMS[]
): Promise<SMSResponse> {
  const seats = seatNumbers.sort((a, b) => a - b).join(', ');
  const message = `[Deeqo Bus] Tigidhkaaga! Salaamu Calaykum ${userName}, dalabkaaga waa la xaqiijiyay. BAS: ${busName}, SAFAR: ${from}-${to}, TAARIIKH: ${departureDate} (${departureTime}), KURSI: ${seats}, WADARTA: $${totalAmount.toFixed(2)}. Safar wanaagsan!`;
  
  return sendSMS(phoneNumber, message);
}
