"use client";

import { AppLayout } from "@/components/layout/app-layout";
import { DriverRideCard } from "@/components/dashboard/driver-ride-card";
import type { Ride, RideRequest } from "@/types";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { Loader2, PlusCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { mockRides, mockRequests } from "@/lib/mock-db"; // Import desde mock-db

export default function DriverDashboardPage() {
  const { user, loading } = useAuthGuard();

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

  // Filtrar viajes y solicitudes del usuario actual (user.uid) desde la base simulada
  const driverRides = mockRides
    .filter(ride => ride.driverUid === user.uid)
    .map(ride => ({
      ...ride,
      // driverName puede ser enriquecido aquí si es necesario, pero el mock-db ya podría tenerlo
      driverName: ride.driverName || user.displayName || user.email || "Yo"
    }))
    .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));

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
          {driverRides.length > 0 ? (
            <div className="space-y-6">
              {driverRides.map((ride) => {
                // Filtrar las solicitudes específicas de este viaje y conductor
                const rideSpecificRequests = mockRequests.filter(
                  req => req.rideId === ride.id && req.driverUid === user.uid
                ).sort((a,b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
                
                return <DriverRideCard key={ride.id} ride={ride} requests={rideSpecificRequests} />;
              })}
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