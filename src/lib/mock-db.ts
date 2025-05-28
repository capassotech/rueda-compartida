import type { Ride, RideRequest } from '@/types';

// Base de datos simulada para viajes
export const mockRides: Ride[] = [
  {
    id: "ride1",
    driverUid: "driverAlpha",
    driverName: "Alice Wonderland",
    origin: "Nueva York",
    destination: "Boston",
    date: "2025-05-27",
    time: "09:00",
    availableSeats: 3,
    price: 25.00,
    createdAt: new Date(Date.now() - 3600000 * 5)
  },
  {
    id: "ride2",
    driverUid: "driverBeta",
    driverName: "Bob The Builder",
    origin: "Nueva York",
    destination: "Filadelfia",
    date: "2024-09-16",
    time: "14:00",
    availableSeats: 2,
    price: 20.00,
    createdAt: new Date(Date.now() - 3600000 * 10)
  },
  {
    id: "ride3",
    driverUid: "driverGamma",
    driverName: "Charlie Brown",
    origin: "Boston",
    destination: "Nueva York",
    date: "2024-09-15",
    time: "18:00",
    availableSeats: 1,
    price: 22.00,
    createdAt: new Date(Date.now() - 3600000 * 3)
  },
  {
    id: "ride4",
    driverUid: "driverDelta",
    driverName: "Diana Prince",
    origin: "Nueva York",
    destination: "Boston",
    date: "2024-09-15",
    time: "15:00",
    availableSeats: 0,
    price: 30.00,
    createdAt: new Date(Date.now() - 3600000 * 1)
  },
];

// Solicitudes de viaje simuladas
export const mockRequests: RideRequest[] = [
  {
    id: "req1",
    rideId: "ride1",
    passengerUid: "passengerEpsilon",
    passengerName: "Pasajero Uno",
    driverUid: "driverAlpha",
    driverName: "Charlie B.",
    origin: "Nueva York",
    destination: "Boston",
    date: "2024-09-15",
    time: "09:00",
    price: 25.00,
    status: "pending",
    createdAt: new Date(Date.now() - 3600000 * 2)
  },
  {
    id: "req2",
    rideId: "ride1",
    passengerUid: "passengerZeta",
    passengerName: "Pasajero Dos",
    driverUid: "driverAlpha",
    driverName: "Charlie B.",
    origin: "Nueva York",
    destination: "Boston",
    date: "2024-09-15",
    time: "09:00",
    price: 25.00,
    status: "accepted",
    createdAt: new Date(Date.now() - 3600000 * 20)
  },
  // Ejemplo de solicitud para un viaje que podría ser creado por un usuario de prueba.
  // Supongamos que un usuario de prueba tiene UID "testUserDriver1" y crea el viaje "ride5"
  {
    id: "req3",
    rideId: "ride5_placeholder_for_driver_dash",
    passengerUid: "passengerEta",
    passengerName: "Pasajero Tres",
    driverUid: "testUserDriver1",
    driverName: "Charlie B.",
    origin: "Chicago",
    destination: "Detroit",
    date: "2024-09-20",
    time: "11:00",
    price: 40.00,
    status: "pending",
    createdAt: new Date(Date.now() - 3600000 * 6)
  },
  // Ejemplo de solicitud hecha por el pasajero de prueba "testUserPassenger1"
  {
    id: "req4",
    rideId: "ride3",
    passengerUid: "testUserPassenger1",
    passengerName: "Pasajero de Prueba",
    driverUid: "driverGamma",
    driverName: "Charlie B.",
    origin: "Boston",
    destination: "Nueva York",
    date: "2024-09-15",
    time: "18:00",
    price: 22.00,
    status: "accepted",
    createdAt: new Date(Date.now() - 3600000 * 24)
  },
  {
    id: "req5",
    rideId: "ride2",
    passengerUid: "testUserPassenger1",
    passengerName: "Pasajero de Prueba",
    driverUid: "driverBeta",
    driverName: "Bob T.B.",
    origin: "Nueva York",
    destination: "Filadelfia",
    date: "2024-09-16",
    time: "14:00",
    price: 20.00,
    status: "rejected",
    createdAt: new Date(Date.now() - 3600000 * 5)
  },
];

// Inicializa los lugares disponibles para solicitudes aceptadas
mockRequests.forEach(req => {
  if (req.status === 'accepted') {
    const ride = mockRides.find(r => r.id === req.rideId);
    if (ride && ride.availableSeats > 0) {
      ride.availableSeats--;
    }
  }
});

let rideCounter = mockRides.length + 1;
export const generateRideId = () => `viaje${rideCounter++}`;

let requestCounter = mockRequests.length + 1;
export const generateRequestId = () => `solicitud${requestCounter++}`;

/**
 * Nota: Para que los paneles de conductor/pasajero muestren datos cuando inicia sesión un nuevo usuario,
 * ese usuario deberá crear viajes o solicitudes.
 * Opcionalmente puedes agregar manualmente elementos a `mockRides` o `mockRequests`
 * con el UID conocido del usuario de prueba. Por ejemplo:
 *
 * mockRides.push({
 *   id: "miViaje1",
 *   driverUid: "miTestIdUsuario",
 *   driverName: "Nombre de Prueba",
 *   origin: "Mi Ciudad",
 *   destination: "Otra Ciudad",
 *   date: "2024-09-25",
 *   time: "08:00",
 *   availableSeats: 2,
 *   price: 5.00,
 *   createdAt: new Date()
 * });
 *
 * Asegurate de que estos UIDs coincidan con los proporcionados por Firebase Auth para tus usuarios de prueba.
 */