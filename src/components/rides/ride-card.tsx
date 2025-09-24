"use client";

import type { Ride } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  CalendarDays,
  Clock,
  MapPin,
  Users,
  CircleDollarSign,
  CheckCircle,
  AlertTriangle,
  Share2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-provider";
import { requestRide } from "@/lib/firestore-rides";
import { useState, useMemo } from "react";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toLocalDate } from "@/lib/date";

interface RideCardProps {
  ride: Ride;
  showShareButton?: boolean;
}

export function RideCard({ ride, showShareButton = true }: RideCardProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isRequesting, setIsRequesting] = useState(false);
  const [isOfferDialogOpen, setIsOfferDialogOpen] = useState(false);
  const [offerValue, setOfferValue] = useState(() => ride.price.toString());

  const formattedRideDate = useMemo(() => {
    const parsedDate = toLocalDate(ride.date);
    return parsedDate ? format(parsedDate, "PPP", { locale: es }) : ride.date;
  }, [ride.date]);

  const handleOpenOfferDialog = () => {
    if (!user) {
      toast({
        title: "Inicia Sesión",
        description: "Debés iniciar sesión para solicitar un viaje.",
        variant: "destructive",
      });
      return;
    }

    if (user.uid === ride.driverUid) {
      toast({
        title: "Acción No Permitida",
        description: "No puedes solicitar tu propio viaje.",
        variant: "destructive",
      });
      return;
    }

    setOfferValue((ride.price ?? 0).toString());
    setIsOfferDialogOpen(true);
  };

  const handleRequestRide = async () => {
    const parsedOffer = Number(offerValue);
    if (!Number.isFinite(parsedOffer) || parsedOffer <= 0) {
      toast({
        title: "Oferta inválida",
        description: "Ingresá un monto válido para tu oferta.",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Inicia Sesión",
        description: "Debés iniciar sesión para solicitar un viaje.",
        variant: "destructive",
      });
      return;
    }

    setIsRequesting(true);
    const result = await requestRide({
      rideId: ride.id || "",
      passengerUid: user.uid,
      passengerName: user.displayName || user.email || "Pasajero Anónimo",
      driverUid: ride.driverUid,
      driverName: ride.driverName,
      origin: ride.origin,
      destination: ride.destination,
      date: ride.date,
      time: ride.time,
      price: ride.price,
      offeredPrice: parsedOffer,
    });

    if (result.success) {
      toast({
        title: "Viaje Solicitado!",
        description: "Tu oferta fue enviada al conductor para su revisión.",
        action: <CheckCircle className="text-green-500" />,
      });
      setIsOfferDialogOpen(false);
    } else {
      toast({
        title: "Solicitud Fallida",
        description: result.message || "No se pudo enviar la solicitud.",
        variant: "destructive",
        action: <AlertTriangle className="text-red-500" />,
      });
    }
    setIsRequesting(false);
  };

  const handleShareRide = async () => {
    if (!ride.id) {
      toast({
        title: "No se puede compartir",
        description: "El viaje no tiene un identificador válido.",
        variant: "destructive",
      });
      return;
    }

    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const appBaseUrl = origin || "https://rueda-compartida.web.app";
      const shareUrl = new URL(`/viajes/${ride.id}`, appBaseUrl);

      shareUrl.searchParams.set("origin", ride.origin);
      shareUrl.searchParams.set("destination", ride.destination);
      shareUrl.searchParams.set("date", ride.date);
      shareUrl.searchParams.set("time", ride.time);
      shareUrl.searchParams.set("price", ride.price.toString());
      shareUrl.searchParams.set(
        "availableSeats",
        ride.availableSeats.toString(),
      );
      if (ride.driverName) {
        shareUrl.searchParams.set("driverName", ride.driverName);
      }

      const shareTitle = `${ride.origin} a ${ride.destination}`;
      const shareText = `Salida el ${formattedRideDate} a las ${ride.time}. ${ride.availableSeats} lugares disponibles a $${ride.price.toFixed(2)}.`;

      if (navigator.share) {
        await navigator.share({
          title: `Viaje compartido: ${shareTitle}`,
          text: shareText,
          url: shareUrl.toString(),
        });
        toast({
          title: "Enlace compartido",
          description: "Tu viaje se abrió en el diálogo de compartir.",
        });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl.toString());
        toast({
          title: "Enlace copiado",
          description: "Pegá el enlace para invitar pasajeros a tu viaje.",
        });
      } else {
        toast({
          title: "No se pudo compartir",
          description: "Tu dispositivo no permite compartir enlaces automáticamente.",
          variant: "destructive",
        });
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }

      console.error("Error al compartir el viaje", error);
      toast({
        title: "No se pudo compartir",
        description: "Ocurrió un error al generar el enlace del viaje.",
        variant: "destructive",
        action: <AlertTriangle className="text-red-500" />,
      });
    }
  };

  return (
    <Card className="w-full shadow-lg hover:shadow-primary/20 transition-shadow">
      <CardHeader>
        <CardTitle className="text-xl md:text-2xl">{ride.origin} a {ride.destination}</CardTitle>
        <CardDescription>Conductor: {ride.driverName}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center text-sm text-muted-foreground">
          <CalendarDays className="mr-2 h-4 w-4 text-primary" />
          <span>{formattedRideDate}</span>
        </div>
        <div className="flex items-center text-sm text-muted-foreground">
          <Clock className="mr-2 h-4 w-4 text-primary" />
          <span>{ride.time}</span>
        </div>
        <div className="flex items-center text-sm text-muted-foreground">
          <MapPin className="mr-2 h-4 w-4 text-primary" />
          <span>Desde: {ride.origin}</span>
        </div>
        <div className="flex items-center text-sm text-muted-foreground">
          <MapPin className="mr-2 h-4 w-4 text-primary" />
          <span>Hacia: {ride.destination}</span>
        </div>
        <div className="flex items-center text-sm">
          <Users className="mr-2 h-4 w-4 text-primary" />
          <span className="font-medium">{ride.availableSeats} lugares disponibles</span>
        </div>
        <div className="flex items-center text-lg font-semibold">
          <CircleDollarSign className="mr-2 h-5 w-5 text-primary" />
          <span>${ride.price.toFixed(2)}</span>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-2 sm:flex-row">
        <div className="flex w-full sm:flex-1">
          {user?.uid !== ride.driverUid ? (
            <Button
              className="w-full"
              onClick={handleOpenOfferDialog}
              disabled={ride.availableSeats === 0}
            >
              {ride.availableSeats > 0
                ? "Solicitar Viaje"
                : "No Hay Lugares Disponibles"}
            </Button>
          ) : (
            <Button className="w-full" disabled variant="outline">
              Este es tu viaje
            </Button>
          )}
        </div>
        {showShareButton && (
          <Button
            className="w-full sm:w-auto"
            onClick={handleShareRide}
            variant="secondary"
          >
            <Share2 className="mr-2 h-4 w-4" /> Compartir
          </Button>
        )}
      </CardFooter>

      <Dialog open={isOfferDialogOpen} onOpenChange={setIsOfferDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ofertar un lugar</DialogTitle>
            <DialogDescription>
              Proponé el precio que estás dispuesto a pagar por este viaje.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">
                Precio sugerido del viaje: ${ride.price.toFixed(2)}
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor={`offer-${ride.id}`}>
                Tu oferta (en pesos)
              </label>
              <Input
                id={`offer-${ride.id}`}
                type="number"
                min="0"
                step="0.01"
                value={offerValue}
                onChange={(event) => setOfferValue(event.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOfferDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleRequestRide} disabled={isRequesting}>
              {isRequesting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Enviar oferta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}