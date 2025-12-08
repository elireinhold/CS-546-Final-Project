document.addEventListener("DOMContentLoaded", () => {
  // Get eventId from button (always exists) or URL
  let eventId = null;
  
  // Try from button first (most reliable, always exists)
  const btn = document.querySelector('button[data-event-id]') || document.querySelector('button[id^="save-btn-"]');
  if (btn) {
    eventId = btn.getAttribute("data-event-id") || btn.id.replace("save-btn-", "");
  }
  
  // Try from URL if button not found (shouldn't happen, but fallback)
  if (!eventId) {
    const pathParts = window.location.pathname.split('/');
    const idIndex = pathParts.indexOf('events');
    if (idIndex !== -1 && pathParts[idIndex + 1]) {
      eventId = pathParts[idIndex + 1];
    }
  }

  if (!eventId) {
    console.error("Could not determine eventId");
    return;
  }

  // Save/Unsave functionality (btn already declared above)
  if (btn) {
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
        const previousPage = document.referrer || (typeof returnTo !== 'undefined' && returnTo ? returnTo : '/events/search');
        
        setTimeout(() => {
          window.location.href = previousPage;
        }, 400);

      } catch (err) {
        console.error(err);
        alert("Something went wrong");
      }
    });
  }

  // Comments functionality

  // Format date for display
  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString();
  }

  // Add comment
  const submitCommentBtn = document.getElementById("submit-comment-btn");
  const commentTextArea = document.getElementById("comment-text");
  
  if (submitCommentBtn && commentTextArea) {
    submitCommentBtn.addEventListener("click", async () => {
      const text = commentTextArea.value.trim();
      
      if (!text) {
        alert("Please enter a comment");
        return;
      }

      try {
        const response = await fetch(`/events/${eventId}/comments`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ commentText: text })
        });

        const data = await response.json();

        if (data.error) {
          alert(data.error);
          return;
        }

        // Clear textarea
        commentTextArea.value = "";

        // Add new comment to the list
        const commentsContainer = document.getElementById("comments-container");
        const commentDiv = document.createElement("div");
        commentDiv.className = "comment";
        commentDiv.setAttribute("data-comment-id", data.comment._id);
        
        // Always show delete button for newly added comments (user owns them)
        commentDiv.innerHTML = `
          <p><strong>${data.comment.username}</strong> <span class="comment-date">${formatDate(data.comment.createdAt)}</span></p>
          <p>${data.comment.text}</p>
          <button class="delete-comment-btn" data-comment-id="${data.comment._id}">Delete</button>
        `;

        // Remove "No comments yet" message if exists
        const noCommentsMsg = commentsContainer.querySelector("p");
        if (noCommentsMsg && noCommentsMsg.textContent.includes("No comments")) {
          noCommentsMsg.remove();
        }

        commentsContainer.appendChild(commentDiv);

        // Add delete button event listener
        const deleteBtnEl = commentDiv.querySelector(".delete-comment-btn");
        if (deleteBtnEl) {
          deleteBtnEl.addEventListener("click", handleDeleteComment);
        }

      } catch (err) {
        console.error(err);
        alert("Failed to add comment");
      }
    });
  }

  // Delete comment handler
  function handleDeleteComment(e) {
    const commentId = e.target.getAttribute("data-comment-id");
    const commentDiv = e.target.closest(".comment");

    if (!confirm("Are you sure you want to delete this comment?")) {
      return;
    }

    fetch(`/events/${eventId}/comments/${commentId}`, {
      method: "DELETE"
    })
      .then(response => response.json())
      .then(data => {
        if (data.error) {
          alert(data.error);
          return;
        }

        // Remove comment from DOM
        commentDiv.remove();

        // If no comments left, show message
        const commentsContainer = document.getElementById("comments-container");
        if (commentsContainer.children.length === 0) {
          commentsContainer.innerHTML = "<p>No comments yet.</p>";
        }
      })
      .catch(err => {
        console.error(err);
        alert("Failed to delete comment");
      });
  }

  // Add event listeners to existing delete buttons
  document.querySelectorAll(".delete-comment-btn").forEach(btn => {
    btn.addEventListener("click", handleDeleteComment);
  });
});