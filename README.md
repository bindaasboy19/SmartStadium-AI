# SmartStadium AI

SmartStadium AI is a production-ready, real-time intelligent system designed to optimize the attendee experience in large-scale sporting venues. It leverages AI-driven insights, live crowd analysis, and predictive modeling to reduce wait times and improve safety.

## Problem Statement
Large stadiums often suffer from extreme congestion, unpredictable queue times at food stalls and gates, and delayed emergency communications. Attendees struggle to navigate the least crowded paths, while administrators lack granular, real-time data to manage the flow effectively.

## Solution Approach
Our system provides a unified platform for both attendees and administrators:
- **Attendees** receive real-time navigation advice, queue predictions, and a Gemini-powered AI assistant.
- **Administrators** monitor the entire stadium via a data-dense command center, simulating crowd scenarios and broadcasting instant alerts.

## Architecture
```ascii
[ User (Attendee/Admin) ]
       |
       v
[ React (Vite) Frontend ] <--- [ Google Maps API (Visualization) ]
       |
       v
[ Node.js (Express) ] <------- [ Gemini AI API (Intelligence) ]
       |
       v
[ Firebase Firestore ] <------ [ Real-time State Sync ]
```

## Features
- **Smart Crowd Heatmap**: Dynamic visualization of density across stadium stands (North, South, East, West, Pitch).
- **AI Route Optimization**: Real-time suggestions for the quickest route to food, seats, or exits based on current congestion.
- **Queue Prediction**: Heuristic-based wait time estimation (People Count / Service Rate) for all stalls and gates.
- **Gemini AI Assistant**: Context-aware assistant that understands current stadium conditions and provides specific advice.
- **Admin Control Dashboard**: A "Mission Control" style interface for stadium staff to monitor KPIs, run simulations, and broadcast emergency alerts.
- **Real-Time Notifications**: Animated marquee for critical alerts and broadcast system for instant attendee updates.

## Tech Stack
- **Frontend**: React 19, Tailwind CSS 4, Framer Motion (animations).
- **Backend**: Express.js (API routes & asset serving).
- **Database**: Firebase Firestore (Real-time updates).
- **Auth**: Firebase Authentication (Google Login).
- **AI**: Google Gemini Pro (LLM for the assistant).
- **Maps**: Google Maps JS API (Custom visualization).

## Setup Steps
1. **Google Maps API**: Obtain an API key and add it to `GOOGLE_MAPS_API_KEY` in your environment.
2. **Gemini API**: Ensure `GEMINI_API_KEY` is configured in your secrets.
3. **Firebase**: The app is pre-configured to use the provisioned Firebase project.
4. **Run**: `npm run dev` to start the full-stack development server.

## Future Improvements
- **Sensor Integration**: Connect real IoT sensors for automated occupancy tracking.
- **Ticketing Integration**: Map ticket IDs to seats for personalized turn-by-turn navigation.
- **Accessibility Mode**: Dedicated routes and priority alerts for disabled attendees.
- **AR Navigation**: Use ARCore for indoor navigation within the stadium corridors.
