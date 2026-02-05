'use client';

import React from "react"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bus, UserPlus, Clock, ArrowRight } from 'lucide-react';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'bus_admin' | 'user'>('user');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pendingApproval, setPendingApproval] = useState(false);
  const { register, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      redirectBasedOnRole(user.role);
    }
  }, [user]);

  const redirectBasedOnRole = (userRole: string) => {
    switch (userRole) {
      case 'super_admin':
        router.push('/super-admin');
        break;
      case 'bus_admin':
        router.push('/bus-admin');
        break;
      case 'user':
        router.push('/dashboard');
        break;
      default:
        router.push('/');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (!phone || phone.length < 9) {
      setError('Please enter a valid phone number');
      return;
    }

    setIsLoading(true);

    const result = await register(name, email, phone, password, role);
    
    if (!result.success) {
      setError(result.error || 'Registration failed');
      setIsLoading(false);
    } else if (result.pendingApproval) {
      // Bus admin needs approval
      setPendingApproval(true);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-6 sm:mb-8">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <div className="p-2 sm:p-3 bg-primary rounded-lg sm:rounded-xl">
              <Bus className="h-6 w-6 sm:h-8 sm:w-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">BusBook</h1>
          </div>
          <p className="text-muted-foreground text-sm sm:text-base">Online Bus Ticket Booking System</p>
        </div>

        {/* Pending Approval Message */}
        {pendingApproval ? (
          <Card className="border-amber-500/30 shadow-lg bg-gradient-to-br from-amber-500/5 to-orange-500/5">
            <CardContent className="pt-6 pb-6 sm:pt-8 sm:pb-8 px-4 sm:px-6">
              <div className="text-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4 sm:mb-6">
                  <Clock className="h-8 w-8 sm:h-10 sm:w-10 text-amber-500" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2 sm:mb-3">Is-diiwaan Gelintaadu Way Guulaysatay!</h2>
                <p className="text-muted-foreground mb-4 sm:mb-6 max-w-sm mx-auto text-sm sm:text-base">
                  Akoonkaaga wuxuu sugayaa ansixinta Admin-ka. Waxaan kuu soo diri doonnaa fariin SMS ah marka la ansixiyo.
                </p>
                <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-card border border-border mb-4 sm:mb-6">
                  <p className="text-xs sm:text-sm text-muted-foreground mb-2">Waxaad la xiriiri kartaa:</p>
                  <p className="font-semibold text-foreground text-sm sm:text-base">admin@busbook.com</p>
                </div>
                <Link href="/login">
                  <Button className="rounded-lg sm:rounded-xl">
                    Ku noqo Login
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-border/50 shadow-lg">
            <CardHeader className="text-center px-4 sm:px-6">
              <CardTitle className="text-xl sm:text-2xl">Create Account</CardTitle>
              <CardDescription className="text-sm">
                Join us to start booking tickets or manage buses
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
              <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                {error && (
                  <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="614386039"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    className="h-11"
                  />
                  <p className="text-xs text-muted-foreground">
                    Waxaa laguu soo diri doonaa fariin soo dhaweyn
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Account Type</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setRole('user')}
                      className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                        role === 'user'
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border bg-card text-muted-foreground hover:border-primary/50'
                      }`}
                    >
                      Passenger
                      <p className="text-xs font-normal mt-1 opacity-70">Book tickets</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('bus_admin')}
                      className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                        role === 'bus_admin'
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border bg-card text-muted-foreground hover:border-primary/50'
                      }`}
                    >
                      Bus Operator
                      <p className="text-xs font-normal mt-1 opacity-70">Manage buses</p>
                    </button>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-11 text-base font-medium"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-5 w-5" />
                      Create Account
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
