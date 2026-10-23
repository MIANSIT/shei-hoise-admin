/* eslint-disable @next/next/no-img-element */
// Plain <img> on purpose: this also renders inside the hidden PDF layouts that
// html2canvas captures, where a same-origin static file is the safest source.

interface BrandLogoProps {
  /** Rendered height in px. Width follows the logo's aspect ratio. */
  height?: number;
  className?: string;
}

export const BRAND_LOGO_SRC = "/logo_beta.png";

export function BrandLogo({ height = 40, className = "" }: BrandLogoProps) {
  return (
    <img
      src={BRAND_LOGO_SRC}
      alt="Shei Hoise"
      height={height}
      style={{ height, width: "auto" }}
      className={className}
      draggable={false}
    />
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
