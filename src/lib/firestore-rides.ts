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
  updateDoc,
  writeBatch,
  where,
  type QueryConstraint,
  type DocumentData,
  type DocumentSnapshot,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "@/config/firebase";
import type { Ride, RideRequest, RideRequestStatus } from "@/types";

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

type UpdateRideData = Partial<
  Pick<
    Ride,
    | "origin"
    | "destination"
    | "date"
    | "time"
    | "availableSeats"
    | "price"
    | "driverName"
  >
>;

export async function updateRide(rideId: string, data: UpdateRideData) {
  try {
    const rideRef = doc(db, RIDES_COLLECTION, rideId);
    const payload: Record<string, unknown> = { ...data };

    if (data.availableSeats !== undefined) {
      payload.availableSeats = Number(data.availableSeats);
    }

    if (data.price !== undefined) {
      payload.price = Number(data.price);
    }

    payload.updatedAt = serverTimestamp();

    await updateDoc(rideRef, payload);

    return { success: true as const };
  } catch (error) {
    console.error("Error al actualizar el viaje", error);
    return {
      success: false as const,
      message:
        error instanceof Error
          ? error.message
          : "No se pudo actualizar el viaje.",
    };
  }
}

export async function deleteRide(rideId: string) {
  try {
    const rideRef = doc(db, RIDES_COLLECTION, rideId);
    const batch = writeBatch(db);
    batch.delete(rideRef);

    const requestsSnapshot = await getDocs(
      query(collection(db, REQUESTS_COLLECTION), where("rideId", "==", rideId)),
    );

    requestsSnapshot.forEach((requestDoc) => {
      batch.delete(requestDoc.ref);
    });

    await batch.commit();

    return { success: true as const };
  } catch (error) {
    console.error("Error al eliminar el viaje", error);
    return {
      success: false as const,
      message:
        error instanceof Error
          ? error.message
          : "No se pudo eliminar el viaje.",
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
  offeredPrice: number;
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

    if ((rideData.driverUid ?? null) === input.passengerUid) {
      return {
        success: false as const,
        message: "No podés solicitar tu propio viaje.",
      };
    }

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
      offeredPrice: Number(input.offeredPrice),
      counterOfferPrice: null,
      finalPrice: null,
      requestKey,
      status: "pending",
      statusUpdatedAt: serverTimestamp(),
      lastActionBy: "passenger",
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

export async function acceptRideRequest(
  requestId: string,
  rideId: string,
  acceptedPrice: number,
  actor: "driver" | "passenger" = "driver",
) {
  const finalPriceValue = Number(acceptedPrice);
  if (!Number.isFinite(finalPriceValue) || finalPriceValue <= 0) {
    return {
      success: false as const,
      message: "Ingresá un precio válido para aceptar la solicitud.",
    };
  }

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
      const rideData = rideSnap.data() as DocumentData;
      const currentStatus = (requestData.status ?? "pending") as RideRequestStatus;

      if (currentStatus === "rejected") {
        throw new Error("No se puede aceptar una solicitud rechazada.");
      }

      if (currentStatus !== "accepted") {
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
        status: "accepted",
        finalPrice: finalPriceValue,
        statusUpdatedAt: serverTimestamp(),
        lastActionBy: actor,
      });
    });

    const updatedSnapshot = await getDoc(requestRef);
    return {
      success: true as const,
      updatedRequest: mapRideRequestSnapshot(updatedSnapshot),
    };
  } catch (error) {
    console.error("Error al aceptar la solicitud", error);
    return {
      success: false as const,
      message:
        error instanceof Error
          ? error.message
          : "No se pudo aceptar la solicitud.",
    };
  }
}

export async function rejectRideRequest(
  requestId: string,
  rideId: string,
  actor: "driver" | "passenger",
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
      const currentStatus = (requestData.status ?? "pending") as RideRequestStatus;

      if (currentStatus === "rejected") {
        return;
      }

      if (currentStatus === "accepted") {
        transaction.update(rideRef, {
          availableSeats: increment(1),
        });
      }

      transaction.update(requestRef, {
        status: "rejected",
        statusUpdatedAt: serverTimestamp(),
        finalPrice: null,
        lastActionBy: actor,
      });
    });

    const updatedSnapshot = await getDoc(requestRef);
    return {
      success: true as const,
      updatedRequest: mapRideRequestSnapshot(updatedSnapshot),
    };
  } catch (error) {
    console.error("Error al rechazar la solicitud", error);
    return {
      success: false as const,
      message:
        error instanceof Error
          ? error.message
          : "No se pudo rechazar la solicitud.",
    };
  }
}

export async function counterOfferRideRequest(
  requestId: string,
  counterOfferPrice: number,
) {
  const counterValue = Number(counterOfferPrice);
  if (!Number.isFinite(counterValue) || counterValue <= 0) {
    return {
      success: false as const,
      message: "Ingresá un valor válido para la contraoferta.",
    };
  }

  try {
    const requestRef = doc(db, REQUESTS_COLLECTION, requestId);

    await runTransaction(db, async (transaction) => {
      const requestSnap = await transaction.get(requestRef);
      if (!requestSnap.exists()) {
        throw new Error("La solicitud no existe.");
      }

      const requestData = requestSnap.data() as DocumentData;
      const currentStatus = (requestData.status ?? "pending") as RideRequestStatus;

      if (currentStatus === "accepted") {
        throw new Error(
          "La solicitud ya fue aceptada, no se puede contraofertar.",
        );
      }

      transaction.update(requestRef, {
        status: "countered",
        counterOfferPrice: counterValue,
        finalPrice: null,
        statusUpdatedAt: serverTimestamp(),
        lastActionBy: "driver",
      });
    });

    const updatedSnapshot = await getDoc(requestRef);
    return {
      success: true as const,
      updatedRequest: mapRideRequestSnapshot(updatedSnapshot),
    };
  } catch (error) {
    console.error("Error al contraofertar la solicitud", error);
    return {
      success: false as const,
      message:
        error instanceof Error
          ? error.message
          : "No se pudo enviar la contraoferta.",
    };
  }
}

export async function updateRideRequestOffer(
  requestId: string,
  offeredPrice: number,
) {
  const offerValue = Number(offeredPrice);
  if (!Number.isFinite(offerValue) || offerValue <= 0) {
    return {
      success: false as const,
      message: "Ingresá un valor válido para la oferta.",
    };
  }

  try {
    const requestRef = doc(db, REQUESTS_COLLECTION, requestId);

    await runTransaction(db, async (transaction) => {
      const requestSnap = await transaction.get(requestRef);
      if (!requestSnap.exists()) {
        throw new Error("La solicitud no existe.");
      }

      const requestData = requestSnap.data() as DocumentData;
      const currentStatus = (requestData.status ?? "pending") as RideRequestStatus;

      if (currentStatus === "accepted") {
        throw new Error(
          "El viaje ya fue aceptado, no es posible modificar la oferta.",
        );
      }

      if (currentStatus === "rejected") {
        throw new Error(
          "La solicitud fue rechazada. Generá una nueva solicitud para negociar de nuevo.",
        );
      }

      transaction.update(requestRef, {
        status: "pending",
        offeredPrice: offerValue,
        counterOfferPrice: null,
        finalPrice: null,
        statusUpdatedAt: serverTimestamp(),
        lastActionBy: "passenger",
      });
    });

    const updatedSnapshot = await getDoc(requestRef);
    return {
      success: true as const,
      updatedRequest: mapRideRequestSnapshot(updatedSnapshot),
    };
  } catch (error) {
    console.error("Error al actualizar la oferta", error);
    return {
      success: false as const,
      message:
        error instanceof Error
          ? error.message
          : "No se pudo actualizar la oferta.",
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

export type RideSubscriptionFilters = Partial<
  Pick<Ride, "date" | "origin" | "destination">
>;

export function subscribeToAllRides(
  callback: (rides: Ride[]) => void,
  filters: RideSubscriptionFilters = {},
) {
  const constraints: QueryConstraint[] = [];

  if (filters.date) {
    constraints.push(where("date", "==", filters.date));
  }

  if (filters.origin) {
    constraints.push(where("origin", "==", filters.origin));
  }

  if (filters.destination) {
    constraints.push(where("destination", "==", filters.destination));
  }

  constraints.push(orderBy("createdAt", "desc"));
  constraints.push(limit(100));

  const ridesQuery = query(collection(db, RIDES_COLLECTION), ...constraints);

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
    status: (data.status as RideRequestStatus) ?? "pending",
    origin: data.origin,
    destination: data.destination,
    date: data.date,
    time: data.time,
    price: typeof data.price === "number" ? data.price : Number(data.price ?? 0),
    offeredPrice:
      typeof data.offeredPrice === "number"
        ? data.offeredPrice
        : Number(data.offeredPrice ?? data.price ?? 0),
    counterOfferPrice:
      typeof data.counterOfferPrice === "number"
        ? data.counterOfferPrice
        : data.counterOfferPrice === null || data.counterOfferPrice === undefined
          ? null
          : Number(data.counterOfferPrice),
    finalPrice:
      typeof data.finalPrice === "number"
        ? data.finalPrice
        : data.finalPrice === null || data.finalPrice === undefined
          ? null
          : Number(data.finalPrice),
    createdAt: toDate(data.createdAt),
    statusUpdatedAt: toDate(data.statusUpdatedAt),
    requestKey: data.requestKey,
    lastActionBy:
      data.lastActionBy === "driver" || data.lastActionBy === "passenger"
        ? data.lastActionBy
        : undefined,
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
