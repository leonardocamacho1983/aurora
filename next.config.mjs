import createNextIntlPlugin from "next-intl/plugin";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");
const projectRoot = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["127.0.0.1", "192.168.0.161", "192.168.0.219", "scottie-prenominal-archetypally.ngrok-free.dev"],
  turbopack: {
    root: projectRoot,
  },
};

export default withNextIntl(nextConfig);
