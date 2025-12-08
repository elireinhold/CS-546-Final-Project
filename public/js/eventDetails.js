document.addEventListener("DOMContentLoaded", () => {
  // Find button by data attribute or by ID pattern
  const btn = document.querySelector('[data-event-id]') 
    ? document.querySelector('button[data-event-id]')
    : document.querySelector('button[id^="save-btn-"]');

  if (!btn) return;

  const eventId = btn.getAttribute("data-event-id") || btn.id.replace("save-btn-", "");

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
      const counter = document.getElementById(`save-count-${eventId}`);
      if (counter) {
        counter.textContent = `${data.userCount} user(s) saved this`;
      }

      // Jump back to previous page using document.referrer
      // This ensures we return to the actual page the user came from
      const previousPage = document.referrer || (typeof returnTo !== 'undefined' && returnTo ? returnTo : '/events/search');
      
      setTimeout(() => {
        window.location.href = previousPage;
      }, 400);

    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    }
  });
});