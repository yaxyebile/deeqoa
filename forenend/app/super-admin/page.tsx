'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/protected-route';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/auth-context';
import { 
  getStats, 
  getUsers, 
  getBuses, 
  getBookings, 
  deleteUser, 
  deleteBus, 
  deleteBooking,
  updateUserStatus,
  getPendingBusAdmins,
  type User,
  type Bus,
  type Booking,
  getBusById,
  getUserById
} from '@/lib/storage';
import { sendSMS } from '@/lib/sms-service';
import { 
  Users, 
  Bus as BusIcon, 
  Ticket, 
  DollarSign, 
  Trash2, 
  UserCircle,
  MapPin,
  Clock,
  Calendar,
  LayoutDashboard,
  Search,
  TrendingUp,
  ChevronRight,
  LogOut,
  Settings,
  Bell,
  MoreVertical,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Phone,
  UserCheck,
  Check,
  X
} from 'lucide-react';

type TabType = 'overview' | 'approvals' | 'users' | 'buses' | 'bookings';

export default function SuperAdminDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBusAdmins: 0,
    totalBuses: 0,
    totalBookings: 0,
    confirmedBookings: 0,
    pendingBookings: 0,
    totalRevenue: 0,
  });
  const [users, setUsers] = useState<User[]>([]);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [pendingAdmins, setPendingAdmins] = useState<User[]>([]);

  const loadData = async () => {
    const statsData = await getStats();
    setStats(statsData);
    setUsers(getUsers().filter(u => u.role !== 'super_admin'));
    setBuses(getBuses());
    setBookings(getBookings());
    setPendingAdmins(getPendingBusAdmins());
  };

  const handleApproveAdmin = async (adminUser: User) => {
    await updateUserStatus(adminUser.id, 'approved');
    
    // Send approval SMS
    try {
      await sendSMS(adminUser.phone, `Hambalyo ${adminUser.name}! Waad ku guulaysatay inaad ka mid noqoto darawalada BusBook. Fadlan macaamiisha ka taxadar oo adeeg wanaagsan sii. Ku soo dhawoow kooxda BusBook!`);
    } catch (error) {
      console.error('Failed to send approval SMS:', error);
    }
    
    loadData();
  };

  const handleRejectAdmin = async (adminUser: User) => {
    await updateUserStatus(adminUser.id, 'rejected');
    
    // Send rejection SMS
    try {
      await sendSMS(adminUser.phone, `${adminUser.name}, waan ka xunnahay in codsigaaga BusBook la diiday. Fadlan la xiriir admin@busbook.com haddii aad su'aalo qabtid.`);
    } catch (error) {
      console.error('Failed to send rejection SMS:', error);
    }
    
    loadData();
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDeleteUser = async (id: string) => {
    if (confirm('Ma hubtaa inaad tirtirto user-kan?')) {
      await deleteUser(id);
      loadData();
    }
  };

  const handleDeleteBus = async (id: string) => {
    if (confirm('Ma hubtaa inaad tirtirto bus-kan? Dhammaan booking-yada la xiriira ayaa la tirtiri doonaa.')) {
      await deleteBus(id);
      loadData();
    }
  };

  const handleDeleteBooking = async (id: string) => {
    if (confirm('Ma hubtaa inaad tirtirto booking-kan?')) {
      await deleteBooking(id);
      loadData();
    }
  };

  const navItems = [
    { id: 'overview' as const, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'approvals' as const, label: 'Codsiyada', icon: UserCheck, badge: pendingAdmins.length },
    { id: 'users' as const, label: 'Isticmaalayaasha', icon: Users },
    { id: 'buses' as const, label: 'Basaska', icon: BusIcon },
    { id: 'bookings' as const, label: 'Booking-yada', icon: Ticket },
  ];

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredBuses = buses.filter(b => 
    b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.to.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredBookings = bookings.filter(b => {
    const bus = getBusById(b.busId);
    return b.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (bus?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <ProtectedRoute allowedRoles={['super_admin']}>
      <div className="min-h-screen bg-[#0a0a0f] flex">
        {/* Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 bg-[#0f0f15] border-r border-[#1a1a25]">
          {/* Logo */}
          <div className="p-6 border-b border-[#1a1a25]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <BusIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-white">BusBook</h1>
                <p className="text-xs text-gray-500">Admin Panel</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider px-3 mb-4">Menu</p>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    activeTab === item.id
                      ? 'bg-primary/10 text-primary'
                      : 'text-gray-400 hover:bg-[#1a1a25] hover:text-white'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="ml-auto px-2 py-0.5 rounded-full bg-amber-500 text-white text-xs font-bold">
                      {item.badge}
                    </span>
                  )}
                  {activeTab === item.id && !item.badge && (
                    <ChevronRight className="h-4 w-4 ml-auto" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* User Profile */}
          <div className="p-4 border-t border-[#1a1a25]">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-[#1a1a25]">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <span className="text-white font-bold">{user?.name?.charAt(0) || 'A'}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user?.name || 'Admin'}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={logout}
                className="text-gray-400 hover:text-white hover:bg-[#252530]"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-h-screen">
          {/* Top Header */}
          <header className="sticky top-0 z-10 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-[#1a1a25]">
            <div className="flex items-center justify-between px-6 py-4">
              {/* Mobile Menu */}
              <div className="lg:hidden flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <BusIcon className="h-5 w-5 text-white" />
                </div>
                <span className="font-bold text-white">BusBook</span>
              </div>

              {/* Search */}
              <div className="hidden md:flex flex-1 max-w-md mx-4">
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Raadi..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-[#1a1a25] border-[#252530] text-white placeholder:text-gray-500 focus:border-primary"
                  />
                </div>
              </div>

              {/* Header Actions */}
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-[#1a1a25]">
                  <Bell className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-[#1a1a25]">
                  <Settings className="h-5 w-5" />
                </Button>
                <div className="lg:hidden">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={logout}
                    className="text-gray-400 hover:text-white hover:bg-[#1a1a25]"
                  >
                    <LogOut className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Mobile Tab Navigation */}
            <div className="lg:hidden flex gap-1 px-2 sm:px-4 pb-3 sm:pb-4 overflow-x-auto scrollbar-hide">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`relative flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${
                      activeTab === item.id
                        ? 'bg-primary text-white'
                        : 'bg-[#1a1a25] text-gray-400'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="hidden xs:inline">{item.label}</span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] flex items-center justify-center font-bold">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 p-3 sm:p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Page Title */}
                <div>
                  <h2 className="text-2xl font-bold text-white">Dashboard</h2>
                  <p className="text-gray-500">Soo dhawoow, {user?.name || 'Admin'}</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="bg-[#0f0f15] border-[#1a1a25]">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Isticmaalayaasha</p>
                          <p className="text-3xl font-bold text-white">{stats.totalUsers}</p>
                          <div className="flex items-center gap-1 mt-2">
                            <TrendingUp className="h-4 w-4 text-primary" />
                            <span className="text-xs text-primary">+12%</span>
                          </div>
                        </div>
                        <div className="p-3 rounded-xl bg-primary/10">
                          <Users className="h-6 w-6 text-primary" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-[#0f0f15] border-[#1a1a25]">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Basaska</p>
                          <p className="text-3xl font-bold text-white">{stats.totalBuses}</p>
                          <div className="flex items-center gap-1 mt-2">
                            <TrendingUp className="h-4 w-4 text-secondary" />
                            <span className="text-xs text-secondary">+8%</span>
                          </div>
                        </div>
                        <div className="p-3 rounded-xl bg-secondary/10">
                          <BusIcon className="h-6 w-6 text-secondary" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-[#0f0f15] border-[#1a1a25]">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Booking-yada</p>
                          <p className="text-3xl font-bold text-white">{stats.totalBookings}</p>
                          <div className="flex items-center gap-1 mt-2">
                            <TrendingUp className="h-4 w-4 text-emerald-500" />
                            <span className="text-xs text-emerald-500">+24%</span>
                          </div>
                        </div>
                        <div className="p-3 rounded-xl bg-emerald-500/10">
                          <Ticket className="h-6 w-6 text-emerald-500" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-[#0f0f15] border-[#1a1a25]">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Dakhliga Guud</p>
                          <p className="text-3xl font-bold text-white">${stats.totalRevenue.toLocaleString()}</p>
                          <div className="flex items-center gap-1 mt-2">
                            <TrendingUp className="h-4 w-4 text-amber-500" />
                            <span className="text-xs text-amber-500">+18%</span>
                          </div>
                        </div>
                        <div className="p-3 rounded-xl bg-amber-500/10">
                          <DollarSign className="h-6 w-6 text-amber-500" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Booking Status */}
                  <Card className="bg-[#0f0f15] border-[#1a1a25] lg:col-span-2">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h3 className="text-lg font-semibold text-white">Xaalada Booking-yada</h3>
                          <p className="text-sm text-gray-500">Todobaadkan</p>
                        </div>
                        <Button variant="ghost" size="icon" className="text-gray-400">
                          <MoreVertical className="h-5 w-5" />
                        </Button>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-primary" />
                                <span className="text-sm text-gray-300">La xaqiijiyay</span>
                              </div>
                              <span className="text-sm font-medium text-white">{stats.confirmedBookings}</span>
                            </div>
                            <div className="h-2 bg-[#1a1a25] rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full transition-all"
                                style={{ width: `${stats.totalBookings > 0 ? (stats.confirmedBookings / stats.totalBookings) * 100 : 0}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <AlertCircle className="h-4 w-4 text-amber-500" />
                                <span className="text-sm text-gray-300">Sugaya</span>
                              </div>
                              <span className="text-sm font-medium text-white">{stats.pendingBookings}</span>
                            </div>
                            <div className="h-2 bg-[#1a1a25] rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-amber-500 to-amber-500/60 rounded-full transition-all"
                                style={{ width: `${stats.totalBookings > 0 ? (stats.pendingBookings / stats.totalBookings) * 100 : 0}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <XCircle className="h-4 w-4 text-red-500" />
                                <span className="text-sm text-gray-300">La joojiyay</span>
                              </div>
                              <span className="text-sm font-medium text-white">
                                {stats.totalBookings - stats.confirmedBookings - stats.pendingBookings}
                              </span>
                            </div>
                            <div className="h-2 bg-[#1a1a25] rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-red-500 to-red-500/60 rounded-full transition-all"
                                style={{ width: `${stats.totalBookings > 0 ? ((stats.totalBookings - stats.confirmedBookings - stats.pendingBookings) / stats.totalBookings) * 100 : 0}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Quick Stats */}
                  <Card className="bg-[#0f0f15] border-[#1a1a25]">
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold text-white mb-6">Xogta Degdega ah</h3>
                      
                      <div className="space-y-4">
                        <div className="p-4 rounded-xl bg-[#1a1a25]">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-400">Maamuleyaasha Bas</span>
                            <span className="text-lg font-bold text-white">{stats.totalBusAdmins}</span>
                          </div>
                        </div>
                        
                        <div className="p-4 rounded-xl bg-[#1a1a25]">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-400">Rakaabka Cusub</span>
                            <span className="text-lg font-bold text-white">{stats.totalUsers - stats.totalBusAdmins}</span>
                          </div>
                        </div>
                        
                        <div className="p-4 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/20">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-300">Celceliska Qiimaha</span>
                            <span className="text-lg font-bold text-primary">
                              ${stats.totalBookings > 0 ? Math.round(stats.totalRevenue / stats.totalBookings) : 0}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Activity */}
                <Card className="bg-[#0f0f15] border-[#1a1a25]">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-white">Booking-yada Ugu Dambeeyay</h3>
                      <Button 
                        variant="ghost" 
                        className="text-primary text-sm"
                        onClick={() => setActiveTab('bookings')}
                      >
                        Arag Dhammaan
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                    
                    <div className="space-y-3">
                      {bookings.slice(0, 5).map((booking) => {
                        const bus = getBusById(booking.busId);
                        return (
                          <div 
                            key={booking.id}
                            className="flex items-center justify-between p-4 rounded-xl bg-[#1a1a25] hover:bg-[#252530] transition-colors"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                                <Ticket className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium text-white">{booking.userName}</p>
                                <p className="text-sm text-gray-500">{bus?.name} - {bus?.from} → {bus?.to}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-white">${booking.totalAmount}</p>
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                booking.status === 'confirmed' 
                                  ? 'bg-primary/10 text-primary' 
                                  : booking.status === 'cancelled'
                                  ? 'bg-red-500/10 text-red-500'
                                  : 'bg-amber-500/10 text-amber-500'
                              }`}>
                                {booking.status === 'confirmed' ? 'La xaqiijiyay' : 
                                 booking.status === 'cancelled' ? 'La joojiyay' : 'Sugaya'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                      
                      {bookings.length === 0 && (
                        <div className="text-center py-8">
                          <Ticket className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                          <p className="text-gray-500">Weli booking ma jiro</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Approvals Tab - Pending Bus Admin Requests */}
            {activeTab === 'approvals' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-white">Codsiyada Bus Admin</h2>
                  <p className="text-gray-500">Ansixinta Bus Operators cusub</p>
                </div>

                {pendingAdmins.length === 0 ? (
                  <Card className="bg-[#12121a] border-[#1a1a25]">
                    <CardContent className="py-12">
                      <div className="text-center">
                        <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                          <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">Codsi ma jiro</h3>
                        <p className="text-gray-500">Dhammaan codsiyada waa la ansixiyay</p>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {pendingAdmins.map((admin) => (
                      <Card key={admin.id} className="bg-[#12121a] border-amber-500/30 overflow-hidden">
                        {/* Pending Badge */}
                        <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 px-4 py-2 border-b border-amber-500/20">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-amber-500" />
                            <span className="text-sm font-medium text-amber-500">Sugaya Ansixinta</span>
                          </div>
                        </div>
                        
                        <CardContent className="p-5">
                          {/* User Info */}
                          <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
                              <span className="text-lg font-bold text-amber-500">{admin.name.charAt(0)}</span>
                            </div>
                            <div>
                              <h3 className="font-semibold text-white">{admin.name}</h3>
                              <p className="text-sm text-gray-500">{admin.email}</p>
                            </div>
                          </div>

                          {/* Contact Info */}
                          <div className="space-y-2 mb-4 p-3 rounded-lg bg-[#0a0a0f]">
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="h-4 w-4 text-gray-500" />
                              <span className="text-gray-400">{admin.phone}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="h-4 w-4 text-gray-500" />
                              <span className="text-gray-400">
                                {new Date(admin.createdAt).toLocaleDateString('so-SO')}
                              </span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleApproveAdmin(admin)}
                              className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
                            >
                              <Check className="h-4 w-4 mr-2" />
                              Ansixii
                            </Button>
                            <Button
                              onClick={() => handleRejectAdmin(admin)}
                              variant="outline"
                              className="flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10 bg-transparent"
                            >
                              <X className="h-4 w-4 mr-2" />
                              Diid
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-white">Isticmaalayaasha</h2>
                    <p className="text-gray-500">Maamul dhammaan isticmaalayaasha</p>
                  </div>
                  <div className="md:hidden">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                      <Input
                        placeholder="Raadi..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 w-48 bg-[#1a1a25] border-[#252530] text-white placeholder:text-gray-500"
                      />
                    </div>
                  </div>
                </div>

                <Card className="bg-[#0f0f15] border-[#1a1a25]">
                  <CardContent className="p-0">
                    {filteredUsers.length === 0 ? (
                      <div className="text-center py-16">
                        <Users className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-400 text-lg">Ma jiro user la helay</p>
                        <p className="text-gray-600 text-sm mt-1">Isku day raadin kale</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-[#1a1a25]">
                        {filteredUsers.map((userData) => (
                          <div
                            key={userData.id}
                            className="flex items-center justify-between p-5 hover:bg-[#1a1a25]/50 transition-colors"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                                <span className="text-lg font-bold text-primary">{userData.name.charAt(0)}</span>
                              </div>
                              <div>
                                <p className="font-semibold text-white">{userData.name}</p>
                                <p className="text-sm text-gray-500">{userData.email}</p>
                                {userData.phone && (
                                  <p className="text-xs text-gray-600 flex items-center gap-1 mt-1">
                                    <Phone className="h-3 w-3" />
                                    {userData.phone}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${
                                userData.role === 'bus_admin' 
                                  ? 'bg-secondary/10 text-secondary' 
                                  : 'bg-primary/10 text-primary'
                              }`}>
                                {userData.role === 'bus_admin' ? 'Maamulaha Bas' : 'Rakaab'}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteUser(userData.id)}
                                className="text-gray-500 hover:text-red-500 hover:bg-red-500/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Buses Tab */}
            {activeTab === 'buses' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-white">Basaska</h2>
                    <p className="text-gray-500">Dhammaan basaska nidaamka</p>
                  </div>
                </div>

                {filteredBuses.length === 0 ? (
                  <Card className="bg-[#0f0f15] border-[#1a1a25]">
                    <CardContent className="py-16 text-center">
                      <BusIcon className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-400 text-lg">Ma jiro bas la helay</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredBuses.map((bus) => (
                      <Card key={bus.id} className="bg-[#0f0f15] border-[#1a1a25] overflow-hidden group hover:border-primary/30 transition-colors">
                        <CardContent className="p-0">
                          {bus.imageUrl && (
                            <div className="h-40 overflow-hidden">
                              <img 
                                src={bus.imageUrl || "/placeholder.svg"} 
                                alt={bus.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            </div>
                          )}
                          <div className="p-5">
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <h3 className="font-bold text-white text-lg">{bus.name}</h3>
                                <p className="text-sm text-gray-500">{bus.busNumber}</p>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteBus(bus.id)}
                                className="text-gray-500 hover:text-red-500 hover:bg-red-500/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            
                            <div className="space-y-3 text-sm">
                              <div className="flex items-center gap-3 text-gray-400">
                                <MapPin className="h-4 w-4 text-primary" />
                                <span>{bus.from} → {bus.to}</span>
                              </div>
                              <div className="flex items-center gap-3 text-gray-400">
                                <Calendar className="h-4 w-4 text-secondary" />
                                <span>{bus.departureDate}</span>
                              </div>
                              <div className="flex items-center gap-3 text-gray-400">
                                <Clock className="h-4 w-4 text-amber-500" />
                                <span>{bus.departureTime}</span>
                              </div>
                            </div>

                            <div className="flex justify-between items-center mt-5 pt-4 border-t border-[#1a1a25]">
                              <span className="text-gray-500">{bus.totalSeats} kursi</span>
                              <span className="text-xl font-bold text-primary">${bus.ticketPrice}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Bookings Tab */}
            {activeTab === 'bookings' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-white">Booking-yada</h2>
                    <p className="text-gray-500">Dhammaan dalabayaasha tigidhada</p>
                  </div>
                </div>

                <Card className="bg-[#0f0f15] border-[#1a1a25]">
                  <CardContent className="p-0">
                    {filteredBookings.length === 0 ? (
                      <div className="text-center py-16">
                        <Ticket className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-400 text-lg">Ma jiro booking la helay</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-[#1a1a25]">
                        {filteredBookings.map((booking) => {
                          const bus = getBusById(booking.busId);
                          const bookingUser = getUserById(booking.userId);
                          return (
                            <div
                              key={booking.id}
                              className="p-5 hover:bg-[#1a1a25]/50 transition-colors"
                            >
                              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                <div className="flex items-start gap-4">
                                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center flex-shrink-0">
                                    <Ticket className="h-6 w-6 text-primary" />
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-3 mb-1">
                                      <span className="font-semibold text-white">{bus?.name || 'Unknown Bus'}</span>
                                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                        booking.status === 'confirmed' 
                                          ? 'bg-primary/10 text-primary' 
                                          : booking.status === 'cancelled'
                                          ? 'bg-red-500/10 text-red-500'
                                          : 'bg-amber-500/10 text-amber-500'
                                      }`}>
                                        {booking.status === 'confirmed' ? 'La xaqiijiyay' : 
                                         booking.status === 'cancelled' ? 'La joojiyay' : 'Sugaya'}
                                      </span>
                                    </div>
                                    <p className="text-sm text-gray-400 mb-1">
                                      Dalabay: <span className="text-gray-300">{bookingUser?.name || booking.userName}</span>
                                    </p>
                                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                                      <span>Kursi: {booking.seatNumbers.join(', ')}</span>
                                      <span>Taariikh: {booking.bookingDate}</span>
                                    </div>
                                    {booking.passengers && booking.passengers.length > 0 && (
                                      <div className="mt-2 flex flex-wrap gap-2">
                                        {booking.passengers.map((p, i) => (
                                          <span key={i} className="text-xs px-2 py-1 rounded bg-[#1a1a25] text-gray-400">
                                            {p.seatNumber}: {p.passengerName}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-4 ml-16 lg:ml-0">
                                  <span className="text-xl font-bold text-primary">${booking.totalAmount}</span>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeleteBooking(booking.id)}
                                    className="text-gray-500 hover:text-red-500 hover:bg-red-500/10"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
