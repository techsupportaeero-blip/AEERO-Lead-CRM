// Render's build cache was reusing a stale node_modules across deploys and
// not reliably installing @types/compression (a devDependency) even after
// it was added to package.json/package-lock.json - this ambient module
// declaration ships with our own source (not npm-installed), so the build
// never depends on that install timing again.
declare module 'compression' {
  import { RequestHandler } from 'express';
  function compression(options?: Record<string, unknown>): RequestHandler;
  export = compression;
}
