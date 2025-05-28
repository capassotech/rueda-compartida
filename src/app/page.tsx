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
            Welcome to Rueda Compartida
          </h1>
          <p className="mt-4 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Find or offer rides with ease. Connect with fellow travelers and make your journey more affordable and enjoyable.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/search-rides">
                <Search className="mr-2 h-5 w-5" />
                Find a Ride
              </Link>
            </Button>
            <Button size="lg" variant="secondary" asChild>
              <Link href="/create-ride">
                <UserPlus className="mr-2 h-5 w-5" />
                Offer a Ride
              </Link>
            </Button>
          </div>
        </header>

        <section className="py-12 md:py-20 w-full">
          <h2 className="text-3xl font-bold mb-10">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-left shadow-lg hover:shadow-primary/20 transition-shadow">
              <CardHeader>
                <div className="bg-primary/10 p-3 rounded-md w-fit mb-3">
                  <Search className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>Search for a Ride</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Enter your origin, destination, and date to find available rides. Browse through listings and choose the one that suits you best.
                </CardDescription>
              </CardContent>
            </Card>
            <Card className="text-left shadow-lg hover:shadow-primary/20 transition-shadow">
              <CardHeader>
                <div className="bg-primary/10 p-3 rounded-md w-fit mb-3">
                  <Car className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>Offer a Ride</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Got empty seats? Post your ride details including route, time, and price per seat. Help others while covering your fuel costs.
                </CardDescription>
              </CardContent>
            </Card>
            <Card className="text-left shadow-lg hover:shadow-primary/20 transition-shadow">
              <CardHeader>
                <div className="bg-primary/10 p-3 rounded-md w-fit mb-3">
                  <UserPlus className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>Connect & Travel</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Passengers can request to book a seat. Drivers can accept requests. Communicate and coordinate for a smooth journey together.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </section>
        
        <section className="py-12 md:py-20 w-full">
          <div className="relative aspect-[2/1] w-full max-w-4xl mx-auto rounded-lg overflow-hidden shadow-2xl">
             <Image 
                src="https://placehold.co/1200x600.png" 
                alt="Carpooling illustration" 
                layout="fill"
                objectFit="cover"
                data-ai-hint="journey roadtrip"
              />
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <h3 className="text-4xl font-bold text-white p-4">Share the Journey, Share the Cost</h3>
              </div>
          </div>
        </section>

      </div>
    </AppLayout>
  );
}
