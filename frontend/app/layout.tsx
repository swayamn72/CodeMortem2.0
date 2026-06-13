import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CodeMortem — Code or be Coded",
  description:
    "The ultimate 1v1 competitive programming arena. Queue up, get matched, and race to solve algorithmic challenges. Real-time duels with Glicko-2 rated matchmaking.",
  keywords: [
    "competitive programming",
    "1v1 coding",
    "algorithm battles",
    "code duels",
    "rating system",
    "online judge",
  ],
  openGraph: {
    title: "CodeMortem — Code or be Coded",
    description:
      "Real-time 1v1 competitive programming battles and interactive learning modules with ranked matchmaking.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="grid-bg" />
        {children}
      </body>
    </html>
  );
}
