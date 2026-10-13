import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Désactivé volontairement : l'app est entièrement dynamique (données par
  // utilisateur). Le mode Cache Components imposerait des frontières Suspense
  // partout sans bénéfice ici.
  cacheComponents: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
