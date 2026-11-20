import type { Metadata } from "next";
import {
  Instrument_Serif,
  Instrument_Sans,
} from "next/font/google";
import Image from "next/image";
import "./globals.css";

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: ["400"]
});

const instrumentSans = Instrument_Sans({
  variable: "--font-instrument-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"]
});

export const metadata: Metadata = {
  title: "Manual Budget Planner",
  description: "Personalized financial planner",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${instrumentSerif.variable} ${instrumentSans.variable} antialiased`}
    >
      <body className="flex min-w-0 flex-col xl:h-dvh xl:overflow-hidden">
        <header className="shrink-0 bg-black">
          <div className="w-58">
            <Image
              alt="Cash Tally logo"
              src="/horizontal.svg"
              height={800}
              width={2011}
            />
          </div>
        </header>
        {children}
        <footer className="shrink-0 mt-auto h-10 w-full flex items-center justify-center text-white text-xs font-instrument-serif bg-neutral-950">
          <p>&copy; 2026 David Byron</p>
        </footer>
      </body>
    </html>
  );
}
