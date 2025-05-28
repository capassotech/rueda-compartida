"use client";

import { AppLayout } from "@/components/layout/app-layout";
import { PassengerRequestCard } from "@/components/dashboard/passenger-request-card";
import type { RideRequest } from "@/types";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { mockRequests } from "@/lib/mock-db"; // Import desde mock-db

export default function PassengerDashboardPage() {
  const { user, loading } = useAuthGuard();

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

  // Filtrar las solicitudes del pasajero actual (user.uid) desde la base simulada
  const passengerRequests = mockRequests
    .filter(req => req.passengerUid === user.uid)
    .map(req => ({
      ...req,
      // passengerName puede ser enriquecido aquí si es necesario
      passengerName: req.passengerName || user.displayName || user.email || "Yo"
    }))
    .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));

  return (
    <AppLayout>
      <div className="space-y-8">
        <h1 className="text-3xl font-bold">Panel del Pasajero</h1>

        <div>
          <h2 className="text-2xl font-semibold mb-4">Tus Solicitudes de Viaje</h2>
          {passengerRequests.length > 0 ? (
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