import React, { Suspense } from 'react';
import CarListStreamer from '../components/CarListStreamer';
import CarSkeletonGrid from '../components/CarSkeletonGrid';

export const revalidate = 0; // Dynamic server rendering for real-time car availability streaming

/**
 * Main Car Listing Page - Pure async Server Component (Next.js App Router)
 * NO 'use client', NO useEffect, NO useState for initial car fetch.
 */
export default async function CarListingPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* HERO BANNER SECTION */}
      <section className="bg-white border-b border-slate-200/80 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-800 text-xs font-bold px-3 py-1 rounded-full">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Hule Car Rental Network • Addis Ababa
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            Find & Rent Verified Cars in Addis Ababa
          </h1>
          <p className="text-sm sm:text-base text-slate-500 font-medium max-w-2xl mx-auto">
            Direct vehicle rentals backed by master local brokers. Instant server-side listing stream.
          </p>
        </div>
      </section>

      {/* CAR LISTING SECTION WITH SUSPENSE STREAMING */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <Suspense fallback={<CarSkeletonGrid count={8} />}>
          <CarListStreamer />
        </Suspense>
      </section>
    </main>
  );
}
