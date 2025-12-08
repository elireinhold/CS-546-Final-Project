async function updateSaveStatus(eventId, isSaved) {
    const url = isSaved ? `/events/${eventId}/unsave` : `/events/${eventId}/save`;
  
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
  
      const data = await res.json();
  
      if (data.error) {
        alert(data.error);
        return;
      }
  
      const button = document.getElementById(`save-btn-${eventId}`);
      const count = document.getElementById(`save-count-${eventId}`);
  
      if (!button || !count) {
        console.error("Button or count element not found");
        return;
      }
  
      if (data.saved) {
        button.textContent = "Unsave";
        button.setAttribute("onclick", `updateSaveStatus('${eventId}', true)`);
      } else {
        button.textContent = "Save";
        button.setAttribute("onclick", `updateSaveStatus('${eventId}', false)`);
      }
  
      count.textContent = `${data.userCount} user(s) saved this`;
    } catch (e) {
      console.error(e);
      alert("Error updating save status");
    }
  }