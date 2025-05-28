
"use server";

import { z } from "zod";
import type { Ride, RideRequest } from "@/types";
import { mockRides, mockRequests, generateRideId, generateRequestId } from "@/lib/mock-db";
import { revalidatePath } from "next/cache";
import { format } from "date-fns";

// Schemas
const createRideSchemaServer = z.object({
  driverUid: z.string(),
  driverName: z.string(),
  origin: z.string().min(3),
  destination: z.string().min(3),
  date: z.string(), // Expecting YYYY-MM-DD string from client
  time: z.string(), // Expecting HH:MM string
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
  rideId: z.string(), // rideId is useful for updating available seats
  status: z.enum(['accepted', 'rejected']),
});


export async function createRideAction(prevState: any, formData: FormData) {
  try {
    const rawData = Object.fromEntries(formData.entries());
    const validatedFields = createRideSchemaServer.safeParse(rawData);

    if (!validatedFields.success) {
      return {
        message: "Invalid ride data.",
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
    console.log("Mock DB: Creating ride", newRide);

    revalidatePath('/dashboard/driver');
    revalidatePath('/rides');
    revalidatePath('/'); // Homepage might show ride counts or featured rides

    return { message: "Ride created successfully!", success: true, rideId: newRide.id };
  } catch (error) {
    console.error("Error creating ride:", error);
    return { message: "Failed to create ride.", success: false };
  }
}

export async function requestRideAction(prevState: any, formData: FormData) {
  try {
    const rawData = Object.fromEntries(formData.entries());
    const validatedFields = requestRideSchemaServer.safeParse(rawData);

    if (!validatedFields.success) {
      return {
        message: "Invalid request data.",
        errors: validatedFields.error.flatten().fieldErrors,
        success: false,
      };
    }
    const requestInputData = validatedFields.data;

    // Check if ride exists and has seats
    const ride = mockRides.find(r => r.id === requestInputData.rideId);
    if (!ride) {
      return { message: "Ride not found.", success: false };
    }
    // This check is also in RideCard, but good to have server-side too
    if (ride.availableSeats <= 0) {
        return { message: "No seats available for this ride.", success: false };
    }
    // Check if user has already requested this ride
    const existingRequest = mockRequests.find(req => req.rideId === requestInputData.rideId && req.passengerUid === requestInputData.passengerUid);
    if (existingRequest) {
        return { message: "You have already requested this ride.", success: false };
    }


    const newRequest: RideRequest = {
      id: generateRequestId(),
      ...requestInputData,
      status: "pending",
      createdAt: new Date(),
    };
    mockRequests.push(newRequest);
    console.log("Mock DB: Requesting ride", newRequest);

    revalidatePath('/dashboard/passenger');
    revalidatePath('/dashboard/driver'); // Driver needs to see new requests
    // revalidatePath('/rides'); // Ride card might show updated info if we display # of requests

    return { message: "Ride requested successfully!", success: true, requestId: newRequest.id };
  } catch (error) {
    console.error("Error requesting ride:", error);
    return { message: "Failed to request ride.", success: false };
  }
}

export async function manageRideRequestAction(prevState: any, formData: FormData) {
  try {
    const rawData = Object.fromEntries(formData.entries());
    const validatedFields = manageRequestSchemaServer.safeParse(rawData);

    if (!validatedFields.success) {
      return {
        message: "Invalid data for managing request.",
        errors: validatedFields.error.flatten().fieldErrors,
        success: false,
      };
    }
    const { requestId, rideId, status: newStatus } = validatedFields.data;
    
    const requestIndex = mockRequests.findIndex(req => req.id === requestId);
    if (requestIndex === -1) {
      return { message: "Request not found.", success: false };
    }

    const requestToUpdate = mockRequests[requestIndex];
    const oldStatus = requestToUpdate.status;
    
    requestToUpdate.status = newStatus;
    requestToUpdate.createdAt = new Date(); // Touch the timestamp

    // Update available seats on the ride
    const rideIndex = mockRides.findIndex(r => r.id === rideId);
    if (rideIndex !== -1) {
      const rideToUpdate = mockRides[rideIndex];
      if (oldStatus === 'pending' && newStatus === 'accepted') {
        if (rideToUpdate.availableSeats > 0) {
          rideToUpdate.availableSeats--;
        } else {
          // Edge case: seats became 0 due to another parallel acceptance.
          // For mock, we can revert request or just log. Let's make it strict.
          requestToUpdate.status = oldStatus; // Revert
          return { message: "No seats available to accept this request.", success: false, updatedRequest: { ...requestToUpdate } }
        }
      } else if (oldStatus === 'accepted' && newStatus === 'rejected') {
        rideToUpdate.availableSeats++;
      }
      // Other transitions (e.g. pending -> rejected) don't change seat count.
    }
    
    console.log(`Mock DB: Updating request ${requestId} to ${newStatus}`);

    revalidatePath('/dashboard/driver');
    revalidatePath('/dashboard/passenger');
    revalidatePath('/rides'); // Seat counts might change

    return { message: `Request ${newStatus} successfully.`, success: true, updatedRequest: { ...requestToUpdate } };
  } catch (error) {
    console.error("Error managing ride request:", error);
    return { message: "Failed to manage ride request.", success: false };
  }
}
