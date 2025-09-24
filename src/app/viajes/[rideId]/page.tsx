import type { Metadata } from "next";
import { AppLayout } from "@/components/layout/app-layout";
import { RideShareDetails, type RideShareFallback } from "@/components/rides/ride-share-details";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const APP_BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);

type RideSharePageProps = {
  params: { rideId: string };
  searchParams: Record<string, string | string[] | undefined>;
};

export function generateStaticParams(): RideSharePageProps["params"][] {
  return [];
}

function getSingleValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function parseNumber(value: string | undefined): number | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function buildFallback(searchParams: RideSharePageProps["searchParams"]): RideShareFallback {
  return {
    origin: getSingleValue(searchParams.origin),
    destination: getSingleValue(searchParams.destination),
    date: getSingleValue(searchParams.date),
    time: getSingleValue(searchParams.time),
    driverName: getSingleValue(searchParams.driverName),
    price: parseNumber(getSingleValue(searchParams.price)),
    availableSeats: parseNumber(getSingleValue(searchParams.availableSeats)),
  };
}

function buildDescription(fallback: RideShareFallback): string {
  const segments: string[] = [];

  if (fallback.origin && fallback.destination) {
    segments.push(`Desde ${fallback.origin} hacia ${fallback.destination}`);
  }

  if (fallback.date) {
    segments.push(`Fecha ${fallback.date}`);
  }

  if (fallback.time) {
    segments.push(`Hora ${fallback.time}`);
  }

  if (typeof fallback.price === "number") {
    segments.push(`Valor sugerido $${fallback.price.toFixed(2)}`);
  }

  return (
    segments.join(" · ") ||
    "Conocé los detalles de este viaje compartido en Rueda Compartida y solicitá tu lugar."
  );
}

export async function generateMetadata({
  params,
  searchParams,
}: RideSharePageProps): Promise<Metadata> {
  const fallback = buildFallback(searchParams);
  const titleBase = fallback.origin && fallback.destination
    ? `${fallback.origin} a ${fallback.destination}`
    : "Viaje compartido";
  const title = `${titleBase} | Rueda Compartida`;
  const description = buildDescription(fallback);
  const absoluteUrl = APP_BASE_URL
    ? new URL(`/viajes/${params.rideId}`, APP_BASE_URL).toString()
    : undefined;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      url: absoluteUrl,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default function RideSharePage({ params, searchParams }: RideSharePageProps) {
  const fallbackRide = buildFallback(searchParams);

  return (
    <AppLayout>
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-3xl">
              Invitá pasajeros a tu viaje compartido
            </CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground">
            Compartí este enlace para que otras personas vean la información del viaje y soliciten un lugar de forma segura.
          </CardContent>
        </Card>

        <RideShareDetails rideId={params.rideId} fallbackRide={fallbackRide} />
      </div>
    </AppLayout>
  );
}
