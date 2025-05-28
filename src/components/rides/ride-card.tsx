"use client";

import type { Ride } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Clock, MapPin, Users, CircleDollarSign, CheckCircle, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-provider";
import { requestRideAction } from "@/lib/actions/rides"; // Placeholder
import { useState } from "react";
import { Loader2 } from "lucide-react";

interface RideCardProps {
  ride: Ride;
}

export function RideCard({ ride }: RideCardProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isRequesting, setIsRequesting] = useState(false);

  const handleRequestRide = async () => {
    if (!user) {
      toast({ title: "Login Required", description: "Please log in to request a ride.", variant: "destructive" });
      return;
    }
    if (user.uid === ride.driverUid) {
      toast({ title: "Action Not Allowed", description: "You cannot request your own ride.", variant: "destructive" });
      return;
    }

    setIsRequesting(true);
    const formData = new FormData();
    formData.append("rideId", ride.id || "");
    formData.append("passengerUid", user.uid);
    formData.append("passengerName", user.displayName || user.email || "Anonymous Passenger");
    formData.append("driverUid", ride.driverUid);
    // Add denormalized ride data for the request document
    formData.append("origin", ride.origin);
    formData.append("destination", ride.destination);
    formData.append("date", ride.date);
    formData.append("time", ride.time);
    formData.append("price", String(ride.price));


    // Placeholder: This action would interact with Firestore
    const result = await requestRideAction(null, formData);

    if (result.success) {
      toast({ 
        title: "Ride Requested!", 
        description: "Your request has been sent to the driver.",
        action: <CheckCircle className="text-green-500" />
      });
    } else {
      toast({ 
        title: "Request Failed", 
        description: result.message || "Could not request ride.", 
        variant: "destructive",
        action: <AlertTriangle className="text-red-500" />
      });
    }
    setIsRequesting(false);
  };

  return (
    <Card className="w-full shadow-lg hover:shadow-primary/20 transition-shadow">
      <CardHeader>
        <CardTitle className="text-xl md:text-2xl">{ride.origin} to {ride.destination}</CardTitle>
        <CardDescription>Driver: {ride.driverName}</CardDescription>
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
          <span>From: {ride.origin}</span>
        </div>
        <div className="flex items-center text-sm text-muted-foreground">
          <MapPin className="mr-2 h-4 w-4 text-primary" />
          <span>To: {ride.destination}</span>
        </div>
        <div className="flex items-center text-sm">
          <Users className="mr-2 h-4 w-4 text-primary" />
          <span className="font-medium">{ride.availableSeats} seats available</span>
        </div>
        <div className="flex items-center text-lg font-semibold">
          <CircleDollarSign className="mr-2 h-5 w-5 text-primary" />
          <span>${ride.price.toFixed(2)}</span>
        </div>
      </CardContent>
      <CardFooter>
        {user?.uid !== ride.driverUid ? (
          <Button className="w-full" onClick={handleRequestRide} disabled={isRequesting || ride.availableSeats === 0}>
            {isRequesting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {ride.availableSeats > 0 ? 'Request Ride' : 'No Seats Available'}
          </Button>
        ) : (
          <Button className="w-full" disabled variant="outline">This is your ride</Button>
        )}
      </CardFooter>
    </Card>
  );
}
