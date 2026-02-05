import { NextRequest, NextResponse } from 'next/server';

const SMS_API_URL = "https://smsgateway24.com/getdata/addsms";
const DEVICE_ID = "12539";
const TOKEN = "9cc542db9cc23b626ae294a166a1594d";

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, message } = await request.json();

    if (!phoneNumber || !message) {
      return NextResponse.json(
        { success: false, error: 'Phone number and message are required' },
        { status: 400 }
      );
    }

    // Format phone number - remove any spaces or dashes
    const cleanPhone = phoneNumber.replace(/[\s-]/g, '');

    const formData = new URLSearchParams();
    formData.append('sendto', cleanPhone);
    formData.append('body', message);
    formData.append('device_id', DEVICE_ID);
    formData.append('sim', '1');
    formData.append('token', TOKEN);

    const response = await fetch(SMS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    if (response.ok) {
      const data = await response.text();
      return NextResponse.json({ success: true, data });
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to send SMS' },
        { status: 500 }
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
