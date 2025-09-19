"use client";

import {
  useEffect,
  useMemo,
  useState,
  type MouseEvent,
} from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Ride, RideRequest } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  AlertTriangle,
  CalendarIcon,
  CheckCircle,
  Loader2,
  Pencil,
  Trash2,
  UserCheck,
  UserX,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  deleteRide,
  updateRide,
  updateRideRequestStatus,
} from "@/lib/firestore-rides";
import { rideFormSchema, type RideFormValues } from "@/lib/validators/ride";
import { useToast } from "@/hooks/use-toast";
import { format, isValid, parseISO } from "date-fns";

interface DriverRideCardProps {
  ride: Ride;
  requests: RideRequest[]; // Solicitudes específicas para este viaje
}

export function DriverRideCard({
  ride,
  requests: initialRequests,
}: DriverRideCardProps) {
  const { toast } = useToast();
  const [requests, setRequests] = useState<RideRequest[]>(initialRequests);
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(
    null,
  );
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSavingRide, setIsSavingRide] = useState(false);
  const [isDeletingRide, setIsDeletingRide] = useState(false);

  const form = useForm<RideFormValues>({
    resolver: zodResolver(rideFormSchema),
    defaultValues: mapRideToFormValues(ride),
  });

  useEffect(() => {
    setRequests(initialRequests);
  }, [initialRequests]);

  useEffect(() => {
    form.reset(mapRideToFormValues(ride));
  }, [ride, form]);

  const pendingRequests = useMemo(
    () => requests.filter((req) => req.status === "pending"),
    [requests],
  );
  const acceptedRequests = useMemo(
    () => requests.filter((req) => req.status === "accepted"),
    [requests],
  );
  const acceptedRequestCount = acceptedRequests.length;

  const formattedDate = useMemo(() => {
    const parsed = ride.date ? parseISO(ride.date) : null;
    return parsed && isValid(parsed) ? format(parsed, "PPP") : ride.date;
  }, [ride.date]);

  const handleManageRequest = async (
    requestId: string,
    newStatus: "accepted" | "rejected",
  ) => {
    setProcessingRequestId(requestId);
    const result = await updateRideRequestStatus(
      requestId,
      ride.id || "",
      newStatus,
    );

    if (result.success && result.updatedRequest) {
      setRequests((prevRequests) =>
        prevRequests.map((req) =>
          req.id === requestId
            ? (result.updatedRequest as RideRequest)
            : req,
        ),
      );
      toast({
        title: `Solicitud ${
          newStatus === "accepted" ? "aceptada" : "rechazada"
        }`,
        description: `Se ha ${
          newStatus === "accepted" ? "aceptado" : "rechazado"
        } correctamente la solicitud.`,
        action:
          newStatus === "accepted" ? (
            <CheckCircle className="text-green-500" />
          ) : (
            <XCircle className="text-red-500" />
          ),
      });
    } else {
      toast({
        title: "Acción Fallida",
        description:
          result.message ||
          `No se pudo ${
            newStatus === "accepted" ? "aceptar" : "rechazar"
          } la solicitud.`,
        variant: "destructive",
        action: <AlertTriangle className="text-red-500" />,
      });
    }
    setProcessingRequestId(null);
  };

  const handleEditSubmit = async (values: RideFormValues) => {
    if (!ride.id) {
      toast({
        title: "No se pudo actualizar",
        description: "No se encontró el identificador del viaje.",
        variant: "destructive",
      });
      return;
    }

    if (values.availableSeats < acceptedRequestCount) {
      toast({
        title: "Lugares insuficientes",
        description: `Ya tenés ${acceptedRequestCount} solicitudes aceptadas. Incrementá los lugares disponibles o rechazá alguna.`,
        variant: "destructive",
        action: <AlertTriangle className="text-red-500" />,
      });
      return;
    }

    setIsSavingRide(true);
    const result = await updateRide(ride.id, {
      origin: values.origin,
      destination: values.destination,
      date: format(values.date, "yyyy-MM-dd"),
      time: values.time,
      availableSeats: values.availableSeats,
      price: values.price,
    });
    setIsSavingRide(false);

    if (result.success) {
      toast({
        title: "Viaje actualizado",
        description: "Los cambios se guardaron correctamente.",
        action: <CheckCircle className="text-green-500" />,
      });
      setIsEditDialogOpen(false);
    } else {
      toast({
        title: "No se pudo actualizar",
        description:
          result.message || "Ocurrió un error inesperado al guardar.",
        variant: "destructive",
        action: <AlertTriangle className="text-red-500" />,
      });
    }
  };

  const handleDeleteRide = async () => {
    if (!ride.id) {
      toast({
        title: "No se pudo eliminar",
        description: "No se encontró el identificador del viaje.",
        variant: "destructive",
      });
      return;
    }

    setIsDeletingRide(true);
    const result = await deleteRide(ride.id);
    setIsDeletingRide(false);

    if (result.success) {
      toast({
        title: "Viaje eliminado",
        description:
          "El viaje y sus solicitudes asociadas fueron eliminados.",
      });
      setIsDeleteDialogOpen(false);
    } else {
      toast({
        title: "No se pudo eliminar",
        description:
          result.message || "Ocurrió un error inesperado al eliminar.",
        variant: "destructive",
        action: <AlertTriangle className="text-red-500" />,
      });
    }
  };

  const handleDeleteConfirmation = async (
    event: MouseEvent<HTMLButtonElement>,
  ) => {
    event.preventDefault();
    await handleDeleteRide();
  };

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl flex justify-between items-center">
          <span>
            {ride.origin} a {ride.destination}
          </span>
          <Badge variant={ride.availableSeats > 0 ? "secondary" : "destructive"}>
            {ride.availableSeats > 0
              ? `${ride.availableSeats} lugares disponibles`
              : "Completo"}
          </Badge>
        </CardTitle>
        <CardDescription>
          {formattedDate} a las {ride.time} | ${ride.price.toFixed(2)} por
          lugar
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="requests">
            <AccordionTrigger>
              Ver Solicitudes ({pendingRequests.length} pendientes,{' '}
              {acceptedRequests.length} aceptadas)
            </AccordionTrigger>
            <AccordionContent>
              {requests.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">
                  Aún no hay solicitudes para este viaje.
                </p>
              ) : (
                <div className="space-y-4 pt-2">
                  {requests.map((request) => (
                    <div
                      key={request.id}
                      className="p-3 border rounded-md bg-background/50"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-semibold">
                            {request.passengerName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Solicitado el:{' '}
                            {request.createdAt
                              ? new Date(request.createdAt).toLocaleDateString()
                              : 'N/A'}
                          </p>
                        </div>
                        <Badge
                          variant={
                            request.status === "accepted"
                              ? "default"
                              : request.status === "rejected"
                                ? "destructive"
                                : "secondary"
                          }
                          className="capitalize"
                        >
                          {request.status}
                        </Badge>
                      </div>
                      {request.status === "pending" && (
                        <div className="mt-3 flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-500 border-green-500 hover:bg-green-500/10 hover:text-green-600"
                            onClick={() =>
                              handleManageRequest(request.id!, "accepted")
                            }
                            disabled={processingRequestId === request.id}
                          >
                            {processingRequestId === request.id && (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            <UserCheck className="mr-1 h-4 w-4" /> Aceptar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-500 border-red-500 hover:bg-red-500/10 hover:text-red-600"
                            onClick={() =>
                              handleManageRequest(request.id!, "rejected")
                            }
                            disabled={processingRequestId === request.id}
                          >
                            {processingRequestId === request.id && (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
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
      <CardFooter className="flex flex-col sm:flex-row gap-2">
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full sm:w-auto">
              <Pencil className="mr-2 h-4 w-4" /> Editar Viaje
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Editar viaje</DialogTitle>
              <DialogDescription>
                Modificá los detalles del viaje. Actualmente tenés{' '}
                {acceptedRequestCount} solicitudes aceptadas.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleEditSubmit)}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="origin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Origen</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="ej. Ciudad de Buenos Aires"
                            {...field}
                          />
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
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground",
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
                                date <
                                new Date(
                                  new Date().setDate(new Date().getDate() - 1),
                                )
                              }
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

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSavingRide}>
                    {isSavingRide && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Guardar Cambios
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <AlertDialog
          open={isDeleteDialogOpen}
          onOpenChange={(open) => {
            if (!isDeletingRide) {
              setIsDeleteDialogOpen(open);
            }
          }}
        >
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="w-full sm:w-auto">
              <Trash2 className="mr-2 h-4 w-4" /> Eliminar Viaje
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar este viaje?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción eliminará el viaje y todas las solicitudes
                asociadas. No se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeletingRide}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirmation}
                disabled={isDeletingRide}
              >
                {isDeletingRide && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
}

function mapRideToFormValues(ride: Ride): RideFormValues {
  const parsedDate = ride.date ? parseISO(ride.date) : undefined;
  const safeDate = parsedDate && isValid(parsedDate) ? parsedDate : new Date();

  return {
    origin: ride.origin ?? "",
    destination: ride.destination ?? "",
    date: safeDate,
    time: ride.time ?? "10:00",
    availableSeats:
      typeof ride.availableSeats === "number"
        ? ride.availableSeats
        : Number(ride.availableSeats ?? 1),
    price:
      typeof ride.price === "number" ? ride.price : Number(ride.price ?? 0),
  };
}
