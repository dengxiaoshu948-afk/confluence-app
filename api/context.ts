import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { authenticateRequest } from "./kimi/auth";
import { verifyLocalToken } from "./local-auth-router";
import { getDb } from "./queries/connection";
import { localUsers } from "@db/schema";
import { eq } from "drizzle-orm";

// Unified user type that works for both OAuth and local auth
export type UnifiedUser = {
  id: number;
  name: string | null;
  email: string | null;
  avatar: string | null;
  role: "user" | "admin";
  points: number;
  createdAt: Date;
  unionId?: string;
  username?: string;
  authType: "oauth" | "local";
};

export type TrpcContext = {
  req: Request;
  resHeaders: Headers;
  user?: UnifiedUser;
};

export async function createContext(
  opts: FetchCreateContextFnOptions,
): Promise<TrpcContext> {
  const ctx: TrpcContext = { req: opts.req, resHeaders: opts.resHeaders };

  // Try LOCAL auth FIRST (to avoid OAuth cookie interference when user switched accounts)
  try {
    const localToken = opts.req.headers.get("x-local-auth-token");
    if (localToken) {
      const userId = await verifyLocalToken(localToken);
      if (userId) {
        const db = getDb();
        const users = await db
          .select()
          .from(localUsers)
          .where(eq(localUsers.id, userId))
          .limit(1);

        if (users.length > 0) {
          const u = users[0];
          ctx.user = {
            id: u.id,
            name: u.name || u.username,
            email: u.email,
            avatar: u.avatar,
            role: u.role as "user" | "admin",
            points: u.points,
            createdAt: u.createdAt,
            username: u.username,
            authType: "local",
          };
          return ctx;
        }
      }
    }
  } catch {
    // Local auth failed, try OAuth
  }

  // Try OAuth (only if no local auth token present)
  try {
    const oauthUser = await authenticateRequest(opts.req.headers);
    if (oauthUser) {
      ctx.user = {
        ...oauthUser,
        authType: "oauth",
      };
      return ctx;
    }
  } catch {
    // OAuth failed
  }

  return ctx;
}
