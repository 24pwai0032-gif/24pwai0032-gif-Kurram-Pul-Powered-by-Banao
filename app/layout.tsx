import type { Metadata, Viewport } from "next";
import { Fraunces, Inter, Noto_Nastaliq_Urdu, Noto_Sans_Arabic } from "next/font/google";
import { cookies } from "next/headers";
import type { CSSProperties } from "react";
import { AppStoreProvider } from "@/components/AppStoreProvider";
import { INTRO_COOKIE } from "@/lib/about";
import { closureHistory, seedReports, verificationTags } from "@/lib/data";
import { DEFAULT_LOCALE, dirFor, isLocale, LOCALE_COOKIE, translate, type Locale } from "@/lib/i18n";
import "./globals.css";

// The faces behind the --font-* tokens in design-tokens.css.

// Headings, area names and stat figures. The optical-size axis keeps large figures crisp.
const fraunces = Fraunces({ subsets: ["latin"], axes: ["opsz"] });

// All data, labels, buttons and body copy.
const inter = Inter({ subsets: ["latin"] });

// Urdu, in real Nastaliq. Large, so it's fetched only when a page uses it, not preloaded.
const nastaliq = Noto_Nastaliq_Urdu({ subsets: ["arabic"], preload: false });

// Pashto (upright, as Pashto is normally printed), and the fallback if Nastaliq fails to load.
const arabicSans = Noto_Sans_Arabic({ subsets: ["arabic"], preload: false });

/**
 * A next/font family without its generated fallback face. That fallback is Arial or Times under
 * another name, and both carry Arabic letters, so Urdu and Pashto would render in it instead of
 * falling through to Nastaliq or Noto Sans Arabic further down the stack.
 */
const family = (font: { style: { fontFamily: string } }) => font.style.fontFamily.split(",")[0].trim();

const FONT_FACES = {
  "--font-fraunces-face": family(fraunces),
  "--font-inter-face": family(inter),
  "--font-nastaliq-face": family(nastaliq),
  "--font-arabic-sans-face": family(arabicSans),
} as CSSProperties;

async function savedLanguage(): Promise<Locale> {
  const saved = (await cookies()).get(LOCALE_COOKIE)?.value;
  return isLocale(saved) ? saved : DEFAULT_LOCALE;
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: translate(await savedLanguage(), "app.name"),
    description:
      "When the road to Parachinar closes, Kurram Pul tells responders who needs what, how urgently, who can help nearby, and how soon it might happen again.",
  };
}

export const viewport: Viewport = {
  // The browser chrome can't read CSS variables, so this repeats --color-background from design-tokens.css.
  themeColor: "#16181b", // token-audit: allow
  colorScheme: "dark",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // The language lives in a cookie so Urdu/Pashto render right-to-left from the first paint.
  const language = await savedLanguage();
  // First visit: open the "About this crisis" intro. Dismissing it sets the cookie.
  const showIntro = !(await cookies()).has(INTRO_COOKIE);

  return (
    <html lang={language} dir={dirFor(language)} style={FONT_FACES} className="h-full antialiased">
      <body className="min-h-full">
        <AppStoreProvider
          language={language}
          showIntro={showIntro}
          seed={seedReports}
          verificationTags={verificationTags}
          closureHistory={closureHistory}
        >
          {children}
        </AppStoreProvider>
      </body>
    </html>
  );
}
