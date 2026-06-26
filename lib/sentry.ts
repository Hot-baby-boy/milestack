import * as Sentry from "@sentry/node";

if (!Sentry.isInitialized()) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 0.1,
  });
}

export { Sentry };
