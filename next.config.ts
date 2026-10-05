import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    qualities: [75, 80, 85, 90, 95, 100],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
      },
      {
        protocol: "https",
        hostname: "**.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/descargar/usuario',
        destination: 'https://firebasestorage.googleapis.com/v0/b/mvp-travelapp.firebasestorage.app/o/apks%2Ftravelapp-usuario.apk?alt=media&token=2fc98030-d553-49c9-a12d-0f9a5f5294ab',
        permanent: false,
      },
      {
        source: '/descargar/conductor',
        destination: 'https://firebasestorage.googleapis.com/v0/b/mvp-travelapp.firebasestorage.app/o/apks%2Ftravelapp-conductor.apk?alt=media&token=ee0a9df0-ad5e-4091-86d0-b4aecb7df61a',
        permanent: false,
      },
      {
        source: '/descargar/supervisor',
        destination: 'https://firebasestorage.googleapis.com/v0/b/mvp-travelapp.firebasestorage.app/o/apks%2Ftravelapp-supervisor.apk?alt=media&token=0b7633dc-c6ec-448c-b1cd-9fc5167468fa',
        permanent: false,
      },
      {
        source: '/apk/usuario',
        destination: 'https://firebasestorage.googleapis.com/v0/b/mvp-travelapp.firebasestorage.app/o/apks%2Ftravelapp-usuario.apk?alt=media&token=2fc98030-d553-49c9-a12d-0f9a5f5294ab',
        permanent: false,
      },
      {
        source: '/apk/conductor',
        destination: 'https://firebasestorage.googleapis.com/v0/b/mvp-travelapp.firebasestorage.app/o/apks%2Ftravelapp-conductor.apk?alt=media&token=ee0a9df0-ad5e-4091-86d0-b4aecb7df61a',
        permanent: false,
      },
      {
        source: '/apk/supervisor',
        destination: 'https://firebasestorage.googleapis.com/v0/b/mvp-travelapp.firebasestorage.app/o/apks%2Ftravelapp-supervisor.apk?alt=media&token=0b7633dc-c6ec-448c-b1cd-9fc5167468fa',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
