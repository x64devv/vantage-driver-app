/** @type {import('next').NextConfig} */
const nextConfig = {
  // ⚠ Static export: no server, no route handlers, no next/image optimisation.
  //   The demo must run on a laptop with no network beyond the map tiles.
  output: 'export',
  // ⚠ /stop/[id] is a dynamic segment. It only exports because app/stop/[id]/page.tsx
  //   declares generateStaticParams over the eight stop ids — see the note there.
  trailingSlash: true,
  images: { unoptimized: true },
};
export default nextConfig;
