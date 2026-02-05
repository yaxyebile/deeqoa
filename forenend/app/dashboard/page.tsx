'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/protected-route';
import { DashboardHeader } from '@/components/dashboard-header';
import { TicketCard } from '@/components/ticket-card';
import { SeatSelector } from '@/components/seat-selector';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth-context';
import { 
  getBuses, 
  searchBuses,
  getBookingsByUserId, 
  getBookedSeats,
  createBooking,
  getSavedRoutesByUserId,
  addSavedRoute,
  deleteSavedRoute,
  type Bus,
  type Booking,
  type PassengerInfo,
  type SavedRoute,
  getBusById
} from '@/lib/storage';
import { 
  Search, 
  Bus as BusIcon, 
  Ticket, 
  MapPin,
  Calendar,
  Clock,
  Users,
  User as UserIcon,
  ArrowRight,
  Sparkles,
  Shield,
  Zap,
  X,
  ChevronRight,
  Star,
  History,
  CheckCircle2,
  Heart,
  HeartOff,
  Route,
  Trash2,
  CreditCard,
  Loader2,
  AlertCircle,
  Phone
} from 'lucide-react';
import { sendBookingConfirmationSMS } from '@/lib/sms-service';
import { processPayment } from '@/lib/payment-service';
import { useAutoReminders } from '@/hooks/use-auto-reminders';

type ViewType = 'search' | 'bookings' | 'trips' | 'routes' | 'booking-form';

export default function UserDashboard() {
  // Enable automatic reminder system - checks every 5 minutes and sends SMS 1 hour before departure
  useAutoReminders();
  const { user } = useAuth();
  const [activeView, setActiveView] = useState<ViewType>('search');
  const [buses, setBuses] = useState<Bus[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [searchFrom, setSearchFrom] = useState('');
  const [searchTo, setSearchTo] = useState('');
  const [searchDate, setSearchDate] = useState('');
  const [selectedBus, setSelectedBus] = useState<Bus | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [bookedSeats, setBookedSeats] = useState<number[]>([]);
  const [passengerNames, setPassengerNames] = useState<Record<number, string>>({});
  const [isBooking, setIsBooking] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [savedRoutes, setSavedRoutes] = useState<SavedRoute[]>([]);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentPhone, setPaymentPhone] = useState('');

  // Function to check if bus departure time has passed
  const isBusDeparted = (bus: Bus): boolean => {
    const now = new Date();
    const [hours, minutes] = bus.departureTime.split(':').map(Number);
    const busDateTime = new Date(bus.departureDate);
    busDateTime.setHours(hours, minutes, 0, 0);
    return now > busDateTime;
  };

  // Filter out buses that have already departed
  const getAvailableBuses = (allBuses: Bus[]): Bus[] => {
    return allBuses.filter(bus => !isBusDeparted(bus));
  };

  // Get active bookings (bus not departed yet)
  const activeBookings = bookings.filter(booking => {
    const bus = getBusById(booking.busId);
    return bus && !isBusDeparted(bus);
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Get trip history (departed buses / completed trips)
  const tripHistory = bookings.filter(booking => {
    const bus = getBusById(booking.busId);
    return bus && isBusDeparted(bus) && booking.status === 'confirmed';
  }).sort((a, b) => new Date(b.bookingDate).getTime() - new Date(a.bookingDate).getTime());

  // Get latest ticket
  const latestTicket = bookings.length > 0 
    ? bookings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
    : null;

  const loadData = () => {
    const allBuses = getBuses();
    setBuses(getAvailableBuses(allBuses));
    if (user) {
      setBookings(getBookingsByUserId(user.id));
      setSavedRoutes(getSavedRoutesByUserId(user.id));
    }
  };

  // Handle save route
  const handleSaveRoute = async (from: string, to: string) => {
    if (!user) return;
    const result = await addSavedRoute(user.id, from, to);
    if (result) {
      setSavedRoutes(getSavedRoutesByUserId(user.id));
    }
  };

  // Handle delete saved route
  const handleDeleteRoute = async (routeId: string) => {
    await deleteSavedRoute(routeId);
    if (user) {
      setSavedRoutes(getSavedRoutesByUserId(user.id));
    }
  };

  // Handle use saved route for search
  const handleUseSavedRoute = (route: SavedRoute) => {
    setSearchFrom(route.from);
    setSearchTo(route.to);
    setActiveView('search');
    // Auto search
    const results = searchBuses(route.from, route.to, searchDate || undefined);
    setBuses(getAvailableBuses(results));
    setHasSearched(true);
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleSearch = () => {
    const results = searchBuses(
      searchFrom || undefined,
      searchTo || undefined,
      searchDate || undefined
    );
    // Filter out departed buses from search results
    setBuses(getAvailableBuses(results));
    setHasSearched(true);
  };

  const handleClearSearch = () => {
    setSearchFrom('');
    setSearchTo('');
    setSearchDate('');
    const allBuses = getBuses();
    setBuses(getAvailableBuses(allBuses));
    setHasSearched(false);
  };

  const handleBookClick = (bus: Bus) => {
    setSelectedBus(bus);
    setSelectedSeats([]);
    setPassengerNames({});
    setBookedSeats(getBookedSeats(bus.id));
    setPaymentPhone(user?.phone || ''); // Initialize with user's phone
    setActiveView('booking-form');
  };

  const handlePassengerNameChange = (seatNumber: number, name: string) => {
    setPassengerNames(prev => ({
      ...prev,
      [seatNumber]: name
    }));
  };

  const allPassengersNamed = selectedSeats.length > 0 && 
    selectedSeats.every(seat => passengerNames[seat]?.trim());

  const isValidPhone = paymentPhone.trim().length >= 9;

  const handleConfirmBooking = async () => {
    if (!user || !selectedBus || selectedSeats.length === 0 || !allPassengersNamed || !isValidPhone) return;

    setIsBooking(true);
    setPaymentStatus('processing');
    setPaymentError(null);

    const totalAmount = selectedSeats.length * selectedBus.ticketPrice;
    
    // Create passengers array with seat numbers and names
    const passengers: PassengerInfo[] = selectedSeats.map(seat => ({
      seatNumber: seat,
      passengerName: passengerNames[seat] || ''
    }));

    // Process payment first
    try {
      const paymentResult = await processPayment({
        phoneNumber: paymentPhone.trim(),
        amount: totalAmount,
      });

      if (!paymentResult.success) {
        setPaymentStatus('failed');
        setPaymentError(paymentResult.message || 'Lacag bixinta way fashilantay');
        setIsBooking(false);
        return;
      }

      setPaymentStatus('success');

      // Payment successful - create booking
      await createBooking({
        busId: selectedBus.id,
        userId: user.id,
        userName: user.name,
        seatNumbers: selectedSeats,
        passengers: passengers,
        totalAmount: totalAmount,
        status: 'confirmed', // Changed to confirmed since payment is done
        bookingDate: selectedBus.departureDate,
      });

      // Send booking confirmation SMS
      try {
        if (user.phone) {
          await sendBookingConfirmationSMS(
            user.phone,
            user.name,
            selectedBus.name,
            selectedBus.from,
            selectedBus.to,
            selectedBus.departureDate,
            selectedBus.departureTime,
            selectedSeats,
            totalAmount,
            passengers
          );
        }
      } catch (error) {
        console.error('Failed to send booking SMS:', error);
      }

      // Small delay to show success state
      await new Promise(resolve => setTimeout(resolve, 1500));

      setIsBooking(false);
      setPaymentStatus('idle');
      setSelectedBus(null);
      setSelectedSeats([]);
      setPassengerNames({});
      loadData();
    } catch (error) {
      console.error('Payment error:', error);
      setPaymentStatus('failed');
      setPaymentError('Khalad ayaa ka dhacay. Fadlan isku day mar kale.');
      setIsBooking(false);
    }
    setActiveView('bookings');
  };

  const handleBackToSearch = () => {
    setSelectedBus(null);
    setSelectedSeats([]);
    setPassengerNames({});
    setActiveView('search');
  };

  return (
    <ProtectedRoute allowedRoles={['user']}>
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
        <DashboardHeader title="BusBook" />
        
        <main className="container px-4 py-6 max-w-7xl mx-auto">
          {/* Navigation Tabs */}
          {activeView !== 'booking-form' && (
            <div className="flex flex-wrap gap-2 sm:gap-3 mb-6 sm:mb-8">
              <button
                onClick={() => setActiveView('search')}
                className={`group relative px-3 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-semibold transition-all duration-300 flex items-center gap-1.5 sm:gap-2.5 ${
                  activeView === 'search'
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                    : 'bg-card text-muted-foreground hover:text-foreground hover:bg-card/80 border border-border'
                }`}
              >
                <Search className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">Raadi</span> Bas
              </button>
              <button
                onClick={() => setActiveView('bookings')}
                className={`group relative px-3 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-semibold transition-all duration-300 flex items-center gap-1.5 sm:gap-2.5 ${
                  activeView === 'bookings'
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                    : 'bg-card text-muted-foreground hover:text-foreground hover:bg-card/80 border border-border'
                }`}
              >
                <Ticket className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Tigidhkayga
                {activeBookings.length > 0 && activeView !== 'bookings' && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-secondary text-secondary-foreground text-[10px] sm:text-xs rounded-full flex items-center justify-center font-bold">
                    {activeBookings.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveView('trips')}
                className={`group relative px-3 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-semibold transition-all duration-300 flex items-center gap-1.5 sm:gap-2.5 ${
                  activeView === 'trips'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25'
                    : 'bg-card text-muted-foreground hover:text-foreground hover:bg-card/80 border border-border'
                }`}
              >
                <History className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Safarada
                {tripHistory.length > 0 && activeView !== 'trips' && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-amber-500 text-white text-[10px] sm:text-xs rounded-full flex items-center justify-center font-bold">
                    {tripHistory.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveView('routes')}
                className={`group relative px-3 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-semibold transition-all duration-300 flex items-center gap-1.5 sm:gap-2.5 ${
                  activeView === 'routes'
                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-500/25'
                    : 'bg-card text-muted-foreground hover:text-foreground hover:bg-card/80 border border-border'
                }`}
              >
                <Heart className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Routes
                {savedRoutes.length > 0 && activeView !== 'routes' && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-pink-500 text-white text-[10px] sm:text-xs rounded-full flex items-center justify-center font-bold">
                    {savedRoutes.length}
                  </span>
                )}
              </button>
            </div>
          )}

          {/* Search View */}
          {activeView === 'search' && (
            <div className="space-y-8">
              {/* Hero Search Section */}
              <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-primary via-primary to-secondary p-4 sm:p-8 md:p-12">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIgMS44LTQgNC00czQgMS44IDQgNC0xLjggNC00IDQtNC0xLjgtNC00eiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
                
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="h-5 w-5 text-primary-foreground/80" />
                    <span className="text-primary-foreground/80 text-sm font-medium">Safarka Fudud</span>
                  </div>
                  
                  <h1 className="text-xl sm:text-3xl md:text-4xl font-bold text-primary-foreground mb-2 text-balance">
                    Raadi Bas, Dooro Kursi, Safar!
                  </h1>
                  <p className="text-primary-foreground/70 mb-4 sm:mb-8 max-w-xl text-sm sm:text-base">
                    Hel basaska ugu fiican ee safarka. Goobaab fudud, qiimo wanaagsan.
                  </p>

                  {/* Search Form */}
                  <div className="bg-card/95 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-2xl">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
                        <Input
                          placeholder="Halka ka bixayso..."
                          value={searchFrom}
                          onChange={(e) => setSearchFrom(e.target.value)}
                          className="pl-10 h-10 sm:h-12 rounded-lg sm:rounded-xl border-border/50 bg-background focus:ring-2 focus:ring-primary/20 text-sm sm:text-base"
                        />
                      </div>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-secondary" />
                        <Input
                          placeholder="Halka aadayso..."
                          value={searchTo}
                          onChange={(e) => setSearchTo(e.target.value)}
                          className="pl-10 h-10 sm:h-12 rounded-lg sm:rounded-xl border-border/50 bg-background focus:ring-2 focus:ring-primary/20 text-sm sm:text-base"
                        />
                      </div>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                        <Input
                          type="date"
                          value={searchDate}
                          onChange={(e) => setSearchDate(e.target.value)}
                          className="pl-10 h-10 sm:h-12 rounded-lg sm:rounded-xl border-border/50 bg-background focus:ring-2 focus:ring-primary/20 text-sm sm:text-base"
                        />
                      </div>
                      <div className="flex gap-2 sm:col-span-2 md:col-span-1">
                        <Button 
                          onClick={handleSearch} 
                          className="flex-1 h-10 sm:h-12 rounded-lg sm:rounded-xl text-sm sm:text-base font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all"
                        >
                          <Search className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2" />
                          Raadi
                        </Button>
                        {searchFrom && searchTo && (
                          <Button 
                            variant="outline" 
                            size="icon" 
                            onClick={() => handleSaveRoute(searchFrom, searchTo)}
                            className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg sm:rounded-xl bg-transparent hover:bg-pink-500/10 hover:border-pink-500/30"
                            title="Keydi Route-kan"
                          >
                            <Heart className="h-4 w-4 sm:h-5 sm:w-5 text-pink-500" />
                          </Button>
                        )}
                        {hasSearched && (
                          <Button 
                            variant="outline" 
                            size="icon" 
                            onClick={handleClearSearch}
                            className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg sm:rounded-xl bg-transparent"
                          >
                            <X className="h-4 w-4 sm:h-5 sm:w-5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Latest Ticket Card */}
              {latestTicket && (
                <div className="bg-gradient-to-r from-primary/5 via-secondary/5 to-primary/5 rounded-xl sm:rounded-2xl border border-primary/20 p-3 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 mb-4">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-primary/10">
                        <Ticket className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">Tigidhkaaga Ugu Danbeeya</h3>
                        <p className="text-xs text-muted-foreground">
                          {new Date(latestTicket.createdAt).toLocaleDateString('so-SO')}
                        </p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setActiveView('bookings')}
                      className="rounded-xl bg-transparent"
                    >
                      Arag Dhamaan
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                  
                  {(() => {
                    const bus = getBusById(latestTicket.busId);
                    return (
                      <div className="bg-card rounded-xl p-4 border border-border">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                              <BusIcon className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-foreground">{bus?.name || 'Bus'}</h4>
                              <p className="text-sm text-muted-foreground">{bus?.from} → {bus?.to}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-center">
                              <p className="text-xs text-muted-foreground">Taariikh</p>
                              <p className="font-semibold text-foreground">{latestTicket.bookingDate}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-muted-foreground">Kursiyo</p>
                              <p className="font-semibold text-primary">{latestTicket.seatNumbers.length}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-muted-foreground">Xaalad</p>
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                latestTicket.status === 'confirmed' 
                                  ? 'bg-emerald-500/20 text-emerald-600' 
                                  : latestTicket.status === 'cancelled'
                                  ? 'bg-red-500/20 text-red-600'
                                  : 'bg-amber-500/20 text-amber-600'
                              }`}>
                                {latestTicket.status === 'confirmed' ? 'Xaqiijiyay' : latestTicket.status === 'cancelled' ? 'La tirtiray' : 'Sugaya'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Features */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { icon: Shield, title: 'Ammaan', desc: 'Safar ammaan ah oo hubaal ah' },
                  { icon: Zap, title: 'Degdeg', desc: 'Booking fudud oo daqiiqado' },
                  { icon: Star, title: 'Tayada', desc: 'Basas tayada sare leh' },
                ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-lg transition-all duration-300">
                    <div className="p-3 rounded-xl bg-primary/10">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground">{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Results Header */}
              {hasSearched && (
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Natiijooyinka</h2>
                    <p className="text-sm text-muted-foreground">{buses.length} bas la helay</p>
                  </div>
                </div>
              )}

              {/* Results */}
              {buses.length === 0 ? (
                <Card className="border-dashed border-2 border-primary/20 bg-gradient-to-br from-card to-muted/30">
                  <CardContent className="py-16">
                    <div className="text-center">
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mx-auto mb-6">
                        <BusIcon className="h-12 w-12 text-primary/60" />
                      </div>
                      <h3 className="text-xl font-bold text-foreground mb-3">Bas lama helin</h3>
                      <p className="text-muted-foreground max-w-md mx-auto mb-6">
                        {hasSearched 
                          ? 'Raadintaada laguma helin bas. Fadlan bedel magaalada ama taariikhda oo isku day mar kale.'
                          : 'Hadda ma jiraan basas diyaar ah. Fadlan markale ka eeg ama la xiriir shirkadda basaska.'
                        }
                      </p>
                      {hasSearched && (
                        <Button 
                          onClick={handleClearSearch}
                          variant="outline"
                          className="rounded-xl bg-transparent"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Tirtir Raadinta
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {buses.map((bus) => {
                    const booked = getBookedSeats(bus.id);
                    const available = bus.totalSeats - booked.length;
                    const availablePercent = (available / bus.totalSeats) * 100;
                    
                    return (
                      <div
                        key={bus.id}
                        className="group relative bg-card rounded-2xl border border-border overflow-hidden hover:border-primary/50 hover:shadow-xl transition-all duration-300"
                      >
                        <div className="flex flex-col md:flex-row">
                          {/* Bus Image */}
                          <div className="relative w-full md:w-48 h-40 md:h-auto bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center overflow-hidden">
                            {bus.image ? (
                              <img 
                                src={bus.image || "/placeholder.svg"} 
                                alt={bus.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <BusIcon className="h-16 w-16 text-primary/40" />
                            )}
                            <Badge className="absolute top-3 left-3 bg-primary/90 text-primary-foreground">
                              {bus.busNumber}
                            </Badge>
                          </div>

                          {/* Content */}
                          <div className="flex-1 p-6">
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                              {/* Route Info */}
                              <div className="flex-1">
                                <h3 className="text-lg font-bold text-foreground mb-3">{bus.name}</h3>
                                
                                <div className="flex items-center gap-3 mb-4">
                                  <div className="text-center">
                                    <p className="text-xs text-muted-foreground mb-1">Ka bixi</p>
                                    <p className="font-semibold text-foreground">{bus.from}</p>
                                  </div>
                                  <div className="flex-1 flex items-center gap-2 px-4">
                                    <div className="h-2 w-2 rounded-full bg-primary" />
                                    <div className="flex-1 h-0.5 bg-gradient-to-r from-primary to-secondary" />
                                    <ArrowRight className="h-4 w-4 text-secondary" />
                                    <div className="flex-1 h-0.5 bg-gradient-to-r from-secondary to-primary" />
                                    <div className="h-2 w-2 rounded-full bg-primary" />
                                  </div>
                                  <div className="text-center">
                                    <p className="text-xs text-muted-foreground mb-1">Gaadhsi</p>
                                    <p className="font-semibold text-foreground">{bus.to}</p>
                                  </div>
                                </div>

                                <div className="flex flex-wrap gap-4 text-sm">
                                  <div className="flex items-center gap-1.5 text-muted-foreground">
                                    <Calendar className="h-4 w-4" />
                                    <span>{bus.departureDate}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5 text-muted-foreground">
                                    <Clock className="h-4 w-4" />
                                    <span>{bus.departureTime}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                    <span className={available <= 5 ? 'text-destructive font-medium' : 'text-muted-foreground'}>
                                      {available} kursi bannaan
                                    </span>
                                  </div>
                                </div>

                                {/* Availability Bar */}
                                <div className="mt-3">
                                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                    <div 
                                      className={`h-full rounded-full transition-all ${
                                        availablePercent > 50 ? 'bg-primary' : 
                                        availablePercent > 20 ? 'bg-yellow-500' : 'bg-destructive'
                                      }`}
                                      style={{ width: `${availablePercent}%` }}
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Price & Action */}
                              <div className="flex lg:flex-col items-center lg:items-end gap-4 pt-4 lg:pt-0 border-t lg:border-t-0 lg:border-l border-border lg:pl-6">
                                <div className="text-right">
                                  <p className="text-xs text-muted-foreground">Qiimaha hal kursi</p>
                                  <p className="text-3xl font-bold text-primary">${bus.ticketPrice}</p>
                                </div>
                                <Button 
                                  onClick={() => handleBookClick(bus)}
                                  disabled={available === 0}
                                  className="rounded-xl px-6 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all group-hover:scale-105"
                                >
                                  {available === 0 ? 'Buuxa' : 'Dooro Kursi'}
                                  <ChevronRight className="h-4 w-4 ml-1" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Bookings View - Active Tickets */}
          {activeView === 'bookings' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Tigidhkayga Active</h2>
                  <p className="text-muted-foreground">{activeBookings.length} booking aan weli safrin</p>
                </div>
              </div>

              {activeBookings.length === 0 ? (
                <Card className="border-dashed border-2">
                  <CardContent className="py-16">
                    <div className="text-center">
                      <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
                        <Ticket className="h-10 w-10 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">Wali ma haysatid tigidh active ah</h3>
                      <p className="text-muted-foreground max-w-sm mx-auto mb-6">
                        Raadi bas oo samee safarka cusub!
                      </p>
                      <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Button onClick={() => setActiveView('search')} className="rounded-xl">
                          <Search className="h-4 w-4 mr-2" />
                          Raadi Bas
                        </Button>
                        {tripHistory.length > 0 && (
                          <Button onClick={() => setActiveView('trips')} variant="outline" className="rounded-xl bg-transparent">
                            <History className="h-4 w-4 mr-2" />
                            Arag Safaradayda ({tripHistory.length})
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {activeBookings.map((booking) => {
                    const bus = getBusById(booking.busId);
                    return (
                      <TicketCard 
                        key={booking.id} 
                        booking={booking} 
                        bus={bus} 
                        userPhone={user?.phone} 
                        showCancelButton={booking.status !== 'cancelled'}
                        onCancelled={loadData}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Saved Routes View */}
          {activeView === 'routes' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Routes-kayga La Keydiyay</h2>
                  <p className="text-muted-foreground">{savedRoutes.length} route la keydiyay</p>
                </div>
              </div>

              {savedRoutes.length === 0 ? (
                <Card className="border-dashed border-2 border-pink-500/30 bg-gradient-to-br from-pink-500/5 to-rose-500/5">
                  <CardContent className="py-16">
                    <div className="text-center">
                      <div className="w-20 h-20 rounded-full bg-pink-500/10 flex items-center justify-center mx-auto mb-6">
                        <Route className="h-10 w-10 text-pink-500" />
                      </div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">Wali ma haysatid route la keydiyay</h3>
                      <p className="text-muted-foreground max-w-sm mx-auto mb-6">
                        Marka aad raadiso bas, riix calaamadda wadnaha si aad u keydiso route-ka
                      </p>
                      <Button onClick={() => setActiveView('search')} className="rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600">
                        <Search className="h-4 w-4 mr-2" />
                        Raadi Bas
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {savedRoutes.map((route) => (
                    <Card key={route.id} className="overflow-hidden border-pink-500/20 hover:border-pink-500/40 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500/20 to-rose-500/20 flex items-center justify-center">
                            <Heart className="h-5 w-5 text-pink-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-foreground truncate">{route.from}</span>
                              <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <span className="font-semibold text-foreground truncate">{route.to}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              La keydiyay {new Date(route.createdAt).toLocaleDateString('so-SO')}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            onClick={() => handleUseSavedRoute(route)}
                            className="flex-1 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600"
                            size="sm"
                          >
                            <Search className="h-4 w-4 mr-2" />
                            Raadi
                          </Button>
                          <Button 
                            onClick={() => handleDeleteRoute(route.id)}
                            variant="outline"
                            size="sm"
                            className="border-destructive/30 text-destructive hover:bg-destructive/10 bg-transparent"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Trips History View - Safaradayda */}
          {activeView === 'trips' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Safaradayda</h2>
                  <p className="text-muted-foreground">{tripHistory.length} safar oo kalay</p>
                </div>
              </div>

              {tripHistory.length === 0 ? (
                <Card className="border-dashed border-2 border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-orange-500/5">
                  <CardContent className="py-16">
                    <div className="text-center">
                      <div className="w-20 h-20 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-6">
                        <History className="h-10 w-10 text-amber-500" />
                      </div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">Wali ma haysatid safar kalay</h3>
                      <p className="text-muted-foreground max-w-sm mx-auto mb-6">
                        Markii aad safar dhamaystid, halkan ayuu ku soo muuqan doonaa
                      </p>
                      <Button onClick={() => setActiveView('search')} className="rounded-xl">
                        <Search className="h-4 w-4 mr-2" />
                        Raadi Bas Cusub
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {tripHistory.map((booking) => {
                    const bus = getBusById(booking.busId);
                    return (
                      <Card key={booking.id} className="overflow-hidden border-amber-500/20 hover:border-amber-500/40 transition-colors">
                        <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 px-5 py-3 border-b border-amber-500/20">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="h-5 w-5 text-amber-500" />
                              <span className="font-semibold text-amber-600">Safar Dhammaaday</span>
                            </div>
                            <span className="text-sm text-muted-foreground">{booking.bookingDate}</span>
                          </div>
                        </div>
                        <CardContent className="p-5">
                          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                            {/* Bus Info */}
                            <div className="flex items-center gap-4">
                              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
                                <BusIcon className="h-7 w-7 text-amber-500" />
                              </div>
                              <div>
                                <h3 className="font-bold text-lg text-foreground">{bus?.name || 'Bus'}</h3>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <MapPin className="h-4 w-4" />
                                  <span>{bus?.from}</span>
                                  <ArrowRight className="h-3 w-3" />
                                  <span>{bus?.to}</span>
                                </div>
                              </div>
                            </div>

                            {/* Trip Details */}
                            <div className="flex flex-wrap items-center gap-6">
                              <div className="text-center">
                                <p className="text-xs text-muted-foreground mb-1">Waqtiga</p>
                                <div className="flex items-center gap-1 text-foreground">
                                  <Clock className="h-4 w-4 text-amber-500" />
                                  <span className="font-semibold">{bus?.departureTime}</span>
                                </div>
                              </div>
                              
                              <div className="text-center">
                                <p className="text-xs text-muted-foreground mb-1">Kursiyo</p>
                                <div className="flex flex-wrap gap-1 justify-center">
                                  {booking.seatNumbers.map(seat => (
                                    <span key={seat} className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-600 text-xs font-medium">
                                      #{seat}
                                    </span>
                                  ))}
                                </div>
                              </div>

                              <div className="text-center">
                                <p className="text-xs text-muted-foreground mb-1">Rakaab</p>
                                <span className="font-semibold text-foreground">{booking.seatNumbers.length}</span>
                              </div>

                              <div className="text-center">
                                <p className="text-xs text-muted-foreground mb-1">Lacag</p>
                                <span className="font-bold text-lg text-amber-500">${booking.totalAmount}</span>
                              </div>
                            </div>
                          </div>

                          {/* Passengers List */}
                          {booking.passengers && booking.passengers.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-border">
                              <p className="text-xs text-muted-foreground mb-2">Rakaabka Safaray:</p>
                              <div className="flex flex-wrap gap-2">
                                {booking.passengers.map((p, i) => (
                                  <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50">
                                    <span className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center text-xs font-bold text-amber-600">
                                      {p.seatNumber}
                                    </span>
                                    <span className="text-sm font-medium text-foreground">{p.passengerName}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Booking Form View */}
          {activeView === 'booking-form' && selectedBus && (
            <div className="space-y-6">
              <Button
                variant="ghost"
                onClick={handleBackToSearch}
                className="gap-2 rounded-xl hover:bg-card"
              >
                <ArrowRight className="h-4 w-4 rotate-180" />
                Dib u noqo
              </Button>

              <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
                {/* Bus Details - 2 columns */}
                <div className="xl:col-span-2 space-y-4">
                  <div className="bg-card rounded-2xl border border-border overflow-hidden">
                    <div className="relative h-48 bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                      {selectedBus.image ? (
                        <img 
                          src={selectedBus.image || "/placeholder.svg"} 
                          alt={selectedBus.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <BusIcon className="h-20 w-20 text-primary/40" />
                      )}
                      <Badge className="absolute top-4 left-4 bg-primary text-primary-foreground text-sm px-3 py-1">
                        {selectedBus.busNumber}
                      </Badge>
                    </div>
                    
                    <div className="p-6 space-y-4">
                      <h2 className="text-xl font-bold text-foreground">{selectedBus.name}</h2>
                      
                      <div className="flex items-center gap-3 py-4 border-y border-dashed border-border">
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground mb-1">Ka bixi</p>
                          <div className="flex items-center gap-1.5">
                            <MapPin className="h-4 w-4 text-primary" />
                            <span className="font-semibold text-foreground">{selectedBus.from}</span>
                          </div>
                        </div>
                        <ArrowRight className="h-5 w-5 text-muted-foreground" />
                        <div className="flex-1 text-right">
                          <p className="text-xs text-muted-foreground mb-1">Gaadhsi</p>
                          <div className="flex items-center gap-1.5 justify-end">
                            <span className="font-semibold text-foreground">{selectedBus.to}</span>
                            <MapPin className="h-4 w-4 text-primary" />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-foreground">{selectedBus.departureDate}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-foreground">{selectedBus.departureTime}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Passenger Names Form */}
                  {selectedSeats.length > 0 && (
                    <div className="bg-card rounded-2xl border border-border p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <UserIcon className="h-5 w-5 text-primary" />
                        <h3 className="font-bold text-lg text-foreground">Magacyada Rakaabka</h3>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">
                        Fadlan ku qor magaca qofka kursi kasta fadhiisan doona
                      </p>
                      
                      <div className="space-y-3">
                        {selectedSeats.sort((a, b) => a - b).map((seat) => (
                          <div key={seat} className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 text-primary font-bold text-sm">
                              {seat}
                            </div>
                            <Input
                              placeholder={`Magaca rakaabka kursi ${seat}...`}
                              value={passengerNames[seat] || ''}
                              onChange={(e) => handlePassengerNameChange(seat, e.target.value)}
                              className="flex-1 h-11 rounded-xl"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Booking Summary Card */}
                  {selectedSeats.length > 0 && (
                    <div className="bg-gradient-to-br from-primary to-secondary rounded-2xl p-6 text-primary-foreground">
                      <h3 className="font-bold text-lg mb-4">Kooban Booking</h3>
                      
                      <div className="space-y-3 mb-6">
                        <div className="flex justify-between">
                          <span className="text-primary-foreground/80">Kuraasta</span>
                          <span className="font-semibold">{selectedSeats.sort((a, b) => a - b).join(', ')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-primary-foreground/80">Tirada</span>
                          <span className="font-semibold">{selectedSeats.length} kursi</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-primary-foreground/80">Qiimaha hal kursi</span>
                          <span className="font-semibold">${selectedBus.ticketPrice}</span>
                        </div>
                        <div className="h-px bg-primary-foreground/20" />
                        <div className="flex justify-between items-center">
                          <span className="text-primary-foreground/80">Wadarta</span>
                          <span className="text-3xl font-bold">
                            ${(selectedSeats.length * selectedBus.ticketPrice).toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Payment Status Messages */}
                      {paymentStatus === 'processing' && (
                        <div className="mb-3 p-3 rounded-xl bg-amber-500/20 border border-amber-500/30">
                          <div className="flex items-center gap-3">
                            <Loader2 className="h-5 w-5 text-amber-500 animate-spin" />
                            <div>
                              <p className="font-semibold text-amber-500">Lacag bixinta socota...</p>
                              <p className="text-xs text-amber-500/80">Fadlan sug, waxaa la xaqiijinayaa lacag bixinta</p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {paymentStatus === 'success' && (
                        <div className="mb-3 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30">
                          <div className="flex items-center gap-3">
                            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                            <div>
                              <p className="font-semibold text-emerald-500">Lacag bixinta way guulaysatay!</p>
                              <p className="text-xs text-emerald-500/80">Tigidhkaaga waa la sameeyay</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {paymentStatus === 'failed' && paymentError && (
                        <div className="mb-3 p-3 rounded-xl bg-red-500/20 border border-red-500/30">
                          <div className="flex items-center gap-3">
                            <AlertCircle className="h-5 w-5 text-red-500" />
                            <div>
                              <p className="font-semibold text-red-500">Lacag bixinta way fashilantay</p>
                              <p className="text-xs text-red-500/80">{paymentError}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Payment Phone Input */}
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-primary-foreground/80 mb-2">
                          <Phone className="h-4 w-4 inline mr-2" />
                          Lambarka Lacag Bixinta (EVC+)
                        </label>
                        <Input
                          type="tel"
                          placeholder="Tusaale: 614386039"
                          value={paymentPhone}
                          onChange={(e) => setPaymentPhone(e.target.value)}
                          className="bg-card/80 border-card text-foreground placeholder:text-muted-foreground h-11 rounded-lg"
                          disabled={paymentStatus === 'processing'}
                        />
                        {!isValidPhone && paymentPhone && (
                          <p className="text-xs text-amber-400 mt-1">Fadlan geli lambar sax ah (ugu yaraan 9 lambar)</p>
                        )}
                      </div>

                      <Button
                        onClick={handleConfirmBooking}
                        disabled={isBooking || !allPassengersNamed || !isValidPhone || paymentStatus === 'processing'}
                        className="w-full h-12 bg-card text-primary hover:bg-card/90 rounded-xl text-base font-semibold disabled:opacity-50"
                      >
                        {paymentStatus === 'processing' ? (
                          <>
                            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                            Lacag bixinta socota...
                          </>
                        ) : paymentStatus === 'success' ? (
                          <>
                            <CheckCircle2 className="h-5 w-5 mr-2" />
                            Booking la sameeyay!
                          </>
                        ) : !allPassengersNamed ? (
                          'Ku qor magacyada rakaabka'
                        ) : !isValidPhone ? (
                          'Geli lambarka lacag bixinta'
                        ) : (
                          <>
                            <CreditCard className="h-5 w-5 mr-2" />
                            Bixi ${(selectedSeats.length * selectedBus.ticketPrice).toFixed(2)} & Xaqiiji
                          </>
                        )}
                      </Button>

                      {paymentStatus === 'failed' && (
                        <Button
                          onClick={() => {
                            setPaymentStatus('idle');
                            setPaymentError(null);
                          }}
                          variant="outline"
                          className="w-full mt-2 bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
                        >
                          Isku day mar kale
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                {/* Seat Selector - 3 columns */}
                <div className="xl:col-span-3">
                  <div className="bg-card rounded-2xl border border-border p-6">
                    <div className="mb-6">
                      <h3 className="text-lg font-bold text-foreground mb-1">Dooro Kursigaaga</h3>
                      <p className="text-sm text-muted-foreground">
                        Dooro ilaa 5 kursi safarkaaga
                      </p>
                    </div>
                    
                    <SeatSelector
                      totalSeats={selectedBus.totalSeats}
                      bookedSeats={bookedSeats}
                      selectedSeats={selectedSeats}
                      onSeatSelect={setSelectedSeats}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
