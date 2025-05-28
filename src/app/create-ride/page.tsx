"use client";

import { AppLayout } from "@/components/layout/app-layout";
import { CreateRideForm } from "@/components/rides/create-ride-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { Loader2 } from "lucide-react";

export default function CreateRidePage() {
  const { user, loading } = useAuthGuard();

  if (loading || !user) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center min-h-[60vh]">
          {loading ? <Loader2 className="h-12 w-12 animate-spin text-primary" /> : <p>Please log in to create a ride.</p>}
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-3xl">Offer a New Ride</CardTitle>
            <CardDescription>
              Fill in the details below to publish your ride and find passengers.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CreateRideForm />
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
