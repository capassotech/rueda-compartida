"use client"; // Marking as client component to use searchParams hook

import { Suspense } from 'react';
import { AppLayout } from "@/components/layout/app-layout";
import { RideCard } from "@/components/rides/ride-card";
import type { Ride } from "@/types";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SearchRidesForm } from "@/components/rides/search-rides-form";
import { AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// Mock data - replace with actual data fetching
const MOCK_RIDES: Ride[] = [
  { id: "1", driverUid: "driver1", driverName: "Alice Wonderland", origin: "New York", destination: "Boston", date: "2024-08-15", time: "09:00", availableSeats: 3, price: 25.00, createdAt: new Date() },
  { id: "2", driverUid: "driver2", driverName: "Bob The Builder", origin: "New York", destination: "Philadelphia", date: "2024-08-16", time: "14:00", availableSeats: 2, price: 20.00, createdAt: new Date() },
  { id: "3", driverUid: "driver3", driverName: "Charlie Brown", origin: "Boston", destination: "New York", date: "2024-08-15", time: "18:00", availableSeats: 1, price: 22.00, createdAt: new Date() },
  { id: "4", driverUid: "driver4", driverName: "Diana Prince", origin: "New York", destination: "Boston", date: "2024-08-15", time: "15:00", availableSeats: 0, price: 30.00, createdAt: new Date() },
];

function RideListings() {
  const searchParams = useSearchParams();
  const origin = searchParams.get('origin');
  const destination = searchParams.get('destination');
  const date = searchParams.get('date');

  // Basic filtering based on query params for mock data
  const filteredRides = MOCK_RIDES.filter(ride => {
    let matches = true;
    if (origin && !ride.origin.toLowerCase().includes(origin.toLowerCase())) matches = false;
    if (destination && !ride.destination.toLowerCase().includes(destination.toLowerCase())) matches = false;
    if (date && ride.date !== date) matches = false;
    return matches;
  });

  if (!origin && !destination && !date) {
    return (
      <div className="text-center py-10">
        <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold mb-2">Search for Rides</h3>
        <p className="text-muted-foreground mb-4">
          Please enter your origin, destination, and date to find available rides.
        </p>
        <Button asChild>
          <Link href="/search-rides">Go to Search</Link>
        </Button>
      </div>
    );
  }
  
  // TODO: Add actual loading state when fetching data
  // const isLoading = false; 
  // if (isLoading) {
  //   return <div className="flex justify-center items-center min-h-[30vh]"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  // }

  return (
    <>
      {filteredRides.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRides.map((ride) => (
            <RideCard key={ride.id} ride={ride} />
          ))}
        </div>
      ) : (
        <div className="text-center py-10">
          <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold">No Rides Found</h3>
          <p className="text-muted-foreground">
            Sorry, no rides match your search criteria. Try different locations or dates.
          </p>
        </div>
      )}
    </>
  );
}


export default function RidesPage() {
  return (
    <AppLayout>
      <div className="space-y-8">
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-3xl">Search Rides</CardTitle>
            <CardDescription>
              Update your search criteria below.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Embedding search form again for convenience */}
            <SearchRidesForm /> 
          </CardContent>
        </Card>

        <div>
          <h2 className="text-2xl font-semibold mb-6">Available Rides</h2>
          <Suspense fallback={<div className="flex justify-center items-center min-h-[30vh]"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
            <RideListings />
          </Suspense>
        </div>
      </div>
    </AppLayout>
  );
}
