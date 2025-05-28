"use client";

import type { Ride, RideRequest } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CalendarDays, Clock, Users, CircleDollarSign, UserCheck, UserX, CheckCircle, XCircle, Loader2, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { manageRideRequestAction } from "@/lib/actions/rides"; // Placeholder
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface DriverRideCardProps {
  ride: Ride;
  requests: RideRequest[]; // Solicitudes específicas para este viaje
}

export function DriverRideCard({ ride, requests: initialRequests }: DriverRideCardProps) {
  const { toast } = useToast();
  const [requests, setRequests] = useState<RideRequest[]>(initialRequests);
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);

  const handleManageRequest = async (requestId: string, newStatus: 'accepted' | 'rejected') => {
    setProcessingRequestId(requestId);
    const formData = new FormData();
    formData.append("requestId", requestId);
    formData.append("status", newStatus);
    formData.append("rideId", ride.id || "");

    // Placeholder: Esta acción actualizaría Firestore
    const result = await manageRideRequestAction(null, formData);

    if (result.success && result.updatedRequest) {
      setRequests(prevRequests => 
        prevRequests.map(req => req.id === requestId ? result.updatedRequest as RideRequest : req)
      );
      toast({ 
        title: `Solicitud ${newStatus === 'accepted' ? 'aceptada' : 'rechazada'}`, 
        description: `Se ha ${newStatus === 'accepted' ? 'aceptado' : 'rechazado'} correctamente la solicitud.`,
        action: newStatus === 'accepted' ? <CheckCircle className="text-green-500" /> : <XCircle className="text-red-500" />
      });
    } else {
      toast({ 
        title: "Acción Fallida", 
        description: result.message || `No se pudo ${newStatus === 'accepted' ? 'aceptar' : 'rechazar'} la solicitud.`, 
        variant: "destructive",
        action: <AlertTriangle className="text-red-500" />
      });
    }
    setProcessingRequestId(null);
  };
  
  const pendingRequests = requests.filter(req => req.status === 'pending');
  const acceptedRequests = requests.filter(req => req.status === 'accepted');

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl flex justify-between items-center">
          <span>{ride.origin} a {ride.destination}</span>
          <Badge variant={ride.availableSeats > 0 ? "secondary" : "destructive"}>
            {ride.availableSeats > 0 ? `${ride.availableSeats} lugares disponibles` : "Completo"}
          </Badge>
        </CardTitle>
        <CardDescription>
          El {new Date(ride.date).toLocaleDateString()} a las {ride.time} | ${ride.price.toFixed(2)} por lugar
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="requests">
            <AccordionTrigger>
              Ver Solicitudes ({pendingRequests.length} pendientes, {acceptedRequests.length} aceptadas)
            </AccordionTrigger>
            <AccordionContent>
              {requests.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">Aún no hay solicitudes para este viaje.</p>
              ) : (
                <div className="space-y-4 pt-2">
                  {requests.map((request) => (
                    <div key={request.id} className="p-3 border rounded-md bg-background/50">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-semibold">{request.passengerName}</p>
                          <p className="text-xs text-muted-foreground">Solicitado el: {request.createdAt ? new Date(request.createdAt).toLocaleDateString() : 'N/A'}</p>
                        </div>
                        <Badge variant={
                          request.status === 'accepted' ? 'default' : 
                          request.status === 'rejected' ? 'destructive' : 'secondary'
                        } className="capitalize">
                          {request.status}
                        </Badge>
                      </div>
                      {request.status === 'pending' && (
                        <div className="mt-3 flex space-x-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-green-500 border-green-500 hover:bg-green-500/10 hover:text-green-600"
                            onClick={() => handleManageRequest(request.id!, 'accepted')}
                            disabled={processingRequestId === request.id}
                          >
                            {processingRequestId === request.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            <UserCheck className="mr-1 h-4 w-4" /> Aceptar
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-red-500 border-red-500 hover:bg-red-500/10 hover:text-red-600"
                            onClick={() => handleManageRequest(request.id!, 'rejected')}
                            disabled={processingRequestId === request.id}
                          >
                             {processingRequestId === request.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            <UserX className="mr-1 h-4 w-4" /> Rechazar
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full">Editar Viaje (No Implementado)</Button>
      </CardFooter>
    </Card>
  );
}