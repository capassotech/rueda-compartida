"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

import { AppLayout } from "@/components/layout/app-layout";
import { PassengerRequestCard } from "@/components/dashboard/passenger-request-card";
import type { RideRequest, RideRequestStatus } from "@/types";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { subscribeToPassengerRequests } from "@/lib/firestore-rides";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/contexts/notification-provider";

type RequestFilter = "all" | RideRequestStatus;

type UpcomingTrip = {
  request: RideRequest;
  date: Date;
};

function parseRequestDateTime(request: RideRequest): Date | null {
  if (!request.date) return null;

  const rawTime = request.time && request.time.length === 5
    ? `${request.time}:00`
    : request.time || "00:00:00";

  const isoString = `${request.date}T${rawTime}`;
  const parsed = new Date(isoString);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export default function PassengerDashboardPage() {
  const { user, loading } = useAuthGuard();
  const [requests, setRequests] = useState<RideRequest[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<RequestFilter>("all");
  const { notifications, markAllAsRead } = useNotifications();

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

  const stats = useMemo(() => {
    const summary = {
      total: passengerRequests.length,
      pending: 0,
      countered: 0,
      accepted: 0,
      rejected: 0,
      latestUpdate: null as Date | null,
    };

    passengerRequests.forEach((request) => {
      switch (request.status) {
        case "pending":
          summary.pending += 1;
          break;
        case "countered":
          summary.countered += 1;
          break;
        case "accepted":
          summary.accepted += 1;
          break;
        case "rejected":
          summary.rejected += 1;
          break;
        default:
          break;
      }

      const timestamp = request.statusUpdatedAt ?? request.createdAt;
      if (timestamp) {
        if (!summary.latestUpdate || timestamp.getTime() > summary.latestUpdate.getTime()) {
          summary.latestUpdate = timestamp;
        }
      }
    });

    return summary;
  }, [passengerRequests]);

  const filteredRequests = useMemo(() => {
    if (selectedFilter === "all") return passengerRequests;
    return passengerRequests.filter((request) => request.status === selectedFilter);
  }, [passengerRequests, selectedFilter]);

  const nextTrip = useMemo(() => {
    const acceptedRequests = passengerRequests
      .filter((request) => request.status === "accepted")
      .map((request) => ({
        request,
        date: parseRequestDateTime(request),
      }))
      .filter((entry): entry is UpcomingTrip => entry.date !== null)
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    if (acceptedRequests.length === 0) return null;

    const now = Date.now();
    const upcoming = acceptedRequests.find((entry) => entry.date.getTime() >= now);
    return upcoming ?? acceptedRequests[0];
  }, [passengerRequests]);

  const passengerNotifications = useMemo(
    () =>
      notifications
        .filter((notification) => notification.source === "passenger")
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    [notifications],
  );

  const passengerUnread = useMemo(
    () => passengerNotifications.filter((notification) => !notification.read).length,
    [passengerNotifications],
  );

  const lastUpdatedText = stats.latestUpdate
    ? formatDistanceToNow(stats.latestUpdate, { addSuffix: true, locale: es })
    : null;

  const filterOptions: Array<{ value: RequestFilter; label: string; count: number }> = [
    { value: "all", label: "Todas", count: stats.total },
    { value: "pending", label: "Pendientes", count: stats.pending },
    { value: "countered", label: "Contraofertas", count: stats.countered },
    { value: "accepted", label: "Confirmadas", count: stats.accepted },
    { value: "rejected", label: "Rechazadas", count: stats.rejected },
  ];

  if (loading || !user) {
    return (
      <AppLayout>
        <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">
          {loading ? (
            <Loader2 className="h-8 w-8 animate-spin" />
          ) : (
            <p className="text-sm">Iniciá sesión para ver tu panel de pasajero.</p>
          )}
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <header className="space-y-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">Panel del pasajero</h1>
            <p className="text-sm text-muted-foreground">
              Un resumen simple de tus solicitudes, viajes confirmados y avisos más recientes.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm">
              <Link href="/buscar-viajes">Buscar nuevos viajes</Link>
            </Button>
            {(stats.pending > 0 || stats.countered > 0) && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedFilter(stats.countered > 0 ? "countered" : "pending")}
              >
                {stats.countered > 0 ? "Ver contraofertas" : "Ver pendientes"}
              </Button>
            )}
          </div>
        </header>

        <section className="rounded-lg border bg-card/40 p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Resumen rápido
          </h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            <div className="space-y-1">
              <p className="text-xs uppercase text-muted-foreground">Enviadas</p>
              <p className="text-lg font-semibold">{stats.total}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs uppercase text-muted-foreground">Pendientes</p>
              <p className="text-lg font-semibold">{stats.pending}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs uppercase text-muted-foreground">Contraofertas</p>
              <p className="text-lg font-semibold">{stats.countered}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs uppercase text-muted-foreground">Confirmadas</p>
              <p className="text-lg font-semibold">{stats.accepted}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs uppercase text-muted-foreground">Rechazadas</p>
              <p className="text-lg font-semibold">{stats.rejected}</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            {lastUpdatedText ? `Última actualización ${lastUpdatedText}.` : "Todavía no registramos actividad reciente."}
          </p>
          {nextTrip ? (
            <p className="mt-2 text-sm">
              Próximo viaje confirmado el {""}
              <span className="font-medium">
                {format(nextTrip.date, "d 'de' MMMM 'a las' HH:mm", { locale: es })}
              </span>{" "}
              ({formatDistanceToNow(nextTrip.date, { addSuffix: true, locale: es })}).
            </p>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">Aún no tenés viajes confirmados.</p>
          )}
        </section>

        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold">Solicitudes</h2>
              <p className="text-sm text-muted-foreground">
                Filtrá por estado para ver el detalle que necesitás.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {filterOptions.map((option) => (
                <Button
                  key={option.value}
                  size="sm"
                  variant={selectedFilter === option.value ? "default" : "outline"}
                  onClick={() => setSelectedFilter(option.value)}
                >
                  {option.label}
                  <span className="ml-1 text-xs text-muted-foreground">{option.count}</span>
                </Button>
              ))}
            </div>
          </div>

          {isFetching ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredRequests.length > 0 ? (
            <div className="space-y-4">
              {filteredRequests.map((request) => (
                <PassengerRequestCard key={request.id} request={request} />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
              {selectedFilter === "all"
                ? "Todavía no enviaste solicitudes. Buscá un viaje para comenzar."
                : "No encontramos solicitudes en este estado."}
            </div>
          )}
        </section>

        <section className="space-y-4 rounded-lg border p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold">Notificaciones</h2>
              <p className="text-sm text-muted-foreground">
                Te avisamos cuando cambie alguna de tus solicitudes.
              </p>
            </div>
            <div className="flex items-center gap-3">
              {passengerUnread > 0 && (
                <span className="text-xs font-medium text-primary">{passengerUnread} sin leer</span>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={markAllAsRead}
                disabled={passengerNotifications.length === 0 || passengerUnread === 0}
              >
                Marcar como leídas
              </Button>
            </div>
          </div>
          {passengerNotifications.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No tenés notificaciones recientes.
            </p>
          ) : (
            <div className="space-y-3">
              {passengerNotifications.slice(0, 6).map((notification) => (
                <div
                  key={notification.id}
                  className="space-y-1 rounded-md border border-border/60 p-3"
                >
                  <p className={`text-sm font-medium ${notification.read ? "text-muted-foreground" : "text-foreground"}`}>
                    {notification.title}
                  </p>
                  <p className="text-xs text-muted-foreground">{notification.description}</p>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    {formatDistanceToNow(notification.createdAt, { addSuffix: true, locale: es })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppLayout>
  );
}
