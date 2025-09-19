import { AppLayout } from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Car, Search, UserPlus } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function HomePage() {
  return (
    <AppLayout>
      <div className="flex flex-col items-center justify-center text-center">
        <header className="py-12 md:py-20">
          <Car className="mx-auto h-20 w-20 text-primary mb-6" />
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Bienvenido a Rueda Compartida
          </h1>
          <p className="mt-4 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Buscá o ofrecé un viaje. Conocé personas y hacé más económico y divertido tu trayecto.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/buscar-viajes">
                <Search className="mr-2 h-5 w-5" />
                Buscar Viaje
              </Link>
            </Button>
            <Button size="lg" variant="secondary" asChild>
              <Link href="/crear-viaje">
                <UserPlus className="mr-2 h-5 w-5" />
                Ofrecer Viaje
              </Link>
            </Button>
          </div>
        </header>

        <section className="py-12 md:py-20 w-full">
          <h2 className="text-3xl font-bold mb-10">Cómo Funciona</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-left shadow-lg hover:shadow-primary/20 transition-shadow">
              <CardHeader>
                <div className="bg-primary/10 p-3 rounded-md w-fit mb-3">
                  <Search className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>Buscar un Viaje</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Ingresá tu origen, destino y fecha para encontrar viajes disponibles. Revisá las opciones y elegí la que mejor te convenga.
                </CardDescription>
              </CardContent>
            </Card>
            <Card className="text-left shadow-lg hover:shadow-primary/20 transition-shadow">
              <CardHeader>
                <div className="bg-primary/10 p-3 rounded-md w-fit mb-3">
                  <Car className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>Ofrecer un Viaje</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  ¿Te sobran lugares? Publicá los detalles de tu viaje incluyendo ruta, horario y precio por lugar. Ayudá a otros mientras cubrís tus gastos.
                </CardDescription>
              </CardContent>
            </Card>
            <Card className="text-left shadow-lg hover:shadow-primary/20 transition-shadow">
              <CardHeader>
                <div className="bg-primary/10 p-3 rounded-md w-fit mb-3">
                  <UserPlus className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>Conectar y Viajar</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Los pasajeros pueden pedir reservar un lugar. Los conductores pueden aceptar esos pedidos. Comunicate y coordiná para hacer el viaje juntos sin problemas.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </section>
        
        <section className="py-12 md:py-20 w-full">
          <div className="relative aspect-[2/1] w-full max-w-4xl mx-auto rounded-lg overflow-hidden shadow-2xl">
             {/* <Image 
                src="https://placehold.co/1200x600.png " 
                alt="Ilustración de viaje compartido" 
                layout="fill"
                objectFit="cover"
                data-ai-hint="viaje en carretera"
              /> */}
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <h3 className="text-4xl font-bold text-white p-4">Compartí el viaje, compartí el costo</h3>
              </div>
          </div>
        </section>

      </div>
    </AppLayout>
  );
}