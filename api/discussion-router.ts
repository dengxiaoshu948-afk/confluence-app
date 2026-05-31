import { z } from "zod";
import { createRouter, publicQuery, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { discussions, discussionReplies, notifications } from "@db/schema";
import { eq, desc, count, sql } from "drizzle-orm";

// Helper: check if user can delete
async function canDeleteDiscussion(db: ReturnType<typeof getDb>, discussionId: number, userId: number, userRole: string) {
  if (userRole === "admin") return true;
  const [item] = await db.select().from(discussions).where(eq(discussions.id, discussionId)).limit(1);
  return item?.userId === userId;
}

export const discussionRouter = createRouter({
  // List discussions
  list: publicQuery
    .input(
      z.object({
        search: z.string().optional(),
        page: z.number().default(1),
        limit: z.number().default(20),
      }).optional()
    )
    .query(async ({ input }) => {
      const db = getDb();

      const items = await db
        .select()
        .from(discussions)
        .orderBy(desc(discussions.createdAt))
        .limit(input?.limit || 20)
        .offset(((input?.page || 1) - 1) * (input?.limit || 20));

      const totalResult = await db
        .select({ value: count() })
        .from(discussions);

      return {
        items,
        total: totalResult[0]?.value || 0,
      };
    }),

  // Get single discussion
  getById: publicQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      
      // Increment view count
      await db
        .update(discussions)
        .set({ viewCount: sql`${discussions.viewCount} + 1` })
        .where(eq(discussions.id, input.id));

      const result = await db
        .select()
        .from(discussions)
        .where(eq(discussions.id, input.id))
        .limit(1);

      const replies = await db
        .select()
        .from(discussionReplies)
        .where(eq(discussionReplies.discussionId, input.id))
        .orderBy(discussionReplies.createdAt);

      return {
        discussion: result[0] || null,
        replies,
      };
    }),

  // Create discussion
  create: authedQuery
    .input(
      z.object({
        title: z.string().min(1).max(255),
        content: z.string().min(1),
        tags: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const user = ctx.user;

      const result = await db.insert(discussions).values({
        ...input,
        userId: user.id,
        userName: user.name || "Anonymous",
        userAvatar: user.avatar || null,
      });

      return { id: Number(result[0].insertId) };
    }),

  // Add reply
  addReply: authedQuery
    .input(
      z.object({
        discussionId: z.number(),
        content: z.string().min(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const user = ctx.user;

      await db.insert(discussionReplies).values({
        discussionId: input.discussionId,
        userId: user.id,
        userName: user.name || "Anonymous",
        userAvatar: user.avatar || null,
        content: input.content,
      });

      // Update reply count
      await db
        .update(discussions)
        .set({ replyCount: sql`${discussions.replyCount} + 1` })
        .where(eq(discussions.id, input.discussionId));

      // Notify discussion owner (if not replying to own discussion)
      const [discussion] = await db
        .select()
        .from(discussions)
        .where(eq(discussions.id, input.discussionId))
        .limit(1);

      if (discussion && discussion.userId !== user.id) {
        await db.insert(notifications).values({
          userId: discussion.userId,
          type: "reply",
          title: `${user.name || "有人"} 回复了你的讨论`,
          content: input.content.slice(0, 100),
          link: `/discussion/${input.discussionId}`,
          actorName: user.name || "Anonymous",
          actorAvatar: user.avatar || null,
        });
      }

      return { success: true };
    }),

  // Delete discussion (owner or admin)
  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const user = ctx.user;

      const allowed = await canDeleteDiscussion(db, input.id, user.id, user.role);
      if (!allowed) {
        throw new Error("无权删除此讨论");
      }

      // Delete replies first
      await db.delete(discussionReplies).where(eq(discussionReplies.discussionId, input.id));
      // Delete discussion
      await db.delete(discussions).where(eq(discussions.id, input.id));

      return { success: true };
    }),

  // Delete reply (owner or admin)
  deleteReply: authedQuery
    .input(z.object({ replyId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const user = ctx.user;

      const [reply] = await db
        .select()
        .from(discussionReplies)
        .where(eq(discussionReplies.id, input.replyId))
        .limit(1);

      if (!reply) throw new Error("回复不存在");
      if (reply.userId !== user.id && user.role !== "admin") {
        throw new Error("无权删除此回复");
      }

      await db.delete(discussionReplies).where(eq(discussionReplies.id, input.replyId));

      // Decrement reply count
      await db
        .update(discussions)
        .set({ replyCount: sql`${discussions.replyCount} - 1` })
        .where(eq(discussions.id, reply.discussionId));

      return { success: true };
    }),
});
