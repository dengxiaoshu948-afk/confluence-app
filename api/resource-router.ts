import { z } from "zod";
import { createRouter, publicQuery, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { resources, stars, comments, notifications } from "@db/schema";
import { eq, desc, like, and, sql, count } from "drizzle-orm";
import { addPoints } from "./points-router";

export const resourceRouter = createRouter({
  // List resources with filters
  list: publicQuery
    .input(
      z.object({
        type: z.string().optional(),
        category: z.string().optional(),
        search: z.string().optional(),
        sort: z.enum(["newest", "popular", "mostDownloaded"]).default("newest"),
        page: z.number().default(1),
        limit: z.number().default(20),
      }).optional()
    )
    .query(async ({ input }) => {
      const db = getDb();
      const filters = [];
      
      if (input?.type) {
        filters.push(eq(resources.type, input.type as "model" | "dataset" | "tool" | "doc" | "tutorial"));
      }
      if (input?.category) {
        filters.push(eq(resources.category, input.category));
      }
      if (input?.search) {
        filters.push(like(resources.title, `%${input.search}%`));
      }

      const where = filters.length > 0 ? and(...filters) : undefined;

      let orderBy;
      switch (input?.sort) {
        case "popular":
          orderBy = desc(resources.starCount);
          break;
        case "mostDownloaded":
          orderBy = desc(resources.downloadCount);
          break;
        default:
          orderBy = desc(resources.createdAt);
      }

      const items = await db
        .select()
        .from(resources)
        .where(where)
        .orderBy(orderBy)
        .limit(input?.limit || 20)
        .offset(((input?.page || 1) - 1) * (input?.limit || 20));

      const totalResult = await db
        .select({ value: count() })
        .from(resources)
        .where(where);

      return {
        items,
        total: totalResult[0]?.value || 0,
        page: input?.page || 1,
        limit: input?.limit || 20,
      };
    }),

  // Get single resource
  getById: publicQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const result = await db
        .select()
        .from(resources)
        .where(eq(resources.id, input.id))
        .limit(1);
      return result[0] || null;
    }),

  // Create resource
  create: authedQuery
    .input(
      z.object({
        title: z.string().min(1).max(255),
        description: z.string().optional(),
        type: z.enum(["model", "dataset", "tool", "doc", "tutorial", "code"]),
        category: z.string(),
        tags: z.string().optional(),
        fileUrl: z.string().optional(),
        fileSize: z.number().optional(),
        fileName: z.string().optional(),
        coverImage: z.string().optional(),
        isPublic: z.enum(["public", "private"]).default("public"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const user = ctx.user;

      const result = await db.insert(resources).values({
        ...input,
        authorId: user.id,
        authorName: user.name || "Anonymous",
        authorAvatar: user.avatar || null,
      });

      const resourceId = Number(result[0].insertId);

      // Add 1 point for uploading (sharing)
      await addPoints(
        user.id,
        "upload",
        1,
        resourceId,
        `上传资源「${input.title}」`
      );

      return { id: resourceId };
    }),

  // Increment download count
  incrementDownload: publicQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();

      // Get resource author first
      const [resource] = await db
        .select()
        .from(resources)
        .where(eq(resources.id, input.id))
        .limit(1);

      await db
        .update(resources)
        .set({ downloadCount: sql`${resources.downloadCount} + 1` })
        .where(eq(resources.id, input.id));

      // Add 1 point to author when their resource is downloaded
      if (resource) {
        await addPoints(
          resource.authorId,
          "download_received",
          1,
          input.id,
          `资源「${resource.title}」被下载`
        );
      }

      return { success: true };
    }),

  // Toggle star
  toggleStar: authedQuery
    .input(z.object({ resourceId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const userId = ctx.user.id;

      // Check if already starred
      const existing = await db
        .select()
        .from(stars)
        .where(and(eq(stars.resourceId, input.resourceId), eq(stars.userId, userId)))
        .limit(1);

      if (existing.length > 0) {
        // Unstar
        await db
          .delete(stars)
          .where(and(eq(stars.resourceId, input.resourceId), eq(stars.userId, userId)));
        
        await db
          .update(resources)
          .set({ starCount: sql`${resources.starCount} - 1` })
          .where(eq(resources.id, input.resourceId));

        return { starred: false };
      } else {
        // Star
        await db.insert(stars).values({
          resourceId: input.resourceId,
          userId,
        });

        await db
          .update(resources)
          .set({ starCount: sql`${resources.starCount} + 1` })
          .where(eq(resources.id, input.resourceId));

        // Notify resource owner and add points
        const [resource] = await db
          .select()
          .from(resources)
          .where(eq(resources.id, input.resourceId))
          .limit(1);

        if (resource && resource.authorId !== userId) {
          await db.insert(notifications).values({
            userId: resource.authorId,
            type: "star",
            title: `${ctx.user.name || "有人"} 收藏了你的资源`,
            content: resource.title,
            link: `/resource/${input.resourceId}`,
            actorName: ctx.user.name || "Anonymous",
            actorAvatar: ctx.user.avatar || null,
          });

          // Add 1 point to author when their resource is starred
          await addPoints(
            resource.authorId,
            "star_received",
            1,
            input.resourceId,
            `资源「${resource.title}」被收藏`
          );
        }

        return { starred: true };
      }
    }),

  // Check if user starred
  isStarred: publicQuery
    .input(z.object({ resourceId: z.number(), userId: z.number().optional() }))
    .query(async ({ input }) => {
      if (!input.userId) return { starred: false };
      const db = getDb();
      const existing = await db
        .select()
        .from(stars)
        .where(and(eq(stars.resourceId, input.resourceId), eq(stars.userId, input.userId)))
        .limit(1);
      return { starred: existing.length > 0 };
    }),

  // Get user's starred resources
  myStars: authedQuery
    .query(async ({ ctx }) => {
      const db = getDb();
      const userId = ctx.user.id;
      
      const starred = await db
        .select()
        .from(stars)
        .where(eq(stars.userId, userId));

      const resourceIds = starred.map((s) => s.resourceId);
      if (resourceIds.length === 0) return [];

      const items = await db
        .select()
        .from(resources)
        .where(sql`${resources.id} IN (${resourceIds.join(",")})`);

      return items;
    }),

  // Get comments for a resource
  getComments: publicQuery
    .input(z.object({ resourceId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      return await db
        .select()
        .from(comments)
        .where(eq(comments.resourceId, input.resourceId))
        .orderBy(comments.createdAt);
    }),

  // Add comment
  addComment: authedQuery
    .input(
      z.object({
        resourceId: z.number(),
        content: z.string().min(1),
        parentId: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const user = ctx.user;

      await db.insert(comments).values({
        resourceId: input.resourceId,
        userId: user.id,
        userName: user.name || "Anonymous",
        userAvatar: user.avatar || null,
        content: input.content,
        parentId: input.parentId || null,
      });

      // Notify resource owner (if not commenting on own resource)
      const [resource] = await db
        .select()
        .from(resources)
        .where(eq(resources.id, input.resourceId))
        .limit(1);

      if (resource && resource.authorId !== user.id) {
        await db.insert(notifications).values({
          userId: resource.authorId,
          type: "comment",
          title: `${user.name || "有人"} 评论了你的资源`,
          content: input.content.slice(0, 100),
          link: `/resource/${input.resourceId}`,
          actorName: user.name || "Anonymous",
          actorAvatar: user.avatar || null,
        });
      }

      return { success: true };
    }),

  // Get my uploads
  myUploads: authedQuery
    .query(async ({ ctx }) => {
      const db = getDb();
      return await db
        .select()
        .from(resources)
        .where(eq(resources.authorId, ctx.user.id))
        .orderBy(desc(resources.createdAt));
    }),

  // Delete resource (owner or admin)
  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const user = ctx.user;

      // Check ownership
      const [resource] = await db
        .select()
        .from(resources)
        .where(eq(resources.id, input.id))
        .limit(1);

      if (!resource) {
        throw new Error("资源不存在");
      }

      if (resource.authorId !== user.id && user.role !== "admin") {
        throw new Error("无权删除此资源");
      }

      // Delete related records first
      await db.delete(stars).where(eq(stars.resourceId, input.id));
      await db.delete(comments).where(eq(comments.resourceId, input.id));

      // Delete resource
      await db.delete(resources).where(eq(resources.id, input.id));

      return { success: true };
    }),
});
