import type { ReactElement } from "react";
import "server-only";
import { after } from "next/server";
import { render } from "react-email";
import { Resend } from "resend";

export function sendAuthEmail(to: string, subject: string, template: ReactElement) {
  after(async () => {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM_EMAIL;
    if (!apiKey || !from) {
      console.error("Auth email requires RESEND_API_KEY and RESEND_FROM_EMAIL.");
      return;
    }

    try {
      const { error } = await new Resend(apiKey).emails.send({
        from,
        to,
        subject,
        html: await render(template),
      });
      if (error) {
        console.error("Resend rejected an auth email.", {
          name: error.name,
          message: error.message,
          statusCode: error.statusCode,
        });
      }
    } catch {
      console.error("Auth email could not be rendered or sent.");
    }
  });
}
