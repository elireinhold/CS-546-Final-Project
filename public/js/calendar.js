(async function() {  
  function renderCalendar(year, month) {
    if(!year || typeof year !== "number" || year < 1900 || year > 2100) {
      throw "Error: Invalid year"
    }
    if(!month || typeof month !== "number" || month < 0 || month > 11) {
      throw "Error: Invalid month"
    }
    if(!calendarDiv) {
      throw "Error: Can not find calendarDiv"
    }
    // Removes all children to clear the calendar
    while (calendarDiv.firstChild) {
      calendarDiv.removeChild(calendarDiv.firstChild);
    }

    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Add empty cells for days before the first of the month
    // firstDay.getDay() gets index from 0(Sunday) - 6(Saturday)
    for (let i = 0; i < firstDay.getDay(); i++) {
      const empty = document.createElement("div");
      calendarDiv.appendChild(empty);
    }

    // Add each day
    for (let day = 1; day <= daysInMonth; day++) {
      const dayCell = document.createElement("div");
      // Set day number
      dayCell.textContent = day;
      

      // Format YYYY-MM-DD
      const monthstr = String(month + 1).padStart(2, '0')
      const daystr = String(day).padStart(2, '0')
      const date = `${year}-${monthstr}-${daystr}`;

      if (eventsByDay[date]) {
        // For each event in the same day append a link to the event page and put it inside
        eventsByDay[date].forEach(ev => {
          const link = document.createElement("a");
          link.href = `/events/${ev._id}`;
          link.textContent = ev.eventName;
          dayCell.appendChild(link);
          dayCell.appendChild(document.createElement("br"));
        });
      }
      // Append day to calendar
      calendarDiv.appendChild(dayCell);
    }
  }

  // Converts index to name of month
  function getMonthName(index) {
    if (typeof index !== "number" || index < 0 || index > 11) {
      throw "Error: Invalid month index";
    }
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    return monthNames[index];
  }

  // Build event map
  const eventsByDay = {};

  if(events) {
    events.forEach(ev => {
      const date = new Date(ev.startDateTime);
      const year = date.getFullYear();
      const monthstr = String(date.getMonth() + 1).padStart(2, "0");
      const daystr = String(date.getDate()).padStart(2, "0");
      const key = `${year}-${monthstr}-${daystr}`;

      if (!eventsByDay[key]) eventsByDay[key] = [];
      eventsByDay[key].push(ev);
    });
  }
  

  // Current month/year
  let currentDate = new Date();
  let currentMonth = currentDate.getMonth(); // 0-11
  let currentYear = currentDate.getFullYear();

  // For previous month button
  const prevBtn = document.getElementById("prev");
  if (prevBtn) {
    // If button clicked then decrease month by 1 and render new calendar
    prevBtn.addEventListener("click", function() {
      currentMonth--;
      if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
      }
      let monthYear = document.getElementById("month-year");
      if(monthYear) {
        // Set month and year
        let monthName = getMonthName(currentMonth)
        monthYear.textContent = `${monthName} ${currentYear}`;
      }
      renderCalendar(currentYear, currentMonth);
    });
  }

  // For next month button
  const nextBtn = document.getElementById("next");
  if (nextBtn) {
    // If button clicked then increase month by 1 and render new calendar
    nextBtn.addEventListener("click", function() {
      currentMonth++;
      if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
      }
      let monthYear = document.getElementById("month-year");
      if(monthYear) {
        // Set month and year
        let monthName = getMonthName(currentMonth)
        monthYear.textContent = `${monthName} ${currentYear}`;
      }
      renderCalendar(currentYear, currentMonth);
    });
  }

  // Render calendar initial
  const calendarDiv = document.getElementById("calendar");
  if(calendarDiv) {
    let monthYear = document.getElementById("month-year");
      if(monthYear) {
        // Set month and year
        let monthName = getMonthName(currentMonth)
        monthYear.textContent = `${monthName} ${currentYear}`;
      }
    renderCalendar(currentYear, currentMonth);
  }  

})();
