import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AROICON 2026 | Registration",
  description: "Register for the 46th Annual Conference of the Association of Radiation Oncologists of India, 3–6 December 2026 in Hyderabad.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
