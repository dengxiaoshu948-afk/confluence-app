import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { notifications } from "@db/schema";
import { eq, desc, and, count } from "drizzle-orm";

export const notificationRouter = createRouter({
  // List my notifications
  list: authedQuery
    .query(async ({ ctx }) => {
      const db = getDb();
      return await db
        .select()
        .from(notifications)
        .where(eq(notifications.userId, ctx.user.id))
        .orderBy(desc(notifications.createdAt))
        .limit(50);
    }),

  // Get unread count
  unreadCount: authedQuery
    .query(async ({ ctx }) => {
      const db = getDb();
      const result = await db
        .select({ value: count() })
        .from(notifications)
        .where(
          and(
            eq(notifications.userId, ctx.user.id),
            eq(notifications.read, "0")
          )
        );
      return { count: result[0]?.value || 0 };
    }),

  // Mark as read
  markRead: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      await db
        .update(notifications)
        .set({ read: "1" })
        .where(
          and(
            eq(notifications.id, input.id),
            eq(notifications.userId, ctx.user.id)
          )
        );
      return { success: true };
    }),

  // Mark all as read
  markAllRead: authedQuery
    .mutation(async ({ ctx }) => {
      const db = getDb();
      await db
        .update(notifications)
        .set({ read: "1" })
        .where(eq(notifications.userId, ctx.user.id));
      return { success: true };
    }),
});
