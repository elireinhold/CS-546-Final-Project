async function updateSaveStatus(eventId, isSaved) {
    const url = isSaved
      ? `/events/${eventId}/unsave`
      : `/events/${eventId}/save`;
  
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        }
      });
  
      const result = await response.json();
  
      if (result.error) {
        alert(result.error);
        return;
      }
  
      const btn = document.getElementById(`save-btn-${eventId}`);
      btn.innerText = result.saved ? "Unsave" : "Save";
  
      // Clicking the button again should toggle correctly
      btn.setAttribute(
        "onclick",
        `updateSaveStatus('${eventId}', ${result.saved})`
      );
  
      // Optional: update saved count
      const counter = document.getElementById(`save-count-${eventId}`);
      if (counter && result.userCount !== undefined) {
        counter.innerText = `${result.userCount} user(s) saved this`;
      }
  
    } catch (e) {
      console.error(e);
      alert("Error updating save status");
    }
  }