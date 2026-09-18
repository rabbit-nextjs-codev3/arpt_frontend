import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n.ts");

const nextConfig: NextConfig = {
  images: {
    // Fichiers publics servis par MinIO (voir MINIO_PUBLIC_URL côté backend) —
    // localhost en dev local, IP LAN si le backend est accédé depuis le réseau.
    remotePatterns: [
      { protocol: "http", hostname: "localhost", port: "9000" },
      { protocol: "http", hostname: "10.5.9.85", port: "9000" },
      { protocol: "http", hostname: "localhost", port: "9010" },
      { protocol: "http", hostname: "10.5.9.85", port: "9010" },
    ],
    // Next 16 refuse par défaut de récupérer une image sur une IP privée
    // (protection anti-SSRF) — localhost/IP LAN sont nos propres MinIO de
    // dev, pas une entrée utilisateur, donc pas de risque ici.
    dangerouslyAllowLocalIP: true,
  },
};

export default withNextIntl(nextConfig);
