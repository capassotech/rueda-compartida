import type { User as FirebaseUser } from "firebase/auth";

// Tipos de usuario
export type AppUser = FirebaseUser | null;

export type UserProfile = {
  uid: string;
  email: string | null;
  displayName: string | null;
  // Agregá otros campos del perfil según sea necesario
};

// Tipo para los viajes
export type Ride = {
  id?: string; // ID del documento en Firestore
  driverUid: string; // UID del conductor
  driverName: string; // Nombre del conductor
  origin: string; // Origen del viaje
  destination: string; // Destino del viaje
  date: string; // Fecha en formato YYYY-MM-DD
  time: string; // Hora en formato HH:MM
  availableSeats: number; // Cantidad de lugares disponibles
  price: number; // Precio por lugar
  createdAt?: Date; // Marca de tiempo de creación (opcional)
};

export type RideRequestStatus = 'pending' | 'countered' | 'accepted' | 'rejected';

// Tipo para las solicitudes de viaje
export type RideRequest = {
  id?: string; // ID del documento en Firestore
  driverName: string; // Nombre del conductor (desnormalizado para el panel del pasajero)
  rideId: string; // ID del viaje asociado
  passengerUid: string; // UID del pasajero
  passengerName: string; // Nombre del pasajero
  driverUid: string; // UID del conductor (para notificaciones o consultas)
  status: RideRequestStatus; // Estado de la solicitud
  origin?: string; // Origen (desnormalizado)
  destination?: string; // Destino (desnormalizado)
  date?: string; // Fecha (desnormalizado)
  time?: string; // Hora (desnormalizado)
  price?: number; // Precio por lugar (desnormalizado)
  offeredPrice?: number; // Precio ofertado por el pasajero
  counterOfferPrice?: number | null; // Contraoferta del conductor, si existe
  finalPrice?: number | null; // Precio final acordado cuando el viaje es aceptado
  createdAt?: Date; // Marca de tiempo de creación
  statusUpdatedAt?: Date; // Marca de tiempo de última actualización
  requestKey?: string; // Clave única compuesta para validaciones
  lastActionBy?: "driver" | "passenger"; // Quién realizó la última acción relevante
};