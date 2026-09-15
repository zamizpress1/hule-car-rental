import React from 'react';
import { getInitialCars } from '../lib/supabase-server';
import CarListingClient from './CarListingClient';

/**
 * Async Server Component: Fetches initial car data directly on the server
 * so Next.js can stream the HTML with car cards seamlessly after rendering the skeleton.
 */
export async function CarListStreamer() {
  // Fetch initial single large batch of up to 100 cars directly on the server
  const initialCars = await getInitialCars(100);

  return <CarListingClient initialCars={initialCars} />;
}

export default CarListStreamer;
