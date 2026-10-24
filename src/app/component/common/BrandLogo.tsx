/* eslint-disable @next/next/no-img-element */
// Plain <img> on purpose: this also renders inside the hidden PDF layouts that
// html2canvas captures, where a same-origin static file is the safest source.

interface BrandLogoProps {
  /** Rendered height in px. Width follows the logo's aspect ratio. */
  height?: number;
  className?: string;
}

export const BRAND_LOGO_SRC = "/logo_beta.png";

// logo_beta.png is 408x612 but the mark itself only fills the box below; the
// rest is transparent padding. Crop to the mark so the logo renders at its
// real size instead of looking tiny.
const SRC_W = 408;
const SRC_H = 612;
const MARK = { x: 58, y: 71, w: 284, h: 446 };

export function BrandLogo({ height = 40, className = "" }: BrandLogoProps) {
  const k = height / MARK.h;
  return (
    <span
      className={className}
      role="img"
      aria-label="Shei Hoise"
      style={{
        display: "inline-block",
        position: "relative",
        overflow: "hidden",
        flexShrink: 0,
        height,
        width: MARK.w * k,
      }}
    >
      <img
        src={BRAND_LOGO_SRC}
        alt=""
        draggable={false}
        style={{
          position: "absolute",
          maxWidth: "none",
          width: SRC_W * k,
          height: SRC_H * k,
          left: -MARK.x * k,
          top: -MARK.y * k,
        }}
      />
    </span>
  );
}

/** Logo on a white rounded tile, for placing on coloured banners. */
export function BrandLogoTile({ height = 48 }: { height?: number }) {
  return (
    <div className="bg-white rounded-xl p-1.5 shrink-0 shadow-sm flex items-center justify-center">
      <BrandLogo height={height} />
    </div>
  );
}

/** Inline-styled tile for the hidden PDF layouts (they use inline styles only). */
export function BrandLogoPdfTile({ height = 56 }: { height?: number }) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 12,
        padding: 6,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <BrandLogo height={height} />
    </div>
  );
}
