// Backend API client for Deeqo bus booking

const API_BASE = typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_URL
  ? process.env.NEXT_PUBLIC_API_URL
  : ' https://deeqoa-1.onrender.com';

export type User = {
  id: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  role: 'super_admin' | 'bus_admin' | 'user';
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
};

export type Bus = {
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
};

export type PassengerInfo = { seatNumber: number; passengerName: string };

export type Booking = {
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
};

export type SavedRoute = {
  id: string;
  userId: string;
  from: string;
  to: string;
  createdAt: string;
};

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || res.statusText || 'Request failed');
  return data as T;
}

export async function healthCheck(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/health`);
    return res.ok;
  } catch {
    return false;
  }
}

export async function migrateFromLocalStorage(payload: {
  users: User[];
  buses: Bus[];
  bookings: Booking[];
  savedRoutes: SavedRoute[];
}): Promise<{ success: boolean; users: number; buses: number; bookings: number; savedRoutes: number }> {
  return request('/api/migrate', { method: 'POST', body: JSON.stringify(payload) });
}

// Users
export async function apiGetUsers(): Promise<User[]> {
  return request<User[]>('/api/users');
}
export async function apiGetUserById(id: string): Promise<User | null> {
  try {
    return await request<User>(`/api/users/${id}`);
  } catch {
    return null;
  }
}
export async function apiGetUserByEmail(email: string): Promise<User | null> {
  try {
    return await request<User>(`/api/users/email?email=${encodeURIComponent(email)}`);
  } catch {
    return null;
  }
}
export async function apiCreateUser(body: Omit<User, 'id' | 'createdAt'>): Promise<User> {
  return request<User>('/api/users', { method: 'POST', body: JSON.stringify(body) });
}
export async function apiUpdateUser(id: string, body: Partial<User>): Promise<User> {
  return request<User>(`/api/users/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
}
export async function apiUpdateUserStatus(id: string, status: User['status']): Promise<User> {
  return request<User>(`/api/users/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
}
export async function apiDeleteUser(id: string): Promise<void> {
  return request(`/api/users/${id}`, { method: 'DELETE' });
}
export async function apiGetPendingBusAdmins(): Promise<User[]> {
  return request<User[]>('/api/users/pending-admins');
}

// Buses
export async function apiGetBuses(params?: { from?: string; to?: string; date?: string }): Promise<Bus[]> {
  const q = new URLSearchParams();
  if (params?.from) q.set('from', params.from);
  if (params?.to) q.set('to', params.to);
  if (params?.date) q.set('date', params.date);
  const query = q.toString();
  return request<Bus[]>(`/api/buses${query ? `?${query}` : ''}`);
}
export async function apiGetBusById(id: string): Promise<Bus | null> {
  try {
    return await request<Bus>(`/api/buses/${id}`);
  } catch {
    return null;
  }
}
export async function apiGetBusesByAdminId(adminId: string): Promise<Bus[]> {
  return request<Bus[]>(`/api/buses/admin/${adminId}`);
}
export async function apiCreateBus(body: Omit<Bus, 'id' | 'createdAt'>): Promise<Bus> {
  return request<Bus>('/api/buses', { method: 'POST', body: JSON.stringify(body) });
}
export async function apiUpdateBus(id: string, body: Partial<Bus>): Promise<Bus> {
  return request<Bus>(`/api/buses/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
}
export async function apiDeleteBus(id: string): Promise<void> {
  return request(`/api/buses/${id}`, { method: 'DELETE' });
}

// Bookings
export async function apiGetBookings(): Promise<Booking[]> {
  return request<Booking[]>('/api/bookings');
}
export async function apiGetBookingById(id: string): Promise<Booking | null> {
  try {
    return await request<Booking>(`/api/bookings/${id}`);
  } catch {
    return null;
  }
}
export async function apiGetBookingsByUserId(userId: string): Promise<Booking[]> {
  return request<Booking[]>(`/api/bookings/user/${userId}`);
}
export async function apiGetBookingsByBusId(busId: string): Promise<Booking[]> {
  return request<Booking[]>(`/api/bookings/bus/${busId}`);
}
export async function apiGetBookedSeats(busId: string): Promise<number[]> {
  return request<number[]>(`/api/bookings/bus/${busId}/booked-seats`);
}
export async function apiCreateBooking(body: Omit<Booking, 'id' | 'createdAt'>): Promise<Booking> {
  return request<Booking>('/api/bookings', { method: 'POST', body: JSON.stringify(body) });
}
export async function apiUpdateBooking(id: string, body: Partial<Booking>): Promise<Booking> {
  return request<Booking>(`/api/bookings/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
}
export async function apiUpdateBookingStatus(id: string, status: Booking['status']): Promise<Booking> {
  return request<Booking>(`/api/bookings/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
}
export async function apiCancelBooking(id: string): Promise<{ success: boolean; refundAmount: number }> {
  return request(`/api/bookings/${id}/cancel`, { method: 'POST' });
}
export async function apiDeleteBooking(id: string): Promise<void> {
  return request(`/api/bookings/${id}`, { method: 'DELETE' });
}

// Saved routes
export async function apiGetSavedRoutes(): Promise<SavedRoute[]> {
  return request<SavedRoute[]>('/api/saved-routes');
}
export async function apiGetSavedRoutesByUserId(userId: string): Promise<SavedRoute[]> {
  return request<SavedRoute[]>(`/api/saved-routes/user/${userId}`);
}
export async function apiCreateSavedRoute(body: Omit<SavedRoute, 'id' | 'createdAt'>): Promise<SavedRoute> {
  return request<SavedRoute>('/api/saved-routes', { method: 'POST', body: JSON.stringify(body) });
}
export async function apiDeleteSavedRoute(id: string): Promise<void> {
  return request(`/api/saved-routes/${id}`, { method: 'DELETE' });
}

// Stats
export async function apiGetStats(): Promise<{
  totalUsers: number;
  totalBusAdmins: number;
  totalBuses: number;
  totalBookings: number;
  confirmedBookings: number;
  pendingBookings: number;
  totalRevenue: number;
}> {
  return request('/api/stats');
}
