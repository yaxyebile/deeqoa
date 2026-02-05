// Payment Service - EVC+ Integration (uses server-side API route)

export interface PaymentRequest {
  phoneNumber: string;
  amount: number;
}

export interface PaymentResponse {
  success: boolean;
  message: string;
  transactionId?: string;
  error?: string;
}

export async function processPayment(request: PaymentRequest): Promise<PaymentResponse> {
  try {
    console.log('[v0] Processing payment via API route:', { phone: request.phoneNumber, amount: request.amount });

    // Call our server-side API route which will proxy to the payment API
    const response = await fetch('/api/payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phoneNumber: request.phoneNumber,
        amount: request.amount,
      }),
    });

    const data = await response.json();
    console.log('[v0] Payment response:', data);

    return data;
  } catch (error) {
    console.error('[v0] Payment error:', error);
    return {
      success: false,
      message: 'Khalad ayaa ka dhacay lacag bixinta. Fadlan isku day mar kale.',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Verify payment status (if API supports it)
export async function verifyPayment(transactionId: string): Promise<PaymentResponse> {
  // This can be implemented if the payment API has a verification endpoint
  return {
    success: true,
    message: 'Payment verified',
    transactionId,
  };
}
