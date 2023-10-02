import { createTransport } from "nodemailer";
export async function sendEmail({
  to = "mahlawyua07@gmail.com",
  subject = "Confirmation Email",
  html = "<b>Confirmation Email</b>",
  attachments = [],
}) {
  const transporter = createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.MESSAGING_EMAIL,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
    tls:{
          rejectUnauthorized:false
      }
    });
  // send mail with defined transport object
  const info = await transporter.sendMail({
    from: `"Saraha App" <${process.env.MESSAGING_EMAIL}>`, // sender address
    to, // list of receivers
    subject, // Subject line
    html, // html body
    attachments,
  });
  
  if (info.accepted.length) {
    return true
  }
  return false
}
