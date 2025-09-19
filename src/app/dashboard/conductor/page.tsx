"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Loader2, PlusCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";

import { AppLayout } from "@/components/layout/app-layout";
import { DriverRideCard } from "@/components/dashboard/driver-ride-card";
import type { Ride, RideRequest } from "@/types";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { Button } from "@/components/ui/button";
import {
  subscribeToDriverRides,
  subscribeToDriverRequests,
} from "@/lib/firestore-rides";
import {
  useNotifications,
  type NotificationEntry,
} from "@/contexts/notification-provider";
import { cn } from "@/lib/utils";

type RideFilter = "all" | "pending" | "countered" | "accepted" | "no-requests";

type RideWithRequests = {
  ride: Ride;
  requests: RideRequest[];
};

function parseRideDateTime(ride: Ride): Date | null {
  if (!ride.date) return null;

  const rawTime =
    ride.time && ride.time.length === 5
      ? `${ride.time}:00`
      : ride.time || "00:00:00";

  const isoString = `${ride.date}T${rawTime}`;
  const parsed = new Date(isoString);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export default function DriverDashboardPage() {
  const { user, loading } = useAuthGuard();
  const [rides, setRides] = useState<Ride[]>([]);
  const [rideRequests, setRideRequests] = useState<RideRequest[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<RideFilter>("all");
  const searchParams = useSearchParams();
  const { notifications, markAllAsRead, markAsRead } = useNotifications();
  const [highlightedNotificationId, setHighlightedNotificationId] = useState<string | null>(
    null,
  );
  const [highlightedRequestId, setHighlightedRequestId] = useState<string | null>(null);
  const notificationsSectionRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    const notificationParam = searchParams.get("notificacion");
    const requestParam = searchParams.get("solicitud");

    setHighlightedNotificationId(notificationParam);
    setHighlightedRequestId(requestParam);

    if ((notificationParam || requestParam) && typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (notificationParam) {
        url.searchParams.delete("notificacion");
      }
      if (requestParam) {
        url.searchParams.delete("solicitud");
      }
      window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!highlightedRequestId) return;

    const targetRequest = rideRequests.find(
      (request) => request.id === highlightedRequestId,
    );
    if (!targetRequest) return;

    if (targetRequest.status === "pending" && selectedFilter !== "pending") {
      setSelectedFilter("pending");
    }

    if (targetRequest.status === "countered" && selectedFilter !== "countered") {
      setSelectedFilter("countered");
    }

    if (targetRequest.status === "accepted" && selectedFilter !== "accepted") {
      setSelectedFilter("accepted");
    }

    if (typeof window === "undefined") return;

    const timer = window.setTimeout(() => {
      if (targetRequest.rideId) {
        const rideElement = document.getElementById(`ride-${targetRequest.rideId}`);
        if (rideElement) {
          rideElement.scrollIntoView({ behavior: "smooth", block: "start" });
          return;
        }
      }

      notificationsSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 200);

    return () => {
      window.clearTimeout(timer);
    };
  }, [highlightedRequestId, rideRequests, selectedFilter]);

  const ridesWithRequests = useMemo<RideWithRequests[]>(() => {
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

  const driverStats = useMemo(() => {
    const summary = {
      totalRides: ridesWithRequests.length,
      totalRequests: 0,
      pendingRequests: 0,
      counteredRequests: 0,
      acceptedRequests: 0,
      ridesWithPending: 0,
      ridesWithCountered: 0,
      ridesWithAccepted: 0,
      ridesWithoutRequests: 0,
      availableSeats: 0,
      latestActivity: null as Date | null,
    };

    const updateLatest = (value?: Date | null) => {
      if (!value) return;
      if (
        !summary.latestActivity ||
        value.getTime() > summary.latestActivity.getTime()
      ) {
        summary.latestActivity = value;
      }
    };

    ridesWithRequests.forEach(({ ride, requests }) => {
      summary.totalRequests += requests.length;
      summary.availableSeats += Number.isFinite(ride.availableSeats)
        ? ride.availableSeats
        : 0;

      if (requests.length === 0) {
        summary.ridesWithoutRequests += 1;
      }

      let hasPending = false;
      let hasCountered = false;
      let hasAccepted = false;

      requests.forEach((request) => {
        switch (request.status) {
          case "pending":
            summary.pendingRequests += 1;
            hasPending = true;
            break;
          case "countered":
            summary.counteredRequests += 1;
            hasCountered = true;
            break;
          case "accepted":
            summary.acceptedRequests += 1;
            hasAccepted = true;
            break;
          default:
            break;
        }

        updateLatest(request.statusUpdatedAt ?? request.createdAt ?? null);
      });

      if (hasPending) summary.ridesWithPending += 1;
      if (hasCountered) summary.ridesWithCountered += 1;
      if (hasAccepted) summary.ridesWithAccepted += 1;

      updateLatest(ride.createdAt ?? null);
    });

    return summary;
  }, [ridesWithRequests]);

  const nextRide = useMemo(() => {
    const enriched = ridesWithRequests
      .map(({ ride, requests }) => {
        const date = parseRideDateTime(ride);
        if (!date) return null;
        return { ride, requests, date };
      })
      .filter(
        (
          entry,
        ): entry is { ride: Ride; requests: RideRequest[]; date: Date } =>
          entry !== null,
      )
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    const future = enriched.find((entry) => entry.date.getTime() >= Date.now());
    return future ?? enriched[0] ?? null;
  }, [ridesWithRequests]);

  const nextRideAcceptedCount = nextRide
    ? nextRide.requests.filter((request) => request.status === "accepted").length
    : 0;

  const nextRidePassengersText =
    nextRideAcceptedCount > 0
      ? `Ya confirmaste ${nextRideAcceptedCount} pasajero${
          nextRideAcceptedCount === 1 ? "" : "s"
        }.`
      : "Todavía no hay pasajeros confirmados.";

  const driverNotifications = useMemo(
    () =>
      notifications
        .filter((notification) => notification.source === "driver")
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    [notifications],
  );

  const driverUnread = useMemo(
    () => driverNotifications.filter((notification) => !notification.read).length,
    [driverNotifications],
  );

  useEffect(() => {
    if (!highlightedNotificationId) return;

    const targetNotification = driverNotifications.find(
      (notification) => notification.id === highlightedNotificationId,
    );

    if (targetNotification && !targetNotification.read) {
      markAsRead(targetNotification.id);
    }
  }, [driverNotifications, highlightedNotificationId, markAsRead]);

  const handleNotificationCardClick = (notification: NotificationEntry) => {
    markAsRead(notification.id);
    setHighlightedNotificationId(notification.id);

    if (notification.requestId) {
      setHighlightedRequestId(notification.requestId);
    } else {
      setHighlightedRequestId(null);
    }

    if (typeof window !== "undefined") {
      window.setTimeout(() => {
        notificationsSectionRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    }
  };

  const lastUpdatedText = driverStats.latestActivity
    ? formatDistanceToNow(driverStats.latestActivity, { addSuffix: true, locale: es })
    : null;

  const filterOptions = useMemo(
    () => [
      { value: "all" as const, label: "Todos", count: driverStats.totalRides },
      {
        value: "pending" as const,
        label: "Con pendientes",
        count: driverStats.ridesWithPending,
      },
      {
        value: "countered" as const,
        label: "Contraofertas",
        count: driverStats.ridesWithCountered,
      },
      {
        value: "accepted" as const,
        label: "Confirmados",
        count: driverStats.ridesWithAccepted,
      },
      {
        value: "no-requests" as const,
        label: "Sin solicitudes",
        count: driverStats.ridesWithoutRequests,
      },
    ],
    [driverStats],
  );

  const filteredRides = useMemo(() => {
    switch (selectedFilter) {
      case "pending":
        return ridesWithRequests.filter(({ requests }) =>
          requests.some((request) => request.status === "pending"),
        );
      case "countered":
        return ridesWithRequests.filter(({ requests }) =>
          requests.some((request) => request.status === "countered"),
        );
      case "accepted":
        return ridesWithRequests.filter(({ requests }) =>
          requests.some((request) => request.status === "accepted"),
        );
      case "no-requests":
        return ridesWithRequests.filter(({ requests }) => requests.length === 0);
      case "all":
      default:
        return ridesWithRequests;
    }
  }, [ridesWithRequests, selectedFilter]);

  if (loading || !user) {
    return (
      <AppLayout>
        <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">
          {loading ? (
            <Loader2 className="h-8 w-8 animate-spin" />
          ) : (
            <p className="text-sm">Iniciá sesión para ver tu panel de conductor.</p>
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
            <h1 className="text-2xl font-semibold tracking-tight">Panel del conductor</h1>
            <p className="text-sm text-muted-foreground">
              Monitoreá tus viajes publicados, administrá solicitudes y mantené todo organizado desde un mismo lugar.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm">
              <Link href="/crear-viaje">
                <PlusCircle className="h-4 w-4" />
                Publicar nuevo viaje
              </Link>
            </Button>
            {driverStats.pendingRequests > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedFilter("pending")}
              >
                Ver pendientes ({driverStats.pendingRequests})
              </Button>
            )}
            {driverStats.counteredRequests > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedFilter("countered")}
              >
                Contraofertas enviadas ({driverStats.counteredRequests})
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
              <p className="text-xs uppercase text-muted-foreground">Publicados</p>
              <p className="text-lg font-semibold">{driverStats.totalRides}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs uppercase text-muted-foreground">Solicitudes</p>
              <p className="text-lg font-semibold">{driverStats.totalRequests}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs uppercase text-muted-foreground">Pendientes</p>
              <p className="text-lg font-semibold">{driverStats.pendingRequests}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs uppercase text-muted-foreground">Contraofertas</p>
              <p className="text-lg font-semibold">{driverStats.counteredRequests}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs uppercase text-muted-foreground">Confirmados</p>
              <p className="text-lg font-semibold">{driverStats.acceptedRequests}</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            {lastUpdatedText
              ? `Última actividad ${lastUpdatedText}.`
              : "Todavía no registramos actividad reciente."}
          </p>
          {driverStats.totalRides > 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Lugares disponibles actualmente: {driverStats.availableSeats}.
            </p>
          ) : null}
          {nextRide ? (
            <p className="mt-2 text-sm">
              Próximo viaje programado el{" "}
              <span className="font-medium">
                {format(nextRide.date, "d 'de' MMMM 'a las' HH:mm", { locale: es })}
              </span>{" "}
              (
              {formatDistanceToNow(nextRide.date, { addSuffix: true, locale: es })}).{" "}
              {nextRidePassengersText}
            </p>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              Aún no tenés viajes próximos en el calendario.
            </p>
          )}
        </section>

        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold">Viajes publicados</h2>
              <p className="text-sm text-muted-foreground">
                Gestioná tus viajes y respondé las solicitudes desde un solo lugar.
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
                  <span className="ml-1 text-xs text-muted-foreground">
                    {option.count}
                  </span>
                </Button>
              ))}
            </div>
          </div>

          {isFetching ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredRides.length > 0 ? (
            <div className="space-y-4">
              {filteredRides.map(({ ride, requests }) => {
                const shouldHighlightRequest =
                  highlightedRequestId &&
                  requests.some((request) => request.id === highlightedRequestId);

                return (
                  <DriverRideCard
                    key={ride.id}
                    ride={ride}
                    requests={requests}
                    highlightedRequestId={shouldHighlightRequest ? highlightedRequestId : null}
                    isHighlighted={Boolean(shouldHighlightRequest)}
                  />
                );
              })}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed p-8 text-center">
              {selectedFilter === "all" ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Todavía no publicaste viajes. Creá uno para comenzar a recibir solicitudes.
                  </p>
                  <div className="flex justify-center">
                    <Button asChild size="sm">
                      <Link href="/crear-viaje">
                        <PlusCircle className="h-4 w-4" />
                        Publicar viaje
                      </Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No encontramos viajes que coincidan con este filtro.
                </p>
              )}
            </div>
          )}
        </section>

        <section
          ref={notificationsSectionRef}
          className="space-y-4 rounded-lg border p-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold">Notificaciones</h2>
              <p className="text-sm text-muted-foreground">
                Te avisamos cuando lleguen nuevas solicitudes o cambios de los pasajeros.
              </p>
            </div>
            <div className="flex items-center gap-3">
              {driverUnread > 0 && (
                <span className="text-xs font-medium text-primary">
                  {driverUnread} sin leer
                </span>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  markAllAsRead();
                  setHighlightedNotificationId(null);
                  setHighlightedRequestId(null);
                }}
                disabled={driverNotifications.length === 0 || driverUnread === 0}
              >
                Marcar como leídas
              </Button>
            </div>
          </div>
          {driverNotifications.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No tenés notificaciones recientes.
            </p>
          ) : (
            <div className="space-y-3">
              {driverNotifications.slice(0, 6).map((notification) => {
                const isHighlighted =
                  highlightedNotificationId === notification.id ||
                  (highlightedRequestId &&
                    notification.requestId &&
                    highlightedRequestId === notification.requestId);

                return (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() => handleNotificationCardClick(notification)}
                    className={cn(
                      "w-full space-y-1 rounded-md border border-border/60 p-3 text-left transition-colors",
                      notification.read
                        ? "bg-background hover:border-border"
                        : "bg-muted/60 hover:bg-muted",
                      isHighlighted && "border-primary/80 ring-2 ring-primary/40",
                    )}
                  >
                    <p
                      className={cn(
                        "text-sm font-medium",
                        notification.read
                          ? "text-muted-foreground"
                          : "text-foreground",
                      )}
                    >
                      {notification.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {notification.description}
                    </p>
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      {formatDistanceToNow(notification.createdAt, {
                        addSuffix: true,
                        locale: es,
                      })}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </AppLayout>
  );
}
