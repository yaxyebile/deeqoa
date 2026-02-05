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
  const message = `Soo dhawoow ${userName}! Ku mahadsan tahay is-diiwaan gelintaada BusBook. Hadda waxaad diyaar u tahay inaad tigidhka bas-ka online-ka ah ka dalbanayso. Safar wanaagsan!`;
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
  const message = `BUSBOOK - Xusuusin Safar!

Salaamu Calaykum ${userName},

Safarkaagu wuu soo dhow yahay!

BAS: ${busName}
SAFAR: ${from} ilaa ${to}
WAQTI: ${departureTime}
KURSI(YO): ${seatNumbers.sort((a, b) => a - b).join(', ')}

Fadlan 30 daqiiqo ka hor soo gaadhsi baska.

Safar wanaagsan!
BusBook`;
  
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
  const message = `BUSBOOK - Joojinta Booking

Salaamu Calaykum ${userName},

Booking-gaaga waa la joojiyay.

BAS: ${busName}
SAFAR: ${from} ilaa ${to}
LACAG LA CELIN DOONO: $${refundAmount.toFixed(2)}

Haddii aad su'aalo qabtid, nala soo xiriir.

Mahadsanid,
BusBook`;
  
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
  // Format passengers list beautifully
  let passengersText = '';
  if (passengers && passengers.length > 0) {
    passengersText = passengers
      .sort((a, b) => a.seatNumber - b.seatNumber)
      .map(p => `  * ${p.passengerName} - Kursi #${p.seatNumber}`)
      .join('\n');
  } else {
    passengersText = `  Kursi(yo): ${seatNumbers.sort((a, b) => a - b).join(', ')}`;
  }

  const message = `BUSBOOK - Tigidhkaaga!

Salaamu Calaykum ${userName},

Dalabkaagu waa la xaqiijiyay.

BAS: ${busName}
SAFAR: ${from} ilaa ${to}
TAARIIKH: ${departureDate}
WAQTI: ${departureTime}

RAKAABKA:
${passengersText}

WADARTA: $${totalAmount.toFixed(2)}

Mahadsanid, safar wanaagsan!`;
  
  return sendSMS(phoneNumber, message);
}
