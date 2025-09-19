"use client";

import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  where,
  type DocumentData,
  type DocumentSnapshot,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "@/config/firebase";
import type { Ride, RideRequest } from "@/types";

const RIDES_COLLECTION = "rides";
const REQUESTS_COLLECTION = "rideRequests";

export type CreateRideInput = Omit<Ride, "id" | "createdAt">;

export async function createRide(input: CreateRideInput) {
  try {
    const docRef = await addDoc(collection(db, RIDES_COLLECTION), {
      ...input,
      availableSeats: Number(input.availableSeats),
      price: Number(input.price),
      createdAt: serverTimestamp(),
    });

    return { success: true as const, rideId: docRef.id };
  } catch (error) {
    console.error("Error al crear el viaje", error);
    return {
      success: false as const,
      message:
        error instanceof Error
          ? error.message
          : "No se pudo crear el viaje.",
    };
  }
}

export type RequestRideInput = {
  rideId: string;
  passengerUid: string;
  passengerName: string;
  driverUid: string;
  driverName: string;
  origin: string;
  destination: string;
  date: string;
  time: string;
  price: number;
};

export async function requestRide(input: RequestRideInput) {
  const requestKey = `${input.rideId}_${input.passengerUid}`;

  try {
    const rideRef = doc(db, RIDES_COLLECTION, input.rideId);
    const rideSnap = await getDoc(rideRef);

    if (!rideSnap.exists()) {
      return { success: false as const, message: "El viaje no existe." };
    }

    const rideData = rideSnap.data() as DocumentData;

    if ((rideData.availableSeats ?? 0) <= 0) {
      return {
        success: false as const,
        message: "No hay lugares disponibles para este viaje.",
      };
    }

    const existingRequestQuery = query(
      collection(db, REQUESTS_COLLECTION),
      where("requestKey", "==", requestKey),
      limit(1),
    );

    const existingSnapshot = await getDocs(existingRequestQuery);
    if (!existingSnapshot.empty) {
      return {
        success: false as const,
        message: "Ya solicitaste este viaje.",
      };
    }

    await addDoc(collection(db, REQUESTS_COLLECTION), {
      ...input,
      driverName: rideData.driverName ?? input.driverName,
      price: Number(input.price),
      requestKey,
      status: "pending",
      createdAt: serverTimestamp(),
    });

    return { success: true as const };
  } catch (error) {
    console.error("Error al solicitar el viaje", error);
    return {
      success: false as const,
      message:
        error instanceof Error
          ? error.message
          : "No se pudo enviar la solicitud.",
    };
  }
}

export async function updateRideRequestStatus(
  requestId: string,
  rideId: string,
  newStatus: "accepted" | "rejected",
) {
  try {
    const requestRef = doc(db, REQUESTS_COLLECTION, requestId);
    const rideRef = doc(db, RIDES_COLLECTION, rideId);

    await runTransaction(db, async (transaction) => {
      const requestSnap = await transaction.get(requestRef);
      if (!requestSnap.exists()) {
        throw new Error("La solicitud no existe.");
      }

      const rideSnap = await transaction.get(rideRef);
      if (!rideSnap.exists()) {
        throw new Error("El viaje no existe.");
      }

      const requestData = requestSnap.data() as DocumentData;
      const currentStatus = requestData.status as RideRequest["status"];

      if (currentStatus === newStatus) {
        return;
      }

      if (currentStatus === "accepted" && newStatus !== "accepted") {
        transaction.update(rideRef, {
          availableSeats: increment(1),
        });
      } else if (currentStatus !== "accepted" && newStatus === "accepted") {
        const rideData = rideSnap.data() as DocumentData;
        if ((rideData.availableSeats ?? 0) <= 0) {
          throw new Error(
            "No hay lugares disponibles para aceptar esta solicitud.",
          );
        }
        transaction.update(rideRef, {
          availableSeats: increment(-1),
        });
      }

      transaction.update(requestRef, {
        status: newStatus,
        statusUpdatedAt: serverTimestamp(),
      });
    });

    const updatedSnapshot = await getDoc(requestRef);
    return {
      success: true as const,
      updatedRequest: mapRideRequestSnapshot(updatedSnapshot),
    };
  } catch (error) {
    console.error("Error al actualizar el estado de la solicitud", error);
    return {
      success: false as const,
      message:
        error instanceof Error
          ? error.message
          : "No se pudo actualizar la solicitud.",
    };
  }
}

export function subscribeToDriverRides(
  driverUid: string,
  callback: (rides: Ride[]) => void,
) {
  const driverQuery = query(
    collection(db, RIDES_COLLECTION),
    where("driverUid", "==", driverUid),
  );

  return onSnapshot(driverQuery, (snapshot) => {
    const rides = snapshot.docs
      .map((docSnap) => mapRideSnapshot(docSnap))
      .sort((a, b) =>
        (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0),
      );
    callback(rides);
  });
}

export function subscribeToDriverRequests(
  driverUid: string,
  callback: (requests: RideRequest[]) => void,
) {
  const requestsQuery = query(
    collection(db, REQUESTS_COLLECTION),
    where("driverUid", "==", driverUid),
  );

  return onSnapshot(requestsQuery, (snapshot) => {
    const requests = snapshot.docs
      .map((docSnap) => mapRideRequestSnapshot(docSnap))
      .sort((a, b) =>
        (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0),
      );
    callback(requests);
  });
}

export function subscribeToPassengerRequests(
  passengerUid: string,
  callback: (requests: RideRequest[]) => void,
) {
  const requestsQuery = query(
    collection(db, REQUESTS_COLLECTION),
    where("passengerUid", "==", passengerUid),
  );

  return onSnapshot(requestsQuery, (snapshot) => {
    const requests = snapshot.docs
      .map((docSnap) => mapRideRequestSnapshot(docSnap))
      .sort((a, b) =>
        (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0),
      );
    callback(requests);
  });
}

export function subscribeToAllRides(callback: (rides: Ride[]) => void) {
  const ridesQuery = query(
    collection(db, RIDES_COLLECTION),
    orderBy("createdAt", "desc"),
    limit(100),
  );

  return onSnapshot(ridesQuery, (snapshot) => {
    const rides = snapshot.docs.map((docSnap) => mapRideSnapshot(docSnap));
    callback(rides);
  });
}

function mapRideSnapshot(
  snapshot: QueryDocumentSnapshot<DocumentData>,
): Ride {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    driverUid: data.driverUid,
    driverName: data.driverName,
    origin: data.origin,
    destination: data.destination,
    date: data.date,
    time: data.time,
    availableSeats: Number(data.availableSeats ?? 0),
    price: Number(data.price ?? 0),
    createdAt: toDate(data.createdAt),
  };
}

function mapRideRequestSnapshot(
  snapshot: QueryDocumentSnapshot<DocumentData> | DocumentSnapshot<DocumentData>,
): RideRequest {
  const data = snapshot.data() ?? {};
  return {
    id: snapshot.id,
    driverName: data.driverName,
    rideId: data.rideId,
    passengerUid: data.passengerUid,
    passengerName: data.passengerName,
    driverUid: data.driverUid,
    status: data.status,
    origin: data.origin,
    destination: data.destination,
    date: data.date,
    time: data.time,
    price: typeof data.price === "number" ? data.price : Number(data.price ?? 0),
    createdAt: toDate(data.createdAt),
    statusUpdatedAt: toDate(data.statusUpdatedAt),
    requestKey: data.requestKey,
  } as RideRequest;
}

function toDate(value: unknown) {
  if (!value) return undefined;
  if (value instanceof Date) return value;
  if (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof (value as { toDate: () => Date }).toDate === "function"
  ) {
    return (value as { toDate: () => Date }).toDate();
  }
  return undefined;
}
