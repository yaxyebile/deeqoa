'use client';

import Image from 'next/image';
import { Bus, MapPin, Clock, Calendar, Users, DollarSign } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Bus as BusType } from '@/lib/storage';

interface BusCardProps {
  bus: BusType;
  onBook?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
  isAdmin?: boolean;
  availableSeats?: number;
}

export function BusCard({ 
  bus, 
  onBook, 
  onEdit, 
  onDelete, 
  showActions = true,
  isAdmin = false,
  availableSeats
}: BusCardProps) {
  return (
    <Card className="overflow-hidden border-border/50 hover:shadow-lg transition-shadow duration-300">
      <div className="relative h-32 sm:h-40 bg-muted">
        {bus.imageUrl ? (
          <Image
            src={bus.imageUrl || "/placeholder.svg"}
            alt={bus.name}
            fill
            className="object-cover"
            crossOrigin="anonymous"
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-primary/5">
            <Bus className="h-12 w-12 sm:h-16 sm:w-16 text-primary/30" />
          </div>
        )}
        <div className="absolute top-2 right-2 sm:top-3 sm:right-3">
          <span className="px-2 py-0.5 sm:px-3 sm:py-1 bg-primary text-primary-foreground text-xs sm:text-sm font-semibold rounded-full">
            ${bus.ticketPrice}
          </span>
        </div>
      </div>
      
      <CardContent className="p-3 sm:p-4">
        <div className="mb-2 sm:mb-3">
          <h3 className="font-semibold text-base sm:text-lg text-foreground truncate">{bus.name}</h3>
          <p className="text-xs sm:text-sm text-muted-foreground">{bus.busNumber}</p>
        </div>

        <div className="space-y-1.5 sm:space-y-2 mb-3 sm:mb-4">
          <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
            <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
            <span className="text-foreground font-medium truncate">{bus.from}</span>
            <span className="text-muted-foreground">→</span>
            <span className="text-foreground font-medium truncate">{bus.to}</span>
          </div>
          
          <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>{bus.departureDate}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>{bus.departureTime}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>{bus.totalSeats} total seats</span>
            </div>
            {availableSeats !== undefined && (
              <span className={`font-medium ${availableSeats > 0 ? 'text-primary' : 'text-destructive'}`}>
                {availableSeats} available
              </span>
            )}
          </div>
        </div>

        {showActions && (
          <div className="flex gap-2 pt-2 sm:pt-3 border-t border-border">
            {isAdmin ? (
              <>
                <Button variant="outline" size="sm" className="flex-1 bg-transparent text-xs sm:text-sm" onClick={onEdit}>
                  Edit
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 text-destructive border-destructive/30 hover:bg-destructive/10 bg-transparent text-xs sm:text-sm" 
                  onClick={onDelete}
                >
                  Delete
                </Button>
              </>
            ) : (
              <Button 
                className="w-full text-sm" 
                onClick={onBook}
                disabled={availableSeats !== undefined && availableSeats === 0}
              >
                {availableSeats === 0 ? 'Fully Booked' : 'Book Now'}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
