import { z } from "zod";
import { createRouter, publicQuery, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { follows, users } from "@db/schema";
import { eq, and, count, desc } from "drizzle-orm";

export const followRouter = createRouter({
  // Follow a user
  follow: authedQuery
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      if (input.userId === ctx.user.id) {
        throw new Error("不能关注自己");
      }

      // Check if already following
      const existing = await db
        .select()
        .from(follows)
        .where(
          and(
            eq(follows.followerId, ctx.user.id),
            eq(follows.followingId, input.userId)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        throw new Error("已关注该用户");
      }

      await db.insert(follows).values({
        followerId: ctx.user.id,
        followingId: input.userId,
      });

      return { success: true };
    }),

  // Unfollow a user
  unfollow: authedQuery
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      await db
        .delete(follows)
        .where(
          and(
            eq(follows.followerId, ctx.user.id),
            eq(follows.followingId, input.userId)
          )
        );
      return { success: true };
    }),

  // Check if following
  isFollowing: authedQuery
    .input(z.object({ userId: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = getDb();
      const result = await db
        .select()
        .from(follows)
        .where(
          and(
            eq(follows.followerId, ctx.user.id),
            eq(follows.followingId, input.userId)
          )
        )
        .limit(1);
      return { following: result.length > 0 };
    }),

  // Get followers list
  followers: publicQuery
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const result = await db
        .select({
          id: users.id,
          name: users.name,
          avatar: users.avatar,
          createdAt: follows.createdAt,
        })
        .from(follows)
        .innerJoin(users, eq(follows.followerId, users.id))
        .where(eq(follows.followingId, input.userId))
        .orderBy(desc(follows.createdAt));
      return result;
    }),

  // Get following list
  following: publicQuery
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const result = await db
        .select({
          id: users.id,
          name: users.name,
          avatar: users.avatar,
          createdAt: follows.createdAt,
        })
        .from(follows)
        .innerJoin(users, eq(follows.followingId, users.id))
        .where(eq(follows.followerId, input.userId))
        .orderBy(desc(follows.createdAt));
      return result;
    }),

  // Get follow counts
  counts: publicQuery
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const [followersResult] = await db
        .select({ count: count() })
        .from(follows)
        .where(eq(follows.followingId, input.userId));
      const [followingResult] = await db
        .select({ count: count() })
        .from(follows)
        .where(eq(follows.followerId, input.userId));
      return {
        followers: followersResult.count,
        following: followingResult.count,
      };
    }),
});
