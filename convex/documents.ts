import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const createDocument = mutation({
  args: {
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const documentId = await ctx.db.insert("documents", {
      title: args.title,
      content: "",
      ownerId: userId,
      collaborators: [],
      isPublic: false,
      lastModified: Date.now(),
    });

    return documentId;
  },
});

export const listDocuments = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const ownedDocs = await ctx.db
      .query("documents")
      .withIndex("by_owner", (q) => q.eq("ownerId", userId))
      .order("desc")
      .collect();

    const allDocs = await ctx.db
      .query("documents")
      .filter((q) => q.neq(q.field("ownerId"), userId))
      .order("desc")
      .collect();

    const collaborativeDocs = allDocs.filter(doc => 
      doc.isPublic || doc.collaborators.includes(userId)
    );

    return [...ownedDocs, ...collaborativeDocs];
  },
});

export const getDocument = query({
  args: { documentId: v.id("documents") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const document = await ctx.db.get(args.documentId);
    if (!document) {
      return null;
    }

    // Check if user has access
    const hasAccess = 
      document.ownerId === userId ||
      document.isPublic ||
      document.collaborators.includes(userId);

    if (!hasAccess) {
      return null;
    }

    return document;
  },
});

export const updateDocument = mutation({
  args: {
    documentId: v.id("documents"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const document = await ctx.db.get(args.documentId);
    if (!document) {
      throw new Error("Document not found");
    }

    // Check if user has write access
    const hasWriteAccess = 
      document.ownerId === userId ||
      document.collaborators.includes(userId);

    if (!hasWriteAccess) {
      throw new Error("Write access denied");
    }

    await ctx.db.patch(args.documentId, {
      content: args.content,
      lastModified: Date.now(),
    });
  },
});

export const updateDocumentTitle = mutation({
  args: {
    documentId: v.id("documents"),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const document = await ctx.db.get(args.documentId);
    if (!document) {
      throw new Error("Document not found");
    }

    if (document.ownerId !== userId) {
      throw new Error("Only owner can change title");
    }

    await ctx.db.patch(args.documentId, {
      title: args.title,
      lastModified: Date.now(),
    });
  },
});

export const deleteDocument = mutation({
  args: { documentId: v.id("documents") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const document = await ctx.db.get(args.documentId);
    if (!document) {
      throw new Error("Document not found");
    }

    if (document.ownerId !== userId) {
      throw new Error("Only owner can delete document");
    }

    await ctx.db.delete(args.documentId);
  },
});

export const addCollaborator = mutation({
  args: {
    documentId: v.id("documents"),
    collaboratorEmail: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const document = await ctx.db.get(args.documentId);
    if (!document) {
      throw new Error("Document not found");
    }

    if (document.ownerId !== userId) {
      throw new Error("Only owner can add collaborators");
    }

    // Find user by email
    const collaborator = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.collaboratorEmail))
      .unique();

    if (!collaborator) {
      throw new Error("User not found");
    }

    if (!document.collaborators.includes(collaborator._id)) {
      await ctx.db.patch(args.documentId, {
        collaborators: [...document.collaborators, collaborator._id],
        lastModified: Date.now(),
      });
    }
  },
});
