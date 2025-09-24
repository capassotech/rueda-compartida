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
import {
  subscribeToAllRides,
  type RideSubscriptionFilters,
} from "@/lib/firestore-rides";
import { getLocalDepartureDate } from "@/lib/date";
import { differenceInCalendarDays, parseISO } from "date-fns";

function RideListings() {
  const searchParams = useSearchParams();
  const origin = searchParams.get('origin');
  const destination = searchParams.get('destination');
  const date = searchParams.get('date'); // Formato esperado YYYY-MM-DD

  const normalizedOrigin = origin?.trim() || undefined;
  const normalizedDestination = destination?.trim() || undefined;

  const [rides, setRides] = useState<Ride[]>([]);
  const [fallbackRides, setFallbackRides] = useState<Ride[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let fallbackUnsubscribe: (() => void) | undefined;

    if (!date || !normalizedOrigin || !normalizedDestination) {
      setRides([]);
      setFallbackRides([]);
      setIsLoading(false);

      return () => {
        if (unsubscribe) {
          unsubscribe();
        }
        if (fallbackUnsubscribe) {
          fallbackUnsubscribe();
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

    fallbackUnsubscribe = subscribeToAllRides((incomingRides) => {
      setFallbackRides(incomingRides);
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
      if (fallbackUnsubscribe) {
        fallbackUnsubscribe();
      }
    };
  }, [date, normalizedOrigin, normalizedDestination]);

  const filteredRides = useMemo(() => {
    const now = new Date();
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
      .filter((ride) => {
        const departure = getLocalDepartureDate(ride);

        if (!departure) {
          return true;
        }

        return departure.getTime() >= now.getTime();
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
  }, [rides, normalizedOrigin, normalizedDestination, date]);

  const suggestedRides = useMemo(() => {
    const now = new Date();
    if (!normalizedOrigin || !normalizedDestination || !date) {
      return [];
    }

    const normalizedOriginLower = normalizedOrigin.toLowerCase();
    const normalizedDestinationLower = normalizedDestination.toLowerCase();
    const filteredIds = new Set(
      filteredRides.map((ride) => ride.id ?? `${ride.driverUid}-${ride.date}-${ride.time}`),
    );

    const targetDate = parseISO(date);
    const isTargetDateValid = !Number.isNaN(targetDate.getTime());

    const hasCommonWord = (text: string, query: string) => {
      const textWords = text.split(/\s+/).map((word) => word.trim()).filter(Boolean);
      const queryWords = query.split(/\s+/).map((word) => word.trim()).filter(Boolean);

      return queryWords.some((queryWord) =>
        textWords.some((word) => word.startsWith(queryWord) || word.includes(queryWord)),
      );
    };

    return fallbackRides
      .filter((ride) => {
        const rideIdentifier = ride.id ?? `${ride.driverUid}-${ride.date}-${ride.time}`;
        return ride.availableSeats > 0 && !filteredIds.has(rideIdentifier);
      })
      .filter((ride) => {
        const departure = getLocalDepartureDate(ride);

        if (!departure) {
          return true;
        }

        return departure.getTime() >= now.getTime();
      })
      .map((ride) => {
        const originLower = ride.origin.toLowerCase();
        const destinationLower = ride.destination.toLowerCase();

        let originScore = 0;
        if (originLower === normalizedOriginLower) {
          originScore = 5;
        } else if (originLower.includes(normalizedOriginLower)) {
          originScore = 3;
        } else if (hasCommonWord(originLower, normalizedOriginLower)) {
          originScore = 2;
        }

        let destinationScore = 0;
        if (destinationLower === normalizedDestinationLower) {
          destinationScore = 5;
        } else if (destinationLower.includes(normalizedDestinationLower)) {
          destinationScore = 3;
        } else if (hasCommonWord(destinationLower, normalizedDestinationLower)) {
          destinationScore = 2;
        }

        let dateScore = 0;
        let dayDifference = Number.POSITIVE_INFINITY;
        if (isTargetDateValid) {
          const rideDate = parseISO(ride.date);
          if (!Number.isNaN(rideDate.getTime())) {
            dayDifference = Math.abs(differenceInCalendarDays(rideDate, targetDate));

            if (dayDifference === 0) {
              dateScore = 4;
            } else if (dayDifference === 1) {
              dateScore = 3;
            } else if (dayDifference <= 3) {
              dateScore = 2;
            } else if (dayDifference <= 7) {
              dateScore = 1;
            }
          }
        }

        const totalScore = originScore + destinationScore + dateScore;

        return {
          ride,
          score: totalScore,
          dayDifference,
          createdAt: ride.createdAt?.getTime() ?? 0,
          departureTimestamp: getLocalDepartureDate(ride)?.getTime() ?? Number.POSITIVE_INFINITY,
        };
      })
      .filter(({ score }) => score > 0)
      .sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        if (a.dayDifference !== b.dayDifference) {
          return a.dayDifference - b.dayDifference;
        }
        if (a.departureTimestamp !== b.departureTimestamp) {
          return a.departureTimestamp - b.departureTimestamp;
        }
        return b.createdAt - a.createdAt;
      })
      .slice(0, 6)
      .map(({ ride }) => ride);
  }, [
    date,
    fallbackRides,
    filteredRides,
    normalizedDestination,
    normalizedOrigin,
  ]);


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
    <div className="space-y-8">
      <div className="text-center py-10">
        <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold">No Se Encontraron Viajes</h3>
        <p className="text-muted-foreground">
          Lo sentimos, ningún viaje coincide con tus criterios. Intentá con otras ubicaciones o fechas.
        </p>
      </div>

      {suggestedRides.length > 0 && (
        <div>
          <h4 className="text-lg font-semibold mb-4 text-center md:text-left">
            Opciones similares a tu búsqueda
          </h4>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {suggestedRides.map((ride) => (
              <RideCard key={ride.id ?? `${ride.driverUid}-${ride.date}-${ride.time}`}
                ride={ride}
              />
            ))}
          </div>
        </div>
      )}
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