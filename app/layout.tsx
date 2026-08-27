import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { APP_NAME, APP_TAGLINE } from "@/lib/brand";
import { AuthProvider } from "@/lib/auth-store";
import { PlantProvider } from "@/lib/plant-store";
import { AppShell } from "@/components/app-shell";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf9f7" },
    { media: "(prefers-color-scheme: dark)", color: "#14181b" },
  ],
};

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
  applicationName: "SAGE",
  appleWebApp: { capable: true, title: "SAGE", statusBarStyle: "default" },
  formatDetection: { telephone: false },
  manifest: "/manifest.webmanifest",
  icons: { icon: [{ url: "/sage-mark.svg", type: "image/svg+xml" }], apple: [{ url: "/sage-mark.svg", type: "image/svg+xml" }], shortcut: "/sage-mark.svg" },
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