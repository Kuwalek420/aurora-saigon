import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.dirname(fileURLToPath(import.meta.url));
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { unoptimized: true },
  // the policy pages keep their existing routes; these are the other names they are known by
  async redirects() {
    return [
      { source: "/about-us", destination: "/about", permanent: true },
      { source: "/returns-policy", destination: "/shipping-returns", permanent: true },
      { source: "/warranty", destination: "/lifetime-warranty", permanent: true },
      { source: "/stone-policy", destination: "/gemstone-policy", permanent: true },
    ];
  },
  webpack(config) {
    config.resolve.alias["@"] = path.join(root, "src");
    return config;
  },
};
export default nextConfig;
