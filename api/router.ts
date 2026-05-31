import { authRouter } from "./auth-router";
import { localAuthRouter } from "./local-auth-router";
import { resourceRouter } from "./resource-router";
import { discussionRouter } from "./discussion-router";
import { uploadRouter } from "./upload-router";
import { notificationRouter } from "./notification-router";
import { pointsRouter } from "./points-router";
import { followRouter } from "./follow-router";
import { createRouter, publicQuery } from "./middleware";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  localAuth: localAuthRouter,
  resource: resourceRouter,
  discussion: discussionRouter,
  upload: uploadRouter,
  notification: notificationRouter,
  points: pointsRouter,
  follow: followRouter,
});

export type AppRouter = typeof appRouter;
