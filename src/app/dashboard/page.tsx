"use client";

import Link from "next/link";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuthGuard } from "@/hooks/use-auth-guard";
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

type DashboardAction = {
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

const quickActions: DashboardAction[] = [
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
  {
    title: "Panel de pasajero",
    description:
      "Seguí el estado de tus reservas, aceptá propuestas y respondé mensajes de los conductores en tiempo real.",
    href: "/dashboard/pasajero",
    label: "Abrir panel pasajero",
    icon: Users,
  },
  {
    title: "Panel de conductor",
    description:
      "Gestioná tus viajes publicados, respondé solicitudes y confirmá pasajeros desde un único lugar.",
    href: "/dashboard/conductor",
    label: "Abrir panel conductor",
    icon: Car,
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

export default function DashboardPage() {
  const { user } = useAuthGuard();

  const greetingName = user?.displayName?.split(" ")[0]
    || user?.email?.split("@")[0]
    || "tripulante";

  return (
    <AppLayout>
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 py-6 sm:py-10">
        <section className="rounded-3xl border border-border/60 bg-card/80 p-6 shadow-sm sm:p-10">
          <div className="flex flex-col gap-6 text-center sm:text-left">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-3 text-balance">
                <p className="text-sm font-medium uppercase tracking-wide text-primary/90">
                  Tu centro de operaciones
                </p>
                <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                  Hola, {greetingName}! 👋
                </h1>
                <p className="text-sm text-muted-foreground sm:text-base">
                  Elegí por dónde empezar: buscá un viaje como pasajero, publicá tu recorrido como conductor o revisá tus solicitudes y notificaciones.
                </p>
              </div>
              <div className="grid w-full gap-3 sm:w-auto">
                <Button asChild size="lg" className="w-full">
                  <Link href="/buscar-viajes">
                    <Search className="mr-2 h-5 w-5" />
                    Buscar viajes
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="w-full">
                  <Link href="/crear-viaje">
                    <PlusCircle className="mr-2 h-5 w-5" />
                    Crear un viaje
                  </Link>
                </Button>
              </div>
            </div>
          </div>
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
