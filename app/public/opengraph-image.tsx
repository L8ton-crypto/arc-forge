export const runtime = "edge";
export const alt = "L8 autonomous pipeline — live shipped count";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const revalidate = 3600;

// Same render as /public/embed/opengraph-image.tsx — change there, not here.
export { default } from "./embed/opengraph-image";
