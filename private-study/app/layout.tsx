import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Auditory Study",
  description: "Private auditory psychophysics participant dashboard"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
