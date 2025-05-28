
"use client"; 

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
import { mockRides } from "@/lib/mock-db"; // Import from mock-db

function RideListings() {
  const searchParams = useSearchParams();
  const origin = searchParams.get('origin');
  const destination = searchParams.get('destination');
  const date = searchParams.get('date'); // Expected format YYYY-MM-DD

  // Filter rides from the mock database based on query params
  const filteredRides = mockRides.filter(ride => {
    let matches = true;
    if (origin && !ride.origin.toLowerCase().includes(origin.toLowerCase())) matches = false;
    if (destination && !ride.destination.toLowerCase().includes(destination.toLowerCase())) matches = false;
    if (date && ride.date !== date) matches = false; // Direct string comparison for YYYY-MM-DD
    return matches;
  }).sort((a, b) => (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0));


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
            <SearchRidesForm /> 
          </CardContent>
        </Card>

        <div>
          <h2 className="text-2xl font-semibold mb-6">Available Rides</h2>
          {/* Suspense is good practice for when data fetching might be async */}
          <Suspense fallback={<div className="flex justify-center items-center min-h-[30vh]"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
            <RideListings />
          </Suspense>
        </div>
      </div>
    </AppLayout>
  );
}
