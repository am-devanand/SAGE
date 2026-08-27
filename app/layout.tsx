import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { APP_NAME, APP_TAGLINE } from "@/lib/brand";
import { AuthProvider } from "@/lib/auth-store";
import { PlantProvider } from "@/lib/plant-store";
import { AppShell } from "@/components/app-shell";

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: `${APP_NAME} — ${APP_TAGLINE}`,
  description:
    "Industrial sustainability decision engine: carbon scorecard, peer benchmark, action optimizer, what-if simulator and action plan for Indian MSME factories.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${plexSans.variable} ${plexMono.variable} antialiased`}
      >
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <AuthProvider>
            <PlantProvider>
              <AppShell>{children}</AppShell>
            </PlantProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}