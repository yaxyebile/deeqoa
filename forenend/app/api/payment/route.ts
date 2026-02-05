import { NextRequest, NextResponse } from 'next/server';

// Payment API Configuration
// POST { "number": "614386039", "amount": "0.01" }
// Response: { "status": "APPROVED" } or { "status": "FAILED", "message": "Payment rejected by user" }
const PAYMENT_API_URL = process.env.PAYMENT_API_URL || 'http://31.220.82.247:7871/pay';

// Demo mode - only when explicitly disabled (use real API by default)
const DEMO_MODE = process.env.PAYMENT_DEMO_MODE === 'true';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phoneNumber, amount } = body;

    if (!phoneNumber || !amount) {
      return NextResponse.json(
        { success: false, message: 'Phone number and amount are required' },
        { status: 400 }
      );
    }

    // Format phone number - remove any non-digit characters
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    
    // Format amount to 2 decimal places
    const formattedAmount = Number(amount).toFixed(2);

    console.log('[v0] Processing payment:', { phone: cleanPhone, amount: formattedAmount, demoMode: DEMO_MODE });

    // Demo Mode: Simulate payment for testing
    if (DEMO_MODE) {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulate success for valid phone numbers (9+ digits)
      if (cleanPhone.length >= 9) {
        return NextResponse.json({
          success: true,
          message: 'Lacag bixinta way guulaysatay! (Demo Mode)',
          transactionId: `DEMO_TXN_${Date.now()}`,
          demoMode: true,
        });
      } else {
        return NextResponse.json({
          success: false,
          message: 'Lambarka telefoonka ma sax aha',
          demoMode: true,
        });
      }
    }

    // Production Mode: Call actual payment API
    const response = await fetch(PAYMENT_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        number: cleanPhone,
        amount: formattedAmount,
      }),
    });

    console.log('[v0] Payment API response status:', response.status);

    const responseText = await response.text();
    console.log('[v0] Payment API raw response:', responseText);

    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      // If response is not valid JSON
      return NextResponse.json({
        success: false,
        message: responseText || 'Lacag bixinta way fashilantay',
        error: 'Invalid response from payment server',
      });
    }

    // Handle the API response format:
    // Success: {"status": "APPROVED"}
    // Failure: {"status": "FAILED", "message": "Payment rejected by user"}
    
    if (data.status === 'APPROVED') {
      return NextResponse.json({
        success: true,
        message: 'Lacag bixinta way guulaysatay!',
        transactionId: data.transactionId || data.transaction_id || `TXN_${Date.now()}`,
      });
    }

    if (data.status === 'FAILED') {
      return NextResponse.json({
        success: false,
        message: data.message || 'Lacag bixinta way fashilantay',
        error: data.message,
      });
    }

    // Handle other possible response formats
    if (data.success === true || data.status === 'success' || data.status === 'SUCCESS') {
      return NextResponse.json({
        success: true,
        message: 'Lacag bixinta way guulaysatay!',
        transactionId: data.transactionId || data.transaction_id || `TXN_${Date.now()}`,
      });
    }

    // Default to failure if no clear success indicator
    return NextResponse.json({
      success: false,
      message: data.message || data.error || 'Lacag bixinta way fashilantay. Fadlan hubi lambarkaaga.',
      error: data.error || data.message,
    });
  } catch (error) {
    console.error('[v0] Payment API route error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Khalad ayaa ka dhacay lacag bixinta. Fadlan isku day mar kale.',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
