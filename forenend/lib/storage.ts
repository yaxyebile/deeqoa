// localStorage helper functions for the bus booking system
// When backend is available, data is synced to MongoDB and reads/writes go through the API.

import * as api from './api';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  role: 'super_admin' | 'bus_admin' | 'user';
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface Bus {
  id: string;
  adminId: string;
  name: string;
  busNumber: string;
  totalSeats: number;
  from: string;
  to: string;
  departureTime: string;
  departureDate: string;
  ticketPrice: number;
  imageUrl: string;
  createdAt: string;
}

export interface PassengerInfo {
  seatNumber: number;
  passengerName: string;
}

export interface Booking {
  id: string;
  busId: string;
  userId: string;
  userName: string;
  seatNumbers: number[];
  passengers: PassengerInfo[];
  totalAmount: number;
  status: 'booked' | 'confirmed' | 'cancelled';
  bookingDate: string;
  createdAt: string;
}

export interface SavedRoute {
  id: string;
  userId: string;
  from: string;
  to: string;
  createdAt: string;
}

// Storage keys
const USERS_KEY = 'bus_booking_users';
const BUSES_KEY = 'bus_booking_buses';
const BOOKINGS_KEY = 'bus_booking_bookings';
const CURRENT_USER_KEY = 'bus_booking_current_user';
const SAVED_ROUTES_KEY = 'bus_booking_saved_routes';
const MIGRATED_KEY = 'deeqo_migrated';

declare global {
  interface Window {
    __deeqoUseBackend?: boolean;
    __deeqoCache?: { users: User[]; buses: Bus[]; bookings: Booking[]; savedRoutes: SavedRoute[] };
  }
}

function useBackend(): boolean {
  return typeof window !== 'undefined' && window.__deeqoUseBackend === true;
}

function getCache(): { users: User[]; buses: Bus[]; bookings: Booking[]; savedRoutes: SavedRoute[] } {
  if (typeof window === 'undefined') return { users: [], buses: [], bookings: [], savedRoutes: [] };
  if (!window.__deeqoCache) window.__deeqoCache = { users: [], buses: [], bookings: [], savedRoutes: [] };
  return window.__deeqoCache;
}

/** Migrate localStorage to MongoDB on first load, then use backend for CRUD. */
export async function runMigrationAndUseBackend(): Promise<void> {
  if (typeof window === 'undefined') return;
  const ok = await api.healthCheck();
  if (!ok) return;
  const alreadyMigrated = localStorage.getItem(MIGRATED_KEY);
  if (!alreadyMigrated) {
    const users = getUsersFromLocalStorage();
    const buses = getBusesFromLocalStorage();
    const bookings = getBookingsFromLocalStorage();
    const savedRoutes = getSavedRoutesFromLocalStorage();
    const hasData = users.length > 0 || buses.length > 0 || bookings.length > 0 || savedRoutes.length > 0;
    if (hasData) {
      try {
        await api.migrateFromLocalStorage({ users, buses, bookings, savedRoutes });
        localStorage.setItem(MIGRATED_KEY, '1');
      } catch (e) {
        console.warn('Migration failed:', e);
        return;
      }
    } else {
      localStorage.setItem(MIGRATED_KEY, '1');
    }
  }
  try {
    const [users, buses, bookings, savedRoutes] = await Promise.all([
      api.apiGetUsers(),
      api.apiGetBuses(),
      api.apiGetBookings(),
      api.apiGetSavedRoutes(),
    ]);
    const cache = getCache();
    cache.users = users;
    cache.buses = buses;
    cache.bookings = bookings;
    cache.savedRoutes = savedRoutes;
    window.__deeqoUseBackend = true;
  } catch (e) {
    console.warn('Backend fetch failed:', e);
  }
}

function getUsersFromLocalStorage(): User[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(USERS_KEY);
  return data ? JSON.parse(data) : [];
}
function getBusesFromLocalStorage(): Bus[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(BUSES_KEY);
  return data ? JSON.parse(data) : [];
}
function getBookingsFromLocalStorage(): Booking[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(BOOKINGS_KEY);
  return data ? JSON.parse(data) : [];
}
function getSavedRoutesFromLocalStorage(): SavedRoute[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(SAVED_ROUTES_KEY);
  return data ? JSON.parse(data) : [];
}

// Initialize default super admin if not exists
export function initializeStorage(): void {
  if (typeof window === 'undefined') return;
  const users = getUsers();
  const superAdminExists = users.some(u => u.role === 'super_admin');
  if (!superAdminExists) {
    const superAdmin: User = {
      id: 'super_admin_1',
      name: 'Super Admin',
      email: 'admin@busbook.com',
      phone: '614386039',
      password: 'admin123',
      role: 'super_admin',
      status: 'approved',
      createdAt: new Date().toISOString(),
    };
    saveUsers([...users, superAdmin]);
  }
}

// User operations
export function getUsers(): User[] {
  if (typeof window === 'undefined') return [];
  if (useBackend()) return getCache().users;
  return getUsersFromLocalStorage();
}

export function saveUsers(users: User[]): void {
  if (typeof window === 'undefined') return;
  if (useBackend()) { getCache().users = [...users]; return; }
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function getUserById(id: string): User | undefined {
  return getUsers().find(u => u.id === id);
}

export function getUserByEmail(email: string): User | undefined {
  return getUsers().find(u => u.email === email);
}

export async function createUser(user: Omit<User, 'id' | 'createdAt' | 'status'>): Promise<User> {
  const status: User['status'] = user.role === 'bus_admin' ? 'pending' : 'approved';
  const createdAt = new Date().toISOString();
  if (useBackend()) {
    const newUser = await api.apiCreateUser({ ...user, status });
    if (newUser.createdAt) (newUser as User).createdAt = typeof newUser.createdAt === 'string' ? newUser.createdAt : new Date(newUser.createdAt).toISOString();
    getCache().users.push(newUser as User);
    return newUser as User;
  }
  const newUser: User = {
    ...user,
    id: `user_${Date.now()}`,
    status,
    createdAt,
  };
  const users = getUsers();
  saveUsers([...users, newUser]);
  return newUser;
}

export async function updateUserStatus(userId: string, status: User['status']): Promise<void> {
  if (useBackend()) {
    await api.apiUpdateUserStatus(userId, status);
    const u = getCache().users.find(x => x.id === userId);
    if (u) u.status = status;
    return;
  }
  const users = getUsers();
  saveUsers(users.map(u => (u.id === userId ? { ...u, status } : u)));
}

export function getPendingBusAdmins(): User[] {
  return getUsers().filter(u => u.role === 'bus_admin' && u.status === 'pending');
}

export async function deleteUser(id: string): Promise<void> {
  if (useBackend()) {
    await api.apiDeleteUser(id);
    getCache().users = getCache().users.filter(u => u.id !== id);
    return;
  }
  saveUsers(getUsers().filter(u => u.id !== id));
}

// Current user (auth) operations
export function getCurrentUser(): User | null {
  if (typeof window === 'undefined') return null;
  const data = localStorage.getItem(CURRENT_USER_KEY);
  return data ? JSON.parse(data) : null;
}

export function setCurrentUser(user: User | null): void {
  if (typeof window === 'undefined') return;
  if (user) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(CURRENT_USER_KEY);
  }
}

// Bus operations
export function getBuses(): Bus[] {
  if (typeof window === 'undefined') return [];
  if (useBackend()) return getCache().buses;
  return getBusesFromLocalStorage();
}

export function saveBuses(buses: Bus[]): void {
  if (typeof window === 'undefined') return;
  if (useBackend()) { getCache().buses = [...buses]; return; }
  localStorage.setItem(BUSES_KEY, JSON.stringify(buses));
}

export function getBusById(id: string): Bus | undefined {
  return getBuses().find(b => b.id === id);
}

export function getBusesByAdminId(adminId: string): Bus[] {
  return getBuses().filter(b => b.adminId === adminId);
}

export async function createBus(bus: Omit<Bus, 'id' | 'createdAt'>): Promise<Bus> {
  if (useBackend()) {
    const newBus = await api.apiCreateBus(bus);
    const b = newBus as Bus;
    if (b.createdAt && typeof b.createdAt !== 'string') (b as Bus).createdAt = new Date(b.createdAt).toISOString();
    getCache().buses.push(b);
    return b;
  }
  const newBus: Bus = {
    ...bus,
    id: `bus_${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  const buses = getBuses();
  saveBuses([...buses, newBus]);
  return newBus;
}

export async function updateBus(id: string, updates: Partial<Bus>): Promise<Bus | undefined> {
  if (useBackend()) {
    const updated = await api.apiUpdateBus(id, updates);
    const idx = getCache().buses.findIndex(b => b.id === id);
    if (idx !== -1) getCache().buses[idx] = { ...getCache().buses[idx], ...updated } as Bus;
    return updated as Bus;
  }
  const buses = getBuses();
  const index = buses.findIndex(b => b.id === id);
  if (index === -1) return undefined;
  buses[index] = { ...buses[index], ...updates };
  saveBuses(buses);
  return buses[index];
}

export async function deleteBus(id: string): Promise<void> {
  if (useBackend()) {
    await api.apiDeleteBus(id);
    getCache().buses = getCache().buses.filter(b => b.id !== id);
    getCache().bookings = getCache().bookings.filter(b => b.busId !== id);
    return;
  }
  saveBuses(getBuses().filter(b => b.id !== id));
  saveBookings(getBookings().filter(b => b.busId !== id));
}

// Booking operations
export function getBookings(): Booking[] {
  if (typeof window === 'undefined') return [];
  if (useBackend()) return getCache().bookings;
  return getBookingsFromLocalStorage();
}

export function saveBookings(bookings: Booking[]): void {
  if (typeof window === 'undefined') return;
  if (useBackend()) { getCache().bookings = [...bookings]; return; }
  localStorage.setItem(BOOKINGS_KEY, JSON.stringify(bookings));
}

export function getBookingById(id: string): Booking | undefined {
  return getBookings().find(b => b.id === id);
}

export function getBookingsByUserId(userId: string): Booking[] {
  return getBookings().filter(b => b.userId === userId);
}

export function getBookingsByBusId(busId: string): Booking[] {
  return getBookings().filter(b => b.busId === busId);
}

export function getBookedSeats(busId: string): number[] {
  const bookings = getBookingsByBusId(busId).filter(b => b.status !== 'cancelled');
  return bookings.flatMap(b => b.seatNumbers);
}

export async function createBooking(booking: Omit<Booking, 'id' | 'createdAt'>): Promise<Booking> {
  if (useBackend()) {
    const newBooking = await api.apiCreateBooking(booking);
    const b = newBooking as Booking;
    if (b.createdAt && typeof b.createdAt !== 'string') (b as Booking).createdAt = new Date(b.createdAt).toISOString();
    getCache().bookings.push(b);
    return b;
  }
  const newBooking: Booking = {
    ...booking,
    id: `booking_${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  const bookings = getBookings();
  saveBookings([...bookings, newBooking]);
  return newBooking;
}

export async function updateBookingStatus(id: string, status: Booking['status']): Promise<Booking | undefined> {
  if (useBackend()) {
    const updated = await api.apiUpdateBookingStatus(id, status);
    const b = getCache().bookings.find(x => x.id === id);
    if (b) b.status = status;
    return updated as Booking;
  }
  const bookings = getBookings();
  const index = bookings.findIndex(b => b.id === id);
  if (index === -1) return undefined;
  bookings[index].status = status;
  saveBookings(bookings);
  return bookings[index];
}

export async function deleteBooking(id: string): Promise<void> {
  if (useBackend()) {
    await api.apiDeleteBooking(id);
    getCache().bookings = getCache().bookings.filter(b => b.id !== id);
    return;
  }
  saveBookings(getBookings().filter(b => b.id !== id));
}

export function deleteBookingsByBusId(busId: string): void {
  if (useBackend()) {
    getCache().bookings = getCache().bookings.filter(b => b.busId !== busId);
    return;
  }
  saveBookings(getBookings().filter(b => b.busId !== busId));
}

// Search buses by from, to, and date
export function searchBuses(from?: string, to?: string, date?: string): Bus[] {
  let buses = getBuses();
  if (from) buses = buses.filter(b => b.from.toLowerCase().includes(from.toLowerCase()));
  if (to) buses = buses.filter(b => b.to.toLowerCase().includes(to.toLowerCase()));
  if (date) buses = buses.filter(b => b.departureDate === date);
  return buses;
}

// Saved Routes operations
export function getSavedRoutes(): SavedRoute[] {
  if (typeof window === 'undefined') return [];
  if (useBackend()) return getCache().savedRoutes;
  return getSavedRoutesFromLocalStorage();
}

export function getSavedRoutesByUserId(userId: string): SavedRoute[] {
  return getSavedRoutes().filter(r => r.userId === userId);
}

export function saveSavedRoutes(routes: SavedRoute[]): void {
  if (typeof window === 'undefined') return;
  if (useBackend()) { getCache().savedRoutes = [...routes]; return; }
  localStorage.setItem(SAVED_ROUTES_KEY, JSON.stringify(routes));
}

export async function addSavedRoute(userId: string, from: string, to: string): Promise<SavedRoute | null> {
  const existing = getSavedRoutes().find(
    r => r.userId === userId && r.from.toLowerCase() === from.toLowerCase() && r.to.toLowerCase() === to.toLowerCase()
  );
  if (existing) return null;
  if (useBackend()) {
    const newRoute = await api.apiCreateSavedRoute({ userId, from, to });
    const r = newRoute as SavedRoute;
    if (r.createdAt && typeof r.createdAt !== 'string') (r as SavedRoute).createdAt = new Date(r.createdAt).toISOString();
    getCache().savedRoutes.push(r);
    return r;
  }
  const newRoute: SavedRoute = {
    id: `route_${Date.now()}`,
    userId,
    from,
    to,
    createdAt: new Date().toISOString(),
  };
  const routes = getSavedRoutes();
  saveSavedRoutes([...routes, newRoute]);
  return newRoute;
}

export async function deleteSavedRoute(id: string): Promise<void> {
  if (useBackend()) {
    await api.apiDeleteSavedRoute(id);
    getCache().savedRoutes = getCache().savedRoutes.filter(r => r.id !== id);
    return;
  }
  saveSavedRoutes(getSavedRoutes().filter(r => r.id !== id));
}

// Cancel booking and return refund info
export async function cancelBooking(bookingId: string): Promise<{ success: boolean; refundAmount: number; error?: string }> {
  const booking = getBookingById(bookingId);
  if (!booking) return { success: false, refundAmount: 0, error: 'Booking not found' };
  if (booking.status === 'cancelled') return { success: false, refundAmount: 0, error: 'Booking already cancelled' };
  const bus = getBusById(booking.busId);
  if (!bus) return { success: false, refundAmount: 0, error: 'Bus not found' };
  if (useBackend()) {
    try {
      const result = await api.apiCancelBooking(bookingId);
      const b = getCache().bookings.find(x => x.id === bookingId);
      if (b) b.status = 'cancelled';
      return { success: result.success, refundAmount: result.refundAmount };
    } catch (e: unknown) {
      return { success: false, refundAmount: 0, error: (e as Error)?.message || 'Cancel failed' };
    }
  }
  const now = new Date();
  const [hours, minutes] = bus.departureTime.split(':').map(Number);
  const busDateTime = new Date(bus.departureDate);
  busDateTime.setHours(hours, minutes, 0, 0);
  if (now > busDateTime) return { success: false, refundAmount: 0, error: 'Cannot cancel after departure' };
  const hoursUntilDeparture = (busDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
  const refundPercent = hoursUntilDeparture >= 24 ? 100 : 50;
  const refundAmount = (booking.totalAmount * refundPercent) / 100;
  await updateBookingStatus(bookingId, 'cancelled');
  return { success: true, refundAmount };
}

// Dashboard stats
export async function getStats(): Promise<{
  totalUsers: number;
  totalBusAdmins: number;
  totalBuses: number;
  totalBookings: number;
  confirmedBookings: number;
  pendingBookings: number;
  totalRevenue: number;
}> {
  if (useBackend()) return api.apiGetStats();
  const users = getUsers();
  const buses = getBuses();
  const bookings = getBookings();
  return {
    totalUsers: users.filter(u => u.role === 'user').length,
    totalBusAdmins: users.filter(u => u.role === 'bus_admin').length,
    totalBuses: buses.length,
    totalBookings: bookings.length,
    confirmedBookings: bookings.filter(b => b.status === 'confirmed').length,
    pendingBookings: bookings.filter(b => b.status === 'booked').length,
    totalRevenue: bookings.filter(b => b.status !== 'cancelled').reduce((sum, b) => sum + b.totalAmount, 0),
  };
}
