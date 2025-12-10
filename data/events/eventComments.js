import { events } from "../../config/mongoCollections.js";
import { ObjectId } from "mongodb";

export async function addComment(
    eventId,
    userId,
    username,
    commentText,
    parentId = null
  ) {
    if (!ObjectId.isValid(eventId)) throw "Invalid event ID";
    if (!ObjectId.isValid(userId)) throw "Invalid user ID";
    if (!commentText || !commentText.trim()) throw "Comment text is required";
    if (parentId && !ObjectId.isValid(parentId)) throw "Invalid parent ID";
  
    const eventCollection = await events();
    const event = await eventCollection.findOne({ _id: new ObjectId(eventId) });
    if (!event) throw "Event not found";
  
    // If parentId is provided, verify parent comment exists
    if (parentId) {
      const parentComment = event.comments.find(
        (c) => c._id.toString() === parentId
      );
      if (!parentComment) throw "Parent comment not found";
    }
  
    const comment = {
      _id: new ObjectId(),
      userId: new ObjectId(userId),
      username: username,
      text: commentText.trim(),
      createdAt: new Date(),
      parentId: parentId ? new ObjectId(parentId) : null,
    };
  
    const result = await eventCollection.updateOne(
      { _id: new ObjectId(eventId) },
      { $push: { comments: comment } }
    );
  
    if (result.matchedCount === 0) throw "Event not found";
    return comment;
  }
  
  // Delete comment or reply from event (supports any level)
export async function deleteComment(eventId, commentId, userId) {
    if (!ObjectId.isValid(eventId)) throw "Invalid event ID";
    if (!ObjectId.isValid(commentId)) throw "Invalid comment ID";
    if (!ObjectId.isValid(userId)) throw "Invalid user ID";
  
    const eventCollection = await events();
    const event = await eventCollection.findOne({ _id: new ObjectId(eventId) });
    if (!event) throw "Event not found";
  
    const comment = event.comments.find((c) => c._id.toString() === commentId);
    if (!comment) throw "Comment not found";
    if (comment.userId.toString() !== userId)
      throw "You can only delete your own comments";
  
    // Collect all IDs to delete (comment + all its descendants)
    const idsToDelete = new Set();
  
    const collectChildren = (parentId) => {
      idsToDelete.add(parentId);
      const children = event.comments.filter(
        (c) => c.parentId && c.parentId.toString() === parentId
      );
      children.forEach((child) => collectChildren(child._id.toString()));
    };
  
    collectChildren(commentId);
  
    // Delete all collected comments in one operation
    const result = await eventCollection.updateOne(
      { _id: new ObjectId(eventId) },
      {
        $pull: {
          comments: {
            _id: { $in: Array.from(idsToDelete).map((id) => new ObjectId(id)) },
          },
        },
      }
    );
  
    if (result.modifiedCount === 0) throw "Failed to delete comment";
    return { deleted: true };
  }