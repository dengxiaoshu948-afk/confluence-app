import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { localUsers } from "@db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import * as jose from "jose";
import { env } from "./lib/env";

const JWT_ALG = "HS256";

async function signLocalToken(userId: number): Promise<string> {
  const secret = new TextEncoder().encode(env.appSecret);
  return new jose.SignJWT({ localUserId: userId, type: "local" })
    .setProtectedHeader({ alg: JWT_ALG })
    .setIssuedAt()
    .setExpirationTime("1 year")
    .sign(secret);
}

export async function verifyLocalToken(token: string): Promise<number | null> {
  if (!token) return null;
  try {
    const secret = new TextEncoder().encode(env.appSecret);
    const { payload } = await jose.jwtVerify(token, secret, {
      algorithms: [JWT_ALG],
      clockTolerance: 60,
    });
    if (payload.type !== "local" || !payload.localUserId) return null;
    return payload.localUserId as number;
  } catch {
    return null;
  }
}

export const localAuthRouter = createRouter({
  register: publicQuery
    .input(
      z.object({
        username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/, "用户名只能包含字母、数字和下划线"),
        password: z.string().min(6).max(100),
        name: z.string().min(1).max(50).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();

      // Check if username exists
      const existing = await db
        .select()
        .from(localUsers)
        .where(eq(localUsers.username, input.username))
        .limit(1);

      if (existing.length > 0) {
        throw new Error("用户名已被注册");
      }

      const passwordHash = await bcrypt.hash(input.password, 10);

      const result = await db.insert(localUsers).values({
        username: input.username,
        passwordHash,
        name: input.name || input.username,
      });

      const userId = Number(result[0].insertId);
      const token = await signLocalToken(userId);

      return { token, userId };
    }),

  login: publicQuery
    .input(
      z.object({
        username: z.string(),
        password: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();

      const users = await db
        .select()
        .from(localUsers)
        .where(eq(localUsers.username, input.username))
        .limit(1);

      if (users.length === 0) {
        throw new Error("用户名或密码错误");
      }

      const user = users[0];
      const valid = await bcrypt.compare(input.password, user.passwordHash);
      if (!valid) {
        throw new Error("用户名或密码错误");
      }

      const token = await signLocalToken(user.id);

      return {
        token,
        user: {
          id: user.id,
          name: user.name || user.username,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
          role: user.role,
          points: user.points,
          createdAt: user.createdAt,
        },
      };
    }),

  me: publicQuery.query(async ({ ctx }) => {
    const header = ctx.req.headers.get("x-local-auth-token");
    if (!header) return null;

    const userId = await verifyLocalToken(header);
    if (!userId) return null;

    const db = getDb();
    const users = await db
      .select()
      .from(localUsers)
      .where(eq(localUsers.id, userId))
      .limit(1);

    if (users.length === 0) return null;

    const user = users[0];
    return {
      id: user.id,
      name: user.name || user.username,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
      points: user.points,
      createdAt: user.createdAt,
    };
  }),

  updateProfile: publicQuery
    .input(
      z.object({
        name: z.string().min(1).max(50).optional(),
        email: z.string().email().optional().or(z.literal("")),
        avatar: z.string().url().optional().or(z.literal("")),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const header = ctx.req.headers.get("x-local-auth-token");
      if (!header) throw new Error("未登录");

      const userId = await verifyLocalToken(header);
      if (!userId) throw new Error("无效的认证");

      const db = getDb();
      const updateData: Record<string, unknown> = {};
      if (input.name !== undefined) updateData.name = input.name || null;
      if (input.email !== undefined) updateData.email = input.email || null;
      if (input.avatar !== undefined) updateData.avatar = input.avatar || null;

      await db
        .update(localUsers)
        .set(updateData)
        .where(eq(localUsers.id, userId));

      return { success: true };
    }),
});
