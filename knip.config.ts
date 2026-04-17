import type { KnipConfig } from "knip";

const config: KnipConfig = {
  entry: [
    "src/app/**/{page,layout,template,loading,error,global-error,not-found,route}.{ts,tsx}",
    "src/providers.tsx",
  ],
  project: ["src/**/*.{ts,tsx}"],
  ignore: [".husky/**"],
  ignoreDependencies: ["postcss", "tailwindcss", "lint-staged"],
};

export default config;
