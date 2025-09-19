"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { PassengerRequestCard } from "@/components/dashboard/passenger-request-card";
import type { RideRequest, RideRequestStatus } from "@/types";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import {
  Loader2,
  AlertCircle,
  ArrowLeftRight,
  ArrowRight,
  Bell,
  CheckCircle2,
  Clock,
  HandCoins,
  MapPin,
  Send,
  Sparkles,
  User,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { subscribeToPassengerRequests } from "@/lib/firestore-rides";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications, type NotificationType } from "@/contexts/notification-provider";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

type RequestFilter = "all" | RideRequestStatus;

const passengerNotificationIcons: Record<
  NotificationType,
  { Icon: LucideIcon; className: string }
> = {
  "new-request": { Icon: HandCoins, className: "text-primary" },
  "counter-offer": { Icon: ArrowLeftRight, className: "text-amber-500" },
  rejection: { Icon: XCircle, className: "text-destructive" },
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

function StatCard({
  title,
  value,
  description,
  icon,
  accent,
  footer,
}: {
  title: string;
  value: ReactNode;
  description: ReactNode;
  icon: ReactNode;
  accent?: string;
  footer?: ReactNode;
}) {
  return (
    <Card className="shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={accent}>{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
        {footer ? <div className="mt-4">{footer}</div> : null}
      </CardContent>
    </Card>
  );
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
    const total = passengerRequests.length;
    const pending = passengerRequests.filter(
      (request) => request.status === "pending",
    ).length;
    const countered = passengerRequests.filter(
      (request) => request.status === "countered",
    ).length;
    const accepted = passengerRequests.filter(
      (request) => request.status === "accepted",
    ).length;
    const rejected = passengerRequests.filter(
      (request) => request.status === "rejected",
    ).length;

    const awaitingResponse = pending + countered;

    const latestUpdate = passengerRequests.reduce<Date | null>((acc, request) => {
      const candidate = request.statusUpdatedAt || request.createdAt;
      if (!candidate) return acc;
      if (!acc || candidate.getTime() > acc.getTime()) {
        return candidate;
      }
      return acc;
    }, null);

    const successRate = total > 0 ? Math.round((accepted / total) * 100) : 0;
    const negotiationRate = total > 0 ? Math.round((countered / total) * 100) : 0;

    return {
      total,
      pending,
      countered,
      accepted,
      rejected,
      awaitingResponse,
      latestUpdate,
      successRate,
      negotiationRate,
    };
  }, [passengerRequests]);

  const filteredRequests = useMemo(() => {
    if (selectedFilter === "all") return passengerRequests;
    return passengerRequests.filter((request) => request.status === selectedFilter);
  }, [passengerRequests, selectedFilter]);

  const hasRequests = passengerRequests.length > 0;

  const nextTrip = useMemo(() => {
    const acceptedRequests = passengerRequests
      .filter((request) => request.status === "accepted")
      .map((request) => ({
        request,
        date: parseRequestDateTime(request),
      }))
      .filter((entry) => entry.date !== null) as Array<{
      request: RideRequest;
      date: Date;
    }>;

    if (!acceptedRequests.length) return null;

    const now = Date.now();
    const upcoming = acceptedRequests
      .filter((entry) => entry.date.getTime() >= now)
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    if (upcoming.length > 0) {
      return upcoming[0];
    }

    return acceptedRequests.sort(
      (a, b) => a.date.getTime() - b.date.getTime(),
    )[0];
  }, [passengerRequests]);

  const passengerNotifications = useMemo(
    () =>
      notifications
        .filter((notification) => notification.source === "passenger")
        .sort(
          (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
        ),
    [notifications],
  );

  const passengerUnread = useMemo(
    () => passengerNotifications.filter((notification) => !notification.read).length,
    [passengerNotifications],
  );

  const latestUpdateRelative = stats.latestUpdate
    ? formatDistanceToNow(stats.latestUpdate, { addSuffix: true, locale: es })
    : null;

  const tabItems: Array<{
    value: RequestFilter;
    label: string;
    count: number;
  }> = [
    { value: "all", label: "Todas", count: stats.total },
    { value: "pending", label: "Pendientes", count: stats.pending },
    { value: "countered", label: "Contraofertas", count: stats.countered },
    { value: "accepted", label: "Confirmadas", count: stats.accepted },
    { value: "rejected", label: "Rechazadas", count: stats.rejected },
  ];

  if (loading || !user) {
    return (
      <AppLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
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
        <div className="flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <h1 className="text-3xl font-bold">Panel del Pasajero</h1>
            <p className="text-muted-foreground">
              Administrá tus solicitudes, resolvé contraofertas y mantenete al día con las notificaciones en tiempo real.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/buscar-viajes">
                <Sparkles className="mr-2 h-4 w-4" />
                Buscar nuevos viajes
              </Link>
            </Button>
            <Button
              variant="outline"
              onClick={() => setSelectedFilter("accepted")}
              disabled={stats.accepted === 0}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Ver confirmados
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Solicitudes enviadas"
            value={stats.total}
            description={
              latestUpdateRelative
                ? `Última actualización ${latestUpdateRelative}`
                : "Envía tu primera solicitud para comenzar."
            }
            icon={<Send className="h-5 w-5" />}
            accent="text-primary"
            footer={
              stats.total > 0 ? (
                <Progress value={Math.min(stats.successRate, 100)} />
              ) : null
            }
          />
          <StatCard
            title="En negociación"
            value={stats.awaitingResponse}
            description={
              stats.awaitingResponse > 0
                ? `Pendientes: ${stats.pending} · Contraofertas: ${stats.countered} · Tasa de negociación: ${stats.negotiationRate}%`
                : "No tenés negociaciones activas."
            }
            icon={<ArrowLeftRight className="h-5 w-5" />}
            accent="text-amber-500"
            footer={
              stats.awaitingResponse > 0 ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start px-2"
                  onClick={() => setSelectedFilter(stats.countered > 0 ? "countered" : "pending")}
                >
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Revisar solicitudes abiertas
                </Button>
              ) : null
            }
          />
          <StatCard
            title="Confirmadas"
            value={stats.accepted}
            description={`Tasa de éxito: ${stats.successRate}%`}
            icon={<CheckCircle2 className="h-5 w-5" />}
            accent="text-green-500"
            footer={
              stats.successRate > 0 ? (
                <Progress value={Math.min(stats.successRate, 100)} />
              ) : null
            }
          />
          <StatCard
            title="Rechazadas"
            value={stats.rejected}
            description={
              stats.rejected > 0
                ? "Podés intentarlo de nuevo en otros viajes."
                : "Ninguna solicitud rechazada por ahora."
            }
            icon={<XCircle className="h-5 w-5" />}
            accent="text-destructive"
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <Card className="shadow-xl">
            <CardHeader className="space-y-2 sm:flex sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
              <div>
                <CardTitle className="text-2xl">Tus solicitudes de viaje</CardTitle>
                <CardDescription>
                  Seguimiento en tiempo real del estado de cada solicitud enviada.
                </CardDescription>
              </div>
              {hasRequests ? (
                <Badge variant="outline" className="mt-2 sm:mt-0">
                  {stats.total} en total
                </Badge>
              ) : null}
            </CardHeader>
            <CardContent>
              <Tabs
                value={selectedFilter}
                onValueChange={(value) => setSelectedFilter(value as RequestFilter)}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-5">
                  {tabItems.map((item) => (
                    <TabsTrigger key={item.value} value={item.value} className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                      <span className="mr-2 hidden sm:inline">{item.label}</span>
                      <span className="sm:hidden">{item.label.slice(0, 3)}.</span>
                      <Badge variant="secondary" className="ml-2">
                        {item.count}
                      </Badge>
                    </TabsTrigger>
                  ))}
                </TabsList>

                <div className="mt-6 space-y-6">
                  {isFetching ? (
                    <div className="flex justify-center py-10">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : filteredRequests.length > 0 ? (
                    filteredRequests.map((request) => (
                      <PassengerRequestCard key={request.id} request={request} />
                    ))
                  ) : (
                    <div className="rounded-lg border border-dashed border-border py-10 text-center">
                      <AlertCircle className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                      <h3 className="text-xl font-semibold">
                        {selectedFilter === "all"
                          ? "Aún no tenés solicitudes"
                          : "Sin resultados para este estado"}
                      </h3>
                      <p className="mb-4 text-muted-foreground">
                        {selectedFilter === "all"
                          ? "Empezá buscando un viaje y enviá tu primera solicitud."
                          : "No encontramos solicitudes que coincidan con este filtro."}
                      </p>
                      {selectedFilter === "all" ? (
                        <Button asChild variant="secondary">
                          <Link href="/buscar-viajes">Buscar un viaje</Link>
                        </Button>
                      ) : (
                        <Button variant="secondary" onClick={() => setSelectedFilter("all")}>
                          Ver todas las solicitudes
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </Tabs>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Próximo viaje</CardTitle>
                <CardDescription>
                  Resumen de tu viaje confirmado más cercano.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {nextTrip ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-sm">
                      <Clock className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">
                          {format(nextTrip.date, "EEEE d 'de' MMMM", { locale: es })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Sale {format(nextTrip.date, "HH:mm", { locale: es })} · {formatDistanceToNow(nextTrip.date, { addSuffix: true, locale: es })}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2 rounded-lg border border-border bg-muted/40 p-3 text-sm">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary" />
                        <span className="font-semibold">
                          {nextTrip.request.origin} → {nextTrip.request.destination}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <User className="h-4 w-4" />
                        <span>Con {nextTrip.request.driverName || "el conductor"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <HandCoins className="h-4 w-4" />
                        <span>
                          Precio acordado: $
                          {nextTrip.request.finalPrice?.toFixed(2) ||
                            nextTrip.request.offeredPrice?.toFixed(2) ||
                            nextTrip.request.price?.toFixed(2) ||
                            "0.00"}
                        </span>
                      </div>
                    </div>
                    <Button asChild className="w-full">
                      <Link href="/buscar-viajes">Ver más viajes</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4 text-center text-sm text-muted-foreground">
                    <p>
                      Todavía no confirmaste un viaje. Revisá las contraofertas o buscá nuevas oportunidades.
                    </p>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Button
                        className="flex-1"
                        variant="secondary"
                        onClick={() => setSelectedFilter("countered")}
                        disabled={stats.countered === 0}
                      >
                        Ver contraofertas
                      </Button>
                      <Button asChild className="flex-1">
                        <Link href="/buscar-viajes">Buscar viajes</Link>
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <CardTitle>Acciones rápidas</CardTitle>
                    <CardDescription>
                      Accedé rápidamente a tus tareas más importantes.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setSelectedFilter("countered")}
                  disabled={stats.countered === 0}
                >
                  <ArrowLeftRight className="mr-2 h-4 w-4" />
                  Resolver contraofertas
                  <Badge variant="secondary" className="ml-auto">
                    {stats.countered}
                  </Badge>
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setSelectedFilter("pending")}
                  disabled={stats.pending === 0}
                >
                  <Clock className="mr-2 h-4 w-4" />
                  Ver solicitudes pendientes
                  <Badge variant="secondary" className="ml-auto">
                    {stats.pending}
                  </Badge>
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setSelectedFilter("accepted")}
                  disabled={stats.accepted === 0}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Revisar viajes confirmados
                  <Badge variant="secondary" className="ml-auto">
                    {stats.accepted}
                  </Badge>
                </Button>
                <Button asChild className="w-full justify-start">
                  <Link href="/viajes">
                    <Send className="mr-2 h-4 w-4" />
                    Explorar publicaciones recientes
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <CardTitle>Notificaciones</CardTitle>
                    <CardDescription>
                      Actualizaciones de tus solicitudes y negociaciones.
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {passengerUnread > 0 ? (
                      <Badge variant="destructive">{passengerUnread} nuevas</Badge>
                    ) : null}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={markAllAsRead}
                      disabled={notifications.length === 0}
                    >
                      <Bell className="mr-2 h-4 w-4" />
                      Marcar como leídas
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {passengerNotifications.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                    No tenés notificaciones recientes. Te avisaremos cuando haya novedades.
                  </div>
                ) : (
                  <ScrollArea className="h-[320px] pr-2">
                    <div className="space-y-4">
                      {passengerNotifications.slice(0, 8).map((notification) => {
                        const iconConfig = passengerNotificationIcons[notification.type];
                        const IconComponent = iconConfig.Icon;
                        return (
                          <div
                            key={notification.id}
                            className={`flex items-start gap-3 rounded-lg border p-3 text-sm transition-colors ${
                              notification.read
                                ? "border-border bg-muted/40"
                                : "border-primary/40 bg-primary/10"
                            }`}
                          >
                            <div className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-full ${
                              notification.read
                                ? "bg-background text-muted-foreground"
                                : "bg-background text-foreground"
                            }`}>
                              <IconComponent className={`h-4 w-4 ${iconConfig.className}`} />
                            </div>
                            <div className="flex-1 space-y-1">
                              <p className="font-medium leading-tight">
                                {notification.title}
                              </p>
                              <p className="text-xs leading-snug text-muted-foreground">
                                {notification.description}
                              </p>
                              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                                {formatDistanceToNow(notification.createdAt, {
                                  addSuffix: true,
                                  locale: es,
                                })}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}