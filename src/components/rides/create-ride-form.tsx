"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { createRideAction } from "@/lib/actions/rides"; // Placeholder action
import { useAuth } from "@/contexts/auth-provider";
import { useRouter } from "next/navigation";

const createRideSchema = z.object({
  origin: z.string().min(3, "Origin must be at least 3 characters."),
  destination: z.string().min(3, "Destination must be at least 3 characters."),
  date: z.date({ required_error: "Date is required." }),
  time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:MM)."),
  availableSeats: z.coerce.number().int().min(1, "At least 1 seat must be available.").max(10, "Maximum 10 seats."),
  price: z.coerce.number().min(0, "Price cannot be negative."),
});

type CreateRideFormValues = z.infer<typeof createRideSchema>;

export function CreateRideForm() {
  const { toast } = useToast();
  const { user } = useAuth();
  const router = useRouter();

  const form = useForm<CreateRideFormValues>({
    resolver: zodResolver(createRideSchema),
    defaultValues: {
      origin: "",
      destination: "",
      time: "10:00",
      availableSeats: 1,
      price: 0,
    },
  });

  const {formState: {isSubmitting}} = form;

  async function onSubmit(values: CreateRideFormValues) {
    if (!user) {
      toast({ title: "Error", description: "You must be logged in to create a ride.", variant: "destructive" });
      return;
    }

    const rideData = {
      ...values,
      date: format(values.date, "yyyy-MM-dd"), // Format date to string for action
      driverUid: user.uid,
      driverName: user.displayName || user.email || "Anonymous Driver",
    };
    
    // Convert rideData to FormData for server action
    const formData = new FormData();
    Object.entries(rideData).forEach(([key, value]) => {
      formData.append(key, String(value));
    });

    // Placeholder: In a real app, this action would interact with Firestore
    const result = await createRideAction(null, formData); 

    if (result.success) {
      toast({
        title: "Ride Created!",
        description: "Your ride has been successfully posted.",
      });
      form.reset();
      router.push('/dashboard/driver'); // Or to the ride details page
    } else {
      toast({
        title: "Failed to Create Ride",
        description: result.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="origin"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Origin</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., New York City" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="destination"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Destination</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Boston" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() -1)) } // Disable past dates
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Time (HH:MM)</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="availableSeats"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Available Seats</FormLabel>
                <FormControl>
                  <Input type="number" min="1" max="10" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price per Seat ($)</FormLabel>
                <FormControl>
                  <Input type="number" min="0" step="0.01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <Button type="submit" className="w-full md:w-auto" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Create Ride
        </Button>
      </form>
    </Form>
  );
}
