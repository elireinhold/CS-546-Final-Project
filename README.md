# NYSee Now — CS 546 Final Project

**Group 17: Janet Koublanou, Richard Toothill, Eli Reinhold, Ru Jia**

**GitHub Repository:** https://github.com/elireinhold/CS-546-Final-Project

---

## Project Overview

NYSee Now is a New York City event browsing and personal calendar application. Users can search for events, filter by borough or event type, save events to their personal calendar, view event information, and explore events on an interactive map.

**Open Dataset:**  
https://data.cityofnewyork.us/City-Government/NYC-Permitted-Event-Information/tvpp-9vvx/about_data

This project uses daily-updated NYC Open Data. All event data is stored in MongoDB, and NYC data is synchronized through scripts in the `/scripts` directory.

---

## Core Features

### 1. Your Event Calendar
- Displays events you have saved and their dates
- Click on a day in the calendar to view all events happening on that day

### 2. Event Search and Filtering
- Search events by name, type, and borough
- Filter functionality: filter by event type and borough
- Display event type, location, borough, and name for each event
- Show whether you have saved the event
- Display how many other users have saved the event

### 3. Event Details Page
- Click on an event from search results to view detailed information
- Display event name, location, and road closure information
- Ability to add the event to your personal calendar

### 4. Personal Event Management
- Users can add personal events to their own calendar (not accessible to others)
- Requires providing the event name and address

### 5. Map Integration
- Display a map view of events you have saved
- Click on events on the map to view information (name, location, road closures)
- Use MongoDB geospatial queries to find events near your location

### 6. User-Created Public Events
- Users can create, edit, or delete their own public events
- Other users can view these public events

### 7. Event Comments
- Users can comment or discuss events on event pages

### 8. View Past and Upcoming Events
- Users can view both past and upcoming events they've saved

### 9. Event Recommendations
- Suggest events based on the user's previous saved events

---

## Extra Features

### 1. Event Rating System
- Users can rate events from 1–5 stars or "like" them
- Display the most popular events
- Implementation: store ratings as numbers in each event document and compute the average

### 2. User Profile Page
- Display user information, saved events, and comments
- Show personalized event recommendations
- Implementation: simple profile route that fetches data from existing user collections

### 3. Event Sharing
- Users can share an event link with others via a generated URL
- Implementation: generate a shareable route like `/event/:id` that anyone can open

---

## Tech Stack

- **Backend Framework:** Express.js
- **Template Engine:** Handlebars
- **Database:** MongoDB
- **Session Management:** express-session
- **Password Encryption:** bcryptjs
- **Runtime:** Node.js (ES Modules)

---

## Project Structure

```
CS-546-Final-Project/
├── app.js                 # Main application entry point
├── package.json           # Project dependencies configuration
├── config/
│   └── mongoConnection.js # MongoDB connection configuration
├── data/                  # Data access layer
│   ├── events.js         # Event data operations
│   ├── savedEvents.js    # Saved event data operations
│   └── users.js          # User data operations
├── routes/                # Route handlers
│   ├── index.js          # Route configuration
│   ├── events.js         # Event-related routes
│   ├── home.js           # Home page routes
│   └── users.js          # User-related routes
├── scripts/               # Data synchronization scripts
│   ├── seedNYCEvents.js  # Initialize NYC event data
│   └── updateNYCEvents.js # Update NYC event data
├── views/                 # Handlebars templates
│   ├── layouts/
│   │   └── main.handlebars # Main layout template
│   ├── calendar.handlebars # Calendar page
│   ├── eventDetails.handlebars # Event details page
│   ├── home.handlebars   # Home page
│   └── search.handlebars # Search page
└── public/                # Static assets
    ├── css/
    │   └── main.css      # Main stylesheet
    └── js/
        └── client.js     # Client-side JavaScript
```

---

## Installation and Setup

### Prerequisites
- Node.js (recommended v18 or higher)
- MongoDB (local or remote instance)
- npm

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/elireinhold/CS-546-Final-Project.git
   cd CS-546-Final-Project
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure MongoDB connection**
   - Edit the `config/mongoConnection.js` file
   - Set your MongoDB connection string

4. **Initialize data (optional)**
   ```bash
   node scripts/seedNYCEvents.js
   ```

5. **Start the server**
   ```bash
   npm start
   ```

6. **Access the application**
   - Open your browser and navigate to: http://localhost:3000

### Updating NYC Event Data

Run the update script periodically to sync the latest NYC event data:

```bash
node scripts/updateNYCEvents.js
```

---

## Main Routes

- `GET /` - Home page
- `GET /search` - Event search page
- `GET /calendar` - Personal calendar page
- `GET /event/:id` - Event details page
- `GET /map` - Map view page
- `GET /profile` - User profile page

(For specific route implementations, refer to files in the `routes/` directory)

---

## Development Notes

This project uses ES Modules (ESM) syntax. All imports use `import/export` instead of `require/module.exports`.

---

## License

ISC

---

## Contributors

- Janet Koublanou
- Richard Toothill
- Eli Reinhold
- Ru Jia
