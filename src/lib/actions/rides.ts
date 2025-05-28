"use server";

import { z } from "zod";
import type { Ride, RideRequest } from "@/types";
// import { db } from '@/config/firebase'; // For actual Firestore operations
// import { collection, addDoc, doc, updateDoc, serverTimestamp } from "firebase/firestore";

// Schemas
const createRideSchemaServer = z.object({
  driverUid: z.string(),
  driverName: z.string(),
  origin: z.string().min(3),
  destination: z.string().min(3),
  date: z.string(), // Assuming YYYY-MM-DD string from client
  time: z.string(), // Assuming HH:MM string
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
  rideId: z.string(),
  status: z.enum(['accepted', 'rejected']),
});


// Placeholder action for creating a ride
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
    const rideData = validatedFields.data;
    console.log("Server Action: Creating ride", rideData);
    
    // Placeholder: Actual Firestore addDoc
    // const docRef = await addDoc(collection(db, "rides"), {
    //   ...rideData,
    //   createdAt: serverTimestamp(),
    // });
    // console.log("Ride created with ID: ", docRef.id);

    return { message: "Ride created successfully!", success: true, rideId: "mockRideId" };
  } catch (error) {
    console.error("Error creating ride:", error);
    return { message: "Failed to create ride.", success: false };
  }
}

// Placeholder action for requesting a ride
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
    const requestData = validatedFields.data;
    console.log("Server Action: Requesting ride", requestData);

    // Placeholder: Actual Firestore addDoc to 'solicitudes' (requests)
    // const docRef = await addDoc(collection(db, "solicitudes"), {
    //   ...requestData,
    //   status: "pending",
    //   createdAt: serverTimestamp(),
    // });
    // console.log("Ride request created with ID: ", docRef.id);

    return { message: "Ride requested successfully!", success: true, requestId: "mockRequestId" };
  } catch (error) {
    console.error("Error requesting ride:", error);
    return { message: "Failed to request ride.", success: false };
  }
}

// Placeholder action for driver to manage a ride request
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
    const { requestId, rideId, status } = validatedFields.data;
    console.log(`Server Action: Updating request ${requestId} to ${status}`);

    // Placeholder: Actual Firestore updateDoc for request status
    // const requestRef = doc(db, "solicitudes", requestId);
    // await updateDoc(requestRef, { status: status });

    // If accepted, potentially decrement availableSeats on the ride document (transaction recommended)
    // if (status === 'accepted') {
    //   const rideRef = doc(db, "rides", rideId);
    //   // Needs a transaction to read current seats and decrement
    // }
    const mockUpdatedRequest: RideRequest = {
        id: requestId,
        rideId: rideId,
        passengerUid: "mockPassengerId",
        passengerName: "Mock Passenger",
        driverUid: "mockDriverId",
        status: status,
        createdAt: new Date(),
    };


    return { message: `Request ${status} successfully.`, success: true, updatedRequest: mockUpdatedRequest };
  } catch (error) {
    console.error("Error managing ride request:", error);
    return { message: "Failed to manage ride request.", success: false };
  }
}
