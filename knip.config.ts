import type { KnipConfig } from "knip";

const config: KnipConfig = {
  entry: [
    "src/app/**/{page,layout,template,loading,error,global-error,not-found,route,sitemap,robots}.{ts,tsx}",
    "src/providers.tsx",
  ],
  project: ["src/**/*.{ts,tsx}"],
  // shadcn primitives ship with the full feature surface; we vendor them
  // intact and treat them as a library. Same goes for the husky hooks.
  ignore: [".husky/**", "src/components/ui/**"],
  ignoreDependencies: [
    "postcss",
    "tailwindcss",
    "lint-staged",
    // shadcn CLI is invoked via `pnpm dlx`, and `@import "shadcn/tailwind.css"`
    // in globals.css references the published package.
    "shadcn",
    // tw-animate-css is loaded via `@import "tw-animate-css"` in globals.css.
    "tw-animate-css",
  ],
  ignoreExportsUsedInFile: true,
};

export default config;
