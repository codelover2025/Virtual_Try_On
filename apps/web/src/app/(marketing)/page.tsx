'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Camera,
  CheckCircle2,
  Diamond,
  Eye,
  Gem,
  Lock,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Star,
  Zap,
} from 'lucide-react';
import { Button, Badge } from '@vj/ui';

const stats = [
  { value: '30 FPS', label: 'Real-time On-device Tracking' },
  { value: '100%', label: 'Private — No Video Uploaded' },
  { value: '0.1mm', label: 'Sub-millimeter Fit Calibration' },
  { value: '5,000+', label: 'Virtual Pieces Tried Today' },
];

const steps = [
  {
    step: '01',
    title: 'Select Fine Jewellery',
    description:
      'Explore our curated catalogue of certified diamond earrings, royal chokers, necklaces, and solitaire rings.',
    icon: Gem,
  },
  {
    step: '02',
    title: 'Activate Live Studio',
    description:
      'Launch your camera in one click. Our AI detector maps facial landmarks, earlobes, and wrists with micro-precision.',
    icon: Camera,
  },
  {
    step: '03',
    title: 'See It On You Live',
    description:
      'Turn, tilt, and smile. Photorealistic Three.js shaders reflect studio lighting and physics naturally in real-time.',
    icon: Sparkles,
  },
];

const featuredCollections = [
  {
    name: 'Celestial Diamond Drops',
    category: 'Earrings',
    description: '18K White Gold with conflict-free brilliant-cut diamonds that catch every angle of ambient light.',
    price: '₹ 84,500',
    tag: 'Trending in AR',
    image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=80',
    tryOnHref: '/try-on',
  },
  {
    name: 'Royal Heritage Emerald Choker',
    category: 'Necklace',
    description: 'Deep Zambian emeralds accented by double-row round diamonds set in handcrafted 22K yellow gold.',
    price: '₹ 2,45,000',
    tag: 'Haute Joaillerie',
    image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80',
    tryOnHref: '/try-on',
  },
  {
    name: 'Solitaire Promise Ring',
    category: 'Rings',
    description: 'A striking 1.5ct round brilliant solitaire held in an iconic six-prong platinum crown.',
    price: '₹ 1,18,000',
    tag: 'Hand Tracking Ready',
    image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=800&q=80',
    tryOnHref: '/try-on',
  },
];

const testimonials = [
  {
    name: 'Ananya Sharma',
    city: 'Mumbai',
    quote:
      'Trying bridal earrings through the live camera felt like standing inside a private jewellery salon. The drop length and sparkle were 100% true to life when the package arrived.',
    piece: 'Starlight Chandelier Drops',
    rating: 5,
  },
  {
    name: 'Devina Mehta',
    city: 'New Delhi',
    quote:
      'Being able to switch between rose gold and platinum rings in the live AR studio saved me hours of store visits. Flawless tracking even when I moved my hands.',
    piece: 'Aura Eternity Solitaire',
    rating: 5,
  },
  {
    name: 'Rohan Singhal',
    city: 'Bengaluru',
    quote:
      'Bought an anniversary necklace after testing the drape on my wife during a video call. The precision and lighting reflections are unmatched.',
    piece: 'Cascade Diamond Pendant',
    rating: 5,
  },
];

export default function LandingPage() {
  return (
    <div className="flex flex-col gap-24 pb-24 overflow-hidden">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b bg-gradient-to-b from-background via-background/95 to-secondary/20 pt-12 pb-20 lg:pt-20 lg:pb-32">
        <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[600px] w-[900px] rounded-full bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.2),transparent_70%)] blur-3xl" />

        <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="space-y-6"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-xs font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              <span>STUDIO-GRADE VIRTUAL JEWELLERY ATELIER</span>
            </div>

            <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-light tracking-tight leading-[1.08] text-foreground">
              See every piece <br />
              <span className="font-normal italic text-primary">on you</span> before <br />
              you fall in love.
            </h1>

            <p className="max-w-xl text-base sm:text-lg text-muted-foreground leading-relaxed">
              Experience photorealistic augmented reality for diamond earrings, emerald necklaces, and eternity
              rings. Real-time sub-millimeter fitting calibrated right inside your browser.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Button asChild size="lg" className="rounded-full px-8 py-6 text-sm font-medium shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-105 transition-all">
                <Link href="/try-on">
                  <Camera className="mr-2 h-4 w-4" /> Open Virtual Studio
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-full px-7 py-6 text-sm font-medium hover:border-primary/50 transition">
                <Link href="/products">
                  Explore Catalogue <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="pt-4 flex items-center gap-6 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <span>On-Device Privacy</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Zap className="h-4 w-4 text-primary" />
                <span>Zero Latency WebGL</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Diamond className="h-4 w-4 text-primary" />
                <span>Certified Haute Pieces</span>
              </div>
            </div>
          </motion.div>

          {/* Hero Visual: Interactive Studio Simulator Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="relative"
          >
            <div className="relative mx-auto aspect-[4/5] w-full max-w-md overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-br from-card via-background to-secondary shadow-2xl">
              {/* Simulated Camera Feed Viewfinder */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-900 via-neutral-950 to-black text-white p-6 flex flex-col justify-between">
                {/* Viewfinder Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 rounded-full bg-black/60 backdrop-blur-md px-3 py-1 font-mono text-[11px] border border-white/10">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>LUMIÈRE AR · 30 FPS</span>
                  </div>
                  <div className="text-[11px] font-mono text-white/60">ANCHOR: EAR_LOBE</div>
                </div>

                {/* Center AR Fitting Illusion */}
                <div className="relative flex flex-col items-center justify-center my-auto text-center">
                  <div className="relative flex items-center justify-center h-48 w-48 rounded-full border border-dashed border-primary/50 animate-[spin_20s_linear_infinite]">
                    <div className="absolute top-2 h-3 w-3 rounded-full bg-primary shadow-lg shadow-primary" />
                  </div>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <Sparkles className="h-10 w-10 text-primary drop-shadow-[0_0_15px_rgba(212,175,55,0.8)] animate-pulse" />
                    <span className="mt-3 font-serif text-lg font-light tracking-wide text-white">
                      Real-Time Fitting
                    </span>
                    <span className="text-[11px] text-white/60 uppercase tracking-widest font-mono">
                      Target: Celestial Drops
                    </span>
                  </div>
                </div>

                {/* Viewfinder Bottom Banner */}
                <div className="rounded-2xl border border-white/10 bg-black/60 backdrop-blur-md p-3.5 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-white">Live Camera Ready</p>
                    <p className="text-[11px] text-white/60">Try any piece in our showroom</p>
                  </div>
                  <Button asChild size="sm" className="rounded-full text-xs">
                    <Link href="/try-on">
                      Try Now <ArrowRight className="ml-1 h-3 w-3" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>

            {/* Floating Luxury Badges */}
            <div className="absolute -bottom-6 -left-6 hidden sm:flex items-center gap-3 rounded-2xl border border-primary/20 bg-card/90 backdrop-blur-md p-4 shadow-xl">
              <div className="rounded-full bg-primary/20 p-2 text-primary">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div className="text-xs">
                <p className="font-semibold text-foreground">True-to-Scale Accuracy</p>
                <p className="text-muted-foreground">Calibrated for natural proportions</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Metrics Banner */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid grid-cols-2 gap-6 rounded-3xl border bg-card/60 backdrop-blur-sm p-6 sm:grid-cols-4 sm:p-8">
          {stats.map((s) => (
            <div key={s.label} className="text-center sm:text-left">
              <p className="font-serif text-3xl sm:text-4xl font-light text-primary">{s.value}</p>
              <p className="mt-1 text-xs text-muted-foreground uppercase tracking-wider">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <Badge variant="outline" className="border-primary/40 text-primary">
            Seamless Three-Step Experience
          </Badge>
          <h2 className="font-serif text-3xl sm:text-5xl font-light text-foreground">
            The Haute Joaillerie Atelier, in Your Hands
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base">
            No downloads, no waiting. Experience luxury jewellery virtually as if standing before a Parisian mirror.
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {steps.map((st) => {
            const Icon = st.icon;
            return (
              <div
                key={st.step}
                className="group relative rounded-3xl border bg-card p-8 transition-all hover:border-primary/50 hover:shadow-xl hover:-translate-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-3xl font-light text-primary/40 group-hover:text-primary transition-colors">
                    {st.step}
                  </span>
                  <div className="rounded-2xl bg-primary/10 p-3 text-primary group-hover:scale-110 transition-transform">
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
                <h3 className="mt-6 font-serif text-xl font-medium text-foreground">{st.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{st.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Featured Try-On Collection */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 space-y-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <Badge variant="outline" className="border-primary/40 text-primary mb-2">
              Curated Masterpieces
            </Badge>
            <h2 className="font-serif text-3xl sm:text-4xl font-light text-foreground">
              Trending for Virtual Try-On
            </h2>
          </div>
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/products">
              View All Catalogue <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {featuredCollections.map((piece) => (
            <div
              key={piece.name}
              className="group relative flex flex-col overflow-hidden rounded-3xl border bg-card shadow-sm hover:shadow-xl transition-all duration-300"
            >
              <div className="relative aspect-[4/5] overflow-hidden bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={piece.image}
                  alt={piece.name}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute top-4 left-4">
                  <Badge className="bg-background/90 text-foreground backdrop-blur-md border border-white/20">
                    {piece.category}
                  </Badge>
                </div>
                <div className="absolute top-4 right-4">
                  <span className="rounded-full bg-primary/90 text-primary-foreground text-[10px] font-semibold px-2.5 py-1">
                    {piece.tag}
                  </span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                  <Button asChild className="w-full rounded-full shadow-lg">
                    <Link href={piece.tryOnHref}>
                      <Camera className="mr-2 h-4 w-4" /> Try It On Live
                    </Link>
                  </Button>
                </div>
              </div>

              <div className="flex flex-1 flex-col justify-between p-6">
                <div>
                  <h3 className="font-serif text-xl font-normal text-foreground group-hover:text-primary transition-colors">
                    {piece.name}
                  </h3>
                  <p className="mt-2 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {piece.description}
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between pt-4 border-t">
                  <span className="font-serif text-lg font-semibold text-primary">{piece.price}</span>
                  <Link
                    href={piece.tryOnHref}
                    className="text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-primary transition flex items-center gap-1"
                  >
                    <span>Instant Studio</span>
                    <Sparkles className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Trust & Guarantee Banner */}
      <section className="border-y bg-secondary/30 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-8 md:grid-cols-4">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                <Diamond className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-serif text-base font-medium">100% Certified Gemstones</h4>
                <p className="mt-1 text-xs text-muted-foreground">Every piece is verified by GIA and IGI international grading labs.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                <Lock className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-serif text-base font-medium">Private AR Experience</h4>
                <p className="mt-1 text-xs text-muted-foreground">Video feeds never leave your device. Zero cloud processing of facial camera data.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                <RotateCcw className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-serif text-base font-medium">30-Day Atelier Exchange</h4>
                <p className="mt-1 text-xs text-muted-foreground">Complimentary insured return and exchange policy on all fine jewellery.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                <Eye className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-serif text-base font-medium">Virtual Lookbook</h4>
                <p className="mt-1 text-xs text-muted-foreground">Save your try-on captures, compare side-by-side, and share with loved ones.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Customer Lookbook & Testimonials */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <Badge variant="outline" className="border-primary/40 text-primary">
            Client Voices
          </Badge>
          <h2 className="font-serif text-3xl sm:text-5xl font-light text-foreground">
            Loved in the Studio, Cherished Forever
          </h2>
          <p className="text-muted-foreground text-sm">
            Read stories from clients who found their signature heirloom piece through our virtual fitting platform.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <div key={t.name} className="flex flex-col justify-between rounded-3xl border bg-card p-8 shadow-sm">
              <div>
                <div className="flex gap-1 text-amber-500">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <p className="mt-4 text-sm text-foreground/90 italic leading-relaxed">
                  &ldquo;{t.quote}&rdquo;
                </p>
              </div>

              <div className="mt-6 pt-6 border-t flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.city}</p>
                </div>
                <Badge variant="secondary" className="text-[10px]">
                  {t.piece}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* VIP Concierge Banner */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-r from-card via-background to-secondary p-8 sm:p-14 shadow-2xl">
          <div className="max-w-2xl space-y-4">
            <Badge variant="outline" className="border-primary/40 text-primary">
              Private Atelier Concierge
            </Badge>
            <h2 className="font-serif text-3xl sm:text-4xl font-light text-foreground">
              Require bespoke sizing or bridal consultation?
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Connect with our master gemologists for high-definition 1-on-1 virtual walkthroughs, custom gemstone
              sourcing, and tailored styling.
            </p>
            <div className="pt-2 flex flex-wrap gap-3">
              <Button asChild className="rounded-full px-6">
                <Link href="/try-on">Launch Try-On Studio</Link>
              </Button>
              <Button asChild variant="outline" className="rounded-full px-6">
                <Link href="/products">Browse All Collections</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
