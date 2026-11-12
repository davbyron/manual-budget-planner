import type { Metadata } from "next";
import {
  Instrument_Serif,
  Instrument_Sans,
} from "next/font/google";
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
      <body className="flex min-h-dvh min-w-0 flex-col">
        <header>
          <h1
            className="
              px-4 py-6 w-full text-3xl text-white font-instrument-serif bg-neutral-950
              sm:py-8 sm:text-5xl
              lg:text-6xl lg:text-center
            "
          >
            Manual Budget Planner
          </h1>
        </header>
        {children}
        <footer className="mt-auto w-full px-4 py-6 text-center text-white font-instrument-serif bg-neutral-950">
          &copy; 2026 David Byron
        </footer>
      </body>
    </html>
  );
}
