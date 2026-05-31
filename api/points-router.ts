import { z } from "zod";
import { createRouter, publicQuery, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { users, pointRecords, shareRecords } from "@db/schema";
import { eq, desc, sql, and } from "drizzle-orm";

// Helper: add points to a user
async function addPoints(userId: number, action: "upload" | "download_received" | "star_received" | "share", points: number, resourceId?: number, description?: string) {
  const db = getDb();

  // Insert point record
  await db.insert(pointRecords).values({
    userId,
    action,
    points,
    resourceId: resourceId || null,
    description: description || null,
  });

  // Update user total points
  await db
    .update(users)
    .set({ points: sql`${users.points} + ${points}` })
    .where(eq(users.id, userId));
}

export { addPoints };

export const pointsRouter = createRouter({
  // Get leaderboard (contributor ranking)
  leaderboard: publicQuery
    .input(
      z.object({
        limit: z.number().default(10),
        period: z.enum(["all", "week", "month"]).default("all"),
      }).optional()
    )
    .query(async ({ input }) => {
      const db = getDb();
      const limit = input?.limit || 10;

      const topUsers = await db
        .select({
          id: users.id,
          name: users.name,
          avatar: users.avatar,
          points: users.points,
        })
        .from(users)
        .orderBy(desc(users.points))
        .limit(limit);

      return topUsers;
    }),

  // Get current user's point history
  myHistory: authedQuery
    .query(async ({ ctx }) => {
      const db = getDb();
      return await db
        .select()
        .from(pointRecords)
        .where(eq(pointRecords.userId, ctx.user.id))
        .orderBy(desc(pointRecords.createdAt))
        .limit(50);
    }),

  // Record a share and give points
  recordShare: authedQuery
    .input(z.object({ resourceId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const sharerId = ctx.user.id;

      // Check if already shared (prevent spam)
      const existing = await db
        .select()
        .from(shareRecords)
        .where(
          and(
            eq(shareRecords.resourceId, input.resourceId),
            eq(shareRecords.sharerId, sharerId)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        return { alreadyShared: true };
      }

      // Insert share record
      await db.insert(shareRecords).values({
        resourceId: input.resourceId,
        sharerId,
      });

      // Add points for sharing
      await addPoints(sharerId, "share", 1, input.resourceId, "分享资源");

      return { alreadyShared: false };
    }),
});
