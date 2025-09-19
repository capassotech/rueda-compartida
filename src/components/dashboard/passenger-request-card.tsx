"use client";

import { useState } from "react";
import type { RideRequest } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CalendarDays,
  Clock,
  MapPin,
  CircleDollarSign,
  CheckCircle,
  XCircle,
  Loader2,
  ArrowLeftRight,
  HandCoins,
  AlertTriangle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  acceptRideRequest,
  rejectRideRequest,
  updateRideRequestOffer,
} from "@/lib/firestore-rides";

interface PassengerRequestCardProps {
  request: RideRequest;
}

type PassengerAction = "accept" | "reject" | "offer" | null;

export function PassengerRequestCard({ request }: PassengerRequestCardProps) {
  const { toast } = useToast();
  const [currentAction, setCurrentAction] = useState<PassengerAction>(null);
  const [isOfferDialogOpen, setIsOfferDialogOpen] = useState(false);
  const [offerValue, setOfferValue] = useState(
    () => (request.offeredPrice ?? request.price ?? 0).toString(),
  );

  let statusColor: "default" | "secondary" | "destructive" | "outline" | null | undefined = "secondary";
  let StatusIcon = Loader2;

  switch (request.status) {
    case "accepted":
      statusColor = "default";
      StatusIcon = CheckCircle;
      break;
    case "rejected":
      statusColor = "destructive";
      StatusIcon = XCircle;
      break;
    case "countered":
      statusColor = "outline";
      StatusIcon = ArrowLeftRight;
      break;
    case "pending":
    default:
      statusColor = "secondary";
      StatusIcon = Loader2;
      break;
  }

  const handleReject = async () => {
    if (!request.id) return;
    setCurrentAction("reject");
    const result = await rejectRideRequest(
      request.id,
      request.rideId,
      "passenger",
    );
    setCurrentAction(null);

    if (result.success) {
      toast({
        title: "Solicitud cancelada",
        description: "Notificamos al conductor que cancelaste la solicitud.",
        action: <XCircle className="text-red-500" />,
      });
    } else {
      toast({
        title: "No se pudo cancelar",
        description:
          result.message || "Intentá nuevamente en unos instantes.",
        variant: "destructive",
        action: <AlertTriangle className="text-red-500" />,
      });
    }
  };

  const handleAcceptCounterOffer = async () => {
    if (
      !request.id ||
      request.counterOfferPrice === null ||
      request.counterOfferPrice === undefined ||
      request.counterOfferPrice <= 0
    ) {
      toast({
        title: "Contraoferta inválida",
        description: "No encontramos la contraoferta del conductor.",
        variant: "destructive",
      });
      return;
    }

    setCurrentAction("accept");
    const result = await acceptRideRequest(
      request.id,
      request.rideId,
      request.counterOfferPrice,
      "passenger",
    );
    setCurrentAction(null);

    if (result.success) {
      toast({
        title: "Viaje confirmado",
        description: "Aceptaste la contraoferta del conductor.",
        action: <CheckCircle className="text-green-500" />,
      });
    } else {
      toast({
        title: "No se pudo confirmar",
        description:
          result.message || "Ocurrió un error al aceptar la contraoferta.",
        variant: "destructive",
        action: <AlertTriangle className="text-red-500" />,
      });
    }
  };

  const handleSubmitOffer = async () => {
    if (!request.id) return;
    const parsedOffer = Number(offerValue);
    if (!Number.isFinite(parsedOffer) || parsedOffer <= 0) {
      toast({
        title: "Oferta inválida",
        description: "Ingresá un monto válido para tu nueva oferta.",
        variant: "destructive",
      });
      return;
    }

    setCurrentAction("offer");
    const result = await updateRideRequestOffer(request.id, parsedOffer);
    setCurrentAction(null);

    if (result.success) {
      toast({
        title: "Oferta enviada",
        description: "Actualizamos la oferta y avisamos al conductor.",
        action: <HandCoins className="text-primary" />,
      });
      setIsOfferDialogOpen(false);
    } else {
      toast({
        title: "No se pudo enviar",
        description:
          result.message || "Intentá de nuevo más tarde.",
        variant: "destructive",
        action: <AlertTriangle className="text-red-500" />,
      });
    }
  };

  const pendingMessage = (() => {
    switch (request.status) {
      case "pending":
        return "Esperando la respuesta del conductor.";
      case "countered":
        return "El conductor te envió una contraoferta.";
      case "accepted":
        return request.finalPrice
          ? `Solicitud confirmada por $${request.finalPrice.toFixed(2)}.`
          : "Solicitud confirmada.";
      case "rejected":
      default:
        return "La solicitud fue rechazada.";
    }
  })();

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl">
              {request.origin || "N/A"} a {request.destination || "N/A"}
            </CardTitle>
            <CardDescription>
              Conductor: {request.driverName || "N/A"} (ID del Viaje: {request.rideId})
            </CardDescription>
          </div>
          <Badge variant={statusColor} className="capitalize flex items-center gap-1">
            <StatusIcon
              className={`h-4 w-4 ${request.status === "pending" ? "animate-spin" : ""}`}
            />
            {request.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center text-sm text-muted-foreground">
          <CalendarDays className="mr-2 h-4 w-4 text-primary" />
          <span>{request.date ? new Date(request.date).toLocaleDateString() : "N/A"}</span>
        </div>
        <div className="flex items-center text-sm text-muted-foreground">
          <Clock className="mr-2 h-4 w-4 text-primary" />
          <span>{request.time || "N/A"}</span>
        </div>
        <div className="flex items-center text-sm text-muted-foreground">
          <MapPin className="mr-2 h-4 w-4 text-primary" />
          <span>Desde: {request.origin || "N/A"}</span>
        </div>
        <div className="flex items-center text-sm text-muted-foreground">
          <MapPin className="mr-2 h-4 w-4 text-primary" />
          <span>Hacia: {request.destination || "N/A"}</span>
        </div>
        <div className="space-y-1 pt-2">
          <div className="flex items-center text-sm">
            <CircleDollarSign className="mr-2 h-4 w-4 text-primary" />
            <span className="font-medium">
              Precio publicado: $
              {typeof request.price === "number"
                ? request.price.toFixed(2)
                : "N/A"}
            </span>
          </div>
          <div className="flex items-center text-sm">
            <HandCoins className="mr-2 h-4 w-4 text-primary" />
            <span>
              Tu oferta: $
              {typeof request.offeredPrice === "number"
                ? request.offeredPrice.toFixed(2)
                : "N/A"}
            </span>
          </div>
          {request.counterOfferPrice !== null &&
          request.counterOfferPrice !== undefined ? (
            <div className="flex items-center text-sm text-primary">
              <ArrowLeftRight className="mr-2 h-4 w-4" />
              <span>
                Contraoferta del conductor: $
                {request.counterOfferPrice.toFixed(2)}
              </span>
            </div>
          ) : null}
          {request.finalPrice && request.status === "accepted" ? (
            <div className="flex items-center text-sm text-green-600">
              <CheckCircle className="mr-2 h-4 w-4" />
              <span>
                Precio acordado: ${request.finalPrice.toFixed(2)}
              </span>
            </div>
          ) : null}
        </div>

        <p className="text-sm text-muted-foreground">{pendingMessage}</p>

        <p className="text-xs text-muted-foreground">
          Solicitado el: {request.createdAt ? new Date(request.createdAt).toLocaleString() : "N/A"}
        </p>

        {request.status === "pending" ? (
          <div className="flex flex-wrap gap-2 pt-2">
            <Button size="sm" onClick={() => {
              setOfferValue(
                (request.offeredPrice ?? request.price ?? 0).toString(),
              );
              setIsOfferDialogOpen(true);
            }}>
              Actualizar oferta
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleReject}
              disabled={currentAction === "reject"}
            >
              {currentAction === "reject" && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Cancelar solicitud
            </Button>
          </div>
        ) : null}

        {request.status === "countered" ? (
          <div className="flex flex-wrap gap-2 pt-2">
            <Button
              size="sm"
              onClick={handleAcceptCounterOffer}
              disabled={currentAction === "accept"}
            >
              {currentAction === "accept" && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Aceptar contraoferta
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setOfferValue(
                  (
                    request.counterOfferPrice ??
                    request.offeredPrice ??
                    request.price ??
                    0
                  ).toString(),
                );
                setIsOfferDialogOpen(true);
              }}
              disabled={currentAction === "offer"}
            >
              {currentAction === "offer" && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Hacer nueva oferta
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleReject}
              disabled={currentAction === "reject"}
            >
              {currentAction === "reject" && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Rechazar
            </Button>
          </div>
        ) : null}
      </CardContent>

      <Dialog open={isOfferDialogOpen} onOpenChange={setIsOfferDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Proponer una nueva oferta</DialogTitle>
            <DialogDescription>
              Ajustá el monto que querés ofrecer al conductor.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">
                Oferta actual: $
                {(request.offeredPrice ?? request.price ?? 0).toFixed(2)}
              </p>
              {request.counterOfferPrice !== null &&
              request.counterOfferPrice !== undefined ? (
                <p className="text-sm text-muted-foreground">
                  Contraoferta vigente: $
                  {request.counterOfferPrice.toFixed(2)}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor={`passenger-offer-${request.id}`}>
                Nuevo monto (en pesos)
              </label>
              <Input
                id={`passenger-offer-${request.id}`}
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
            <Button
              onClick={handleSubmitOffer}
              disabled={currentAction === "offer"}
            >
              {currentAction === "offer" && (
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