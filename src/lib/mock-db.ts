
import type { Ride, RideRequest } from '@/types';

// Centralized store for mock data
export const mockRides: Ride[] = [
  { id: "ride1", driverUid: "driverAlpha", driverName: "Alice Wonderland", origin: "New York", destination: "Boston", date: "2024-09-15", time: "09:00", availableSeats: 3, price: 25.00, createdAt: new Date(Date.now() - 3600000 * 5) },
  { id: "ride2", driverUid: "driverBeta", driverName: "Bob The Builder", origin: "New York", destination: "Philadelphia", date: "2024-09-16", time: "14:00", availableSeats: 2, price: 20.00, createdAt: new Date(Date.now() - 3600000 * 10) },
  { id: "ride3", driverUid: "driverGamma", driverName: "Charlie Brown", origin: "Boston", destination: "New York", date: "2024-09-15", time: "18:00", availableSeats: 1, price: 22.00, createdAt: new Date(Date.now() - 3600000 * 3) },
  { id: "ride4", driverUid: "driverDelta", driverName: "Diana Prince", origin: "New York", destination: "Boston", date: "2024-09-15", time: "15:00", availableSeats: 0, price: 30.00, createdAt: new Date(Date.now() - 3600000 * 1) },
];

export const mockRequests: RideRequest[] = [
  { id: "req1", rideId: "ride1", passengerUid: "passengerEpsilon", passengerName: "Passenger One", driverUid: "driverAlpha", origin: "New York", destination: "Boston", date: "2024-09-15", time: "09:00", price: 25.00, status: "pending", createdAt: new Date(Date.now() - 3600000 * 2) },
  { id: "req2", rideId: "ride1", passengerUid: "passengerZeta", passengerName: "Passenger Two", driverUid: "driverAlpha", origin: "New York", destination: "Boston", date: "2024-09-15", time: "09:00", price: 25.00, status: "accepted", createdAt: new Date(Date.now() - 3600000 * 20) },
  // Example request for a ride that might be created by a test user.
  // Let's assume a test user has UID "testUserDriver1" and creates ride "ride5"
  { id: "req3", rideId: "ride5_placeholder_for_driver_dash", passengerUid: "passengerEta", passengerName: "Passenger Three", driverUid: "testUserDriver1", origin: "Chicago", destination: "Detroit", date: "2024-09-20", time: "11:00", price: 40.00, status: "pending", createdAt: new Date(Date.now() - 3600000 * 6) },
  // Example request made by a test user "testUserPassenger1"
  { id: "req4", rideId: "ride3", passengerUid: "testUserPassenger1", passengerName:"Test Passenger", driverUid: "driverGamma", driverName: "Charlie B.", origin: "Boston", destination: "New York", date: "2024-09-15", time: "18:00", price: 22.00, status: "accepted", createdAt: new Date(Date.now() - 3600000 * 24) },
  { id: "req5", rideId: "ride2", passengerUid: "testUserPassenger1", passengerName:"Test Passenger", driverUid: "driverBeta", driverName: "Bob T.B.", origin: "New York", destination: "Philadelphia", date: "2024-09-16", time: "14:00", price: 20.00, status: "rejected", createdAt: new Date(Date.now() - 3600000 * 5) },
];

// Initialize available seats for accepted requests
mockRequests.forEach(req => {
  if (req.status === 'accepted') {
    const ride = mockRides.find(r => r.id === req.rideId);
    if (ride && ride.availableSeats > 0) {
      ride.availableSeats--;
    }
  }
});


let rideCounter = mockRides.length + 1;
export const generateRideId = () => `ride${rideCounter++}`;

let requestCounter = mockRequests.length + 1;
export const generateRequestId = () => `req${requestCounter++}`;

// Note: For dashboards to show data for a newly logged-in user,
// that user will need to create rides or requests.
// Or, you can manually add items to mockRides/mockRequests with a known test user's UID.
// For example, if your test user's UID is "myTestUserId", you could add:
// mockRides.push({ id: "myRide1", driverUid: "myTestUserId", driverName: "My Test User", origin: "My Home", destination: "My Work", date: "2024-09-25", time: "08:00", availableSeats: 2, price: 5.00, createdAt: new Date() });
// mockRequests.push({ id: "myReq1", rideId: "ride1", passengerUid: "myTestUserId", passengerName: "My Test User", driverUid: "driverAlpha", origin: "New York", destination: "Boston", date: "2024-09-15", time: "09:00", price: 25.00, status: "pending", createdAt: new Date() });
// Ensure these UIDs match what Firebase auth provides for your test accounts.
