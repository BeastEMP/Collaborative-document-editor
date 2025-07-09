import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  documents: defineTable({
    title: v.string(),
    content: v.string(),
    ownerId: v.id("users"),
    collaborators: v.array(v.id("users")),
    isPublic: v.boolean(),
    lastModified: v.number(),
  })
    .index("by_owner", ["ownerId"])
    .index("by_last_modified", ["lastModified"]),
  
  documentSessions: defineTable({
    documentId: v.id("documents"),
    userId: v.id("users"),
    userName: v.string(),
    cursorPosition: v.number(),
    selection: v.object({
      start: v.number(),
      end: v.number(),
    }),
    lastSeen: v.number(),
  })
    .index("by_document", ["documentId"])
    .index("by_user_document", ["userId", "documentId"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
