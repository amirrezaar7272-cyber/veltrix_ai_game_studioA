/** @type {import('next').NextConfig} */
const isGitHubPages = process.env.GITHUB_PAGES === "true";
const basePath = isGitHubPages ? "/veltrix_ai_game_studioA" : "";
const nextConfig = {
  reactStrictMode: true,
  output: "export",
  basePath,
  assetPrefix: isGitHubPages ? basePath + "/" : undefined,
  trailingSlash: true,
  images: { unoptimized: true }
};
module.exports = nextConfig;
