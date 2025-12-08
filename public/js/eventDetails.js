document.addEventListener("DOMContentLoaded", () => {
    const btn = document.getElementById("saveBtn");
    const section = document.getElementById("save-section");
  
    if (!btn || !section) return;
  
    const eventId = section.getAttribute("data-event-id");
  
    btn.addEventListener("click", async () => {
      const currentlySaved = btn.getAttribute("data-saved") === "true";
  
      const url = currentlySaved
        ? `/events/${eventId}/unsave`
        : `/events/${eventId}/save`;
  
      try {
        const response = await fetch(url, { method: "POST" });
        const data = await response.json();
  
        if (data.error) {
          alert(data.error);
          return;
        }
  
        // Update button text and state
        btn.textContent = data.saved ? "Unsave" : "Save";
        btn.setAttribute("data-saved", data.saved);
  
        // Update user count
        const userCountText = document.getElementById("userCountText");
        userCountText.textContent = `Saved by ${data.userCount} user${data.userCount === 1 ? "" : "s"}`;
  
        // Jump back to search page so search result UI refreshes
        setTimeout(() => {
          window.location.href = "/events/search";
        }, 400);
  
      } catch (err) {
        console.error(err);
        alert("Something went wrong");
      }
    });
  });