import helpers from './validation/client-helpers.js';

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

        if (!response.ok || data.error) {
          alert(data.error || "Error updating save status");
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
        alert("Error updating save status. Please try again.");
      }
    });
  }

  // Share functionality
  const shareBtn = document.getElementById(`share-btn-${eventId}`);
  const shareMessage = document.getElementById(`share-message-${eventId}`);
  
  if (shareBtn) {
    shareBtn.addEventListener("click", async () => {
      try {
        // Get current page URL
        const url = window.location.href;
        
        // Copy to clipboard
        await navigator.clipboard.writeText(url);
        
        // Show message
        if (shareMessage) {
          shareMessage.style.display = "inline";
          
          // Hide message after 3 seconds
          setTimeout(() => {
            shareMessage.style.display = "none";
          }, 3000);
        }
      } catch (err) {
        console.error("Failed to copy link:", err);
        // Fallback for browsers that don't support clipboard API
        const url = window.location.href;
        const textArea = document.createElement("textarea");
        textArea.value = url;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.select();
        try {
          document.execCommand("copy");
          if (shareMessage) {
            shareMessage.style.display = "inline";
            setTimeout(() => {
              shareMessage.style.display = "none";
            }, 3000);
          }
        } catch (fallbackErr) {
          alert("Failed to copy link. Please copy manually: " + url);
        }
        document.body.removeChild(textArea);
      }
    });
  }

  // Comments functionality - Recursive rendering with parentId model

  // Format date for display
  // function formatDate(dateString) {
  //   const date = new Date(dateString);
  //   return date.toLocaleString();

  // }
  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      timeZone: "America/New_York",
    });
  }
  
  

  // Recursive function to render comment tree
  function renderComment(comment, depth = 0) {
    const commentDiv = document.createElement("div");
    commentDiv.className = "comment";
    const commentId = comment._id.toString ? comment._id.toString() : String(comment._id);
    commentDiv.setAttribute("data-comment-id", commentId);
    commentDiv.style.marginLeft = `${depth * 20}px`;
    commentDiv.style.marginTop = "10px";
    commentDiv.style.borderLeft = depth > 0 ? "2px solid #ccc" : "none";
    commentDiv.style.paddingLeft = depth > 0 ? "10px" : "0";

    const isOwner = currentUserId && comment.userId && String(comment.userId) === String(currentUserId);
    const showActions = currentUserId !== null;

    commentDiv.innerHTML = `
      <p><strong>${comment.username}</strong> <span class="comment-date">${formatDate(comment.createdAt)}</span></p>
      <p>${comment.text}</p>
      ${showActions ? `
        ${isOwner ? `<button class="delete-comment-btn" data-comment-id="${commentId}">Delete</button>` : ''}
        <button class="reply-btn" data-comment-id="${commentId}">Reply</button>
      ` : ''}
      <div class="reply-form-container" data-comment-id="${commentId}" style="display: none; margin-top: 10px;">
        <textarea class="reply-text" rows="3" cols="40" placeholder="Write your reply..."></textarea>
        <br>
        <button class="submit-reply-btn" data-comment-id="${commentId}">Submit Reply</button>
        <button class="cancel-reply-btn" data-comment-id="${commentId}">Cancel</button>
      </div>
    `;

    return commentDiv;
  }

  // Render all comments recursively
  function renderComments(comments) {
    const commentsList = document.getElementById("comments-list");
    if (!commentsList) return;

    commentsList.innerHTML = "";

    if (!comments || comments.length === 0) {
      commentsList.innerHTML = "<p>No comments yet.</p>";
      return;
    }

    // Build comment tree
    const commentMap = new Map();
    const rootComments = [];

    // First pass: create map and find root comments
    comments.forEach(comment => {
      commentMap.set(comment._id.toString(), comment);
      if (!comment.parentId) {
        rootComments.push(comment);
      }
    });

    // Recursive function to render comment and its children
    function renderCommentTree(comment, depth = 0) {
      const commentDiv = renderComment(comment, depth);
      commentsList.appendChild(commentDiv);

      // Find and render children
      const children = comments.filter(c => 
        c.parentId && c.parentId.toString() === comment._id.toString()
      );
      
      children.forEach(child => {
        renderCommentTree(child, depth + 1);
      });
    }

    // Render all root comments
    rootComments.forEach(comment => {
      renderCommentTree(comment, 0);
    });
  }

  // Make allComments mutable
  let allCommentsArray = typeof allComments !== 'undefined' ? [...allComments] : [];

  // Setup event listeners for comments (using event delegation - only once)
  let eventListenersSetup = false;
  function setupCommentEventListeners() {
    const commentsList = document.getElementById("comments-list");
    if (!commentsList) return;

    // Only setup event listeners once
    if (eventListenersSetup) return;
    eventListenersSetup = true;

    // Use event delegation to handle all buttons
    commentsList.addEventListener("click", async (e) => {
      // Reply button - show/hide form
      if (e.target.classList.contains("reply-btn")) {
        const commentId = e.target.getAttribute("data-comment-id");
        const replyForm = document.querySelector(`.reply-form-container[data-comment-id="${commentId}"]`);
        if (replyForm) {
          replyForm.style.display = replyForm.style.display === "none" ? "block" : "none";
        }
      }

      // Cancel reply button
      if (e.target.classList.contains("cancel-reply-btn")) {
        const commentId = e.target.getAttribute("data-comment-id");
        const replyForm = document.querySelector(`.reply-form-container[data-comment-id="${commentId}"]`);
        const replyText = replyForm.querySelector(".reply-text");
        if (replyForm) {
          replyForm.style.display = "none";
          if (replyText) replyText.value = "";
        }
      }

      // Submit reply button
      if (e.target.classList.contains("submit-reply-btn")) {
        const parentId = e.target.getAttribute("data-comment-id");
        const replyForm = document.querySelector(`.reply-form-container[data-comment-id="${parentId}"]`);
        const replyText = replyForm.querySelector(".reply-text");
        
        // Client-side validation
        let text = replyText.value;
        try {
          text = helpers.validCommentText(text);
        } catch (e) {
          alert(e);
          return;
        }

        try {
          const response = await fetch(`/events/${eventId}/comments`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ commentText: text, parentId: parentId })
          });

          const data = await response.json();

          if (data.error) {
            alert(data.error);
            return;
          }

          replyText.value = "";
          replyForm.style.display = "none";

          // Add new reply to array and re-render
          allCommentsArray.push(data.comment);
          renderComments(allCommentsArray);

        } catch (err) {
          console.error(err);
          alert("Failed to add reply");
        }
      }

      // Delete comment button
      if (e.target.classList.contains("delete-comment-btn")) {
        const commentId = e.target.getAttribute("data-comment-id");

        if (!confirm("Are you sure you want to delete this comment?")) {
          return;
        }

        try {
          const response = await fetch(`/events/${eventId}/comments/${commentId}`, {
            method: "DELETE"
          });

          const data = await response.json();

          if (data.error) {
            alert(data.error);
            return;
          }

          // Remove comment and all its children recursively
          const removeCommentAndChildren = (id) => {
            allCommentsArray = allCommentsArray.filter(c => c._id.toString() !== id);
            const children = allCommentsArray.filter(c => c.parentId && c.parentId.toString() === id);
            children.forEach(child => removeCommentAndChildren(child._id.toString()));
          };
          removeCommentAndChildren(commentId);
          renderComments(allCommentsArray);

        } catch (err) {
          console.error(err);
          alert("Failed to delete comment");
        }
      }
    });
  }

  // Initial render
  renderComments(allCommentsArray);
  
  // Setup event listeners after initial render (only once)
  setupCommentEventListeners();

  // Add top-level comment
  const submitCommentBtn = document.getElementById("submit-comment-btn");
  const commentTextArea = document.getElementById("comment-text");
  
  if (submitCommentBtn && commentTextArea) {
    submitCommentBtn.addEventListener("click", async () => {
      // Client-side validation
      let text = commentTextArea.value;
      try {
        text = helpers.validCommentText(text);
      } catch (e) {
        alert(e);
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

        // Add new comment to array and re-render
        allCommentsArray.push(data.comment);
        renderComments(allCommentsArray);

      } catch (err) {
        console.error(err);
        alert("Failed to add comment");
      }
    });
  }

});