"use client";

import { useEffect, useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { DriverRideCard } from "@/components/dashboard/driver-ride-card";
import type { Ride, RideRequest } from "@/types";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { Loader2, PlusCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  subscribeToDriverRides,
  subscribeToDriverRequests,
} from "@/lib/firestore-rides";

export default function DriverDashboardPage() {
  const { user, loading } = useAuthGuard();
  const [rides, setRides] = useState<Ride[]>([]);
  const [rideRequests, setRideRequests] = useState<RideRequest[]>([]);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      setRides([]);
      setRideRequests([]);
      setIsFetching(false);
      return undefined;
    }

    setIsFetching(true);
    const unsubscribeRides = subscribeToDriverRides(user.uid, (incomingRides) => {
      setRides(
        incomingRides.map((ride) => ({
          ...ride,
          driverName:
            ride.driverName || user.displayName || user.email || "Yo",
        })),
      );
      setIsFetching(false);
    });

    const unsubscribeRequests = subscribeToDriverRequests(
      user.uid,
      (incomingRequests) => {
        setRideRequests(incomingRequests);
      },
    );

    return () => {
      unsubscribeRides();
      unsubscribeRequests();
    };
  }, [user?.uid, user?.displayName, user?.email]);

  const ridesWithRequests = useMemo(() => {
    const requestsByRide = rideRequests.reduce<Record<string, RideRequest[]>>(
      (acc, request) => {
        const rideId = request.rideId;
        if (!rideId) return acc;
        if (!acc[rideId]) {
          acc[rideId] = [];
        }
        acc[rideId].push(request);
        return acc;
      },
      {},
    );

    return rides.map((ride) => ({
      ride,
      requests: (ride.id && requestsByRide[ride.id]) || [],
    }));
  }, [rides, rideRequests]);

  if (loading || !user) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center min-h-[60vh]">
          {loading ? (
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          ) : (
            <p>Iniciá sesión para ver tu panel de conductor.</p>
          )}
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-3xl font-bold">Panel del Conductor</h1>
          <Button asChild>
            <Link href="/crear-viaje">
              <PlusCircle className="mr-2 h-5 w-5" />
              Ofrecer Nuevo Viaje
            </Link>
          </Button>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-4">Viajes Publicados</h2>
          {isFetching ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : ridesWithRequests.length > 0 ? (
            <div className="space-y-6">
              {ridesWithRequests.map(({ ride, requests }) => (
                <DriverRideCard
                  key={ride.id}
                  ride={ride}
                  requests={requests}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-10 border-2 border-dashed border-border rounded-lg">
              <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold">Aún No Tenés Viajes Publicados</h3>
              <p className="text-muted-foreground mb-4">
                Ofrecé un viaje para empezar a ganar y conectar con pasajeros.
              </p>
              <Button asChild variant="secondary">
                <Link href="/crear-viaje">Ofrecé Tu Primer Viaje</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}