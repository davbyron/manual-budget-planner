import type { EmailTemplateBaseProps } from "@/types/props";
import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
  Tailwind,
  pixelBasedPreset,
} from "react-email";

export default function EmailTemplateBase(props: EmailTemplateBaseProps) {
  const { previewText, children } = props;

  return (
    <Html lang="en">
      <Tailwind
        config={{
          presets: [pixelBasedPreset],
          theme: {
            extend: {
              // Email clients use system fallbacks when the app fonts are unavailable.
              fontFamily: {
                sans: ["Instrument Sans", "Arial", "Helvetica", "sans-serif"],
                serif: ["Instrument Serif", "Georgia", "Times New Roman", "serif"],
              },
            },
          },
        }}
      >
        <Head />
        <Preview>{previewText}</Preview>
        <Body className="m-0 bg-[#f4f4f5] px-3 py-8 font-sans text-[#18181b] sm:px-6 sm:py-12">
          <Container className="mx-auto w-full max-w-[560px] rounded-2xl border border-solid border-[#e4e4e7] bg-white">
            <Section className="rounded-t-2xl bg-[#0a0a0a] px-6 py-8 text-center">
              <Text className="m-0 font-serif text-[30px] font-normal leading-[1.2] text-white">
                Manual Budget Planner
              </Text>
            </Section>
            <Section className="px-6 py-8 sm:p-10">
              {children}
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
