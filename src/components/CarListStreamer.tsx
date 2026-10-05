import React from 'react';
import { getInitialCars, getPremiumCars } from '../lib/supabase-server';
import CarListingClient from './CarListingClient';
import { parseUrlFilters } from '../utils/urlFilters';

interface CarListStreamerProps {
  rawParams?: any;
}

/**
 * Async Server Component: Fetches initial car data directly on the server
 * so Next.js can stream the HTML with car cards seamlessly after rendering the skeleton.
 * Strictly applies only valid filter keys and ignores all marketing tracking parameters.
 */
export async function CarListStreamer({ rawParams }: CarListStreamerProps = {}) {
  const validFilters = rawParams ? parseUrlFilters(rawParams) : undefined;
  const [initialCars, initialPremiumCars] = await Promise.all([
    getInitialCars(12, validFilters?.hasActiveFilters ? validFilters : undefined),
    getPremiumCars()
  ]);

  return (
    <CarListingClient
      initialCars={initialCars}
      initialPremiumCars={initialPremiumCars}
      initialFilters={validFilters?.hasActiveFilters ? validFilters : undefined}
    />
  );
}

export default CarListStreamer;
