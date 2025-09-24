"use client";

import { useEffect, useMemo, useState } from "react";
import { RideCard } from "@/components/rides/ride-card";
import { getRideById } from "@/lib/firestore-rides";
import type { Ride } from "@/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  CalendarDays,
  Clock,
  Loader2,
  MapPin,
  Users,
  CircleDollarSign,
} from "lucide-react";
import { toLocalDate } from "@/lib/date";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export type RideShareFallback = {
  origin?: string;
  destination?: string;
  date?: string;
  time?: string;
  price?: number;
  availableSeats?: number;
  driverName?: string;
};

interface RideShareDetailsProps {
  rideId: string;
  fallbackRide?: RideShareFallback;
}

export function RideShareDetails({ rideId, fallbackRide }: RideShareDetailsProps) {
  const [ride, setRide] = useState<Ride | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    async function fetchRide() {
      setIsLoading(true);

      const fetchedRide = await getRideById(rideId);

      if (!isActive) {
        return;
      }

      if (!fetchedRide) {
        setRide(null);
      } else {
        setRide(fetchedRide);
      }

      setIsLoading(false);
    }

    fetchRide();

    return () => {
      isActive = false;
    };
  }, [rideId]);

  const fallbackDate = useMemo(() => toLocalDate(fallbackRide?.date), [fallbackRide?.date]);
  const formattedFallbackDate = useMemo(() => {
    if (!fallbackRide?.date) {
      return undefined;
    }
    return fallbackDate ? format(fallbackDate, "PPP", { locale: es }) : fallbackRide.date;
  }, [fallbackDate, fallbackRide?.date]);

  if (ride) {
    return <RideCard ride={ride} />;
  }

  if (isLoading && fallbackRide) {
    return (
      <Card className="w-full shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl md:text-2xl">
            {fallbackRide.origin && fallbackRide.destination
              ? `${fallbackRide.origin} a ${fallbackRide.destination}`
              : "Viaje compartido"}
          </CardTitle>
          {fallbackRide.driverName ? (
            <CardDescription>Conductor: {fallbackRide.driverName}</CardDescription>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-3">
          {fallbackRide.date ? (
            <div className="flex items-center text-sm text-muted-foreground">
              <CalendarDays className="mr-2 h-4 w-4 text-primary" />
              <span>{formattedFallbackDate}</span>
            </div>
          ) : null}
          {fallbackRide.time ? (
            <div className="flex items-center text-sm text-muted-foreground">
              <Clock className="mr-2 h-4 w-4 text-primary" />
              <span>{fallbackRide.time}</span>
            </div>
          ) : null}
          {fallbackRide.origin ? (
            <div className="flex items-center text-sm text-muted-foreground">
              <MapPin className="mr-2 h-4 w-4 text-primary" />
              <span>Desde: {fallbackRide.origin}</span>
            </div>
          ) : null}
          {fallbackRide.destination ? (
            <div className="flex items-center text-sm text-muted-foreground">
              <MapPin className="mr-2 h-4 w-4 text-primary" />
              <span>Hacia: {fallbackRide.destination}</span>
            </div>
          ) : null}
          {typeof fallbackRide.availableSeats === "number" ? (
            <div className="flex items-center text-sm">
              <Users className="mr-2 h-4 w-4 text-primary" />
              <span className="font-medium">
                {fallbackRide.availableSeats} lugares disponibles
              </span>
            </div>
          ) : null}
          {typeof fallbackRide.price === "number" ? (
            <div className="flex items-center text-lg font-semibold">
              <CircleDollarSign className="mr-2 h-5 w-5 text-primary" />
              <span>${fallbackRide.price.toFixed(2)}</span>
            </div>
          ) : null}
        </CardContent>
        <CardFooter className="text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Verificando la disponibilidad actualizada del viaje…</span>
          </div>
        </CardFooter>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Alert variant="destructive">
      <AlertTitle>Viaje no disponible</AlertTitle>
      <AlertDescription>
        Es posible que el conductor haya cancelado el viaje o que ya no tenga lugares disponibles.
      </AlertDescription>
    </Alert>
  );
}
