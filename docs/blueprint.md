# **App Name**: Rueda Compartida

## Core Features:

- User Authentication: User registration and login using Firebase Authentication.
- Create Ride: Form to create and post a new ride with details such as origin, destination, date, time, available seats, and price.
- Search Rides: Form to search for rides based on origin, destination, and date.
- Ride Listings: Display ride listings with relevant details such as driver name, date, time, available seats, and price, with a button to request a ride.
- Request Ride: Functionality for passengers to request a seat on a ride. Creates a document in the 'solicitudes' collection with the ride ID, passenger UID, and status set to 'pending'.
- Driver Dashboard: Dashboard for drivers to view their posted rides and manage incoming requests (accept or reject).
- Passenger Dashboard: Dashboard for passengers to view their ride requests and the status of each request.

## Style Guidelines:

- Primary color: Dark gray (#333333) to provide a modern and sophisticated dark theme.
- Background color: Black (#000000) for a true dark mode experience.
- Accent color: A vibrant blue to highlight key actions and elements, providing contrast and guiding user attention in the dark theme.
- Clean and modern typography for easy readability on all devices, optimized for dark mode.
- Simple, intuitive, and light-colored icons to ensure visibility against the dark background.
- Clean and structured layout with clear visual hierarchy to make navigation and content consumption easy in dark mode.
- Subtle animations and transitions to enhance user experience and provide feedback on interactions, optimized for dark mode.