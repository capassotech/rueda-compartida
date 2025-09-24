"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import type { Ride, RideRequest } from "@/types";
import {
  subscribeToDriverRequests,
  subscribeToDriverRides,
  subscribeToPassengerRequests,
} from "@/lib/firestore-rides";
import type { LucideIcon } from "lucide-react";
import {
  Bell,
  Car,
  CheckCircle2,
  LayoutDashboard,
  MapPin,
  MessageCircle,
  PlusCircle,
  Search,
  Users,
} from "lucide-react";

type QuickAction = {
  title: string;
  description: string;
  href: string;
  label: string;
  icon: LucideIcon;
};

type HighlightItem = {
  title: string;
  description: string;
  icon: LucideIcon;
};

const quickActions: QuickAction[] = [
  {
    title: "Buscar viajes disponibles",
    description:
      "Filtrá por origen, destino y fecha para encontrar el recorrido perfecto y reservar tu asiento al instante.",
    href: "/buscar-viajes",
    label: "Buscar viajes",
    icon: Search,
  },
  {
    title: "Publicar un viaje",
    description:
      "Indicá tu recorrido, el costo por asiento y la cantidad de lugares disponibles para recibir solicitudes.",
    href: "/crear-viaje",
    label: "Crear viaje",
    icon: PlusCircle,
  },
];

const highlights: HighlightItem[] = [
  {
    title: "Notificaciones al instante",
    description:
      "Recibí avisos cada vez que alguien solicita un viaje, contraoferta o confirma un asiento. Respondé sin salir del panel.",
    icon: Bell,
  },
  {
    title: "Rutas claras y verificadas",
    description:
      "Todos los recorridos incluyen punto de encuentro y horarios. Verificamos perfiles para que viajes con tranquilidad.",
    icon: MapPin,
  },
  {
    title: "Comunicación directa",
    description:
      "Chateá con pasajeros y conductores para ultimar detalles antes del viaje y mantené todo organizado desde la app.",
    icon: MessageCircle,
  },
];

type PassengerSummary = {
  confirmed: number;
  pending: number;
  countered: number;
  total: number;
};

type DriverSummary = {
  confirmedRides: number;
  pendingRequests: number;
  counteredRequests: number;
  totalRides: number;
};

export default function DashboardPage() {
  const { user } = useAuthGuard();
  const [passengerRequests, setPassengerRequests] = useState<RideRequest[]>([]);
  const [driverRequests, setDriverRequests] = useState<RideRequest[]>([]);
  const [driverRides, setDriverRides] = useState<Ride[]>([]);
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      setPassengerRequests([]);
      setDriverRequests([]);
      setDriverRides([]);
      setIsLoadingSummary(false);
      return undefined;
    }

    setIsLoadingSummary(true);

    let passengerReady = false;
    let driverRequestsReady = false;
    let driverRidesReady = false;

    const markReady = () => {
      if (passengerReady && driverRequestsReady && driverRidesReady) {
        setIsLoadingSummary(false);
      }
    };

    const unsubscribePassenger = subscribeToPassengerRequests(
      user.uid,
      (requests) => {
        passengerReady = true;
        setPassengerRequests(
          requests.map((request) => ({
            ...request,
            passengerName:
              request.passengerName
              || user.displayName
              || user.email
              || "Yo",
          })),
        );
        markReady();
      },
    );

    const unsubscribeDriverRequests = subscribeToDriverRequests(
      user.uid,
      (requests) => {
        driverRequestsReady = true;
        setDriverRequests(requests);
        markReady();
      },
    );

    const unsubscribeDriverRides = subscribeToDriverRides(
      user.uid,
      (rides) => {
        driverRidesReady = true;
        setDriverRides(
          rides.map((ride) => ({
            ...ride,
            driverName:
              ride.driverName || user.displayName || user.email || "Yo",
          })),
        );
        markReady();
      },
    );

    return () => {
      unsubscribePassenger();
      unsubscribeDriverRequests();
      unsubscribeDriverRides();
    };
  }, [user?.uid, user?.displayName, user?.email]);

  const passengerSummary = useMemo<PassengerSummary>(() => {
    const summary: PassengerSummary = {
      confirmed: 0,
      pending: 0,
      countered: 0,
      total: passengerRequests.length,
    };

    passengerRequests.forEach((request) => {
      switch (request.status) {
        case "accepted":
          summary.confirmed += 1;
          break;
        case "pending":
          summary.pending += 1;
          break;
        case "countered":
          summary.countered += 1;
          break;
        default:
          break;
      }
    });

    return summary;
  }, [passengerRequests]);

  const driverSummary = useMemo<DriverSummary>(() => {
    const summary: DriverSummary = {
      confirmedRides: 0,
      pendingRequests: 0,
      counteredRequests: 0,
      totalRides: driverRides.length,
    };

    const ridesWithAccepted = new Set<string>();

    driverRequests.forEach((request) => {
      if (request.status === "pending") {
        summary.pendingRequests += 1;
      }
      if (request.status === "countered") {
        summary.counteredRequests += 1;
      }
      if (request.status === "accepted" && request.rideId) {
        ridesWithAccepted.add(request.rideId);
      }
    });

    summary.confirmedRides = ridesWithAccepted.size;

    return summary;
  }, [driverRequests, driverRides.length]);

  const greetingName = user?.displayName?.split(" ")[0]
    || user?.email?.split("@")[0]
    || "tripulante";

  const passengerPendingTotal = passengerSummary.pending + passengerSummary.countered;
  const driverPendingTotal = driverSummary.pendingRequests + driverSummary.counteredRequests;

  return (
    <AppLayout>
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 py-6 sm:py-10">
        <section className="rounded-3xl border border-border/60 bg-card/80 p-6 shadow-sm sm:p-10">
          <div className="flex flex-col gap-6 text-center sm:text-left">
            <div className="space-y-3 text-balance">
              <p className="text-sm font-medium uppercase tracking-wide text-primary/90">
                Tu centro de operaciones
              </p>
              <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                Hola, {greetingName}! 👋
              </h1>
              <p className="text-sm text-muted-foreground sm:text-base">
                Tené a mano un resumen de tus viajes confirmados y las solicitudes pendientes que necesitan tu atención.
              </p>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card className="flex h-full flex-col justify-between border border-border/60 bg-background/70 shadow-sm">
            <CardHeader className="flex flex-row items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Users className="h-5 w-5" />
              </div>
              <div className="space-y-2">
                <CardTitle className="text-lg font-semibold leading-tight text-foreground">
                  Actividad como pasajero
                </CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                  Revisá tus viajes confirmados y respondé las solicitudes que siguen abiertas.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-border/60 bg-card/70 p-4 text-center">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Viajes confirmados
                  </p>
                  <p className="text-3xl font-semibold text-foreground">
                    {isLoadingSummary ? "--" : passengerSummary.confirmed}
                  </p>
                </div>
                <div className="rounded-lg border border-border/60 bg-card/70 p-4 text-center">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Solicitudes pendientes
                  </p>
                  <p className="text-3xl font-semibold text-foreground">
                    {isLoadingSummary ? "--" : passengerPendingTotal}
                  </p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                {isLoadingSummary
                  ? "Cargando tu actividad más reciente..."
                  : passengerSummary.total === 0
                    ? "Todavía no enviaste solicitudes. Buscá un viaje para comenzar."
                    : passengerPendingTotal > 0
                      ? "Tenés solicitudes por confirmar o contraofertas para revisar."
                      : "Todo al día: no hay solicitudes pendientes."}
              </p>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full" variant="outline">
                <Link href="/dashboard/pasajero">Ir al panel de pasajero</Link>
              </Button>
            </CardFooter>
          </Card>

          <Card className="flex h-full flex-col justify-between border border-border/60 bg-background/70 shadow-sm">
            <CardHeader className="flex flex-row items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Car className="h-5 w-5" />
              </div>
              <div className="space-y-2">
                <CardTitle className="text-lg font-semibold leading-tight text-foreground">
                  Actividad como conductor
                </CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                  Seguí tus viajes publicados y las solicitudes que necesitan respuesta.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-border/60 bg-card/70 p-4 text-center">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Viajes con pasajeros confirmados
                  </p>
                  <p className="text-3xl font-semibold text-foreground">
                    {isLoadingSummary ? "--" : driverSummary.confirmedRides}
                  </p>
                </div>
                <div className="rounded-lg border border-border/60 bg-card/70 p-4 text-center">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Solicitudes por responder
                  </p>
                  <p className="text-3xl font-semibold text-foreground">
                    {isLoadingSummary ? "--" : driverPendingTotal}
                  </p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                {isLoadingSummary
                  ? "Consultando tus publicaciones activas..."
                  : driverSummary.totalRides === 0
                    ? "Todavía no publicaste viajes. Creá uno para comenzar a recibir solicitudes."
                    : driverPendingTotal > 0
                      ? "Tenés solicitudes pendientes o contraofertas a revisar."
                      : "Todo listo: no hay solicitudes pendientes por responder."}
              </p>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full" variant="outline">
                <Link href="/dashboard/conductor">Ir al panel de conductor</Link>
              </Button>
            </CardFooter>
          </Card>
        </section>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {quickActions.map((action) => (
            <Card
              key={action.title}
              className="flex h-full flex-col justify-between border border-border/60 bg-background/70 shadow-sm"
            >
              <CardHeader className="flex flex-row items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <action.icon className="h-5 w-5" />
                </div>
                <div className="space-y-2">
                  <CardTitle className="text-lg font-semibold leading-tight text-foreground">
                    {action.title}
                  </CardTitle>
                  <CardDescription className="text-sm text-muted-foreground">
                    {action.description}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <Button asChild className="w-full">
                  <Link href={action.href}>{action.label}</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="border border-border/60 bg-card/80 shadow-sm lg:col-span-2">
            <CardHeader>
              <div className="flex items-center gap-3 text-foreground">
                <LayoutDashboard className="h-6 w-6 text-primary" />
                <div>
                  <CardTitle className="text-2xl">Cómo sacarle provecho a tu panel</CardTitle>
                  <CardDescription className="text-sm">
                    Tené todo bajo control desde tu celular: es rápido, claro y pensado para usarse en movimiento.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5 pt-4 text-sm sm:text-base">
              <div className="flex items-start gap-3">
                <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  1
                </span>
                <div>
                  <p className="font-semibold text-foreground">Elegí tu próximo paso</p>
                  <p className="text-muted-foreground">
                    Accedé al panel de pasajero para revisar reservas o ingresá al panel de conductor para administrar tus viajes publicados.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  2
                </span>
                <div>
                  <p className="font-semibold text-foreground">Respondé solicitudes y mensajes</p>
                  <p className="text-muted-foreground">
                    Gestioná confirmaciones, contraofertas y conversaciones desde cualquier dispositivo sin perderte novedades.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  3
                </span>
                <div>
                  <p className="font-semibold text-foreground">Prepará tu viaje</p>
                  <p className="text-muted-foreground">
                    Coordiná puntos de encuentro, horarios y compartí información clave con el resto del equipo antes de salir.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="flex flex-col justify-between border border-border/60 bg-background/70 shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-3 text-foreground">
                <CheckCircle2 className="h-6 w-6 text-primary" />
                <div>
                  <CardTitle className="text-xl">Recordá</CardTitle>
                  <CardDescription>
                    Estos atajos te mantienen informado y seguro en cada viaje.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-2 text-sm">
              {highlights.map((item) => (
                <div key={item.title} className="flex items-start gap-3">
                  <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <item.icon className="h-4 w-4" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">{item.title}</p>
                    <p className="text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      </div>
    </AppLayout>
  );
}
