import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const updateSession = mutation({
  args: {
    documentId: v.id("documents"),
    cursorPosition: v.number(),
    selection: v.object({
      start: v.number(),
      end: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Check if session exists
    const existingSession = await ctx.db
      .query("documentSessions")
      .withIndex("by_user_document", (q) => 
        q.eq("userId", userId).eq("documentId", args.documentId)
      )
      .unique();

    if (existingSession) {
      await ctx.db.patch(existingSession._id, {
        cursorPosition: args.cursorPosition,
        selection: args.selection,
        lastSeen: Date.now(),
      });
    } else {
      await ctx.db.insert("documentSessions", {
        documentId: args.documentId,
        userId,
        userName: user.name || user.email || "Anonymous",
        cursorPosition: args.cursorPosition,
        selection: args.selection,
        lastSeen: Date.now(),
      });
    }
  },
});

export const getActiveSessions = query({
  args: { documentId: v.id("documents") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    
    const sessions = await ctx.db
      .query("documentSessions")
      .withIndex("by_document", (q) => q.eq("documentId", args.documentId))
      .filter((q) => q.gt(q.field("lastSeen"), fiveMinutesAgo))
      .filter((q) => q.neq(q.field("userId"), userId))
      .collect();

    return sessions;
  },
});

export const leaveSession = mutation({
  args: { documentId: v.id("documents") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return;
    }

    const session = await ctx.db
      .query("documentSessions")
      .withIndex("by_user_document", (q) => 
        q.eq("userId", userId).eq("documentId", args.documentId)
      )
      .unique();

    if (session) {
      await ctx.db.delete(session._id);
    }
  },
});
