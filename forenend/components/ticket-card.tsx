'use client';

import { Calendar } from "@/components/ui/calendar"
import { Clock, User, Bell } from 'lucide-react'; // Import Clock, User, and Bell icons

import { useState } from 'react';
import { Bus, CheckCircle, XCircle, AlertCircle, QrCode, ArrowRight, Printer, MessageCircle, Loader2, Download, Ban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Booking, Bus as BusType } from '@/lib/storage';
import { sendSMS, sendCancellationSMS, sendTripReminderSMS } from '@/lib/sms-service'; // Import sendTripReminderSMS
import { cancelBooking } from '@/lib/storage';

interface TicketCardProps {
  booking: Booking;
  bus: BusType | undefined;
  userPhone?: string;
  showCancelButton?: boolean;
  onCancelled?: () => void;
}

export function TicketCard({ booking, bus, userPhone, showCancelButton = false, onCancelled }: TicketCardProps) {
  const [isSending, setIsSending] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isReminding, setIsReminding] = useState(false); // Declare isReminding state
  const [reminderSent, setReminderSent] = useState(false); // Declare reminderSent state

  const getStatusConfig = () => {
    switch (booking.status) {
      case 'confirmed':
        return {
          icon: CheckCircle,
          bg: 'bg-primary/10',
          text: 'text-primary',
          border: 'border-primary/20',
          label: 'La xaqiijiyay'
        };
      case 'cancelled':
        return {
          icon: XCircle,
          bg: 'bg-destructive/10',
          text: 'text-destructive',
          border: 'border-destructive/20',
          label: 'La joojiyay'
        };
      default:
        return {
          icon: AlertCircle,
          bg: 'bg-secondary/10',
          text: 'text-secondary',
          border: 'border-secondary/20',
          label: 'La dalbay'
        };
    }
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;

  // Generate short ticket ID for display
  const ticketId = `TKT-${booking.id.slice(0, 8).toUpperCase()}`;

  const handlePrint = () => {
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Tigidhka - ${ticketId}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', system-ui, sans-serif; padding: 24px; background: #f1f5f9; }
          .ticket { background: white; max-width: 420px; margin: 0 auto; border-radius: 28px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.15); border: 1px solid #e2e8f0; }
          .header { background: linear-gradient(135deg, #22c55e 0%, #16a34a 50%, #15803d 100%); color: white; padding: 28px 24px; text-align: center; position: relative; }
          .header::before { content: ''; position: absolute; inset: 0; background: radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0); background-size: 24px 24px; opacity: 0.5; }
          .header h1 { font-size: 28px; font-weight: 800; letter-spacing: -0.02em; margin-bottom: 4px; }
          .header p { opacity: 0.9; font-size: 13px; font-weight: 500; }
          .ticket-id { background: rgba(0,0,0,0.2); padding: 10px 20px; border-radius: 14px; display: inline-block; margin-top: 14px; font-weight: 700; font-family: ui-monospace, monospace; letter-spacing: 0.05em; }
          .body { padding: 24px; background: linear-gradient(180deg, #fff 0%, #f8fafc 100%); }
          .bus-name { font-size: 18px; font-weight: 700; color: #0f172a; margin-bottom: 18px; text-align: center; padding: 14px; background: linear-gradient(90deg, #dcfce7 0%, #bbf7d0 100%); border-radius: 14px; border: 1px solid #86efac; }
          .route { display: flex; align-items: center; justify-content: space-between; padding: 20px; background: #f1f5f9; border-radius: 16px; margin-bottom: 18px; border: 1px solid #e2e8f0; }
          .route-point { text-align: center; }
          .route-point .label { font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 600; margin-bottom: 6px; }
          .route-point .city { font-size: 20px; font-weight: 800; color: #0f172a; }
          .arrow-wrap { width: 48px; height: 48px; background: linear-gradient(135deg, #22c55e, #16a34a); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 20px; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
          .info-item { padding: 14px; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; }
          .info-item .label { font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; font-weight: 600; }
          .info-item .value { font-weight: 700; color: #0f172a; font-size: 14px; }
          .divider { border-top: 2px dashed #cbd5e1; margin: 22px 0; }
          .footer { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; background: linear-gradient(90deg, #f1f5f9 0%, #e2e8f0 100%); border-top: 2px dashed #cbd5e1; }
          .total { text-align: right; }
          .total .label { font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600; }
          .total .amount { font-size: 32px; font-weight: 800; background: linear-gradient(90deg, #22c55e, #16a34a); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
          .qr { width: 64px; height: 64px; background: white; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #94a3b8; border: 1px solid #e2e8f0; font-weight: 600; }
          .passengers { margin-top: 18px; padding: 16px; background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-radius: 14px; border: 1px solid #bbf7d0; }
          .passengers .label { font-size: 10px; color: #166534; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 10px; font-weight: 700; }
          .pass-row { display: flex; align-items: center; gap: 12px; padding: 10px 12px; background: white; border-radius: 10px; margin-bottom: 8px; border: 1px solid #dcfce7; }
          .pass-row .seat { width: 36px; height: 36px; background: linear-gradient(135deg, #22c55e, #16a34a); color: white; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 14px; }
          @media print { body { background: white; padding: 0; } .ticket { box-shadow: none; border-radius: 0; } }
        </style>
      </head>
      <body>
        <div class="ticket">
          <div class="header">
            <h1>BusBook</h1>
            <p>Tigidhka Safarka</p>
            <div class="ticket-id">${ticketId}</div>
          </div>
          <div class="body">
            <div class="bus-name">${bus?.name || 'Bus'} — ${bus?.busNumber || ''}</div>
            <div class="route">
              <div class="route-point">
                <div class="label">Ka bixi</div>
                <div class="city">${bus?.from || '-'}</div>
              </div>
              <div class="arrow-wrap">→</div>
              <div class="route-point">
                <div class="label">Gaadhsi</div>
                <div class="city">${bus?.to || '-'}</div>
              </div>
            </div>
            <div class="info-grid">
              <div class="info-item"><div class="label">Taariikhda</div><div class="value">${booking.bookingDate}</div></div>
              <div class="info-item"><div class="label">Waqtiga</div><div class="value">${bus?.departureTime || '-'}</div></div>
              <div class="info-item"><div class="label">Dalbaday</div><div class="value">${booking.userName}</div></div>
              <div class="info-item"><div class="label">Tirada</div><div class="value">${booking.seatNumbers.length} kursi</div></div>
            </div>
            ${booking.passengers && booking.passengers.length > 0 ? `
            <div class="passengers">
              <div class="label">Rakaabka iyo Kuraastooda</div>
              ${booking.passengers.map(p => `
                <div class="pass-row">
                  <div class="seat">${p.seatNumber}</div>
                  <span style="font-weight: 600; color: #0f172a;">${p.passengerName}</span>
                </div>
              `).join('')}
            </div>
            ` : ''}
            <div class="divider"></div>
          </div>
          <div class="footer">
            <div class="qr">QR</div>
            <div class="total">
              <div class="label">Wadarta</div>
              <div class="amount">$${booking.totalAmount}</div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  };

  const handleShareViaSMS = async () => {
    if (!userPhone) {
      alert('Fadlan ku dar lambarka telefoonka profile-kaaga');
      return;
    }

    setIsSending(true);
    setShareSuccess(false);

    // Format passengers list beautifully
    let passengersText = '';
    if (booking.passengers && booking.passengers.length > 0) {
      passengersText = booking.passengers
        .sort((a, b) => a.seatNumber - b.seatNumber)
        .map(p => `  * ${p.passengerName} - Kursi #${p.seatNumber}`)
        .join('\n');
    } else {
      passengersText = `  Kursi(yo): ${booking.seatNumbers.sort((a, b) => a - b).join(', ')}`;
    }

    const message = `BUSBOOK - Tigidhkaaga!
${ticketId}

BAS: ${bus?.name || 'Bus'} (${bus?.busNumber || '-'})
SAFAR: ${bus?.from || '-'} ilaa ${bus?.to || '-'}
TAARIIKH: ${booking.bookingDate}
WAQTI: ${bus?.departureTime || '-'}

RAKAABKA:
${passengersText}

WADARTA: $${booking.totalAmount}

Fadlan tigidh-kan hay markii aad safraysid.
BusBook - Safar Wanaagsan!`;

    try {
      const result = await sendSMS(userPhone, message);
      if (result.success) {
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 3000);
      } else {
        alert('SMS-ka ma dirin. Fadlan isku day mar kale.');
      }
    } catch (error) {
      alert('Khalad ayaa dhacay. Fadlan isku day mar kale.');
    } finally {
      setIsSending(false);
    }
  };

  // Handle cancel booking
  const handleCancelBooking = async () => {
    if (!confirm('Ma hubtaa inaad joojinayso booking-kan? Lacagta dib ayaa laguu celin doonaa.')) {
      return;
    }

    setIsCancelling(true);
    
    const result = await cancelBooking(booking.id);
    
    if (result.success) {
      // Send cancellation SMS
      if (userPhone && bus) {
        try {
          await sendCancellationSMS(
            userPhone,
            booking.userName,
            bus.name,
            bus.from,
            bus.to,
            result.refundAmount
          );
        } catch (error) {
          console.error('Failed to send cancellation SMS:', error);
        }
      }
      
      alert(`Booking-gaaga waa la joojiyay. Lacagta la celin doono: $${result.refundAmount.toFixed(2)}`);
      onCancelled?.();
    } else {
      alert(result.error || 'Khalad ayaa dhacay. Fadlan isku day mar kale.');
    }
    
    setIsCancelling(false);
  };

  // Handle send reminder
  const handleSendReminder = async () => {
    if (!userPhone) {
      alert('Fadlan ku dar lambarka telefoonka profile-kaaga');
      return;
    }

    setIsReminding(true);
    setReminderSent(false);

    try {
      const result = await sendTripReminderSMS(userPhone, booking.userName, bus?.name || 'Bus', bus?.from || '-', bus?.to || '-', booking.bookingDate);
      if (result.success) {
        setReminderSent(true);
        setTimeout(() => setReminderSent(false), 3000);
      } else {
        alert('Xusuusin SMS-ka ma dirin. Fadlan isku day mar kale.');
      }
    } catch (error) {
      alert('Khalad ayaa dhacay. Fadlan isku day mar kale.');
    } finally {
      setIsReminding(false);
    }
  };

  // Generate PDF and download
  const handleDownloadPDF = () => {
    // Format passengers
    let passengersText = '';
    if (booking.passengers && booking.passengers.length > 0) {
      passengersText = booking.passengers
        .sort((a, b) => a.seatNumber - b.seatNumber)
        .map(p => `${p.passengerName} - Kursi #${p.seatNumber}`)
        .join(', ');
    } else {
      passengersText = `Kursi(yo): ${booking.seatNumbers.sort((a, b) => a - b).join(', ')}`;
    }

    const pdfContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Tigidhka - ${ticketId}</title>
        <style>
          @page { size: A5; margin: 0; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; background: white; }
          .ticket { width: 100%; max-width: 400px; margin: 20px auto; border: 2px solid #e5e7eb; border-radius: 16px; overflow: hidden; }
          .header { background: linear-gradient(135deg, #22c55e, #3b82f6); color: white; padding: 24px; text-align: center; }
          .header h1 { font-size: 28px; margin-bottom: 4px; }
          .header .ticket-id { background: rgba(255,255,255,0.2); padding: 6px 12px; border-radius: 8px; display: inline-block; margin-top: 8px; font-size: 12px; }
          .body { padding: 24px; }
          .route { display: flex; justify-content: space-between; align-items: center; padding: 16px; background: #f9fafb; border-radius: 12px; margin-bottom: 16px; }
          .route-point { text-align: center; }
          .route-point .label { font-size: 10px; color: #6b7280; text-transform: uppercase; }
          .route-point .city { font-size: 20px; font-weight: bold; color: #111827; }
          .arrow { font-size: 24px; color: #22c55e; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px; }
          .info-item { padding: 12px; background: #f9fafb; border-radius: 8px; }
          .info-item .label { font-size: 10px; color: #6b7280; text-transform: uppercase; margin-bottom: 4px; }
          .info-item .value { font-weight: 600; color: #111827; }
          .passengers { padding: 16px; background: #f0fdf4; border-radius: 12px; border: 1px solid #bbf7d0; margin-bottom: 16px; }
          .passengers .label { font-size: 10px; color: #166534; text-transform: uppercase; margin-bottom: 8px; }
          .passengers .list { font-weight: 500; color: #111827; }
          .footer { display: flex; justify-content: space-between; align-items: center; padding: 16px 24px; background: #f9fafb; border-top: 1px solid #e5e7eb; }
          .total .label { font-size: 10px; color: #6b7280; text-transform: uppercase; }
          .total .amount { font-size: 28px; font-weight: bold; color: #22c55e; }
          .qr { width: 60px; height: 60px; background: #e5e7eb; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="ticket">
          <div class="header">
            <h1>BusBook</h1>
            <p>Tigidhka Safarka</p>
            <div class="ticket-id">${ticketId}</div>
          </div>
          <div class="body">
            <div class="route">
              <div class="route-point">
                <div class="label">Ka Bixi</div>
                <div class="city">${bus?.from || '-'}</div>
              </div>
              <div class="arrow">→</div>
              <div class="route-point">
                <div class="label">Gaadhsi</div>
                <div class="city">${bus?.to || '-'}</div>
              </div>
            </div>
            <div class="info-grid">
              <div class="info-item">
                <div class="label">Bas</div>
                <div class="value">${bus?.name || '-'}</div>
              </div>
              <div class="info-item">
                <div class="label">Number</div>
                <div class="value">${bus?.busNumber || '-'}</div>
              </div>
              <div class="info-item">
                <div class="label">Taariikh</div>
                <div class="value">${booking.bookingDate}</div>
              </div>
              <div class="info-item">
                <div class="label">Waqti</div>
                <div class="value">${bus?.departureTime || '-'}</div>
              </div>
            </div>
            <div class="passengers">
              <div class="label">Rakaabka</div>
              <div class="list">${passengersText}</div>
            </div>
          </div>
          <div class="footer">
            <div class="qr">QR Code</div>
            <div class="total">
              <div class="label">Wadarta</div>
              <div class="amount">$${booking.totalAmount}</div>
            </div>
          </div>
        </div>
        <script>window.print(); window.onafterprint = () => window.close();</script>
      </body>
      </html>
    `;

    const blob = new Blob([pdfContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const printWindow = window.open(url, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        // Cleanup URL after print
        setTimeout(() => URL.revokeObjectURL(url), 100);
      };
    }
  };

  return (
    <div className="group relative">
      {/* Ticket Container - premium card with soft shadow & subtle border */}
      <div className="relative bg-card rounded-[1.75rem] overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 border border-border/80 dark:border-border/50">
        
        {/* Top ticket notches (cinema-style) */}
        <div className="absolute top-0 left-8 w-5 h-2.5 bg-background rounded-b-full z-10 shadow-sm" />
        <div className="absolute top-0 right-8 w-5 h-2.5 bg-background rounded-b-full z-10 shadow-sm" />
        
        {/* Header - gradient with pattern & ribbon feel */}
        <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-emerald-600 dark:to-emerald-700 p-5 sm:p-6 text-primary-foreground">
          {/* Subtle grid pattern */}
          <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '20px 20px' }} />
          {/* Shine overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent" />
          
          <div className="relative flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-inner">
                <Bus className="h-6 w-6" />
              </div>
              <div>
                <h2 className="font-bold text-2xl tracking-tight">BusBook</h2>
                <p className="text-primary-foreground/80 text-base font-medium">Tigidhka Safarka</p>
              </div>
            </div>
            <div className="text-right flex flex-col items-end gap-2">
              <div className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold shadow-lg ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border} border-2 backdrop-blur-sm`}>
                <StatusIcon className="h-4 w-4" />
                <span>{statusConfig.label}</span>
              </div>
              <div className="bg-black/20 backdrop-blur-sm px-3.5 py-2 rounded-lg border border-white/20">
                <span className="text-sm font-mono font-bold tracking-wider">{ticketId}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-5 sm:space-y-6 bg-gradient-to-b from-card to-muted/20">
          {/* Bus name strip */}
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-secondary/10 border border-primary/10 dark:border-primary/20">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center shadow-lg shadow-primary/20">
              <Bus className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-xl sm:text-2xl text-foreground truncate">{bus?.name || 'Unknown Bus'}</h3>
              <p className="text-base text-muted-foreground font-medium">Lambar: {bus?.busNumber}</p>
            </div>
          </div>

          {/* Route - journey line */}
          <div className="relative py-5 sm:py-6 px-4 sm:px-5 rounded-2xl bg-muted/40 dark:bg-muted/20 border border-border/50 rounded-2xl overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,hsl(var(--primary)/0.03)_50%,transparent_100%)]" />
            <div className="relative flex items-center justify-between gap-4">
              <div className="text-center flex-1 min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground uppercase tracking-widest mb-2 font-semibold">Ka bixi</p>
                <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-background/80 border border-primary/20">
                  <div className="w-3 h-3 rounded-full bg-primary ring-2 ring-primary/30" />
                  <span className="font-bold text-lg sm:text-2xl text-foreground truncate">{bus?.from}</span>
                </div>
              </div>
              <div className="flex-shrink-0 flex items-center">
                <div className="w-10 sm:w-14 h-1 rounded-full bg-gradient-to-r from-primary via-primary/60 to-secondary" />
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/25 -ml-1 -mr-1 z-10 border-2 border-background">
                  <ArrowRight className="h-5 w-5 text-white" />
                </div>
                <div className="w-10 sm:w-14 h-1 rounded-full bg-gradient-to-r from-secondary via-secondary/60 to-primary -ml-1" />
              </div>
              <div className="text-center flex-1 min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground uppercase tracking-widest mb-2 font-semibold">Gaadhsi</p>
                <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-background/80 border border-secondary/20">
                  <span className="font-bold text-lg sm:text-2xl text-foreground truncate">{bus?.to}</span>
                  <div className="w-3 h-3 rounded-full bg-secondary ring-2 ring-secondary/30" />
                </div>
              </div>
            </div>
          </div>


          {/* Details grid - pill style */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="flex items-center gap-3 p-3 sm:p-4 rounded-xl bg-muted/40 dark:bg-muted/30 border border-border/50">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground uppercase tracking-wider mb-0.5">Taariikhda</p>
                <span className="font-bold text-base text-foreground">{booking.bookingDate}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 sm:p-4 rounded-xl bg-muted/40 dark:bg-muted/30 border border-border/50">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground uppercase tracking-wider mb-0.5">Waqtiga</p>
                <span className="font-bold text-base text-foreground">{bus?.departureTime}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 sm:p-4 rounded-xl bg-muted/40 dark:bg-muted/30 border border-border/50">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground uppercase tracking-wider mb-0.5">Dalbaday</p>
                <span className="font-bold text-base text-foreground truncate block">{booking.userName}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 sm:p-4 rounded-xl bg-primary/10 dark:bg-primary/15 border border-primary/20">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <span className="font-black text-white text-base">{booking.seatNumbers.length}</span>
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground uppercase tracking-wider mb-0.5">Kursiyo</p>
                <span className="font-bold text-primary text-lg">kursi</span>
              </div>
            </div>
          </div>

          {/* Kuraasta - single line, no array rendering */}
          <div className="p-3 sm:p-4 rounded-xl bg-muted/40 dark:bg-muted/30 border border-border/50">
            <p className="text-xs sm:text-sm text-muted-foreground uppercase tracking-wider mb-1.5">Kuraasta</p>
            <p className="font-semibold text-base text-foreground">
              {[...booking.seatNumbers].sort((a, b) => a - b).join(', ')}
            </p>
          </div>

          {/* Passengers - card list */}
          {booking.passengers && booking.passengers.length > 0 && (
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-primary/10 dark:from-emerald-500/5 dark:to-primary/5 border border-primary/15">
              <p className="text-sm text-muted-foreground uppercase tracking-widest mb-3 font-semibold flex items-center gap-2">
                <span className="w-1 h-4 rounded-full bg-primary" />
                Rakaabka iyo Kuraastooda
              </p>
              <div className="space-y-2">
                {booking.passengers.map((passenger, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 rounded-xl bg-card/80 dark:bg-card/60 border border-border/50 shadow-sm">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center font-black text-primary text-base border border-primary/20">
                      {passenger.seatNumber}
                    </div>
                    <span className="font-semibold text-base text-foreground">{passenger.passengerName}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3 pt-2">
            <div className="flex gap-2">
              <Button 
                onClick={handleDownloadPDF}
                variant="outline"
                size="sm"
                className="flex-1 gap-2 rounded-xl border-2 hover:bg-primary/10 hover:border-primary/30 text-sm font-semibold"
              >
                <Download className="h-4 w-4" />
                Soo Deji PDF
              </Button>
              <Button 
                onClick={handlePrint}
                variant="outline"
                size="sm"
                className="flex-1 gap-2 rounded-xl border-2 hover:bg-primary/10 hover:border-primary/30 text-sm font-semibold"
              >
                <Printer className="h-4 w-4" />
                Print
              </Button>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={handleShareViaSMS}
                disabled={isSending}
                className="flex-1 gap-2 rounded-xl text-sm font-semibold shadow-lg shadow-primary/20"
                size="sm"
              >
                {isSending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : shareSuccess ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <MessageCircle className="h-4 w-4" />
                )}
                {isSending ? 'Diraya...' : shareSuccess ? 'La diray!' : 'SMS u Dir'}
              </Button>
              {showCancelButton && booking.status !== 'cancelled' && (
                <Button 
                  onClick={handleCancelBooking}
                  disabled={isCancelling}
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-2 rounded-xl border-2 border-destructive/40 hover:bg-destructive/10 text-destructive font-semibold text-sm"
                >
                  {isCancelling ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Ban className="h-4 w-4" />
                  )}
                  {isCancelling ? 'Joojinaya...' : 'Jooji Booking'}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Footer - total & QR */}
        <div className="relative px-5 sm:px-6 py-4 sm:py-5 flex items-center justify-between bg-gradient-to-r from-muted/60 to-muted/40 dark:from-muted/40 dark:to-muted/30 border-t-2 border-dashed border-border">
          <div className="hidden sm:flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-muted border border-border flex items-center justify-center">
              <QrCode className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Ticket ID</p>
              <p className="text-base font-mono font-bold text-foreground mt-0.5">{ticketId}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 w-full sm:w-auto justify-end">
            <div className="w-12 h-12 sm:hidden rounded-xl bg-muted border border-border flex items-center justify-center flex-shrink-0">
              <QrCode className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Wadarta</p>
              <p className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-primary to-emerald-600 bg-clip-text text-transparent">${booking.totalAmount}</p>
            </div>
          </div>
        </div>

        {/* Bottom notches */}
        <div className="absolute bottom-0 left-8 w-5 h-2.5 bg-background rounded-t-full z-10 shadow-sm" />
        <div className="absolute bottom-0 right-8 w-5 h-2.5 bg-background rounded-t-full z-10 shadow-sm" />
      </div>
    </div>
  );
}
