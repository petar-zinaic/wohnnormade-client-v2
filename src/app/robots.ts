import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/landlord/", "/privacy-policy", "/terms-of-use"],
        disallow: [
          "/search",
          "/contribute",
          "/profile",
          "/communications",
          "/tenant/",
          "/tenant-preview",
          "/forgot-password",
          "/reset-password",
          "/login",
          "/register",
        ],
      },
    ],
    sitemap: "https://wohnnomade.com/sitemap.xml",
  };
}
