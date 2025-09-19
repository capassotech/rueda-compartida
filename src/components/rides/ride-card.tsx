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
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-provider";
import { requestRide } from "@/lib/firestore-rides";
import { useState } from "react";
import { Loader2 } from "lucide-react";

interface RideCardProps {
  ride: Ride;
}

export function RideCard({ ride }: RideCardProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isRequesting, setIsRequesting] = useState(false);
  const [isOfferDialogOpen, setIsOfferDialogOpen] = useState(false);
  const [offerValue, setOfferValue] = useState(() => ride.price.toString());

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

  return (
    <Card className="w-full shadow-lg hover:shadow-primary/20 transition-shadow">
      <CardHeader>
        <CardTitle className="text-xl md:text-2xl">{ride.origin} a {ride.destination}</CardTitle>
        <CardDescription>Conductor: {ride.driverName}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center text-sm text-muted-foreground">
          <CalendarDays className="mr-2 h-4 w-4 text-primary" />
          <span>{new Date(ride.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
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
      <CardFooter>
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