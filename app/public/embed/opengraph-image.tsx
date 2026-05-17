import { ImageResponse } from "next/og";
import { fetchFlatTasks, computeEmbedSummary } from "@/lib/public-data";

export const runtime = "edge";
export const alt = "L8 autonomous pipeline — live shipped count";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Short cache so LinkedIn previews refresh. Edge cache 60s.
export const revalidate = 60;

export default async function Image() {
  const flat = await fetchFlatTasks();
  const summary = flat ? computeEmbedSummary(flat) : null;

  const total = summary?.totalShipped ?? 0;
  const week = summary?.shippedThisWeek ?? 0;
  const building = summary?.activeBuilds ?? 0;
  const lastShip = summary?.lastShipDaysAgo;
  const lastShipLabel =
    lastShip === null || lastShip === undefined
      ? "no ships yet"
      : lastShip === 0
      ? "shipped today"
      : lastShip === 1
      ? "shipped 1 day ago"
      : lastShip < 30
      ? `shipped ${lastShip} days ago`
      : "shipped this month";

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "70px 80px",
          background: "linear-gradient(135deg, #0F172A 0%, #020617 100%)",
          color: "#FFFFFF",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 20,
              color: "#60A5FA",
              letterSpacing: 6,
              textTransform: "uppercase",
              fontWeight: 600,
              marginBottom: 24,
            }}
          >
            Autonomous overnight pipeline
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 24,
              fontSize: 180,
              fontWeight: 800,
              lineHeight: 1,
              color: "#FFFFFF",
            }}
          >
            {total}
            <div style={{ fontSize: 72, color: "#64748B", fontWeight: 600 }}>apps shipped</div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "flex", gap: 60, fontSize: 30, color: "#CBD5E1" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
              <span style={{ color: "#FFFFFF", fontSize: 44, fontWeight: 700 }}>{week}</span>
              <span style={{ color: "#94A3B8" }}>this week</span>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
              <span style={{ color: "#FFFFFF", fontSize: 44, fontWeight: 700 }}>{building}</span>
              <span style={{ color: "#94A3B8" }}>building now</span>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
              <span style={{ color: "#34D399", fontSize: 32, fontWeight: 600 }}>{lastShipLabel}</span>
            </div>
          </div>
          <div
            style={{
              fontSize: 22,
              color: "#475569",
              borderTop: "1px solid #1E293B",
              paddingTop: 18,
            }}
          >
            arc-forge-rho.vercel.app/public
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
