import { relations } from "drizzle-orm";
import { users, resources, comments, stars, discussions, discussionReplies } from "./schema";

export const usersRelations = relations(users, ({ many }) => ({
  resources: many(resources),
  comments: many(comments),
  stars: many(stars),
  discussions: many(discussions),
  discussionReplies: many(discussionReplies),
}));

export const resourcesRelations = relations(resources, ({ many }) => ({
  comments: many(comments),
  stars: many(stars),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  resource: one(resources, { fields: [comments.resourceId], references: [resources.id] }),
  user: one(users, { fields: [comments.userId], references: [users.id] }),
}));

export const starsRelations = relations(stars, ({ one }) => ({
  resource: one(resources, { fields: [stars.resourceId], references: [resources.id] }),
  user: one(users, { fields: [stars.userId], references: [users.id] }),
}));

export const discussionsRelations = relations(discussions, ({ many }) => ({
  replies: many(discussionReplies),
}));

export const discussionRepliesRelations = relations(discussionReplies, ({ one }) => ({
  discussion: one(discussions, { fields: [discussionReplies.discussionId], references: [discussions.id] }),
  user: one(users, { fields: [discussionReplies.userId], references: [users.id] }),
}));
