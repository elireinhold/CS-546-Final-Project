document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("form[action='/events/search']");
    if (!form) return;
  
    form.addEventListener("submit", (e) => {
      const keywordInput = form.querySelector("input[name='keyword']");
      const startDateInput = form.querySelector("input[name='startDate']");
      const endDateInput = form.querySelector("input[name='endDate']");
  
      const keyword = keywordInput.value.trim();
      const startDate = startDateInput.value;
      const endDate = endDateInput.value;
  
      if (keyword && keyword.length < 2) {
        e.preventDefault();
        alert("Keyword must be at least 2 characters long.");
        return;
      }
  
      if (startDate && !isValidDate(startDate)) {
        e.preventDefault();
        alert("Start date is invalid.");
        return;
      }
  
      if (endDate && !isValidDate(endDate)) {
        e.preventDefault();
        alert("End date is invalid.");
        return;
      }
  
      if (startDate && endDate) {
        if (new Date(startDate) > new Date(endDate)) {
          e.preventDefault();
          alert("Start date cannot be after end date.");
          return;
        }
      }
    });
  
    function isValidDate(str) {
      const d = new Date(str);
      return !isNaN(d.getTime());
    }
  });