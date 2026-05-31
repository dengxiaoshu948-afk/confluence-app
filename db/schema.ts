import {
  mysqlTable,
  mysqlEnum,
  serial,
  varchar,
  text,
  timestamp,
  bigint,
  int,
} from "drizzle-orm/mysql-core";
// import { sql } from "drizzle-orm";

// Users table (managed by auth system)
export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  unionId: varchar("unionId", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  avatar: text("avatar"),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  points: int("points").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  lastSignInAt: timestamp("lastSignInAt").defaultNow().notNull(),
});

// Resources: AI models, datasets, docs, tools
export const resources = mysqlTable("resources", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  type: mysqlEnum("type", ["model", "dataset", "tool", "doc", "tutorial", "code"]).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  tags: text("tags"), // comma-separated
  fileUrl: text("fileUrl"), // stored file path
  fileSize: bigint("fileSize", { mode: "number" }),
  fileName: varchar("fileName", { length: 255 }),
  downloadCount: int("downloadCount").default(0).notNull(),
  starCount: int("starCount").default(0).notNull(),
  authorId: bigint("authorId", { mode: "number", unsigned: true }).notNull(),
  authorName: varchar("authorName", { length: 255 }),
  authorAvatar: text("authorAvatar"),
  coverImage: text("coverImage"), // optional cover
  isPublic: mysqlEnum("isPublic", ["public", "private"]).default("public").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

// Comments on resources
export const comments = mysqlTable("comments", {
  id: serial("id").primaryKey(),
  resourceId: bigint("resourceId", { mode: "number", unsigned: true }).notNull(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  userName: varchar("userName", { length: 255 }),
  userAvatar: text("userAvatar"),
  content: text("content").notNull(),
  parentId: bigint("parentId", { mode: "number", unsigned: true }), // for replies
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Stars (收藏/点赞)
export const stars = mysqlTable("stars", {
  id: serial("id").primaryKey(),
  resourceId: bigint("resourceId", { mode: "number", unsigned: true }).notNull(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Discussions (community posts)
export const discussions = mysqlTable("discussions", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  userName: varchar("userName", { length: 255 }),
  userAvatar: text("userAvatar"),
  replyCount: int("replyCount").default(0).notNull(),
  viewCount: int("viewCount").default(0).notNull(),
  tags: text("tags"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

// Discussion replies
export const discussionReplies = mysqlTable("discussion_replies", {
  id: serial("id").primaryKey(),
  discussionId: bigint("discussionId", { mode: "number", unsigned: true }).notNull(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  userName: varchar("userName", { length: 255 }),
  userAvatar: text("userAvatar"),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Points history (积分记录)
export const pointRecords = mysqlTable("point_records", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  action: mysqlEnum("action", ["upload", "download_received", "star_received", "share"]).notNull(),
  points: int("points").notNull(),
  resourceId: bigint("resourceId", { mode: "number", unsigned: true }),
  description: varchar("description", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Local users (independent auth system)
export const localUsers = mysqlTable("local_users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  avatar: text("avatar"),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  points: int("points").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Share tracking (防止重复刷分享积分)
export const shareRecords = mysqlTable("share_records", {
  id: serial("id").primaryKey(),
  resourceId: bigint("resourceId", { mode: "number", unsigned: true }).notNull(),
  sharerId: bigint("sharerId", { mode: "number", unsigned: true }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Follows (关注关系)
export const follows = mysqlTable("follows", {
  id: serial("id").primaryKey(),
  followerId: bigint("followerId", { mode: "number", unsigned: true }).notNull(),
  followingId: bigint("followingId", { mode: "number", unsigned: true }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Notifications
export const notifications = mysqlTable("notifications", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  type: mysqlEnum("type", ["reply", "comment", "star", "mention"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content"),
  link: text("link"),
  actorName: varchar("actorName", { length: 255 }),
  actorAvatar: text("actorAvatar"),
  read: mysqlEnum("read", ["0", "1"]).default("0").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Resource = typeof resources.$inferSelect;
export type InsertResource = typeof resources.$inferInsert;
export type Comment = typeof comments.$inferSelect;
export type Star = typeof stars.$inferSelect;
export type Discussion = typeof discussions.$inferSelect;
export type DiscussionReply = typeof discussionReplies.$inferSelect;
export type PointRecord = typeof pointRecords.$inferSelect;
export type ShareRecord = typeof shareRecords.$inferSelect;
export type Follow = typeof follows.$inferSelect;
