import type { EmailTemplateProps } from "@/types/props";
import { Button, Heading, Text } from "react-email";
import EmailTemplateBase from "./EmailTemplateBase";

export function VerificationEmailTemplate(props: EmailTemplateProps) {
  const { url } = props;

  return (
    <EmailTemplateBase previewText="Confirm your email address to finish setting up your account.">
      <Text className="mb-3 mt-0 text-xs font-semibold tracking-[1.5px] text-[#71717a]">
        ACCOUNT VERIFICATION
      </Text>
      <Heading className="mb-4 mt-0 font-serif text-[32px] font-normal leading-[1.2] text-[#18181b]">
        You&apos;re almost there.
      </Heading>
      <Text className="mb-6 mt-0 text-[15px] leading-6 text-[#52525b]">
        Confirm your email address to finish setting up your account.
      </Text>
      <Button
        href={url}
        className="box-border rounded-lg border border-solid border-[#d4d4d8] bg-[#f4f4f5] px-5 py-3 text-center text-sm font-semibold leading-5 text-[#18181b] no-underline"
      >
        Verify your email&nbsp; &rarr;
      </Button>
      <Text className="mb-0 mt-8 border-0 border-t border-solid border-[#e4e4e7] pt-5 text-xs leading-5 text-[#71717a]">
        If you didn&apos;t create an account, you can safely ignore this email.
      </Text>
    </EmailTemplateBase>
  );
}
