async function updateSaveStatus(eventId, currentlySaved) {
    const url = currentlySaved
      ? `/events/${eventId}/unsave`
      : `/events/${eventId}/save`;
  
    try {
      const res = await fetch(url, { method: "POST" });
      const data = await res.json();
  
      if (data.error) {
        alert(data.error);
        return;
      }
  
      // Update button text + onclick
      const btn = document.getElementById(`save-btn-${eventId}`);
      btn.textContent = data.saved ? "Unsave" : "Save";
      btn.setAttribute(
        "onclick",
        `updateSaveStatus('${eventId}', ${data.saved})`
      );
  
      // Update the save count
      const countEl = document.getElementById(`save-count-${eventId}`);
      if (countEl) {
        countEl.textContent = `${data.userCount} user(s) saved this`;
      }
  
    } catch (err) {
      console.error(err);
      alert("Save action failed.");
    }
  }