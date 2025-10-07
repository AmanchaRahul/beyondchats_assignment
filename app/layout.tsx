import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StudyMate AI",
  description: "Your intelligent study companion for revision",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
