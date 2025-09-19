"use client";

import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { PassengerRequestCard } from "@/components/dashboard/passenger-request-card";
import type { RideRequest } from "@/types";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { subscribeToPassengerRequests } from "@/lib/firestore-rides";

export default function PassengerDashboardPage() {
  const { user, loading } = useAuthGuard();
  const [requests, setRequests] = useState<RideRequest[]>([]);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      setRequests([]);
      setIsFetching(false);
      return undefined;
    }

    setIsFetching(true);
    const unsubscribe = subscribeToPassengerRequests(
      user.uid,
      (incomingRequests) => {
        setRequests(
          incomingRequests.map((request) => ({
            ...request,
            passengerName:
              request.passengerName ||
              user.displayName ||
              user.email ||
              "Yo",
          })),
        );
        setIsFetching(false);
      },
    );

    return () => unsubscribe();
  }, [user?.uid, user?.displayName, user?.email]);

  const passengerRequests = requests;

  if (loading || !user) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center min-h-[60vh]">
          {loading ? (
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          ) : (
            <p>Iniciá sesión para ver tu panel de pasajero.</p>
          )}
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-8">
        <h1 className="text-3xl font-bold">Panel del Pasajero</h1>

        <div>
          <h2 className="text-2xl font-semibold mb-4">Tus Solicitudes de Viaje</h2>
          {isFetching ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : passengerRequests.length > 0 ? (
            <div className="space-y-6">
              {passengerRequests.map((request) => (
                <PassengerRequestCard key={request.id} request={request} />
              ))}
            </div>
          ) : (
            <div className="text-center py-10 border-2 border-dashed border-border rounded-lg">
              <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold">Aún No Tenés Solicitudes de Viaje</h3>
              <p className="text-muted-foreground mb-4">
                No has solicitado ningún viaje. Empezá buscando uno.
              </p>
              <Button asChild variant="secondary">
                <Link href="/buscar-viajes">Buscar un Viaje</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}