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
  requests: RideRequest[]; // Requests specific to this ride
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

    // Placeholder: This action would update Firestore
    const result = await manageRideRequestAction(null, formData);

    if (result.success && result.updatedRequest) {
      setRequests(prevRequests => 
        prevRequests.map(req => req.id === requestId ? result.updatedRequest as RideRequest : req)
      );
      toast({ 
        title: `Request ${newStatus}`, 
        description: `Successfully ${newStatus} the ride request.`,
        action: newStatus === 'accepted' ? <CheckCircle className="text-green-500" /> : <XCircle className="text-red-500" />
      });
    } else {
      toast({ 
        title: "Action Failed", 
        description: result.message || `Could not ${newStatus} request.`, 
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
          <span>{ride.origin} to {ride.destination}</span>
          <Badge variant={ride.availableSeats > 0 ? "secondary" : "destructive"}>
            {ride.availableSeats > 0 ? `${ride.availableSeats} seats left` : "Full"}
          </Badge>
        </CardTitle>
        <CardDescription>
          On {new Date(ride.date).toLocaleDateString()} at {ride.time} | ${ride.price.toFixed(2)} per seat
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="requests">
            <AccordionTrigger>
                View Ride Requests ({pendingRequests.length} pending, {acceptedRequests.length} accepted)
            </AccordionTrigger>
            <AccordionContent>
              {requests.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">No requests for this ride yet.</p>
              ) : (
                <div className="space-y-4 pt-2">
                  {requests.map((request) => (
                    <div key={request.id} className="p-3 border rounded-md bg-background/50">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-semibold">{request.passengerName}</p>
                          <p className="text-xs text-muted-foreground">Requested on: {request.createdAt ? new Date(request.createdAt).toLocaleDateString() : 'N/A'}</p>
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
                            <UserCheck className="mr-1 h-4 w-4" /> Accept
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-red-500 border-red-500 hover:bg-red-500/10 hover:text-red-600"
                            onClick={() => handleManageRequest(request.id!, 'rejected')}
                            disabled={processingRequestId === request.id}
                          >
                             {processingRequestId === request.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            <UserX className="mr-1 h-4 w-4" /> Reject
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
        <Button variant="outline" className="w-full">Edit Ride (Not Implemented)</Button>
      </CardFooter>
    </Card>
  );
}
