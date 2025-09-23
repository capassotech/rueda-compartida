"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
import { createRide } from "@/lib/firestore-rides";
import { useAuth } from "@/contexts/auth-provider";
import { useRouter } from "next/navigation";
import { rideFormSchema, type RideFormValues } from "@/lib/validators/ride";
import { toLocalDate } from "@/lib/date";
import { useMediaQuery } from "@/hooks/use-media-query";

export function CreateRideForm() {
  const { toast } = useToast();
  const { user } = useAuth();
  const router = useRouter();
  const isDesktop = useMediaQuery("(min-width: 640px)");

  const form = useForm<RideFormValues>({
    resolver: zodResolver(rideFormSchema),
    defaultValues: {
      origin: "",
      destination: "",
      time: "10:00",
      availableSeats: 1,
      price: 0,
    },
  });

  const { formState: { isSubmitting } } = form;

  async function onSubmit(values: RideFormValues) {
    if (!user) {
      toast({ 
        title: "Error", 
        description: "Debés iniciar sesión para ofrecer un viaje.", 
        variant: "destructive" 
      });
      return;
    }

    const rideData = {
      ...values,
      date: format(values.date, "yyyy-MM-dd"), // Formato de fecha para la acción
      driverUid: user.uid,
      driverName: user.displayName || user.email || "Conductor Anónimo",
    };
    
    const result = await createRide(rideData);

    if (result.success) {
      toast({
        title: "Viaje Creado!",
        description: "Tu viaje ha sido publicado correctamente.",
      });
      form.reset();
      router.push('/dashboard/conductor'); // O a la página del detalle del viaje
    } else {
      toast({
        title: "No se Pudo Crear el Viaje",
        description: result.message || "Ocurrió un error inesperado.",
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
                <FormLabel>Origen</FormLabel>
                <FormControl>
                  <Input placeholder="ej. Ciudad de Buenos Aires" {...field} />
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
                <FormLabel>Destino</FormLabel>
                <FormControl>
                  <Input placeholder="ej. Córdoba" {...field} />
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
                <FormLabel>Fecha</FormLabel>
                {isDesktop ? (
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
                            <span>Seleccioná una fecha</span>
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
                        disabled={(date) =>
                          date < new Date(new Date().setDate(new Date().getDate() - 1))
                        } // Fechas pasadas deshabilitadas
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                ) : (
                  <FormControl>
                    <Input
                      type="date"
                      value={field.value ? format(field.value, "yyyy-MM-dd") : ""}
                      min={format(new Date(), "yyyy-MM-dd")}
                      onChange={(event) => {
                        const nextValue = toLocalDate(event.target.value);
                        field.onChange(nextValue ?? undefined);
                      }}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                    />
                  </FormControl>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hora (HH:MM)</FormLabel>
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
                <FormLabel>Lugares Disponibles</FormLabel>
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
                <FormLabel>Precio por Lugar ($)</FormLabel>
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
          Ofrecer Viaje
        </Button>
      </form>
    </Form>
  );
}