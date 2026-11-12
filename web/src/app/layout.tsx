import "@fontsource-variable/urbanist";
import "@fontsource-variable/jost";
import "@fontsource-variable/inter";
import "@fontsource-variable/geist-mono";
import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Toaster } from "@/components/app/toaster";
import { motionFlagScript } from "@/components/motion/motion-flag";
import { MotionRoot } from "@/components/motion/motion-root";

export const metadata: Metadata = {
  title: "Kams · Snap your goods, AI shoppers buy them",
  description:
    "Kams turns a few phone photos into a store that AI shopping agents can find and pay for with PayPal, in about 60 seconds.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: motionFlagScript }} />
      </head>
      <body>
        {children}
        <Toaster />
        <MotionRoot />
      </body>
    </html>
  );
}
