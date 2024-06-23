import { createTransport } from "nodemailer";
import { Resend } from "resend";
export async function sendEmail({
  to = "mahlawyua07@gmail.com",
  subject = "Confirmation Email",
  html = "<b>Confirmation Email</b>",
  attachments = [],
}) {
  try {
    const resend = new Resend(process.env.MESSAGING_API_KEY);
    await resend.emails.send({
      from: `"Bazar Market" <onboarding@resend.dev>`, // sender address
      to:"delivered@resend.dev",
      subject,
      html,
      attachments,
    });
    return true;
  } catch (err) {
    console.log(err);
    return false;
  }
}
