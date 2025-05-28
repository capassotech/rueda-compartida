"use server";

import { z } from "zod";
import type { Ride, RideRequest } from "@/types";
import { mockRides, mockRequests, generateRideId, generateRequestId } from "@/lib/mock-db";
import { revalidatePath } from "next/cache";
import { format } from "date-fns";

// Esquemas
const createRideSchemaServer = z.object({
  driverUid: z.string(),
  driverName: z.string(),
  origin: z.string().min(3),
  destination: z.string().min(3),
  date: z.string(), // Se espera una fecha en formato YYYY-MM-DD desde el cliente
  time: z.string(), // Se espera una hora en formato HH:MM
  availableSeats: z.coerce.number().int().min(1),
  price: z.coerce.number().min(0),
});

const requestRideSchemaServer = z.object({
  rideId: z.string(),
  passengerUid: z.string(),
  passengerName: z.string(),
  driverUid: z.string(),
  origin: z.string(),
  destination: z.string(),
  date: z.string(),
  time: z.string(),
  price: z.coerce.number(),
});

const manageRequestSchemaServer = z.object({
  requestId: z.string(),
  rideId: z.string(), // rideId es útil para actualizar los lugares disponibles
  status: z.enum(['accepted', 'rejected']),
});


export async function createRideAction(prevState: any, formData: FormData) {
  try {
    const rawData = Object.fromEntries(formData.entries());
    const validatedFields = createRideSchemaServer.safeParse(rawData);

    if (!validatedFields.success) {
      return {
        message: "Datos del viaje inválidos.",
        errors: validatedFields.error.flatten().fieldErrors,
        success: false,
      };
    }
    const rideInputData = validatedFields.data;

    const newRide: Ride = {
      id: generateRideId(),
      ...rideInputData,
      createdAt: new Date(),
    };
    mockRides.push(newRide);
    console.log("Mock DB: Creando viaje", newRide);

    revalidatePath('/dashboard/conductor');
    revalidatePath('/viajes');
    revalidatePath('/'); // La página principal podría mostrar recuentos o viajes destacados

    return { message: "Viaje creado exitosamente!", success: true, rideId: newRide.id };
  } catch (error) {
    console.error("Error al crear el viaje:", error);
    return { message: "No se pudo crear el viaje.", success: false };
  }
}

export async function requestRideAction(prevState: any, formData: FormData) {
  try {
    const rawData = Object.fromEntries(formData.entries());
    const validatedFields = requestRideSchemaServer.safeParse(rawData);

    if (!validatedFields.success) {
      return {
        message: "Datos de solicitud inválidos.",
        errors: validatedFields.error.flatten().fieldErrors,
        success: false,
      };
    }
    const requestInputData = validatedFields.data;

    // Verificar si existe el viaje y tiene lugares
    const ride = mockRides.find(r => r.id === requestInputData.rideId);
    if (!ride) {
      return { message: "El viaje no fue encontrado.", success: false };
    }

    // Esta verificación también está en RideCard, pero buena para incluirla del lado del servidor
    if (ride.availableSeats <= 0) {
      return { message: "No hay lugares disponibles para este viaje.", success: false };
    }

    // Verificar si el usuario ya solicitó este viaje
    const existingRequest = mockRequests.find(req => req.rideId === requestInputData.rideId && req.passengerUid === requestInputData.passengerUid);
    if (existingRequest) {
      return { message: "Ya has solicitado este viaje.", success: false };
    }

    const newRequest: RideRequest = {
      id: generateRequestId(),
      driverName: ride.driverName,
      ...requestInputData,
      status: "pending",
      createdAt: new Date(),
    };
    mockRequests.push(newRequest);
    console.log("Mock DB: Solicitud de viaje", newRequest);

    revalidatePath('/dashboard/pasajero');
    revalidatePath('/dashboard/conductor'); // El conductor necesita ver las nuevas solicitudes

    return { message: "Solicitud de viaje realizada con éxito!", success: true, requestId: newRequest.id };
  } catch (error) {
    console.error("Error al solicitar el viaje:", error);
    return { message: "No se pudo realizar la solicitud.", success: false };
  }
}

export async function manageRideRequestAction(prevState: any, formData: FormData) {
  try {
    const rawData = Object.fromEntries(formData.entries());
    const validatedFields = manageRequestSchemaServer.safeParse(rawData);

    if (!validatedFields.success) {
      return {
        message: "Datos inválidos para gestionar la solicitud.",
        errors: validatedFields.error.flatten().fieldErrors,
        success: false,
      };
    }
    const { requestId, rideId, status: newStatus } = validatedFields.data;

    const requestIndex = mockRequests.findIndex(req => req.id === requestId);
    if (requestIndex === -1) {
      return { message: "Solicitud no encontrada.", success: false };
    }

    const requestToUpdate = mockRequests[requestIndex];
    const oldStatus = requestToUpdate.status;

    requestToUpdate.status = newStatus;
    requestToUpdate.createdAt = new Date(); // Actualizar timestamp

    // Actualizar lugares disponibles en el viaje
    const rideIndex = mockRides.findIndex(r => r.id === rideId);
    if (rideIndex !== -1) {
      const rideToUpdate = mockRides[rideIndex];
      if (oldStatus === 'pending' && newStatus === 'accepted') {
        if (rideToUpdate.availableSeats > 0) {
          rideToUpdate.availableSeats--;
        } else {
          // Caso extremo: no hay más lugares por otra aceptación paralela.
          // Para el mock, revertimos la solicitud o simplemente lo registramos.
          requestToUpdate.status = oldStatus; // Revertir
          return { message: "No hay lugares disponibles para aceptar esta solicitud.", success: false, updatedRequest: { ...requestToUpdate } };
        }
      } else if (oldStatus === 'accepted' && newStatus === 'rejected') {
        rideToUpdate.availableSeats++;
      }
      // Otras transiciones (ej. pending -> rejected) no modifican la cantidad de lugares.
    }

    console.log(`Mock DB: Actualizando solicitud ${requestId} a ${newStatus}`);

    revalidatePath('/dashboard/conductor');
    revalidatePath('/dashboard/pasajero');
    revalidatePath('/viajes'); // Los contadores de lugares pueden haber cambiado

    return { message: `Solicitud ${newStatus === 'accepted' ? 'aceptada' : 'rechazada'} con éxito.`, success: true, updatedRequest: { ...requestToUpdate } };
  } catch (error) {
    console.error("Error al gestionar la solicitud de viaje:", error);
    return { message: "No se pudo gestionar la solicitud.", success: false };
  }
}