'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import {
  Bus,
  Shield,
  Ticket,
  Users,
  MapPin,
  Clock,
  ArrowRight,
  CheckCircle,
  Star,
  Zap,
  Globe,
  ChevronRight,
  Phone,
  Menu,
  X,
} from 'lucide-react';

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentStat, setCurrentStat] = useState(0);

  useEffect(() => {
    if (!isLoading && user) {
      switch (user.role) {
        case 'super_admin': router.push('/super-admin'); break;
        case 'bus_admin': router.push('/bus-admin'); break;
        case 'user': router.push('/dashboard'); break;
      }
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStat(prev => (prev + 1) % 4);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  // Close menu on resize
  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 768) setMenuOpen(false); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'How It Works', href: '#howitworks' },
    { label: 'Reviews', href: '#reviews' },
  ];

  const features = [
    {
      icon: Zap,
      title: 'Lightning Fast',
      subtitle: 'Xawli Sarreeya',
      description: 'Book your ticket in seconds. Skip the long queues and travel smarter.',
      color: 'from-amber-400 to-orange-500',
      glow: 'shadow-amber-500/20',
      border: 'border-amber-500/20 hover:border-amber-500/50',
      bg: 'hover:bg-amber-500/5',
    },
    {
      icon: Shield,
      title: '100% Secure',
      subtitle: 'Ammaan 100%',
      description: 'Your data and payments are fully protected. We use EVC+ for safe transactions.',
      color: 'from-emerald-400 to-teal-500',
      glow: 'shadow-emerald-500/20',
      border: 'border-emerald-500/20 hover:border-emerald-500/50',
      bg: 'hover:bg-emerald-500/5',
    },
    {
      icon: Globe,
      title: 'Nationwide',
      subtitle: 'Magaalo Kasta',
      description: 'Find buses to every major city across Somalia. All routes, one platform.',
      color: 'from-blue-400 to-cyan-500',
      glow: 'shadow-blue-500/20',
      border: 'border-blue-500/20 hover:border-blue-500/50',
      bg: 'hover:bg-blue-500/5',
    },
    {
      icon: Phone,
      title: 'SMS Confirmation',
      subtitle: 'Xaqiijin SMS',
      description: 'Get an instant SMS confirmation with your ticket details right after booking.',
      color: 'from-purple-400 to-pink-500',
      glow: 'shadow-purple-500/20',
      border: 'border-purple-500/20 hover:border-purple-500/50',
      bg: 'hover:bg-purple-500/5',
    },
  ];

  const steps = [
    {
      icon: MapPin,
      title: 'Search a Bus',
      subtitle: 'Raadi Bas',
      description: 'Enter your departure city and destination to find available buses.',
    },
    {
      icon: Ticket,
      title: 'Choose Your Seat',
      subtitle: 'Dooro Kursi',
      description: 'View the seat map and pick the perfect seat for your journey.',
    },
    {
      icon: CheckCircle,
      title: 'Pay & Travel',
      subtitle: 'Bixi & Safar',
      description: 'Pay securely via EVC+ and receive your ticket confirmation instantly.',
    },
  ];

  const stats = [
    { value: '500+', label: 'Daily Trips', sub: 'Safarada Maalin' },
    { value: '10K+', label: 'Happy Travelers', sub: 'Rakaab Faraxsan' },
    { value: '50+', label: 'Active Buses', sub: 'Basas Diyaar' },
    { value: '99%', label: 'Satisfaction', sub: 'Qanacsanida' },
  ];

  const testimonials = [
    {
      name: 'Faadumo A.',
      city: 'Mogadishu',
      text: 'So easy to use! I booked my ticket in under a minute. The SMS confirmation was instant.',
      textSo: 'Aad ayaan ugu faraxsanahay — booking waa sahal mana sugno xarriiq.',
      rating: 5,
    },
    {
      name: 'Cabdi X.',
      city: 'Hargeisa',
      text: 'The SMS ticket confirmation is a great feature. Everything arrived right after booking.',
      textSo: 'SMS-ka xaqiijinta waa fikrad fiican. Tigidhkii waa si toos ah u heley.',
      rating: 5,
    },
    {
      name: 'Hodan M.',
      city: 'Kismayo',
      text: 'Great prices and excellent service. Deeqo Bus is my go-to for all my trips!',
      textSo: 'Qiimahu fiican, adeeguna waa heer sare. Waxaan kula talineynaa!',
      rating: 5,
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#080b14]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <Bus className="h-8 w-8 text-white" />
            </div>
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 animate-ping opacity-25" />
          </div>
          <p className="text-white/60 text-sm animate-pulse">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080b14] text-white" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ══════════════════════════════ NAVBAR ══════════════════════════════ */}
      <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-[#080b14]/95 backdrop-blur-xl border-b border-white/[0.06] shadow-lg shadow-black/30' : 'bg-transparent'}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14 sm:h-16 md:h-20">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
              <div className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-md shadow-emerald-500/30">
                <Bus className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <span className="font-bold text-base sm:text-lg">
                Deeqo<span className="text-emerald-400"> Bus</span>
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-6 lg:gap-8">
              {navLinks.map(link => (
                <a key={link.href} href={link.href} className="text-sm text-white/60 hover:text-white transition-colors duration-200">
                  {link.label}
                </a>
              ))}
            </nav>

            {/* Auth Buttons - Desktop */}
            <div className="hidden md:flex items-center gap-2 lg:gap-3">
              <Link href="/login">
                <button className="px-4 py-2 text-sm text-white/70 hover:text-white transition-colors">Sign In</button>
              </Link>
              <Link href="/register">
                <button className="px-4 lg:px-5 py-2 lg:py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-emerald-500/30 hover:scale-105 active:scale-100 transition-all duration-200">
                  Get Started
                </button>
              </Link>
            </div>

            {/* Mobile: Sign In + Hamburger */}
            <div className="flex md:hidden items-center gap-2">
              <Link href="/login">
                <button className="px-3 py-1.5 text-sm text-white/70 hover:text-white transition-colors">Sign In</button>
              </Link>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/70 hover:text-white transition-colors"
                aria-label="Toggle menu"
              >
                {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        <div className={`md:hidden transition-all duration-300 overflow-hidden ${menuOpen ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="bg-[#0d1020]/95 backdrop-blur-xl border-b border-white/[0.06] px-4 py-4 space-y-1">
            {navLinks.map(link => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="block px-4 py-3 text-sm text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
              >
                {link.label}
              </a>
            ))}
            <div className="pt-2 pb-1">
              <Link href="/register" onClick={() => setMenuOpen(false)}>
                <button className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl text-sm font-semibold">
                  Get Started — Bilow Hadda
                </button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* ══════════════════════════════ HERO ══════════════════════════════ */}
      <section className="relative min-h-screen flex items-center justify-center pt-14 sm:pt-16 md:pt-20">
        {/* Background glows */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 -left-24 sm:-left-32 w-64 sm:w-96 h-64 sm:h-96 bg-emerald-500/20 rounded-full blur-[100px] sm:blur-[120px] animate-pulse" />
          <div className="absolute top-1/3 -right-16 sm:right-0 w-56 sm:w-80 h-56 sm:h-80 bg-teal-500/15 rounded-full blur-[80px] sm:blur-[100px] animate-pulse" style={{ animationDelay: '1.2s' }} />
          <div className="absolute bottom-1/4 left-1/3 w-48 sm:w-64 h-48 sm:h-64 bg-blue-500/10 rounded-full blur-[60px] sm:blur-[80px] animate-pulse" style={{ animationDelay: '2.4s' }} />
          <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '50px 50px' }} />
        </div>

        <div className="relative w-full max-w-5xl mx-auto px-4 sm:px-6 text-center py-16 sm:py-20">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs sm:text-sm font-medium mb-6 sm:mb-8 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
            <span>Somalia's #1 Bus Booking Platform · Nidaamka Tigidhka #1</span>
          </div>

          {/* Headline */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-extrabold leading-[1.1] tracking-tight mb-4 sm:mb-6">
            <span className="text-white">Travel</span>{' '}
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              Smarter
            </span>
            <br />
            <span className="text-white/80 text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold">
              Safar Fudud & Raaxo leh
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-sm sm:text-base md:text-lg text-white/55 max-w-xl sm:max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed px-2">
            Book bus tickets online in seconds — search routes, pick your seat, and pay safely via EVC+.
            <span className="block mt-1 text-white/40 text-xs sm:text-sm">Online ah ku book tigidhkaaga — raadi, dooro, bixi.</span>
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col xs:flex-row gap-3 justify-center mb-10 sm:mb-14 px-4 xs:px-0">
            <Link href="/register" className="w-full xs:w-auto">
              <button className="group w-full xs:w-auto px-6 sm:px-8 py-3.5 sm:py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl text-sm sm:text-base font-semibold hover:shadow-xl hover:shadow-emerald-500/30 hover:scale-105 active:scale-100 transition-all duration-300 flex items-center justify-center gap-2">
                Book a Ticket — Book Tigidhka
                <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform flex-shrink-0" />
              </button>
            </Link>
            <Link href="/login" className="w-full xs:w-auto">
              <button className="w-full xs:w-auto px-6 sm:px-8 py-3.5 sm:py-4 bg-white/[0.06] border border-white/10 text-white rounded-2xl text-sm sm:text-base font-semibold hover:bg-white/[0.1] hover:border-white/20 active:scale-95 transition-all duration-300 backdrop-blur-sm">
                Sign In — Gal
              </button>
            </Link>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 md:gap-4 max-w-xs sm:max-w-2xl md:max-w-3xl mx-auto">
            {stats.map((stat, i) => (
              <div
                key={i}
                className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border transition-all duration-500 ${
                  i === currentStat
                    ? 'bg-emerald-500/10 border-emerald-500/40 shadow-lg shadow-emerald-500/10 scale-105'
                    : 'bg-white/[0.04] border-white/[0.08]'
                }`}
              >
                <div className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white mb-0.5">{stat.value}</div>
                <div className="text-xs sm:text-xs text-white/60 leading-tight">{stat.label}</div>
                <div className="text-[10px] sm:text-[11px] text-emerald-400/60 leading-tight mt-0.5">{stat.sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 animate-bounce opacity-50">
          <div className="w-px h-6 sm:h-8 bg-gradient-to-b from-transparent to-emerald-400" />
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        </div>
      </section>

      {/* ══════════════════════════════ FEATURES ══════════════════════════════ */}
      <section id="features" className="relative py-16 sm:py-24 md:py-32">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">

          {/* Section header */}
          <div className="text-center mb-10 sm:mb-14 md:mb-16">
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/50 text-xs sm:text-sm mb-4">
              <Star className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-amber-400 flex-shrink-0" fill="currentColor" />
              Why Choose Us · Maxay Fiicantahay
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4">
              Everything You Need
              <span className="block text-lg sm:text-xl md:text-2xl font-medium text-white/40 mt-1">Waxaad u baahan tahay oo dhan</span>
            </h2>
          </div>

          {/* Feature cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div key={i} className={`group p-5 sm:p-6 rounded-2xl border bg-white/[0.03] ${feature.border} ${feature.bg} transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ${feature.glow}`}>
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 sm:mb-5 group-hover:scale-110 transition-transform shadow-lg`}>
                    <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-white mb-0.5">{feature.title}</h3>
                  <p className="text-xs font-medium text-emerald-400/70 mb-2 sm:mb-3">{feature.subtitle}</p>
                  <p className="text-xs sm:text-sm text-white/45 leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════ HOW IT WORKS ══════════════════════════════ */}
      <section id="howitworks" className="relative py-16 sm:py-24 md:py-32 overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
        <div className="absolute inset-0 bg-white/[0.015]" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 sm:mb-14 md:mb-16">
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/50 text-xs sm:text-sm mb-4">
              <Zap className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-emerald-400 flex-shrink-0" />
              Simple Steps · Si Fudud
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2">
              3 Steps to Your Ticket
              <span className="block text-lg sm:text-xl font-medium text-white/40 mt-1">3 Tallaabo Oo Kaliya</span>
            </h2>
          </div>

          {/* Steps — vertical on mobile, horizontal on md+ */}
          <div className="relative">
            {/* Connecting line on desktop */}
            <div className="hidden md:block absolute top-10 left-[calc(16.67%+3rem)] right-[calc(16.67%+3rem)] h-px bg-gradient-to-r from-emerald-500/50 via-teal-500/50 to-emerald-500/50" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              {steps.map((step, i) => {
                const Icon = step.icon;
                return (
                  <div key={i} className="flex md:flex-col items-start md:items-center gap-4 md:gap-0 md:text-center group">
                    {/* Icon + number */}
                    <div className="relative flex-shrink-0 md:mb-5">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center group-hover:border-emerald-500/60 group-hover:bg-emerald-500/10 transition-all duration-300">
                        <Icon className="h-7 w-7 sm:h-9 sm:h-9 text-emerald-400" />
                      </div>
                      <div className="absolute -top-2 -right-2 sm:-top-3 sm:-right-3 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-[10px] sm:text-xs font-bold text-white shadow-md shadow-emerald-500/30">
                        {i + 1}
                      </div>
                    </div>
                    {/* Text */}
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-white mb-0.5">{step.title}</h3>
                      <p className="text-xs sm:text-sm font-medium text-emerald-400/70 mb-1 sm:mb-2">{step.subtitle}</p>
                      <p className="text-xs sm:text-sm text-white/45 leading-relaxed">{step.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════ TESTIMONIALS ══════════════════════════════ */}
      <section id="reviews" className="py-16 sm:py-24 md:py-32">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">

          <div className="text-center mb-10 sm:mb-14 md:mb-16">
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/50 text-xs sm:text-sm mb-4">
              <Users className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-emerald-400 flex-shrink-0" />
              Customer Reviews · Macaamiisha Faraxsan
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">
              What Our Customers Say
              <span className="block text-lg sm:text-xl font-medium text-white/40 mt-1">Waxay Yidhaahdeen Macaamiisheenna</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
            {testimonials.map((t, i) => (
              <div key={i} className="p-5 sm:p-6 rounded-2xl bg-white/[0.04] border border-white/10 hover:border-emerald-500/30 hover:bg-emerald-500/[0.04] transition-all duration-300 flex flex-col">
                {/* Stars */}
                <div className="flex gap-0.5 mb-3 sm:mb-4">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-white/70 leading-relaxed mb-1 flex-1">"{t.text}"</p>
                <p className="text-xs text-emerald-400/55 italic mb-4 sm:mb-5">"{t.textSo}"</p>
                {/* Author */}
                <div className="flex items-center gap-3 pt-3 sm:pt-4 border-t border-white/[0.06]">
                  <div className="w-9 h-9 sm:w-10 sm:w-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">{t.name}</p>
                    <p className="text-white/40 text-xs flex items-center gap-1">
                      <MapPin className="h-2.5 w-2.5 flex-shrink-0" />{t.city}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════ CTA BANNER ══════════════════════════════ */}
      <section className="py-12 sm:py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl p-6 sm:p-10 md:p-16 text-center bg-gradient-to-br from-emerald-500/15 via-teal-500/10 to-cyan-500/15 border border-emerald-500/25">
            {/* Background glows */}
            <div className="absolute top-0 left-1/4 w-48 sm:w-64 h-48 sm:h-64 bg-emerald-500/20 rounded-full blur-3xl -translate-y-1/2 pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-48 sm:w-64 h-48 sm:h-64 bg-teal-500/15 rounded-full blur-3xl translate-y-1/2 pointer-events-none" />

            <div className="relative">
              <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 mb-4 sm:mb-6 shadow-xl shadow-emerald-500/30">
                <Bus className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-white" />
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2 sm:mb-3">
                Ready to Travel?
                <span className="block text-base sm:text-lg font-medium text-white/50 mt-1">Diyaar ma u tahay Safarka?</span>
              </h2>
              <p className="text-sm sm:text-base text-white/55 max-w-md sm:max-w-lg mx-auto mb-6 sm:mb-8 leading-relaxed">
                Join thousands of travelers who trust Deeqo Bus for their journeys.
                Create a free account today and start booking.
                <span className="block mt-1 text-xs sm:text-sm text-white/35">Ku biir kumanaan qof. Samee akoon bilaash maanta.</span>
              </p>
              <div className="flex flex-col xs:flex-row gap-3 justify-center">
                <Link href="/register" className="w-full xs:w-auto">
                  <button className="group w-full xs:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl sm:rounded-2xl font-semibold text-sm sm:text-base hover:shadow-xl hover:shadow-emerald-500/30 hover:scale-105 active:scale-100 transition-all duration-300 flex items-center justify-center gap-2">
                    Create Free Account — Samee Akoon
                    <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform flex-shrink-0" />
                  </button>
                </Link>
                <Link href="/login" className="w-full xs:w-auto">
                  <button className="w-full xs:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-white/[0.08] border border-white/15 text-white rounded-xl sm:rounded-2xl font-semibold text-sm sm:text-base hover:bg-white/[0.12] active:scale-95 transition-all duration-300">
                    Sign In — Gal
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════ FOOTER ══════════════════════════════ */}
      <footer className="border-t border-white/[0.05]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 md:py-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center">
                <Bus className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-sm sm:text-base text-white">
                Deeqo<span className="text-emerald-400"> Bus</span>
              </span>
            </div>

            {/* Copyright */}
            <p className="text-xs sm:text-sm text-white/25 text-center">
              © 2026 Deeqo Bus · Online Bus Ticket Booking · Tigidhka Basaska Online
            </p>

            {/* Links */}
            <div className="flex items-center gap-4 sm:gap-6 text-xs sm:text-sm text-white/30">
              <Link href="/login" className="hover:text-white/60 transition-colors">Sign In</Link>
              <span className="text-white/10">|</span>
              <Link href="/register" className="hover:text-white/60 transition-colors">Register</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating CTA button (mobile only) */}
      <div className="fixed bottom-4 left-4 right-4 sm:hidden z-40">
        <Link href="/register">
          <button className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl font-semibold text-sm shadow-xl shadow-emerald-500/30 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-transform">
            <Bus className="h-4 w-4" />
            Book a Ticket — Hadda Bilow
            <ArrowRight className="h-4 w-4" />
          </button>
        </Link>
      </div>

      {/* Extra bottom padding on mobile to account for floating button */}
      <div className="h-20 sm:hidden" />
    </div>
  );
}
