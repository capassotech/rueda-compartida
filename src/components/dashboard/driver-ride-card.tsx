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
  ArrowLeftRight,
  CalendarIcon,
  CheckCircle,
  HandCoins,
  Loader2,
  Pencil,
  Trash2,
  UserCheck,
  UserX,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toLocalDate } from "@/lib/date";
import {
  acceptRideRequest,
  counterOfferRideRequest,
  deleteRide,
  rejectRideRequest,
  updateRide,
} from "@/lib/firestore-rides";
import { rideFormSchema, type RideFormValues } from "@/lib/validators/ride";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface DriverRideCardProps {
  ride: Ride;
  requests: RideRequest[]; // Solicitudes específicas para este viaje
  highlightedRequestId?: string | null;
  isHighlighted?: boolean;
}

export function DriverRideCard({
  ride,
  requests: initialRequests,
  highlightedRequestId = null,
  isHighlighted = false,
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
  const [requestToCounter, setRequestToCounter] = useState<RideRequest | null>(
    null,
  );
  const [counterOfferValue, setCounterOfferValue] = useState<string>("");
  const [isSendingCounterOffer, setIsSendingCounterOffer] = useState(false);
  const [accordionValue, setAccordionValue] = useState<string | undefined>();

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

  useEffect(() => {
    if (!highlightedRequestId) return;
    if (!requests.some((request) => request.id === highlightedRequestId)) return;
    setAccordionValue("requests");
  }, [highlightedRequestId, requests]);

  const activeRequests = useMemo(
    () =>
      requests.filter(
        (req) => req.status === "pending" || req.status === "countered",
      ),
    [requests],
  );
  const acceptedRequests = useMemo(
    () => requests.filter((req) => req.status === "accepted"),
    [requests],
  );
  const acceptedRequestCount = acceptedRequests.length;

  const formattedDate = useMemo(() => {
    const parsed = ride.date ? toLocalDate(ride.date) : null;
    return parsed ? format(parsed, "PPP", { locale: es }) : ride.date;
  }, [ride.date]);

  const updateRequestState = (updatedRequest: RideRequest) => {
    if (!updatedRequest.id) return;
    setRequests((prevRequests) =>
      prevRequests.map((req) =>
        req.id === updatedRequest.id ? updatedRequest : req,
      ),
    );
  };

  const handleAcceptRequest = async (
    request: RideRequest,
    acceptedPrice: number,
  ) => {
    if (!request.id || !ride.id) {
      toast({
        title: "Acción no disponible",
        description: "No se encontró la información necesaria de la solicitud.",
        variant: "destructive",
      });
      return;
    }

    setProcessingRequestId(request.id);
    const result = await acceptRideRequest(
      request.id,
      ride.id,
      acceptedPrice,
      "driver",
    );
    setProcessingRequestId(null);

    if (result.success && result.updatedRequest) {
      updateRequestState(result.updatedRequest as RideRequest);
      toast({
        title: "Solicitud aceptada",
        description: `Confirmaste el viaje por $${acceptedPrice.toFixed(2)}.`,
        action: <CheckCircle className="text-green-500" />,
      });
    } else {
      toast({
        title: "No se pudo aceptar",
        description:
          result.message || "Intentalo de nuevo en unos instantes.",
        variant: "destructive",
        action: <AlertTriangle className="text-red-500" />,
      });
    }
  };

  const handleRejectRequest = async (request: RideRequest) => {
    if (!request.id || !ride.id) {
      toast({
        title: "Acción no disponible",
        description: "No se encontró la información necesaria de la solicitud.",
        variant: "destructive",
      });
      return;
    }

    setProcessingRequestId(request.id);
    const result = await rejectRideRequest(request.id, ride.id, "driver");
    setProcessingRequestId(null);

    if (result.success && result.updatedRequest) {
      updateRequestState(result.updatedRequest as RideRequest);
      toast({
        title: "Solicitud rechazada",
        description: "Le avisamos al pasajero del rechazo.",
        action: <XCircle className="text-red-500" />,
      });
    } else {
      toast({
        title: "No se pudo rechazar",
        description:
          result.message || "Ocurrió un error al actualizar la solicitud.",
        variant: "destructive",
        action: <AlertTriangle className="text-red-500" />,
      });
    }
  };

  const openCounterOfferDialog = (request: RideRequest) => {
    if (isSendingCounterOffer) return;
    setRequestToCounter(request);
    setCounterOfferValue(
      (
        request.counterOfferPrice ||
        request.offeredPrice ||
        request.price ||
        ride.price ||
        0
      ).toString(),
    );
  };

  const handleCounterOfferSubmit = async () => {
    if (!requestToCounter?.id) return;
    const parsedValue = Number(counterOfferValue);
    if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
      toast({
        title: "Contraoferta inválida",
        description: "Ingresá un monto válido para la contraoferta.",
        variant: "destructive",
      });
      return;
    }

    setIsSendingCounterOffer(true);
    const result = await counterOfferRideRequest(
      requestToCounter.id,
      parsedValue,
    );
    setIsSendingCounterOffer(false);

    if (result.success && result.updatedRequest) {
      updateRequestState(result.updatedRequest as RideRequest);
      toast({
        title: "Contraoferta enviada",
        description: `Propusiste $${parsedValue.toFixed(2)} al pasajero.`,
        action: <HandCoins className="text-primary" />,
      });
      setRequestToCounter(null);
    } else {
      toast({
        title: "No se pudo contraofertar",
        description:
          result.message || "Reintentá más tarde.",
        variant: "destructive",
        action: <AlertTriangle className="text-red-500" />,
      });
    }
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
    <Card
      id={ride.id ? `ride-${ride.id}` : undefined}
      className={cn(
        "w-full shadow-lg transition-shadow",
        isHighlighted && "border-primary/80 ring-2 ring-primary/40",
      )}
    >
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
        <Accordion
          type="single"
          collapsible
          className="w-full"
          value={accordionValue}
          onValueChange={(value) =>
            setAccordionValue(value === "" ? undefined : value)
          }
        >
          <AccordionItem value="requests">
            <AccordionTrigger>
              Ver Solicitudes ({activeRequests.length} en curso,{' '}
              {acceptedRequests.length} aceptadas)
            </AccordionTrigger>
            <AccordionContent>
              {requests.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">
                  Aún no hay solicitudes para este viaje.
                </p>
              ) : (
                <div className="space-y-4 pt-2">
                  {requests.map((request) => {
                    const isHighlightedRequest =
                      highlightedRequestId === request.id;
                    const passengerOffer =
                      typeof request.offeredPrice === "number"
                        ? request.offeredPrice
                        : typeof request.price === "number"
                          ? request.price
                          : ride.price;
                    const badgeVariant =
                      request.status === "accepted"
                        ? "default"
                        : request.status === "rejected"
                          ? "destructive"
                          : request.status === "countered"
                            ? "outline"
                            : "secondary";

                    return (
                      <div
                        key={request.id}
                        data-request-id={request.id}
                        className={cn(
                          "p-3 border rounded-md bg-background/50 transition-shadow",
                          isHighlightedRequest &&
                            "border-primary/80 ring-2 ring-primary/40 bg-primary/5",
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
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
                          <Badge variant={badgeVariant} className="capitalize">
                            {request.status}
                          </Badge>
                        </div>

                        <div className="mt-3 space-y-2 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <HandCoins className="h-4 w-4 text-primary" />
                            <span>
                              Oferta del pasajero: $
                              {passengerOffer.toFixed(2)}
                            </span>
                          </div>
                          {request.counterOfferPrice !== null &&
                          request.counterOfferPrice !== undefined ? (
                            <div className="flex items-center gap-2 text-primary">
                              <ArrowLeftRight className="h-4 w-4" />
                              <span>
                                Contraoferta enviada: $
                                {request.counterOfferPrice.toFixed(2)}
                              </span>
                            </div>
                          ) : null}
                          {request.finalPrice && request.status === "accepted" ? (
                            <div className="flex items-center gap-2 text-green-600">
                              <CheckCircle className="h-4 w-4" />
                              <span>
                                Precio acordado: $
                                {request.finalPrice.toFixed(2)}
                              </span>
                            </div>
                          ) : null}
                        </div>

                        {request.status === "pending" ? (
                          <div className="mt-4 flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-500 border-green-500 hover:bg-green-500/10 hover:text-green-600"
                              onClick={() =>
                                handleAcceptRequest(request, passengerOffer)
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
                              className="text-blue-500 border-blue-500 hover:bg-blue-500/10 hover:text-blue-600"
                              onClick={() => openCounterOfferDialog(request)}
                              disabled={processingRequestId === request.id}
                            >
                              <ArrowLeftRight className="mr-1 h-4 w-4" />
                              Contraofertar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-500 border-red-500 hover:bg-red-500/10 hover:text-red-600"
                              onClick={() => handleRejectRequest(request)}
                              disabled={processingRequestId === request.id}
                            >
                              {processingRequestId === request.id && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              )}
                              <UserX className="mr-1 h-4 w-4" /> Rechazar
                            </Button>
                          </div>
                        ) : null}

                        {request.status === "countered" ? (
                          <div className="mt-4 space-y-2">
                            <p className="text-xs text-muted-foreground">
                              Contraoferta enviada. Esperando respuesta del pasajero.
                            </p>
                            <div className="flex flex-wrap gap-2">
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => openCounterOfferDialog(request)}
                                disabled={
                                  isSendingCounterOffer &&
                                  requestToCounter?.id === request.id
                                }
                              >
                                {isSendingCounterOffer &&
                                requestToCounter?.id === request.id ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : null}
                                <ArrowLeftRight className="mr-1 h-4 w-4" />
                                Editar contraoferta
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-500 border-red-500 hover:bg-red-500/10 hover:text-red-600"
                                onClick={() => handleRejectRequest(request)}
                                disabled={processingRequestId === request.id}
                              >
                                {processingRequestId === request.id && (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                <UserX className="mr-1 h-4 w-4" /> Rechazar
                              </Button>
                            </div>
                          </div>
                        ) : null}
                        {request.status === "accepted" ? (
                          <p className="mt-3 text-xs text-green-600">
                            Pasajero confirmado. Coordiná los detalles del viaje.
                          </p>
                        ) : null}
                        {request.status === "rejected" ? (
                          <p className="mt-3 text-xs text-muted-foreground">
                            Esta solicitud fue rechazada.
                          </p>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        <Dialog
          open={Boolean(requestToCounter)}
          onOpenChange={(open) => {
            if (!open && !isSendingCounterOffer) {
              setRequestToCounter(null);
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Enviar contraoferta</DialogTitle>
              <DialogDescription>
                Proponé un nuevo precio para negociar con{' '}
                {requestToCounter?.passengerName || "el pasajero"}.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>
                  Oferta del pasajero: $
                  {requestToCounter
                    ? (
                        typeof requestToCounter.offeredPrice === "number"
                          ? requestToCounter.offeredPrice
                          : typeof requestToCounter.price === "number"
                            ? requestToCounter.price
                            : ride.price
                      ).toFixed(2)
                    : ride.price.toFixed(2)}
                </p>
                {requestToCounter?.counterOfferPrice ? (
                  <p>
                    Tu última contraoferta: $
                    {requestToCounter.counterOfferPrice.toFixed(2)}
                  </p>
                ) : null}
              </div>
              <div className="space-y-2">
                <label
                  className="text-sm font-medium"
                  htmlFor={`counter-offer-${requestToCounter?.id ?? "ride"}`}
                >
                  Nuevo monto (en pesos)
                </label>
                <Input
                  id={`counter-offer-${requestToCounter?.id ?? "ride"}`}
                  type="number"
                  min="0"
                  step="0.01"
                  value={counterOfferValue}
                  onChange={(event) => setCounterOfferValue(event.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setRequestToCounter(null)}
                disabled={isSendingCounterOffer}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCounterOfferSubmit}
                disabled={isSendingCounterOffer}
              >
                {isSendingCounterOffer && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Enviar contraoferta
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
                                  format(field.value, "PPP", { locale: es })
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
  const parsedDate = ride.date ? toLocalDate(ride.date) : null;
  const safeDate = parsedDate ?? new Date();

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
