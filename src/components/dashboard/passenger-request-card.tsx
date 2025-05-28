"use client";

import type { RideRequest } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Clock, MapPin, CircleDollarSign, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PassengerRequestCardProps {
  request: RideRequest;
}

export function PassengerRequestCard({ request }: PassengerRequestCardProps) {
  let statusColor: "default" | "secondary" | "destructive" | "outline" | null | undefined = "secondary";
  let StatusIcon = Loader2;

  switch (request.status) {
    case 'accepted':
      statusColor = "default"; // verde en algunos temas
      StatusIcon = CheckCircle;
      break;
    case 'rejected':
      statusColor = "destructive";
      StatusIcon = XCircle;
      break;
    case 'pending':
      statusColor = "secondary"; // amarillo/gris
      StatusIcon = Loader2;
      break;
  }

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl">{request.origin || "N/A"} a {request.destination || "N/A"}</CardTitle>
            <CardDescription>Conductor: {request.driverName || "N/A"} (ID del Viaje: {request.rideId})</CardDescription>
          </div>
          <Badge variant={statusColor} className="capitalize flex items-center gap-1">
            <StatusIcon className={`h-4 w-4 ${request.status === 'pending' ? 'animate-spin' : ''}`} />
            {request.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center text-sm text-muted-foreground">
          <CalendarDays className="mr-2 h-4 w-4 text-primary" />
          <span>{request.date ? new Date(request.date).toLocaleDateString() : "N/A"}</span>
        </div>
        <div className="flex items-center text-sm text-muted-foreground">
          <Clock className="mr-2 h-4 w-4 text-primary" />
          <span>{request.time || "N/A"}</span>
        </div>
        <div className="flex items-center text-sm">
          <CircleDollarSign className="mr-2 h-4 w-4 text-primary" />
          <span className="font-medium">${typeof request.price === 'number' ? request.price.toFixed(2) : "N/A"}</span>
        </div>
        <p className="text-xs text-muted-foreground pt-2">
          Solicitado el: {request.createdAt ? new Date(request.createdAt).toLocaleString() : 'N/A'}
        </p>
      </CardContent>
      {/* Opcionalmente agregar un botón de cancelar si el estado es "pending" */}
    </Card>
  );
}