"use client";

import Image from "next/image";
import { useTour } from "@/components/tour/useTour";
import { riseOrder } from "@/lib/motion";
import { useT } from "@/lib/useT";
import parachinar from "@/public/images/parachinar.jpg";

const PHOTO_PAGE = "https://commons.wikimedia.org/wiki/File:Parachinar_in_winter.jpg";

/**
 * The About page's opening: the place, the page title and the pitch, over a photograph of
 * Parachinar in winter (the season the 2024–25 closure ran through). A sign-green wash on the
 * text side keeps white text legible over the snow; the photo shows through on the far side.
 */
export function AboutHero() {
  const { t } = useT();
  const { start } = useTour();

  return (
    <header data-sign className="rise relative isolate min-h-112 overflow-hidden rounded-lg bg-sign text-on-sign" style={riseOrder(0)}>
      <Image
        src={parachinar}
        alt={t("about.photoAlt")}
        fill
        priority
        placeholder="blur"
        sizes="(min-width: 1024px) 75vw, 100vw"
        className="-z-20 object-cover object-[center_60%]"
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-sign/80 md:bg-transparent md:bg-linear-to-r md:from-sign md:via-sign/85 md:to-sign/10 md:rtl:bg-linear-to-l"
      />

      <div className="max-w-2xl px-6 pt-8 pb-16 md:px-8 md:pt-12">
        <p className="text-caption font-semibold tracking-wide text-signal uppercase">{t("about.eyebrow")}</p>
        <h1 id="about-title" className="mt-2 text-heading text-on-sign-muted">
          {t("about.title")}
        </h1>
        <p className="mt-3 font-display text-title font-semibold text-on-sign md:text-display">{t("app.pitch")}</p>
        <button
          type="button"
          data-tour-start
          onClick={start}
          className="mt-8 rounded-md bg-signal px-6 py-3 text-lead font-bold text-on-signal transition-colors hover:bg-on-sign"
        >
          {t("tour.start")}
        </button>
      </div>

      <p data-credit className="absolute end-3 bottom-2 rounded-sm bg-sign/80 px-2 text-caption text-on-sign-muted">
        <a href={PHOTO_PAGE} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 hover:text-on-sign">
          {t("about.photoCredit", { name: "Mujtaba Hassan" })}
        </a>
      </p>
    </header>
  );
}
