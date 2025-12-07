async function toggleSave(eventId, isSaved) {
    const url = isSaved
      ? `/events/${eventId}/unsave`
      : `/events/${eventId}/save`;
  
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });
  
    if (!res.ok) {
      alert("Error saving event");
      return;
    }
  
    const data = await res.json();
    location.reload(); // refresh to update button UI
  }