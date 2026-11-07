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
  title: "Financial Planner",
  description: "Personalized financial planner",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${instrumentSerif.variable} ${instrumentSans.variable} antialiased`}
    >
      <body className="flex flex-col">
        <header>
          <h1 className="w-full py-8 bg-neutral-950 text-white text-center text-6xl font-instrument-serif">
            Financial Planner
          </h1>
        </header>
        {children}
        <footer className="w-full py-8 text-center text-white font-instrument-serif bg-neutral-950">
          &copy; 2026 David Byron
        </footer>
      </body>
    </html>
  );
}
