"use client";

import { Suspense, useEffect, useMemo, useState } from 'react';
import { AppLayout } from "@/components/layout/app-layout";
import { RideCard } from "@/components/rides/ride-card";
import type { Ride } from "@/types";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SearchRidesForm } from "@/components/rides/search-rides-form";
import { AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
<<<<<<< HEAD
import {
  subscribeToAllRides,
  type RideSubscriptionFilters,
} from "@/lib/firestore-rides";
=======
import { subscribeToAllRides } from "@/lib/firestore-rides";
import { getLocalDepartureDate } from "@/lib/date";
>>>>>>> 5fce9c4609ee7972feff195216ca87b61032ffb4

function RideListings() {
  const searchParams = useSearchParams();
  const origin = searchParams.get('origin');
  const destination = searchParams.get('destination');
  const date = searchParams.get('date'); // Formato esperado YYYY-MM-DD

  const normalizedOrigin = origin?.trim() || undefined;
  const normalizedDestination = destination?.trim() || undefined;

  const [rides, setRides] = useState<Ride[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    if (!date || !normalizedOrigin || !normalizedDestination) {
      setRides([]);
      setIsLoading(false);

      return () => {
        if (unsubscribe) {
          unsubscribe();
        }
      };
    }

    setIsLoading(true);

    const filters: RideSubscriptionFilters = {
      date,
      origin: normalizedOrigin,
      destination: normalizedDestination,
    };

    unsubscribe = subscribeToAllRides((incomingRides) => {
      setRides(incomingRides);
      setIsLoading(false);
    }, filters);

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [date, normalizedOrigin, normalizedDestination]);

  const filteredRides = useMemo(() => {
    const originQuery = normalizedOrigin?.toLowerCase();
    const destinationQuery = normalizedDestination?.toLowerCase();

    return rides
      .filter((ride) => {
        let matches = true;
        if (originQuery && !ride.origin.toLowerCase().includes(originQuery)) {
          matches = false;
        }
        if (
          destinationQuery &&
          !ride.destination.toLowerCase().includes(destinationQuery)
        ) {
          matches = false;
        }
        if (date && ride.date !== date) {
          matches = false;
        }
        return matches;
      })
      .filter((ride) => ride.availableSeats > 0)
      .sort((a, b) => {
        const departureA = getLocalDepartureDate(a)?.getTime() ?? null;
        const departureB = getLocalDepartureDate(b)?.getTime() ?? null;

        if (departureA !== departureB) {
          if (departureA === null) {
            return 1;
          }
          if (departureB === null) {
            return -1;
          }
          return departureA - departureB;
        }

        const createdAtA = a.createdAt?.getTime() ?? 0;
        const createdAtB = b.createdAt?.getTime() ?? 0;

        return createdAtA - createdAtB;
      });
  }, [rides, origin, destination, date]);


  if (!normalizedOrigin && !normalizedDestination && !date) {
    return (
      <div className="text-center py-10">
        <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold mb-2">Buscar Viajes</h3>
        <p className="text-muted-foreground mb-4">
          Por favor, ingresá tu origen, destino y fecha para encontrar viajes disponibles.
        </p>
        <Button asChild>
          <Link href="/buscar-viajes">Ir a la Búsqueda</Link>
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return filteredRides.length > 0 ? (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {filteredRides.map((ride) => (
        <RideCard key={ride.id} ride={ride} />
      ))}
    </div>
  ) : (
    <div className="text-center py-10">
      <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-xl font-semibold">No Se Encontraron Viajes</h3>
      <p className="text-muted-foreground">
        Lo sentimos, ningún viaje coincide con tus criterios. Intentá con otras ubicaciones o fechas.
      </p>
    </div>
  );
}

export default function RidesPage() {
  return (
    <AppLayout>
      <div className="space-y-8">
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-3xl">Buscar Viajes</CardTitle>
            <CardDescription>
              Actualizá tus criterios de búsqueda a continuación.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SearchRidesForm />
          </CardContent>
        </Card>

        <div>
          <h2 className="text-2xl font-semibold mb-6">Viajes Disponibles</h2>
          {/* Suspense es buena práctica cuando hay datos asincrónicos */}
          <Suspense fallback={<div className="flex justify-center items-center min-h-[30vh]"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
            <RideListings />
          </Suspense>
        </div>
      </div>
    </AppLayout>
  );
}