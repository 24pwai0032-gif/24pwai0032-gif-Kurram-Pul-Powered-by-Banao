import type { Metadata, Viewport } from "next";
import { Noto_Naskh_Arabic, Noto_Nastaliq_Urdu, Noto_Sans } from "next/font/google";
import { cookies } from "next/headers";
import { AppStoreProvider } from "@/components/AppStoreProvider";
import { INTRO_COOKIE } from "@/lib/about";
import { closureHistory, seedReports, verificationTags } from "@/lib/data";
import { DEFAULT_LOCALE, dirFor, isLocale, LOCALE_COOKIE, translate, type Locale } from "@/lib/i18n";
import "./globals.css";

// English. Drawn to match the Noto Arabic-script faces below, so mixed lines don't jump.
const notoSans = Noto_Sans({
  variable: "--font-noto-sans",
  subsets: ["latin"],
});

// Urdu and Pashto interface text.
const naskh = Noto_Naskh_Arabic({
  variable: "--font-naskh",
  subsets: ["arabic"],
});

// Urdu reading text (headings, About, AI answers). Large, so only fetched when used.
const nastaliq = Noto_Nastaliq_Urdu({
  variable: "--font-nastaliq",
  subsets: ["arabic"],
  preload: false,
});

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
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#1e2b27" },
    { media: "(prefers-color-scheme: dark)", color: "#0e1412" },
  ],
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // The language lives in a cookie so Urdu/Pashto render right-to-left from the first paint.
  const language = await savedLanguage();
  // First visit: open the "About this crisis" intro. Dismissing it sets the cookie.
  const showIntro = !(await cookies()).has(INTRO_COOKIE);

  return (
    <html
      lang={language}
      dir={dirFor(language)}
      className={`${notoSans.variable} ${naskh.variable} ${nastaliq.variable} h-full antialiased`}
    >
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
