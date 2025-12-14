# NYSee Now — CS 546 Final Project

**Group 17: Ru Jia, Janet Koublanou, Richard Toothill, Eli Reinhold**

**GitHub Repository:** https://github.com/elireinhold/CS-546-Final-Project

---

## Project Overview

NYSee Now is a New York City event browsing and personal calendar application. Users can search for events, filter by borough or event type, save events to their personal calendar, view event information, and explore events on an interactive map.

**Open Dataset:**  
https://data.cityofnewyork.us/City-Government/NYC-Permitted-Event-Information/tvpp-9vvx/about_data

All event data is stored in MongoDB, and NYC data is synchronized through scripts in the `/scripts` directory.

---

## Core Features

### 1. Your Event Calendar
- Displays events you have saved and their dates
- Click on a day in the calendar to view all events happening on that day

### 2. Event Search and Filtering
- Search events by name
- Filter functionality: filter by event type, borough and time
- Display event name, type, borough and time.
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

### 1. User Profile Page
- Display user information, saved events, and comments
- Show personalized event recommendations
- Implementation: simple profile route that fetches data from existing user collections

### 2. Event Sharing
- Users can share an event link with others via a generated URL
- Implementation: generate a shareable route like `/event/:id` that anyone can open

### 

---

## Project Structure

```
CS-546-Final-Project/
├── app.js                    
├── package.json
├── middleware.js
├── README.md
├── .gitignore
├── config/
│   ├── mongoCollections.js
│   ├── mongoConnection.js     
│   └── settings.js           
├── data/                    
│   ├── events.js          
│   ├── map.js
│   └── users.js              
├── helpers/                  
│   ├── userHelpers.js
│   ├── handlebarsHelpers.js
│   └── eventHelpers.js
├── routes/                   
│   ├── calendar.js         
│   ├── events.js             
│   ├── home.js           
│   ├── index.js             
│   └── users.js               
├── scripts/                  
│   ├── seedNYCEvents.js      
│   └── updateNYCEvents.js    
├── views/                   
│   ├── layouts/
│       └── main.handlebars
│   ├── users/
│       ├── login.handlebars
│       └── register.handlebars
│   ├── calendar.handlebars
│   ├── createEvent.handlebars
│   ├── createEventSuccess.handlebars
│   ├── error.handlebars
│   ├── eventDetails.handlebars
│   ├── home.handlebars
│   ├── editEvent.handlebars
│   ├── logout.handlebars
│   ├── search.handlebars
│   └── userProfile.handlebars
└── public/                
    ├── css/main.css
    └── js/
        ├── validation/
            ├── client-helpers.js
            ├── createEvent.js
            ├── login.js
            └── register.js
        ├── calander.js
        ├── client.js
        ├── eventDetails.js    
        ├── eventMap.js
        ├── closestEventMap.js 
        ├── searchValidation.js  
        ├── homeMap.js
        └── search.js
```

---

## Installation and Setup

### Prerequisites
- Node.js (recommended v18 or higher)
- MongoDB (local or remote instance)
- npm

### Installation Steps (Clone Repository)

1. **Clone the repository**
   ```bash
   git clone https://github.com/elireinhold/CS-546-Final-Project.git
   cd CS-546-Final-Project
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Initialize data (optional)**
   ```bash
   npm run seed
   ```

4. **Start the server**
   ```bash
   npm start
   ```

5. **Access the application**
   - Open your browser and navigate to: http://localhost:3000

### Updating NYC Event Data

Run the update script in a seperate terminal whenever you want to sync the latest NYC event data:

```bash
npm run updateNYC
```

### Installation Steps (.zip)
1. **Download zip file submission from Canvas**
2. **Unzip file into decided terminal**
2. **Follow steps 3-5 from "Installation Steps (Clone Repository)" Section** 
---

## Main Routes

- GET `/` - Home page
- GET `/search` - Event search page
- GET `/users/login` - User login page
- GET `/users/register` -User registration page
- GET `/users/:id` - User profile page
- GET `/users/logout` - Logout success page
- GET `/calendar` - Personal calendar page
- GET `/event/:id` - Event details page
- GET `/event/create` - Event creation form
- GET `/event/create/success` - Event creation success indication

(For specific route implementations, refer to files in the `routes/` directory)

---

## Contributors

- Ru Jia
- Janet Koublanou
- Richard Toothill
- Eli Reinhold

