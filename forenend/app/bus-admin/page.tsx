'use client';

import React from "react"
import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/protected-route';
import { BusCard } from '@/components/bus-card';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth-context';
import { 
  getBusesByAdminId, 
  getBookingsByBusId, 
  createBus, 
  updateBus, 
  deleteBus,
  updateBookingStatus,
  getBookedSeats,
  deleteBookingsByBusId,
  type Bus,
  type Booking,
  getBusById,
  getUserById
} from '@/lib/storage';
import { 
  Plus, 
  Bus as BusIcon, 
  Ticket, 
  DollarSign,
  X,
  Check,
  XCircle,
  Search,
  LogOut,
  Eye,
  Calendar,
  MapPin,
  Users,
  Clock,
  User,
  Phone,
  CreditCard,
  ChevronRight,
  TrendingUp,
  LayoutDashboard,
  MessageSquare,
  Send,
  UserCheck,
  ArrowLeft,
  History,
  CheckCircle2,
  RefreshCw,
  Megaphone,
  Loader2
} from 'lucide-react';
import { sendSMS } from '@/lib/sms-service';
import { useRouter } from 'next/navigation';

type TabType = 'dashboard' | 'buses' | 'bookings' | 'trips' | 'passengers' | 'add';

interface BusFormData {
  name: string;
  busNumber: string;
  totalSeats: string;
  from: string;
  to: string;
  departureTime: string;
  departureDate: string;
  ticketPrice: string;
  imageUrl: string;
}

const initialFormData: BusFormData = {
  name: '',
  busNumber: '',
  totalSeats: '40',
  from: '',
  to: '',
  departureTime: '',
  departureDate: '',
  ticketPrice: '',
  imageUrl: '',
};

export default function BusAdminDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [buses, setBuses] = useState<Bus[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [formData, setFormData] = useState<BusFormData>(initialFormData);
  const [editingBusId, setEditingBusId] = useState<string | null>(null);
  const [bookingSearch, setBookingSearch] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [smsMessage, setSmsMessage] = useState('');
  const [isSendingSms, setIsSendingSms] = useState(false);
  const [smsSuccess, setSmsSuccess] = useState(false);
  const [bulkSmsMessage, setBulkSmsMessage] = useState('');
  const [isSendingBulkSms, setIsSendingBulkSms] = useState(false);
  const [bulkSmsResult, setBulkSmsResult] = useState<{ sent: number; failed: number } | null>(null);
  const [showBulkSmsModal, setShowBulkSmsModal] = useState(false);
  const [renewBus, setRenewBus] = useState<Bus | null>(null);
  const [renewDate, setRenewDate] = useState('');
  const [renewTime, setRenewTime] = useState('');
  const [selectedBusForPassengers, setSelectedBusForPassengers] = useState<Bus | null>(null);
  const [passengerSearch, setPassengerSearch] = useState('');
  const [stats, setStats] = useState({
    totalBuses: 0,
    totalBookings: 0,
    totalRevenue: 0,
    confirmedBookings: 0,
    pendingBookings: 0,
    totalPassengers: 0,
  });

  const loadData = () => {
    if (!user) return;
    
    const adminBuses = getBusesByAdminId(user.id);
    setBuses(adminBuses);
    
    const allBookings: Booking[] = [];
    let revenue = 0;
    let confirmed = 0;
    let pending = 0;
    let passengers = 0;
    
    adminBuses.forEach(bus => {
      const busBookings = getBookingsByBusId(bus.id);
      allBookings.push(...busBookings);
      busBookings.forEach(b => {
        if (b.status !== 'cancelled') {
          revenue += b.totalAmount;
        }
        if (b.status === 'confirmed') {
          confirmed++;
          passengers += b.seatNumbers.length;
        }
        if (b.status === 'booked') pending++;
      });
    });
    
    setBookings(allBookings);
    setStats({
      totalBuses: adminBuses.length,
      totalBookings: allBookings.length,
      totalRevenue: revenue,
      confirmedBookings: confirmed,
      pendingBookings: pending,
      totalPassengers: passengers,
    });
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const busData = {
      adminId: user.id,
      name: formData.name,
      busNumber: formData.busNumber,
      totalSeats: parseInt(formData.totalSeats),
      from: formData.from,
      to: formData.to,
      departureTime: formData.departureTime,
      departureDate: formData.departureDate,
      ticketPrice: parseFloat(formData.ticketPrice),
      imageUrl: formData.imageUrl,
    };

    if (editingBusId) {
      await updateBus(editingBusId, busData);
      setEditingBusId(null);
    } else {
      await createBus(busData);
    }

    setFormData(initialFormData);
    setActiveTab('buses');
    loadData();
  };

  const handleEdit = (bus: Bus) => {
    setFormData({
      name: bus.name,
      busNumber: bus.busNumber,
      totalSeats: bus.totalSeats.toString(),
      from: bus.from,
      to: bus.to,
      departureTime: bus.departureTime,
      departureDate: bus.departureDate,
      ticketPrice: bus.ticketPrice.toString(),
      imageUrl: bus.imageUrl,
    });
    setEditingBusId(bus.id);
    setActiveTab('add');
  };

  const handleDelete = async (busId: string) => {
    if (confirm('Ma hubtaa inaad tirtirto baska? Dhammaan bookings-ka waa la tirtiri doonaa.')) {
      await deleteBus(busId);
      loadData();
    }
  };

  const handleStatusUpdate = async (bookingId: string, status: Booking['status']) => {
    await updateBookingStatus(bookingId, status);
    loadData();
    if (selectedBooking?.id === bookingId) {
      setSelectedBooking({ ...selectedBooking, status });
    }
    
    // Send welcome SMS when booking is confirmed
    if (status === 'confirmed') {
      const booking = bookings.find(b => b.id === bookingId);
      if (booking) {
        const customer = getUserById(booking.userId);
        const bus = buses.find(b => b.id === booking.busId);
        
        if (customer?.phone && bus) {
          // Format passengers list
          let passengersText = '';
          if (booking.passengers && booking.passengers.length > 0) {
            passengersText = booking.passengers
              .sort((a, b) => a.seatNumber - b.seatNumber)
              .map(p => `  * ${p.passengerName} - Kursi #${p.seatNumber}`)
              .join('\n');
          }

          const welcomeMessage = `Ku soo dhawow ${bus.name}!

Safarkayagu wuxuu u socda: ${bus.to}
Ka: ${bus.from}
Taariikh: ${bus.departureDate}
Waqti: ${bus.departureTime}

RAKAABKA:
${passengersText}

Wadarta: $${booking.totalAmount}

Waxaan kugu rajeynayaa safar wanaagsan iyo nabadgelyo.

BusBook - Safar Raaxo leh!`;

          try {
            await sendSMS(customer.phone, welcomeMessage);
          } catch (error) {
            console.error('Failed to send confirmation SMS:', error);
          }
        }
      }
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleSendSms = async () => {
    if (!selectedBooking || !smsMessage.trim()) return;
    
    const customerPhone = getUserById(selectedBooking.userId)?.phone;
    if (!customerPhone) {
      alert('Macmiilku ma lahan lambarka telefoonka');
      return;
    }

    setIsSendingSms(true);
    setSmsSuccess(false);

    try {
      const result = await sendSMS(customerPhone, smsMessage);
      if (result.success) {
        setSmsSuccess(true);
        setSmsMessage('');
        setTimeout(() => setSmsSuccess(false), 3000);
      } else {
        alert('SMS-ka ma dirin. Fadlan isku day mar kale.');
      }
    } catch (error) {
      alert('Khalad ayaa dhacay. Fadlan isku day mar kale.');
    } finally {
      setIsSendingSms(false);
    }
  };

  // Handle sending bulk SMS to all passengers of a bus
  const handleSendBulkSms = async () => {
    if (!selectedBusForPassengers || !bulkSmsMessage.trim()) return;

    const confirmedBookings = getConfirmedPassengersForBus(selectedBusForPassengers.id);
    if (confirmedBookings.length === 0) {
      alert('Baska ma lahan rakaab confirmed ah');
      return;
    }

    setIsSendingBulkSms(true);
    setBulkSmsResult(null);

    let sentCount = 0;
    let failedCount = 0;

    // Get unique phone numbers (in case same user has multiple bookings)
    const sentPhones = new Set<string>();

    for (const booking of confirmedBookings) {
      const customer = getUserById(booking.userId);
      if (customer?.phone && !sentPhones.has(customer.phone)) {
        try {
          // Personalize the message with passenger name
          const personalizedMessage = `Salaamu Calaykum ${booking.userName},\n\n${bulkSmsMessage}\n\nBas: ${selectedBusForPassengers.name}\nSafar: ${selectedBusForPassengers.from} → ${selectedBusForPassengers.to}\nTaariikh: ${selectedBusForPassengers.departureDate}\nWaqti: ${selectedBusForPassengers.departureTime}\n\nMahadsanid,\nBusBook`;
          
          const result = await sendSMS(customer.phone, personalizedMessage);
          if (result.success) {
            sentCount++;
          } else {
            failedCount++;
          }
          sentPhones.add(customer.phone);
        } catch (error) {
          failedCount++;
        }
      }
    }

    setBulkSmsResult({ sent: sentCount, failed: failedCount });
    setIsSendingBulkSms(false);

    // Clear message and close modal after 3 seconds if all successful
    if (failedCount === 0) {
      setTimeout(() => {
        setBulkSmsMessage('');
        setShowBulkSmsModal(false);
        setBulkSmsResult(null);
      }, 3000);
    }
  };

  const handleRenewBus = async () => {
    if (!renewBus || !renewDate || !renewTime || !user) return;
    
    // Create a NEW bus with same details but new date/time
    // The old bus stays in history (trips)
    await createBus({
      adminId: user.id,
      name: renewBus.name,
      busNumber: renewBus.busNumber,
      from: renewBus.from,
      to: renewBus.to,
      departureDate: renewDate,
      departureTime: renewTime,
      totalSeats: renewBus.totalSeats,
      ticketPrice: renewBus.ticketPrice,
      imageUrl: (renewBus as Bus).imageUrl || '',
    });

    // Reset state
    setRenewBus(null);
    setRenewDate('');
    setRenewTime('');
    loadData();
  };

  const openRenewModal = (bus: Bus) => {
    setRenewBus(bus);
    // Set default date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setRenewDate(tomorrow.toISOString().split('T')[0]);
    setRenewTime('08:00');
  };

  const handleViewBusPassengers = (bus: Bus) => {
    setSelectedBusForPassengers(bus);
    setActiveTab('passengers');
  };

  // Check if bus has departed
  const isBusDeparted = (bus: Bus): boolean => {
    const now = new Date();
    const [hours, minutes] = bus.departureTime.split(':').map(Number);
    const busDateTime = new Date(bus.departureDate);
    busDateTime.setHours(hours, minutes, 0, 0);
    return now > busDateTime;
  };

  // Get active buses (not departed)
  const activeBuses = buses.filter(bus => !isBusDeparted(bus));
  
  // Get departed buses (trips/safaro)
  const departedBuses = buses.filter(bus => isBusDeparted(bus));

  // Get confirmed passengers for a specific bus
  const getConfirmedPassengersForBus = (busId: string) => {
    return bookings
      .filter(b => b.busId === busId && b.status === 'confirmed')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  };

  // Get confirmed passenger count for a bus
  const getConfirmedPassengerCount = (busId: string) => {
    return bookings
      .filter(b => b.busId === busId && b.status === 'confirmed')
      .reduce((sum, b) => sum + b.seatNumbers.length, 0);
  };

  // Filter bookings based on search
  const filteredBookings = bookings.filter(booking => {
    const bus = getBusById(booking.busId);
    const bookingUser = getUserById(booking.userId);
    const searchLower = bookingSearch.toLowerCase();
    
    return (
      booking.id.toLowerCase().includes(searchLower) ||
      booking.userName.toLowerCase().includes(searchLower) ||
      bookingUser?.name.toLowerCase().includes(searchLower) ||
      bookingUser?.phone?.includes(searchLower) ||
      bus?.name.toLowerCase().includes(searchLower) ||
      bus?.from.toLowerCase().includes(searchLower) ||
      bus?.to.toLowerCase().includes(searchLower) ||
      booking.bookingDate.includes(searchLower)
    );
  });

  // Filter confirmed passengers based on search
  const filteredPassengers = selectedBusForPassengers
    ? getConfirmedPassengersForBus(selectedBusForPassengers.id).filter(booking => {
        const bookingUser = getUserById(booking.userId);
        const searchLower = passengerSearch.toLowerCase();
        
        return (
          booking.userName.toLowerCase().includes(searchLower) ||
          bookingUser?.phone?.includes(searchLower) ||
          booking.passengers?.some(p => p.passengerName.toLowerCase().includes(searchLower)) ||
          booking.seatNumbers.some(s => s.toString().includes(searchLower))
        );
      })
    : [];

  const navItems = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'buses' as const, label: 'Basaskeeyga', icon: BusIcon },
    { id: 'bookings' as const, label: 'Bookings', icon: Ticket, badge: activeBuses.length },
    { id: 'trips' as const, label: 'Safarada Kalay', icon: History, badge: departedBuses.length },
    { id: 'passengers' as const, label: 'Rakaabka Raacay', icon: UserCheck },
    { id: 'add' as const, label: editingBusId ? 'Wax ka bedel' : 'Bas Cusub', icon: Plus },
  ];

  return (
    <ProtectedRoute allowedRoles={['bus_admin']}>
      <div className="min-h-screen bg-[#0a0a0f] text-white flex">
        {/* Sidebar - Desktop */}
        <aside className="hidden lg:flex flex-col w-64 bg-[#12121a] border-r border-white/10">
          {/* Logo */}
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                <BusIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg">BusBook</h1>
                <p className="text-xs text-white/50">Maamulaha Baska</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4">
            <div className="space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.id === 'add' && activeTab !== 'add') {
                      setFormData(initialFormData);
                      setEditingBusId(null);
                    }
                    if (item.id === 'passengers' && !selectedBusForPassengers) {
                      // Show bus selection for passengers
                    }
                    setActiveTab(item.id);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    activeTab === item.id
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'text-white/60 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
{item.id === 'passengers' && stats.totalPassengers > 0 && (
                                    <span className="ml-auto bg-emerald-500/20 text-emerald-400 text-xs px-2 py-0.5 rounded-full">
                                      {stats.totalPassengers}
                                    </span>
                                  )}
                                  {item.badge !== undefined && item.badge > 0 && item.id !== 'passengers' && (
                                    <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${
                                      item.id === 'trips' 
                                        ? 'bg-amber-500/20 text-amber-400' 
                                        : 'bg-blue-500/20 text-blue-400'
                                    }`}>
                                      {item.badge}
                                    </span>
                                  )}
                </button>
              ))}
            </div>
          </nav>

          {/* User Profile */}
          <div className="p-4 border-t border-white/10">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center">
                <span className="text-sm font-bold">{user?.name?.charAt(0) || 'A'}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.name}</p>
                <p className="text-xs text-white/50 truncate">Maamulaha Baska</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          {/* Mobile Header */}
          <header className="lg:hidden sticky top-0 z-40 bg-[#0a0a0f]/95 backdrop-blur border-b border-white/10">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                  <BusIcon className="h-4 w-4 text-white" />
                </div>
                <span className="font-bold">BusBook Admin</span>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg hover:bg-white/10 text-white/60"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
            
            {/* Mobile Navigation */}
            <div className="flex gap-1 px-4 pb-4 overflow-x-auto">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.id === 'add' && activeTab !== 'add') {
                      setFormData(initialFormData);
                      setEditingBusId(null);
                    }
                    setActiveTab(item.id);
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                    activeTab === item.id
                      ? 'bg-emerald-500 text-white'
                      : 'bg-white/5 text-white/60'
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </button>
              ))}
            </div>
          </header>

          <div className="p-4 lg:p-8">
            {/* Dashboard Tab */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Soo dhawoow, {user?.name?.split(' ')[0]}</h2>
                  <p className="text-white/60">Waa kan warbixinta maanta ee basaskaaga</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/20">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                        <BusIcon className="h-5 w-5 text-emerald-400" />
                      </div>
                      <TrendingUp className="h-4 w-4 text-emerald-400" />
                    </div>
                    <p className="text-2xl font-bold">{stats.totalBuses}</p>
                    <p className="text-sm text-white/60">Basaska</p>
                  </div>

                  <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/20">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                        <Ticket className="h-5 w-5 text-blue-400" />
                      </div>
                      <TrendingUp className="h-4 w-4 text-blue-400" />
                    </div>
                    <p className="text-2xl font-bold">{stats.totalBookings}</p>
                    <p className="text-sm text-white/60">Bookings</p>
                  </div>

                  <div className="p-5 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 border border-cyan-500/20">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                        <UserCheck className="h-5 w-5 text-cyan-400" />
                      </div>
                      <TrendingUp className="h-4 w-4 text-cyan-400" />
                    </div>
                    <p className="text-2xl font-bold">{stats.totalPassengers}</p>
                    <p className="text-sm text-white/60">Rakaabka Raacay</p>
                  </div>

                  <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/20">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                        <Clock className="h-5 w-5 text-amber-400" />
                      </div>
                    </div>
                    <p className="text-2xl font-bold">{stats.pendingBookings}</p>
                    <p className="text-sm text-white/60">Sugaya Xaqiijin</p>
                  </div>

                  <div className="p-5 rounded-2xl bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/20">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                        <Check className="h-5 w-5 text-green-400" />
                      </div>
                    </div>
                    <p className="text-2xl font-bold">{stats.confirmedBookings}</p>
                    <p className="text-sm text-white/60">La Xaqiijiyay</p>
                  </div>

                  <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/20">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                        <DollarSign className="h-5 w-5 text-purple-400" />
                      </div>
                      <TrendingUp className="h-4 w-4 text-purple-400" />
                    </div>
                    <p className="text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</p>
                    <p className="text-sm text-white/60">Dakhliga</p>
                  </div>
                </div>

                {/* Buses with Passenger Counts */}
                <div className="bg-[#12121a] rounded-2xl border border-white/10 overflow-hidden">
                  <div className="p-5 border-b border-white/10">
                    <h3 className="font-semibold">Basaska iyo Rakaabka Raacay</h3>
                    <p className="text-sm text-white/50 mt-1">Guji bas si aad u aragto rakaabka confirmed</p>
                  </div>
                  <div className="divide-y divide-white/5">
                    {buses.map((bus) => {
                      const confirmedCount = getConfirmedPassengerCount(bus.id);
                      const bookedSeatsCount = getBookedSeats(bus.id).length;
                      return (
                        <div
                          key={bus.id}
                          className="p-4 hover:bg-white/5 transition-colors cursor-pointer"
                          onClick={() => handleViewBusPassengers(bus)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-blue-500/20 flex items-center justify-center">
                                <BusIcon className="h-6 w-6 text-emerald-400" />
                              </div>
                              <div>
                                <p className="font-medium">{bus.name}</p>
                                <p className="text-sm text-white/50">{bus.from} → {bus.to}</p>
                                <p className="text-xs text-white/40">{bus.departureDate} - {bus.departureTime}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center gap-2 justify-end">
                                <UserCheck className="h-4 w-4 text-emerald-400" />
                                <span className="text-xl font-bold text-emerald-400">{confirmedCount}</span>
                                <span className="text-white/40">/ {bus.totalSeats}</span>
                              </div>
                              <p className="text-xs text-white/50 mt-1">Rakaab confirmed</p>
                              <div className="mt-2 w-32 h-2 bg-white/10 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
                                  style={{ width: `${(confirmedCount / bus.totalSeats) * 100}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {buses.length === 0 && (
                      <div className="p-8 text-center text-white/40">
                        <BusIcon className="h-10 w-10 mx-auto mb-3 opacity-50" />
                        <p>Wali ma jirto bas</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Trips Tab - Departed buses */}
            {activeTab === 'trips' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Safarada Kalay</h2>
                  <p className="text-white/60">Basaska waqtigooda bixitaanka dhaafay iyo rakaabkoodii</p>
                </div>

                {departedBuses.length === 0 ? (
                  <div className="bg-[#12121a] rounded-2xl border border-white/10 p-12 text-center">
                    <div className="w-20 h-20 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
                      <History className="h-10 w-10 text-amber-500/50" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Wali ma jirto safar kalay</h3>
                    <p className="text-white/50">Markii basaskaagu waqtigooda dhaafay, halkan ayay ku soo muuqan doonaan</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {departedBuses.map((bus) => {
                      const busBookings = bookings.filter(b => b.busId === bus.id);
                      const confirmedBookings = busBookings.filter(b => b.status === 'confirmed');
                      const totalPassengers = confirmedBookings.reduce((sum, b) => sum + b.seatNumbers.length, 0);
                      const totalRevenue = confirmedBookings.reduce((sum, b) => sum + b.totalAmount, 0);
                      
                      return (
                        <div key={bus.id} className="bg-[#12121a] rounded-2xl border border-white/10 overflow-hidden">
                          {/* Trip Header */}
                          <div className="p-5 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-b border-white/10">
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                              <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
                                  <CheckCircle2 className="h-7 w-7 text-amber-400" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h3 className="font-bold text-lg">{bus.name}</h3>
                                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs">
                                      Safarka Dhammaaday
                                    </span>
                                  </div>
                                  <p className="text-sm text-white/60">{bus.from} → {bus.to}</p>
                                  <p className="text-xs text-white/40 mt-1">
                                    <Calendar className="inline h-3 w-3 mr-1" />
                                    {bus.departureDate} - {bus.departureTime}
                                  </p>
                                </div>
                              </div>
                              
                              {/* Trip Stats & Renew Button */}
                              <div className="flex items-center gap-6">
                                <div className="text-center">
                                  <p className="text-2xl font-bold text-amber-400">{totalPassengers}</p>
                                  <p className="text-xs text-white/50">Rakaab</p>
                                </div>
                                <div className="text-center border-l border-white/10 pl-6">
                                  <p className="text-2xl font-bold text-emerald-400">${totalRevenue}</p>
                                  <p className="text-xs text-white/50">Dakhli</p>
                                </div>
                                <div className="text-center border-l border-white/10 pl-6">
                                  <p className="text-2xl font-bold text-blue-400">{confirmedBookings.length}</p>
                                  <p className="text-xs text-white/50">Bookings</p>
                                </div>
                                <div className="border-l border-white/10 pl-6">
                                  <Button
                                    onClick={() => openRenewModal(bus)}
                                    className="bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600"
                                  >
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    Dib u Cusbooneysii
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Passengers List */}
                          {confirmedBookings.length > 0 ? (
                            <div className="overflow-x-auto">
                              <table className="w-full">
                                <thead>
                                  <tr className="border-b border-white/10 bg-white/5">
                                    <th className="text-left p-4 text-sm font-medium text-white/60">Rakaabka</th>
                                    <th className="text-left p-4 text-sm font-medium text-white/60">Kuraasta</th>
                                    <th className="text-left p-4 text-sm font-medium text-white/60">Telefoon</th>
                                    <th className="text-left p-4 text-sm font-medium text-white/60">Lacag</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                  {confirmedBookings.map((booking) => {
                                    const bookingUser = getUserById(booking.userId);
                                    return (
                                      <tr key={booking.id} className="hover:bg-white/5 transition-colors">
                                        <td className="p-4">
                                          {booking.passengers && booking.passengers.length > 0 ? (
                                            <div className="space-y-1">
                                              {booking.passengers.map((p, i) => (
                                                <div key={i} className="flex items-center gap-2">
                                                  <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center">
                                                    <span className="text-xs font-bold text-amber-400">{p.seatNumber}</span>
                                                  </div>
                                                  <span className="text-sm">{p.passengerName}</span>
                                                </div>
                                              ))}
                                            </div>
                                          ) : (
                                            <span className="text-white/50">{booking.userName}</span>
                                          )}
                                        </td>
                                        <td className="p-4">
                                          <div className="flex flex-wrap gap-1">
                                            {booking.seatNumbers.map(seat => (
                                              <span key={seat} className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 text-xs font-medium">
                                                #{seat}
                                              </span>
                                            ))}
                                          </div>
                                        </td>
                                        <td className="p-4">
                                          <span className="text-sm text-white/60">{bookingUser?.phone || '-'}</span>
                                        </td>
                                        <td className="p-4">
                                          <span className="font-semibold text-emerald-400">${booking.totalAmount}</span>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <div className="p-8 text-center text-white/40">
                              <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
                              <p className="text-sm">Safarkaan rakaab ma lahayn</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Passengers Tab - View confirmed passengers per bus */}
            {activeTab === 'passengers' && (
              <div className="space-y-6">
                {!selectedBusForPassengers ? (
                  // Bus selection view
                  <>
                    <div>
                      <h2 className="text-2xl font-bold mb-2">Rakaabka Raacay</h2>
                      <p className="text-white/60">Dooro bas si aad u aragto rakaabka confirmed</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {buses.map((bus) => {
                        const confirmedCount = getConfirmedPassengerCount(bus.id);
                        const confirmedBookings = getConfirmedPassengersForBus(bus.id);
                        return (
                          <div
                            key={bus.id}
                            onClick={() => handleViewBusPassengers(bus)}
                            className="p-6 rounded-2xl bg-[#12121a] border border-white/10 hover:border-emerald-500/30 cursor-pointer transition-all group"
                          >
                            <div className="flex items-start justify-between mb-4">
                              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500/20 to-blue-500/20 flex items-center justify-center group-hover:from-emerald-500/30 group-hover:to-blue-500/30 transition-all">
                                <BusIcon className="h-7 w-7 text-emerald-400" />
                              </div>
                              <div className="text-right">
                                <div className="flex items-center gap-2">
                                  <UserCheck className="h-5 w-5 text-emerald-400" />
                                  <span className="text-2xl font-bold text-emerald-400">{confirmedCount}</span>
                                </div>
                                <p className="text-xs text-white/50">Rakaab</p>
                              </div>
                            </div>
                            <h3 className="font-semibold text-lg mb-1">{bus.name}</h3>
                            <p className="text-white/60 text-sm mb-2">{bus.busNumber}</p>
                            <div className="flex items-center gap-2 text-sm text-white/50">
                              <MapPin className="h-4 w-4" />
                              <span>{bus.from} → {bus.to}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-white/50 mt-1">
                              <Calendar className="h-4 w-4" />
                              <span>{bus.departureDate} - {bus.departureTime}</span>
                            </div>
                            <div className="mt-4 w-full h-2 bg-white/10 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all"
                                style={{ width: `${(confirmedCount / bus.totalSeats) * 100}%` }}
                              />
                            </div>
                            <p className="text-xs text-white/40 mt-2">{confirmedCount} ka mid ah {bus.totalSeats} kursi</p>
                          </div>
                        );
                      })}
                    </div>

                    {buses.length === 0 && (
                      <div className="bg-[#12121a] rounded-2xl border border-white/10 p-12 text-center">
                        <BusIcon className="h-16 w-16 mx-auto mb-4 text-white/20" />
                        <h3 className="text-xl font-semibold mb-2">Wali ma jirto bas</h3>
                        <p className="text-white/50">Ku dar baskaaga ugu horreeya</p>
                      </div>
                    )}
                  </>
                ) : (
                  // Passengers list for selected bus
                  <>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => setSelectedBusForPassengers(null)}
                          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                        >
                          <ArrowLeft className="h-5 w-5" />
                        </button>
                        <div>
                          <h2 className="text-2xl font-bold">{selectedBusForPassengers.name}</h2>
                          <p className="text-white/60">{selectedBusForPassengers.from} → {selectedBusForPassengers.to} | {selectedBusForPassengers.departureDate}</p>
                        </div>
                      </div>
                      
                      {/* Bulk SMS Button */}
                      {getConfirmedPassengersForBus(selectedBusForPassengers.id).length > 0 && (
                        <Button
                          onClick={() => setShowBulkSmsModal(true)}
                          className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white gap-2"
                        >
                          <Megaphone className="h-4 w-4" />
                          <span className="hidden sm:inline">Fariin u Dir</span> Dhamaan
                        </Button>
                      )}
                    </div>

                    {/* Stats for this bus */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <p className="text-2xl font-bold text-emerald-400">{getConfirmedPassengerCount(selectedBusForPassengers.id)}</p>
                        <p className="text-sm text-white/60">Rakaab Confirmed</p>
                      </div>
                      <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                        <p className="text-2xl font-bold text-blue-400">{getConfirmedPassengersForBus(selectedBusForPassengers.id).length}</p>
                        <p className="text-sm text-white/60">Bookings</p>
                      </div>
                      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                        <p className="text-2xl font-bold text-amber-400">{selectedBusForPassengers.totalSeats - getBookedSeats(selectedBusForPassengers.id).length}</p>
                        <p className="text-sm text-white/60">Kursi Bannaan</p>
                      </div>
                      <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
                        <p className="text-2xl font-bold text-purple-400">
                          ${getConfirmedPassengersForBus(selectedBusForPassengers.id).reduce((sum, b) => sum + b.totalAmount, 0)}
                        </p>
                        <p className="text-sm text-white/60">Dakhli</p>
                      </div>
                    </div>

                    {/* Search */}
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
                      <input
                        type="text"
                        placeholder="Raadi magaca, telefoonka, ama kursi..."
                        value={passengerSearch}
                        onChange={(e) => setPassengerSearch(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-[#12121a] border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>

                    {/* Passengers List */}
                    <div className="bg-[#12121a] rounded-2xl border border-white/10 overflow-hidden">
                      <div className="p-4 border-b border-white/10 bg-white/5">
                        <div className="grid grid-cols-12 gap-4 text-sm font-medium text-white/60">
                          <div className="col-span-1">#</div>
                          <div className="col-span-3">Rakaabka</div>
                          <div className="col-span-2">Kursi</div>
                          <div className="col-span-3">Telefoon</div>
                          <div className="col-span-2">Lacag</div>
                          <div className="col-span-1"></div>
                        </div>
                      </div>
                      <div className="divide-y divide-white/5">
                        {filteredPassengers.map((booking, bookingIndex) => {
                          const bookingUser = getUserById(booking.userId);
                          return (
                            <React.Fragment key={booking.id}>
                              {booking.passengers && booking.passengers.length > 0 ? (
                                booking.passengers.map((passenger, index) => (
                                  <div key={`${booking.id}-${index}`} className="p-4 hover:bg-white/5 transition-colors">
                                    <div className="grid grid-cols-12 gap-4 items-center">
                                      <div className="col-span-1">
                                        <span className="text-white/40 text-sm">{bookingIndex + 1}.{index + 1}</span>
                                      </div>
                                      <div className="col-span-3">
                                        <div className="flex items-center gap-3">
                                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center">
                                            <span className="text-xs font-bold">{passenger.passengerName.charAt(0)}</span>
                                          </div>
                                          <span className="font-medium">{passenger.passengerName}</span>
                                        </div>
                                      </div>
                                      <div className="col-span-2">
                                        <span className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold">
                                          #{passenger.seatNumber}
                                        </span>
                                      </div>
                                      <div className="col-span-3">
                                        <span className="text-white/60">{bookingUser?.phone || '-'}</span>
                                      </div>
                                      <div className="col-span-2">
                                        <span className="text-emerald-400 font-medium">
                                          ${(booking.totalAmount / booking.seatNumbers.length).toFixed(2)}
                                        </span>
                                      </div>
                                      <div className="col-span-1">
                                        <button
                                          onClick={() => setSelectedBooking(booking)}
                                          className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                                        >
                                          <Eye className="h-4 w-4" />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="p-4 hover:bg-white/5 transition-colors">
                                  <div className="grid grid-cols-12 gap-4 items-center">
                                    <div className="col-span-1">
                                      <span className="text-white/40 text-sm">{bookingIndex + 1}</span>
                                    </div>
                                    <div className="col-span-3">
                                      <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center">
                                          <span className="text-xs font-bold">{booking.userName.charAt(0)}</span>
                                        </div>
                                        <span className="font-medium">{booking.userName}</span>
                                      </div>
                                    </div>
                                    <div className="col-span-2">
                                      <div className="flex flex-wrap gap-1">
                                        {booking.seatNumbers.map(seat => (
                                          <span key={seat} className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-sm font-bold">
                                            #{seat}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                    <div className="col-span-3">
                                      <span className="text-white/60">{bookingUser?.phone || '-'}</span>
                                    </div>
                                    <div className="col-span-2">
                                      <span className="text-emerald-400 font-medium">${booking.totalAmount}</span>
                                    </div>
                                    <div className="col-span-1">
                                      <button
                                        onClick={() => setSelectedBooking(booking)}
                                        className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                                      >
                                        <Eye className="h-4 w-4" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </React.Fragment>
                          );
                        })}
                        {filteredPassengers.length === 0 && (
                          <div className="p-12 text-center text-white/40">
                            <UserCheck className="h-12 w-12 mx-auto mb-3 opacity-50" />
                            <p className="font-medium">Wali ma jirto rakaab confirmed</p>
                            <p className="text-sm mt-1">Marka booking la confirm-gareeyo, rakaabka waxay ka muuqan doonaan halkan</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* My Buses Tab */}
            {activeTab === 'buses' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold">Basaskeeyga</h2>
                    <p className="text-white/60">Maamul basaskaaga oo dhan</p>
                  </div>
                  <Button
                    onClick={() => setActiveTab('add')}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Bas Cusub
                  </Button>
                </div>

                {buses.length === 0 ? (
                  <div className="bg-[#12121a] rounded-2xl border border-white/10 p-12 text-center">
                    <BusIcon className="h-16 w-16 mx-auto mb-4 text-white/20" />
                    <h3 className="text-xl font-semibold mb-2">Wali ma jirto bas</h3>
                    <p className="text-white/50 mb-6">Ku dar baskaaga ugu horreeya hadda</p>
                    <Button
                      onClick={() => setActiveTab('add')}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Bas Cusub
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {/* Active Buses */}
                    {activeBuses.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          Basaska Active ({activeBuses.length})
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                          {activeBuses.map((bus) => {
                            const bookedSeats = getBookedSeats(bus.id);
                            const availableSeats = bus.totalSeats - bookedSeats.length;
                            const confirmedCount = getConfirmedPassengerCount(bus.id);
                            return (
                              <div key={bus.id} className="relative">
                                <BusCard
                                  bus={bus}
                                  isAdmin
                                  availableSeats={availableSeats}
                                  onEdit={() => handleEdit(bus)}
                                  onDelete={() => handleDelete(bus.id)}
                                />
                                {/* Confirmed passengers badge */}
                                <button
                                  onClick={() => handleViewBusPassengers(bus)}
                                  className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-500/90 text-white text-xs font-medium hover:bg-emerald-500 transition-colors"
                                >
                                  <UserCheck className="h-3 w-3" />
                                  {confirmedCount} rakaab
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Departed Buses - Need Renewal */}
                    {departedBuses.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-amber-500" />
                          Basaska Waqtigooda Dhaafay ({departedBuses.length})
                          <span className="text-xs font-normal text-white/50 ml-2">- U baahan dib u cusbooneysiin</span>
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                          {departedBuses.map((bus) => {
                            const confirmedCount = getConfirmedPassengerCount(bus.id);
                            return (
                              <div key={bus.id} className="relative bg-[#12121a] rounded-2xl border border-amber-500/30 overflow-hidden">
                                {/* Departed Badge */}
                                <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-amber-500/90 text-white text-xs font-medium">
                                  <History className="h-3 w-3" />
                                  Waqtiga dhaafay
                                </div>
                                
                                {/* Bus Info */}
                                <div className="p-5">
                                  <div className="flex items-center gap-4 mb-4">
                                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
                                      <BusIcon className="h-7 w-7 text-amber-400" />
                                    </div>
                                    <div>
                                      <h4 className="font-bold text-lg">{bus.name}</h4>
                                      <p className="text-sm text-white/60">{bus.from} → {bus.to}</p>
                                    </div>
                                  </div>
                                  
                                  <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                                    <div className="p-2 rounded-lg bg-white/5">
                                      <p className="text-white/50 text-xs">Taariikhii</p>
                                      <p className="font-medium">{bus.departureDate}</p>
                                    </div>
                                    <div className="p-2 rounded-lg bg-white/5">
                                      <p className="text-white/50 text-xs">Waqtigii</p>
                                      <p className="font-medium">{bus.departureTime}</p>
                                    </div>
                                    <div className="p-2 rounded-lg bg-white/5">
                                      <p className="text-white/50 text-xs">Rakaab raacay</p>
                                      <p className="font-medium text-emerald-400">{confirmedCount}</p>
                                    </div>
                                    <div className="p-2 rounded-lg bg-white/5">
                                      <p className="text-white/50 text-xs">Qiimaha</p>
                                      <p className="font-medium">${bus.ticketPrice}</p>
                                    </div>
                                  </div>
                                  
                                  {/* Actions */}
                                  <div className="flex gap-2">
                                    <Button
                                      onClick={() => openRenewModal(bus)}
                                      className="flex-1 bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600"
                                    >
                                      <RefreshCw className="h-4 w-4 mr-2" />
                                      Dib u Cusbooneysii
                                    </Button>
                                    <Button
                                      onClick={() => handleDelete(bus.id)}
                                      variant="outline"
                                      className="border-red-500/30 text-red-400 hover:bg-red-500/10 bg-transparent"
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Bookings Tab */}
            {activeTab === 'bookings' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Bookings-ka Basaska Active</h2>
                  <p className="text-white/60">Basaska aan weli bixin iyo dalabkooda - bas walba gooni ahaan</p>
                </div>

                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
                  <input
                    type="text"
                    placeholder="Raadi magaca, telefoonka, baska, magaalada..."
                    value={bookingSearch}
                    onChange={(e) => setBookingSearch(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-[#12121a] border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Bookings grouped by Active Buses only */}
                {activeBuses.length === 0 ? (
                  <div className="bg-[#12121a] rounded-2xl border border-white/10 p-12 text-center">
                    <BusIcon className="h-16 w-16 mx-auto mb-4 text-white/20" />
                    <h3 className="text-xl font-semibold mb-2">Wali ma jirto bas active ah</h3>
                    <p className="text-white/50 mb-4">Dhammaan basaskaagu waqtigooda ayaa dhaafay</p>
                    {departedBuses.length > 0 && (
                      <Button 
                        onClick={() => setActiveTab('trips')}
                        className="bg-amber-500 hover:bg-amber-600"
                      >
                        <History className="h-4 w-4 mr-2" />
                        Arag Safarada Kalay ({departedBuses.length})
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {activeBuses.map((bus) => {
                      const busBookings = filteredBookings.filter(b => b.busId === bus.id);
                      const totalRevenue = busBookings.reduce((sum, b) => sum + b.totalAmount, 0);
                      const confirmedCount = busBookings.filter(b => b.status === 'confirmed').length;
                      const pendingCount = busBookings.filter(b => b.status === 'booked').length;
                      
                      return (
                        <div key={bus.id} className="bg-[#12121a] rounded-2xl border border-white/10 overflow-hidden">
                          {/* Bus Header */}
                          <div className="p-4 bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border-b border-white/10">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-blue-500/20 flex items-center justify-center">
                                  <BusIcon className="h-6 w-6 text-emerald-400" />
                                </div>
                                <div>
                                  <h3 className="font-bold text-lg">{bus.name}</h3>
                                  <p className="text-sm text-white/60">{bus.from} → {bus.to} | {bus.departureDate} - {bus.departureTime}</p>
                                </div>
                              </div>
<div className="flex items-center gap-4">
                                                <div className="text-center px-3">
                                                  <p className="text-xl font-bold text-emerald-400">{busBookings.length}</p>
                                                  <p className="text-xs text-white/50">Bookings</p>
                                                </div>
                                                <div className="text-center px-3 border-l border-white/10">
                                                  <p className="text-xl font-bold text-amber-400">{pendingCount}</p>
                                                  <p className="text-xs text-white/50">Sugaya</p>
                                                </div>
                                                <div className="text-center px-3 border-l border-white/10">
                                                  <p className="text-xl font-bold text-blue-400">{confirmedCount}</p>
                                                  <p className="text-xs text-white/50">Confirmed</p>
                                                </div>
                                                <div className="text-center px-3 border-l border-white/10">
                                                  <p className="text-xl font-bold text-emerald-400">${totalRevenue}</p>
                                                  <p className="text-xs text-white/50">Dakhli</p>
                                                </div>
                                                {confirmedCount > 0 && (
                                                  <Button
                                                    onClick={() => {
                                                      setSelectedBusForPassengers(bus);
                                                      setShowBulkSmsModal(true);
                                                    }}
                                                    size="sm"
                                                    className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white gap-1.5 ml-2"
                                                  >
                                                    <Megaphone className="h-4 w-4" />
                                                    <span className="hidden lg:inline">Fariin</span>
                                                  </Button>
                                                )}
                                              </div>
                            </div>
                          </div>
                          
                          {/* Bookings Table for this Bus */}
                          {busBookings.length > 0 ? (
                            <div className="overflow-x-auto">
                              <table className="w-full">
                                <thead>
                                  <tr className="border-b border-white/10 bg-white/5">
                                    <th className="text-left p-4 text-sm font-medium text-white/60">Macmiil</th>
                                    <th className="text-left p-4 text-sm font-medium text-white/60">Rakaabka</th>
                                    <th className="text-left p-4 text-sm font-medium text-white/60">Kursiyo</th>
                                    <th className="text-left p-4 text-sm font-medium text-white/60">Lacag</th>
                                    <th className="text-left p-4 text-sm font-medium text-white/60">Xaalad</th>
                                    <th className="text-left p-4 text-sm font-medium text-white/60">Tallaabo</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                  {busBookings.map((booking) => {
                                    const bookingUser = getUserById(booking.userId);
                                    return (
                                      <tr key={booking.id} className="hover:bg-white/5 transition-colors">
                                        <td className="p-4">
                                          <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center">
                                              <span className="text-xs font-bold">{booking.userName.charAt(0)}</span>
                                            </div>
                                            <div>
                                              <p className="font-medium text-sm">{booking.userName}</p>
                                              <p className="text-xs text-white/50">{bookingUser?.phone || '-'}</p>
                                            </div>
                                          </div>
                                        </td>
                                        <td className="p-4">
                                          {booking.passengers && booking.passengers.length > 0 ? (
                                            <div className="space-y-1">
                                              {booking.passengers.slice(0, 2).map((p, i) => (
                                                <p key={i} className="text-xs text-white/70">
                                                  {p.passengerName} <span className="text-emerald-400">#{p.seatNumber}</span>
                                                </p>
                                              ))}
                                              {booking.passengers.length > 2 && (
                                                <p className="text-xs text-white/50">+{booking.passengers.length - 2} kale</p>
                                              )}
                                            </div>
                                          ) : (
                                            <span className="text-xs text-white/50">-</span>
                                          )}
                                        </td>
                                        <td className="p-4">
                                          <div className="flex flex-wrap gap-1">
                                            {booking.seatNumbers.slice(0, 4).map(seat => (
                                              <span key={seat} className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-xs font-medium">
                                                #{seat}
                                              </span>
                                            ))}
                                            {booking.seatNumbers.length > 4 && (
                                              <span className="px-2 py-0.5 rounded bg-white/10 text-xs font-medium">
                                                +{booking.seatNumbers.length - 4}
                                              </span>
                                            )}
                                          </div>
                                        </td>
                                        <td className="p-4">
                                          <span className="font-semibold text-emerald-400">${booking.totalAmount}</span>
                                        </td>
                                        <td className="p-4">
                                          <span className={`text-xs px-2 py-1 rounded-full ${
                                            booking.status === 'confirmed' 
                                              ? 'bg-emerald-500/20 text-emerald-400' 
                                              : booking.status === 'cancelled'
                                              ? 'bg-red-500/20 text-red-400'
                                              : 'bg-amber-500/20 text-amber-400'
                                          }`}>
                                            {booking.status === 'confirmed' ? 'Xaqiijiyay' : booking.status === 'cancelled' ? 'La tirtiray' : 'Sugaya'}
                                          </span>
                                        </td>
                                        <td className="p-4">
                                          <div className="flex items-center gap-1">
                                            <button
                                              onClick={() => setSelectedBooking(booking)}
                                              className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                                              title="Arag"
                                            >
                                              <Eye className="h-4 w-4" />
                                            </button>
                                            {booking.status === 'booked' && (
                                              <>
                                                <button
                                                  onClick={() => handleStatusUpdate(booking.id, 'confirmed')}
                                                  className="p-2 rounded-lg hover:bg-emerald-500/20 text-emerald-400 transition-colors"
                                                  title="Xaqiiji"
                                                >
                                                  <Check className="h-4 w-4" />
                                                </button>
                                                <button
                                                  onClick={() => handleStatusUpdate(booking.id, 'cancelled')}
                                                  className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
                                                  title="Tirtir"
                                                >
                                                  <XCircle className="h-4 w-4" />
                                                </button>
                                              </>
                                            )}
                                          </div>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <div className="p-8 text-center text-white/40">
                              <Ticket className="h-10 w-10 mx-auto mb-2 opacity-50" />
                              <p className="text-sm">Wali ma jirto booking baska</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Add/Edit Bus Tab */}
            {activeTab === 'add' && (
              <div className="max-w-2xl mx-auto">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold">{editingBusId ? 'Wax ka bedel Baska' : 'Ku Dar Bas Cusub'}</h2>
                  <p className="text-white/60">Buuxi macluumaadka baska</p>
                </div>

                <form onSubmit={handleSubmit} className="bg-[#12121a] rounded-2xl border border-white/10 p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-white/80">Magaca Baska</Label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Tusaale: Mogadishu Express"
                        required
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white/80">Lambarka Baska</Label>
                      <Input
                        value={formData.busNumber}
                        onChange={(e) => setFormData({ ...formData, busNumber: e.target.value })}
                        placeholder="Tusaale: BUS-001"
                        required
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white/80">Ka (Magaalada)</Label>
                      <Input
                        value={formData.from}
                        onChange={(e) => setFormData({ ...formData, from: e.target.value })}
                        placeholder="Tusaale: Mogadishu"
                        required
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white/80">Ilaa (Magaalada)</Label>
                      <Input
                        value={formData.to}
                        onChange={(e) => setFormData({ ...formData, to: e.target.value })}
                        placeholder="Tusaale: Hargeisa"
                        required
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white/80">Taariikhda Safarka</Label>
                      <Input
                        type="date"
                        value={formData.departureDate}
                        onChange={(e) => setFormData({ ...formData, departureDate: e.target.value })}
                        required
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white/80">Waqtiga Safarka</Label>
                      <Input
                        type="time"
                        value={formData.departureTime}
                        onChange={(e) => setFormData({ ...formData, departureTime: e.target.value })}
                        required
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white/80">Tirada Kuraasta</Label>
                      <Input
                        type="number"
                        value={formData.totalSeats}
                        onChange={(e) => setFormData({ ...formData, totalSeats: e.target.value })}
                        placeholder="40"
                        required
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white/80">Qiimaha Tigidhka ($)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.ticketPrice}
                        onChange={(e) => setFormData({ ...formData, ticketPrice: e.target.value })}
                        placeholder="15.00"
                        required
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/80">Sawirka URL (ikhtiyaari)</Label>
                    <Input
                      value={formData.imageUrl}
                      onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                      placeholder="https://example.com/bus-image.jpg"
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <Button
                      type="submit"
                      className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
                    >
                      {editingBusId ? 'Kaydi Isbedelka' : 'Ku Dar Baska'}
                    </Button>
                    {editingBusId && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setFormData(initialFormData);
                          setEditingBusId(null);
                        }}
                        className="border-white/20 text-white hover:bg-white/10"
                      >
                        Ka noqo
                      </Button>
                    )}
                  </div>
                </form>
              </div>
            )}
          </div>
        </main>

        {/* Booking Detail Modal */}
        {selectedBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => {
              setSelectedBooking(null);
              setSmsMessage('');
              setSmsSuccess(false);
            }} />
            <div className="relative bg-[#12121a] rounded-2xl border border-white/10 w-full max-w-lg max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="sticky top-0 bg-[#12121a] p-5 border-b border-white/10 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">Faahfaahinta Booking</h3>
                  <p className="text-sm text-white/50">#{selectedBooking.id.slice(-8).toUpperCase()}</p>
                </div>
                <button
                  onClick={() => {
                    setSelectedBooking(null);
                    setSmsMessage('');
                    setSmsSuccess(false);
                  }}
                  className="p-2 rounded-lg hover:bg-white/10 text-white/60"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-5 space-y-4">
                {/* Status Badge */}
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${
                  selectedBooking.status === 'confirmed' 
                    ? 'bg-emerald-500/20 text-emerald-400' 
                    : selectedBooking.status === 'cancelled'
                    ? 'bg-red-500/20 text-red-400'
                    : 'bg-amber-500/20 text-amber-400'
                }`}>
                  {selectedBooking.status === 'confirmed' ? <Check className="h-4 w-4" /> : 
                   selectedBooking.status === 'cancelled' ? <XCircle className="h-4 w-4" /> : 
                   <Clock className="h-4 w-4" />}
                  <span className="text-sm font-medium">
                    {selectedBooking.status === 'confirmed' ? 'La Xaqiijiyay' : 
                     selectedBooking.status === 'cancelled' ? 'La Tirtiray' : 'Sugaya Xaqiijin'}
                  </span>
                </div>

                {/* Customer Info */}
                <div className="p-4 rounded-xl bg-white/5 space-y-3">
                  <h4 className="font-medium text-emerald-400 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Macluumaadka Macmiilka
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-white/50">Magaca</p>
                      <p className="font-medium">{selectedBooking.userName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-white/50">Telefoon</p>
                      <p className="font-medium">{getUserById(selectedBooking.userId)?.phone || '-'}</p>
                    </div>
                  </div>
                </div>

                {/* Trip Info */}
                <div className="p-4 rounded-xl bg-white/5 space-y-3">
                  <h4 className="font-medium text-blue-400 flex items-center gap-2">
                    <BusIcon className="h-4 w-4" />
                    Macluumaadka Safarka
                  </h4>
                  {(() => {
                    const bus = getBusById(selectedBooking.busId);
                    return (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-white/50">Baska</span>
                          <span className="font-medium">{bus?.name}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-white/50">Route</span>
                          <span className="font-medium">{bus?.from} → {bus?.to}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-white/50">Taariikh</span>
                          <span className="font-medium">{selectedBooking.bookingDate}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-white/50">Waqti</span>
                          <span className="font-medium">{bus?.departureTime}</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Passengers */}
                <div className="p-4 rounded-xl bg-white/5 space-y-3">
                  <h4 className="font-medium text-purple-400 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Rakaabka iyo Kuraasta
                  </h4>
                  {selectedBooking.passengers && selectedBooking.passengers.length > 0 ? (
                    <div className="space-y-2">
                      {selectedBooking.passengers.map((p, i) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                          <span>{p.passengerName}</span>
                          <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 text-sm font-bold">
                            #{p.seatNumber}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {selectedBooking.seatNumbers.map(seat => (
                        <span key={seat} className="px-3 py-1 rounded-lg bg-purple-500/20 text-purple-400 font-bold">
                          #{seat}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Payment */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/20 to-blue-500/20 border border-emerald-500/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-emerald-400" />
                      <span className="text-white/60">Wadarta</span>
                    </div>
                    <span className="text-2xl font-bold text-emerald-400">${selectedBooking.totalAmount}</span>
                  </div>
                </div>

                {/* SMS Section */}
                <div className="p-4 rounded-xl bg-white/5 space-y-3">
                  <h4 className="font-medium text-amber-400 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Fariin u Dir Macmiilka
                  </h4>
                  
                  {smsSuccess && (
                    <div className="p-3 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-sm">
                      Fariinta waa la diray si guul leh!
                    </div>
                  )}
                  
                  <textarea
                    placeholder="Qor fariintaada halkan..."
                    value={smsMessage}
                    onChange={(e) => setSmsMessage(e.target.value)}
                    rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white placeholder:text-white/30 focus:border-amber-500 focus:outline-none resize-none text-sm"
                  />
                  
                  <Button
                    onClick={handleSendSms}
                    disabled={isSendingSms || !smsMessage.trim()}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-white disabled:opacity-50"
                  >
                    {isSendingSms ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        U Dir SMS
                      </>
                    )}
                  </Button>
                </div>

                {/* Actions */}
                {selectedBooking.status === 'booked' && (
                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleStatusUpdate(selectedBooking.id, 'confirmed')}
                      className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Xaqiiji
                    </Button>
                    <Button
                      onClick={() => handleStatusUpdate(selectedBooking.id, 'cancelled')}
                      variant="outline"
                      className="flex-1 border-red-500/50 text-red-400 hover:bg-red-500/10"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Tirtir
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Renew Bus Modal */}
        {renewBus && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#12121a] rounded-2xl border border-white/10 w-full max-w-md overflow-hidden">
              {/* Modal Header */}
              <div className="p-5 border-b border-white/10 bg-gradient-to-r from-emerald-500/10 to-blue-500/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                      <RefreshCw className="h-5 w-5 text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">Dib u Cusbooneysii Baska</h3>
                      <p className="text-sm text-white/60">{renewBus.name}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setRenewBus(null)}
                    className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-5 space-y-5">
                {/* Info */}
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <p className="text-sm text-amber-400">
                    Markii aad dib u cusbooneysiiso baska, booking-yadii hore waa la tirtiri doonaa oo bas-ku diyaar ayuu u noqon doonaa safar cusub.
                  </p>
                </div>

                {/* Route Display */}
                <div className="p-4 rounded-xl bg-white/5">
                  <p className="text-sm text-white/60 mb-2">Route-ka</p>
                  <p className="font-semibold">{renewBus.from} → {renewBus.to}</p>
                </div>

                {/* Date Input */}
                <div className="space-y-2">
                  <label className="text-sm text-white/60">Taariikhda Cusub</label>
                  <input
                    type="date"
                    value={renewDate}
                    onChange={(e) => setRenewDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Time Input */}
                <div className="space-y-2">
                  <label className="text-sm text-white/60">Waqtiga Bixitaanka</label>
                  <input
                    type="time"
                    value={renewTime}
                    onChange={(e) => setRenewTime(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={() => setRenewBus(null)}
                    variant="outline"
                    className="flex-1 border-white/10 hover:bg-white/5 bg-transparent"
                  >
                    Ka noqo
                  </Button>
                  <Button
                    onClick={handleRenewBus}
                    disabled={!renewDate || !renewTime}
                    className="flex-1 bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 disabled:opacity-50"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Dib u Cusbooneysii
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bulk SMS Modal */}
        {showBulkSmsModal && selectedBusForPassengers && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#12121a] rounded-2xl border border-white/10 w-full max-w-lg overflow-hidden">
              {/* Header */}
              <div className="p-6 border-b border-white/10 bg-gradient-to-r from-blue-500/20 to-cyan-500/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                      <Megaphone className="h-6 w-6 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">Fariin u Dir Dhamaan Rakaabka</h3>
                      <p className="text-sm text-white/60">{selectedBusForPassengers.name} - {getConfirmedPassengersForBus(selectedBusForPassengers.id).length} qof</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowBulkSmsModal(false);
                      setBulkSmsMessage('');
                      setBulkSmsResult(null);
                    }}
                    className="p-2 rounded-lg hover:bg-white/10 text-white/60"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                {/* Result Message */}
                {bulkSmsResult && (
                  <div className={`p-4 rounded-xl ${bulkSmsResult.failed === 0 ? 'bg-emerald-500/20 border border-emerald-500/30' : 'bg-amber-500/20 border border-amber-500/30'}`}>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className={`h-5 w-5 ${bulkSmsResult.failed === 0 ? 'text-emerald-400' : 'text-amber-400'}`} />
                      <div>
                        <p className={`font-semibold ${bulkSmsResult.failed === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {bulkSmsResult.sent} fariin ayaa la diray!
                        </p>
                        {bulkSmsResult.failed > 0 && (
                          <p className="text-xs text-amber-400/80">{bulkSmsResult.failed} fariin ayaa fashilantay</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Bus Info */}
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-3 mb-3">
                    <BusIcon className="h-5 w-5 text-emerald-400" />
                    <span className="font-medium">{selectedBusForPassengers.name}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm text-white/60">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>{selectedBusForPassengers.from} → {selectedBusForPassengers.to}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{selectedBusForPassengers.departureDate} - {selectedBusForPassengers.departureTime}</span>
                    </div>
                  </div>
                </div>

                {/* Message Input */}
                <div className="space-y-2">
                  <label className="text-sm text-white/60">Fariinta (Magaca, baska, iyo waqtiga ayaa automatic lagu dari doonaa)</label>
                  <textarea
                    value={bulkSmsMessage}
                    onChange={(e) => setBulkSmsMessage(e.target.value)}
                    placeholder="Tusaale: Fadlan 30 daqiiqo ka hor soo gaadhsi baska..."
                    rows={4}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder:text-white/40 focus:border-blue-500 focus:outline-none resize-none"
                    disabled={isSendingBulkSms}
                  />
                </div>

                {/* Preview */}
                {bulkSmsMessage && (
                  <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                    <p className="text-xs text-blue-400 mb-2">Preview (fariinta ugu horeeysa):</p>
                    <p className="text-sm text-white/80 whitespace-pre-line">
                      Salaamu Calaykum [Magaca Rakaabka],{'\n\n'}
                      {bulkSmsMessage}{'\n\n'}
                      Bas: {selectedBusForPassengers.name}{'\n'}
                      Safar: {selectedBusForPassengers.from} → {selectedBusForPassengers.to}{'\n'}
                      Taariikh: {selectedBusForPassengers.departureDate}{'\n'}
                      Waqti: {selectedBusForPassengers.departureTime}{'\n\n'}
                      Mahadsanid,{'\n'}BusBook
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={() => {
                      setShowBulkSmsModal(false);
                      setBulkSmsMessage('');
                      setBulkSmsResult(null);
                    }}
                    variant="outline"
                    className="flex-1 border-white/10 hover:bg-white/5 bg-transparent"
                    disabled={isSendingBulkSms}
                  >
                    Ka noqo
                  </Button>
                  <Button
                    onClick={handleSendBulkSms}
                    disabled={!bulkSmsMessage.trim() || isSendingBulkSms}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50"
                  >
                    {isSendingBulkSms ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Diraya...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        U Dir {getConfirmedPassengersForBus(selectedBusForPassengers.id).length} Qof
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
