import { AppLayout } from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Car, Check, Search, ShieldCheck, UserPlus } from 'lucide-react';
import Link from 'next/link';

const featureList = [
  {
    icon: Search,
    title: 'Encontrá viajes confiables',
    description:
      'Filtrá por origen, destino y fecha para sumarte al viaje que mejor se adapte a tu agenda.',
  },
  {
    icon: ShieldCheck,
    title: 'Conductores verificados',
    description:
      'Sumate a una comunidad moderada, con perfiles reales y comunicación transparente.',
  },
  {
    icon: UserPlus,
    title: 'Compartí tu viaje en minutos',
    description:
      'Publicá tu recorrido, definí el precio por asiento y confirmá solicitudes desde tu panel.',
  },
];

const stats = [
  { label: 'Conductores activos', value: '280+' },
  { label: 'Viajes confirmados', value: '1.9k' },
  { label: 'Ciudades conectadas', value: '85' },
];

export default function HomePage() {
  return (
    <AppLayout>
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-12 py-8 sm:py-12">
        <section className="rounded-3xl border border-border/60 bg-card/70 p-6 shadow-sm sm:p-10">
          <div className="flex flex-col gap-8 text-center sm:text-left">
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 text-primary">
                  <Car className="h-6 w-6" />
                </div>
                <div className="max-w-xl space-y-3 text-balance">
                  <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                    Movete de forma inteligente con Rueda Compartida
                  </h1>
                  <p className="text-sm text-muted-foreground sm:text-base">
                    Reservá tu asiento o compartí tu viaje en segundos. Diseñamos una experiencia ágil, mobile-first y lista para tu día a día.
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-3 sm:items-end">
                <Button size="lg" className="w-full sm:w-auto" asChild>
                  <Link href="/buscar-viajes">
                    <Search className="mr-2 h-5 w-5" />
                    Buscar viajes
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="w-full sm:w-auto" asChild>
                  <Link href="/crear-viaje">
                    <UserPlus className="mr-2 h-5 w-5" />
                    Ofrecer un viaje
                  </Link>
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 text-sm text-muted-foreground sm:grid-cols-3 sm:text-base">
              {stats.map((stat) => (
                <div key={stat.label} className="rounded-xl border border-border/40 bg-background/60 p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">{stat.label}</p>
                  <p className="mt-1 text-2xl font-semibold text-foreground">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-6 sm:grid-cols-3">
          {featureList.map((feature) => (
            <Card key={feature.title} className="border border-border/60 bg-card/70 shadow-sm">
              <CardContent className="flex flex-col gap-4 p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary">
                  <feature.icon className="h-5 w-5" />
                </div>
                <div className="space-y-2 text-left">
                  <h3 className="text-lg font-semibold text-foreground">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="rounded-3xl border border-border/60 bg-gradient-to-r from-primary/10 via-background to-primary/10 p-6 shadow-sm sm:p-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-3 text-balance text-center sm:text-left">
              <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">
                Simplificamos la forma de coordinar tus viajes compartidos
              </h2>
              <p className="text-sm text-muted-foreground sm:text-base">
                Gestioná tus solicitudes, confirmá pasajeros y mantené todo sincronizado gracias a la persistencia en Firestore.
              </p>
              <ul className="space-y-2 text-left text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" /> Registro rápido con Google o correo
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" /> Paneles pensados para conductores y pasajeros
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" /> Datos guardados en tiempo real y disponibles siempre
                </li>
              </ul>
            </div>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:text-right">
              <Button size="lg" className="w-full sm:w-auto" asChild>
                <Link href="/register">Crear cuenta</Link>
              </Button>
              <Button size="lg" variant="outline" className="w-full sm:w-auto" asChild>
                <Link href="/dashboard/conductor">Ir al panel</Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}