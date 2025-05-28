import type { User as FirebaseUser } from "firebase/auth";

export type AppUser = FirebaseUser | null;

export type UserProfile = {
  uid: string;
  email: string | null;
  displayName: string | null;
  // Add other profile fields as needed
};

export type Ride = {
  id?: string; // Firestore document ID
  driverUid: string;
  driverName: string;
  origin: string;
  destination: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  availableSeats: number;
  price: number;
  createdAt?: Date; // Firestore timestamp
};

export type RideRequest = {
  id?: string; // Firestore document ID
  rideId: string;
  passengerUid: string;
  passengerName: string;
  driverUid: string;
  status: 'pending' | 'accepted' | 'rejected';
  origin?: string; // Denormalized for passenger dashboard
  destination?: string; // Denormalized for passenger dashboard
  date?: string; // Denormalized for passenger dashboard
  time?: string; // Denormalized for passenger dashboard
  price?: number; // Denormalized for passenger dashboard
  createdAt?: Date; // Firestore timestamp
};
