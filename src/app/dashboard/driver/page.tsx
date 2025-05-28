"use client";

import { AppLayout } from "@/components/layout/app-layout";
import { DriverRideCard } from "@/components/dashboard/driver-ride-card";
import type { Ride, RideRequest } from "@/types";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { Loader2, PlusCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// Mock data - replace with actual data fetching for the logged-in driver
const MOCK_DRIVER_RIDES: Ride[] = [
  { id: "1", driverUid: "currentUserUID", driverName: "Current User", origin: "New York", destination: "Boston", date: "2024-08-15", time: "09:00", availableSeats: 1, price: 25.00, createdAt: new Date() },
  { id: "5", driverUid: "currentUserUID", driverName: "Current User", origin: "Chicago", destination: "Detroit", date: "2024-08-20", time: "11:00", availableSeats: 3, price: 40.00, createdAt: new Date() },
];

const MOCK_RIDE_REQUESTS: RideRequest[] = [
  { id: "req1", rideId: "1", passengerUid: "pass1", passengerName: "Passenger One", driverUid: "currentUserUID", status: "pending", createdAt: new Date() },
  { id: "req2", rideId: "1", passengerUid: "pass2", passengerName: "Passenger Two", driverUid: "currentUserUID", status: "accepted", createdAt: new Date() },
  { id: "req3", rideId: "5", passengerUid: "pass3", passengerName: "Passenger Three", driverUid: "currentUserUID", status: "pending", createdAt: new Date() },
];


export default function DriverDashboardPage() {
  const { user, loading } = useAuthGuard();

  if (loading || !user) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center min-h-[60vh]">
           {loading ? <Loader2 className="h-12 w-12 animate-spin text-primary" /> : <p>Please log in to view your driver dashboard.</p>}
        </div>
      </AppLayout>
    );
  }

  // In a real app, filter rides and requests for the current user (user.uid)
  const driverRides = MOCK_DRIVER_RIDES.map(ride => ({
    ...ride,
    driverUid: user.uid, // Assuming these are the current user's rides for mock
    driverName: user.displayName || user.email || "Me"
  }));

  return (
    <AppLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-3xl font-bold">Driver Dashboard</h1>
          <Button asChild>
            <Link href="/create-ride">
              <PlusCircle className="mr-2 h-5 w-5" />
              Offer New Ride
            </Link>
          </Button>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-4">Your Posted Rides</h2>
          {driverRides.length > 0 ? (
            <div className="space-y-6">
              {driverRides.map((ride) => {
                const rideRequests = MOCK_RIDE_REQUESTS.filter(req => req.rideId === ride.id && req.driverUid === user.uid);
                return <DriverRideCard key={ride.id} ride={ride} requests={rideRequests} />;
              })}
            </div>
          ) : (
            <div className="text-center py-10 border-2 border-dashed border-border rounded-lg">
              <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold">No Rides Posted Yet</h3>
              <p className="text-muted-foreground mb-4">
                Offer a ride to start earning and connecting with passengers.
              </p>
              <Button asChild variant="secondary">
                <Link href="/create-ride">Offer Your First Ride</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
