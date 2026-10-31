import "server-only";

// Transactional e-mail through Resend's HTTP API. Configure RESEND_API_KEY and EMAIL_FROM
// (an address on a domain verified in Resend, e.g. "Maison Gravure <atelier@exemplu.ro>").

export const isEmailConfigured = () => Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);

export async function sendEmail({ to, subject, text, html }: { to: string; subject: string; text: string; html: string }) {
  if (!isEmailConfigured()) throw new Error("E-mail is not configured (RESEND_API_KEY / EMAIL_FROM).");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.EMAIL_FROM, to, subject, text, html }),
  });
  if (!response.ok) throw new Error(`Resend responded ${response.status}: ${await response.text()}`);
}

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);

export function passwordResetEmail(name: string, link: string) {
  const greeting = `Bună, ${name.split(" ")[0]}`;
  return {
    subject: "Setează o parolă nouă · Maison Gravure",
    text: `${greeting},\n\nAm primit o cerere de resetare a parolei pentru contul tău Maison Gravure. Deschide linkul de mai jos în următoarea oră ca să alegi o parolă nouă:\n\n${link}\n\nDacă nu ai cerut tu resetarea, ignoră acest mesaj: parola rămâne neschimbată.\n\nAtelierul Maison Gravure`,
    html: `<div style="font-family:Georgia,serif;color:#181818;max-width:520px;margin:auto;padding:24px">
<p style="letter-spacing:.24em;font-size:11px;text-transform:uppercase;color:#7e6332">Maison Gravure</p>
<p>${escapeHtml(greeting)},</p>
<p>Am primit o cerere de resetare a parolei pentru contul tău. Linkul este valabil o oră.</p>
<p><a href="${escapeHtml(link)}" style="display:inline-block;background:#1e352f;color:#f7f5f0;padding:12px 22px;text-decoration:none;letter-spacing:.12em;font-size:12px;text-transform:uppercase">Setează parola nouă</a></p>
<p style="color:#5d5a55;font-size:14px">Dacă nu ai cerut tu resetarea, ignoră acest mesaj: parola rămâne neschimbată.</p>
</div>`,
  };
}
