import { NextRequest, NextResponse } from 'next/server';

const SMS_API_URL = "https://api.xaliye6.online/sendSMS";

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, message } = await request.json();

    if (!phoneNumber || !message) {
      return NextResponse.json(
        { success: false, error: 'Phone number and message are required' },
        { status: 400 }
      );
    }

    // Format phone number - remove any spaces or dashes, ensure it starts with +252 if not present
    let cleanPhone = phoneNumber.replace(/[\s-]/g, '');
    if (!cleanPhone.startsWith('+')) {
      if (cleanPhone.startsWith('252')) {
        cleanPhone = '+' + cleanPhone;
      } else {
        // Assume it's a local number if it starts with 6 or 7
        cleanPhone = '+252' + cleanPhone.replace(/^0/, '');
      }
    }

    const response = await fetch(SMS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mobile: cleanPhone,
        message: message,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json({ success: true, data });
    } else {
      const errorText = await response.text();
      console.error('SMS API error response:', errorText);
      return NextResponse.json(
        { success: false, error: 'Failed to send SMS' },
        { status: response.status }
      );
    }
  } catch (error) {
    console.error('SMS API error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error while sending SMS' },
      { status: 500 }
    );
  }
}
