'use client';

interface SeatSelectorProps {
  totalSeats: number;
  bookedSeats: number[];
  selectedSeats: number[];
  onSeatSelect: (seats: number[]) => void;
  maxSelection?: number;
}

export function SeatSelector({
  totalSeats,
  bookedSeats,
  selectedSeats,
  onSeatSelect,
  maxSelection = 5,
}: SeatSelectorProps) {
  const handleSeatClick = (seatNumber: number) => {
    if (bookedSeats.includes(seatNumber)) return;

    if (selectedSeats.includes(seatNumber)) {
      onSeatSelect(selectedSeats.filter((s) => s !== seatNumber));
    } else if (selectedSeats.length < maxSelection) {
      onSeatSelect([...selectedSeats, seatNumber]);
    }
  };

  const getSeatStatus = (seatNumber: number) => {
    if (bookedSeats.includes(seatNumber)) return 'booked';
    if (selectedSeats.includes(seatNumber)) return 'selected';
    return 'available';
  };

  const getSeatStyle = (status: string) => {
    switch (status) {
      case 'booked':
        return 'bg-muted/80 text-muted-foreground/50 cursor-not-allowed border-transparent shadow-none';
      case 'selected':
        return 'bg-gradient-to-br from-primary to-secondary text-primary-foreground border-transparent shadow-lg shadow-primary/30 scale-105';
      default:
        return 'bg-card text-foreground border-border hover:border-primary hover:shadow-md hover:scale-102 cursor-pointer';
    }
  };

  // Calculate rows (4 seats per row: 2-aisle-2 layout)
  const seatsPerRow = 4;
  const totalRows = Math.ceil(totalSeats / seatsPerRow);
  const rows = [];

  for (let row = 0; row < totalRows; row++) {
    const rowSeats = [];
    for (let col = 0; col < seatsPerRow; col++) {
      const seatNumber = row * seatsPerRow + col + 1;
      if (seatNumber <= totalSeats) {
        rowSeats.push(seatNumber);
      }
    }
    rows.push(rowSeats);
  }

  return (
    <div className="space-y-6">
      {/* Legend */}
      <div className="flex flex-wrap gap-3 sm:gap-6 justify-center p-3 sm:p-4 bg-muted/30 rounded-lg sm:rounded-xl">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-md sm:rounded-lg border-2 bg-card border-border shadow-sm" />
          <span className="text-xs sm:text-sm font-medium text-foreground">Bannaan</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-md sm:rounded-lg bg-gradient-to-br from-primary to-secondary shadow-md" />
          <span className="text-xs sm:text-sm font-medium text-foreground">La doortay</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-md sm:rounded-lg bg-muted/80" />
          <span className="text-xs sm:text-sm font-medium text-muted-foreground">La qabsaday</span>
        </div>
      </div>

      {/* Bus Layout */}
      <div className="relative bg-gradient-to-b from-muted/50 to-muted/30 rounded-2xl sm:rounded-3xl p-4 sm:p-8 border border-border">
        {/* Bus Front */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-6 py-1 bg-primary rounded-full">
          <span className="text-xs font-bold text-primary-foreground uppercase tracking-wider">Hore</span>
        </div>

        {/* Driver Section */}
        <div className="flex justify-between items-center mb-4 sm:mb-6 pb-4 sm:pb-6 border-b-2 border-dashed border-border">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-foreground/10 flex items-center justify-center">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-foreground/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-xs sm:text-sm font-medium text-muted-foreground">Darawal</span>
          </div>
          <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-lg sm:rounded-xl bg-foreground/5 border-2 border-dashed border-foreground/20 flex items-center justify-center">
            <svg className="w-5 h-5 sm:w-7 sm:h-7 text-foreground/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
            </svg>
          </div>
        </div>

        {/* Seats Grid */}
        <div className="space-y-3">
          {rows.map((rowSeats, rowIndex) => (
            <div key={rowIndex} className="flex justify-center items-center gap-3">
              {/* Row number */}
              <span className="w-6 text-xs font-medium text-muted-foreground text-right">
                {rowIndex + 1}
              </span>
              
              {/* Left side (2 seats) */}
              <div className="flex gap-1 sm:gap-2">
                {rowSeats.slice(0, 2).map((seatNumber) => {
                  const status = getSeatStatus(seatNumber);
                  return (
                    <button
                      key={seatNumber}
                      onClick={() => handleSeatClick(seatNumber)}
                      disabled={status === 'booked'}
                      className={`
                        relative w-9 h-9 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-lg sm:rounded-xl border-2 
                        flex items-center justify-center text-xs sm:text-sm font-bold
                        transition-all duration-200 ${getSeatStyle(status)}
                      `}
                      title={`Kursi ${seatNumber} - ${status === 'booked' ? 'La qabsaday' : status === 'selected' ? 'La doortay' : 'Bannaan'}`}
                    >
                      {seatNumber}
                      {status === 'selected' && (
                        <span className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-card rounded-full flex items-center justify-center">
                          <svg className="w-2 h-2 sm:w-3 sm:h-3 text-primary" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Aisle */}
              <div className="w-6 sm:w-10 md:w-16 flex items-center justify-center">
                <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-border to-transparent" />
              </div>

              {/* Right side (2 seats) */}
              <div className="flex gap-1 sm:gap-2">
                {rowSeats.slice(2, 4).map((seatNumber) => {
                  const status = getSeatStatus(seatNumber);
                  return (
                    <button
                      key={seatNumber}
                      onClick={() => handleSeatClick(seatNumber)}
                      disabled={status === 'booked'}
                      className={`
                        relative w-9 h-9 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-lg sm:rounded-xl border-2 
                        flex items-center justify-center text-xs sm:text-sm font-bold
                        transition-all duration-200 ${getSeatStyle(status)}
                      `}
                      title={`Kursi ${seatNumber} - ${status === 'booked' ? 'La qabsaday' : status === 'selected' ? 'La doortay' : 'Bannaan'}`}
                    >
                      {seatNumber}
                      {status === 'selected' && (
                        <span className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-card rounded-full flex items-center justify-center">
                          <svg className="w-2 h-2 sm:w-3 sm:h-3 text-primary" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Row number */}
              <span className="w-6 text-xs font-medium text-muted-foreground">
                {rowIndex + 1}
              </span>
            </div>
          ))}
        </div>

        {/* Bus Back */}
        <div className="mt-6 pt-4 border-t-2 border-dashed border-border flex justify-center">
          <div className="px-4 py-1 bg-muted rounded-full">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Gadaal</span>
          </div>
        </div>
      </div>

      {/* Selection Info */}
      <div className="text-center p-3 sm:p-4 bg-primary/5 rounded-lg sm:rounded-xl border border-primary/20">
        <p className="text-xs sm:text-sm text-foreground">
          La doortay: <span className="font-bold text-primary">{selectedSeats.length}</span> / {maxSelection} kursi
        </p>
        {selectedSeats.length > 0 && (
          <p className="text-sm sm:text-base font-bold text-primary mt-1">
            Kuraasta: {selectedSeats.sort((a, b) => a - b).join(', ')}
          </p>
        )}
      </div>
    </div>
  );
}
