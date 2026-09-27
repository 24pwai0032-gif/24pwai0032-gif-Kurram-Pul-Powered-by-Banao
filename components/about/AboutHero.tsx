"use client";

import { riseOrder } from "@/lib/motion";
import { useT } from "@/lib/useT";

// Three ridgelines, far to near: the high Koh-e-Safed wall, the middle hills, the valley's
// foothills. Generated once from a fixed seed; abstract terrain, no motifs.
const FAR = "M0 190.8L9 195.3L19 192.6L28 194.7L38 188.4L47 192.7L56 190.5L66 191.9L75 183.8L84 187.5L94 185.1L103 185.8L113 179.4L122 182.5L131 178.2L141 179.5L150 170.9L159 177.9L169 177.4L178 179.3L188 173.7L197 174.6L206 168.9L216 166.7L225 157.7L234 161.2L244 159.0L253 159.5L263 155.2L272 156.4L281 154.5L291 152.1L300 145.9L309 147.5L319 143.8L328 143.6L338 139.2L347 136.4L356 131.6L366 128.3L375 124.1L384 122.9L394 122.2L403 121.0L413 117.7L422 117.9L431 117.5L441 114.5L450 112.2L459 110.4L469 109.7L478 109.1L488 109.4L497 109.7L506 109.7L516 109.0L525 108.2L534 105.2L544 103.1L553 101.9L563 103.8L572 97.5L581 97.7L591 96.0L600 102.0L609 88.5L619 85.4L628 79.0L638 85.1L647 71.3L656 74.9L666 69.5L675 84.1L684 67.5L694 69.0L703 61.8L713 76.0L722 63.6L731 70.0L741 71.2L750 90.3L759 71.6L769 70.3L778 64.9L788 73.9L797 65.3L806 69.6L816 68.1L825 79.2L834 67.4L844 70.9L853 66.0L863 79.9L872 73.3L881 83.6L891 85.1L900 107.3L909 81.1L919 78.7L928 66.2L938 79.0L947 57.0L956 63.8L966 59.4L975 83.8L984 61.1L994 65.6L1003 57.6L1013 75.6L1022 65.4L1031 79.4L1041 81.4L1050 106.1L1059 87.7L1069 88.7L1078 82.8L1088 97.2L1097 85.7L1106 93.4L1116 95.0L1125 115.7L1134 103.8L1144 109.5L1153 107.8L1163 121.9L1172 120.1L1181 128.8L1191 132.8L1200 145.5L1200 320L0 320Z";
const MID = "M0 223.6L19 224.4L38 226.5L56 228.0L75 228.5L94 229.6L113 230.4L131 231.2L150 230.4L169 230.9L188 232.2L206 234.1L225 236.5L244 239.0L263 242.1L281 243.5L300 246.6L319 244.6L338 243.2L356 241.4L375 239.0L394 239.1L413 239.0L431 237.3L450 236.3L469 237.0L488 238.7L506 238.6L525 238.1L544 238.1L563 239.7L581 240.0L600 240.4L619 238.4L638 238.1L656 235.9L675 235.2L694 232.5L713 231.5L731 229.5L750 228.3L769 227.0L788 224.5L806 225.0L825 224.2L844 224.9L863 223.8L881 223.8L900 224.7L919 227.3L938 228.6L956 230.4L975 231.0L994 232.7L1013 233.4L1031 235.1L1050 235.9L1069 236.4L1088 237.5L1106 236.1L1125 235.8L1144 236.7L1163 236.3L1181 236.8L1200 235.8L1200 320L0 320Z";
const NEAR = "M0 278.9L38 278.8L75 277.7L113 277.1L150 275.9L188 274.6L225 272.1L263 271.3L300 269.4L338 270.5L375 271.9L413 271.8L450 271.4L488 271.2L525 271.0L563 271.0L600 270.8L638 271.0L675 270.1L713 268.8L750 266.9L788 266.4L825 266.6L863 266.0L900 264.4L938 262.9L975 260.4L1013 259.2L1050 257.5L1088 256.4L1125 256.1L1163 255.3L1200 253.6L1200 320L0 320Z";

/**
 * The About page's opening: the place, the page title and the pitch, over layered mountain
 * silhouettes in the surface and border tones. Distant ridges are lighter and near ones darker,
 * fading into the page background, so the text above them always sits on a calm, dark sky.
 */
export function AboutHero() {
  const { t } = useT();

  return (
    <header className="rise relative isolate min-h-112 overflow-hidden rounded-lg border border-border bg-surface" style={riseOrder(0)}>
      <svg
        aria-hidden
        viewBox="0 0 1200 320"
        preserveAspectRatio="xMidYMax slice"
        className="absolute inset-x-0 bottom-0 -z-10 h-3/5 w-full rtl:-scale-x-100"
      >
        <path d={FAR} fill="var(--color-border)" stroke="var(--color-border-control)" strokeOpacity={0.35} />
        <path d={MID} fill="var(--color-surface-raised)" />
        <path d={NEAR} fill="var(--color-background)" />
      </svg>
      {/* Fades the foothills into the page, so the hero has no hard bottom edge. */}
      <div aria-hidden className="absolute inset-x-0 bottom-0 -z-10 h-1/3 bg-linear-to-t from-background to-transparent" />

      <div className="max-w-2xl px-6 pt-8 pb-16 md:px-8 md:pt-12">
        <p className="text-caption font-semibold tracking-wide text-text-secondary uppercase">{t("about.eyebrow")}</p>
        <h1 id="about-title" className="mt-2 text-heading text-text-primary">
          {t("about.title")}
        </h1>
        <p className="mt-4 font-display text-title text-text-primary md:text-heading">{t("app.pitch")}</p>
      </div>
    </header>
  );
}
