const { Resend } = require("resend");

const resendApiKey = process.env.RESEND_API_KEY;
const sender =
    process.env.SENDER_EMAIL ||
    process.env.FROM_EMAIL ||
    "info@grupo-mac.com.ar";
const frontendUrl = (
    process.env.FRONTEND_URL || "http://localhost:5173"
).replace(/\/$/, "");
const backendUrl = (process.env.BACKEND_URL || "").replace(/\/$/, "");

let resendClient = null;
if (resendApiKey) {
    try {
        resendClient = new Resend(resendApiKey);
    } catch (e) {
        console.warn("Resend client init failed:", e);
        resendClient = null;
    }
} else {
    console.warn(
        "RESEND_API_KEY not set — email sending will be logged only (dev mode)"
    );
}

function escapeHtml(str = "") {
    return String(str).replace(/[&<>"']/g, function (m) {
        return {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;",
        }[m];
    });
}

/**
 * Send verification email using Resend (if configured) or log the verification link.
 * The frontend VerifyEmail page expects token as query param -> /verify-email?token=...
 *
 * @param {string} email - recipient email
 * @param {string} token - verification token
 * @param {string} name - recipient name (optional)
 */
async function sendVerificationEmail(email, token, name = "") {
    const safeName = escapeHtml(name || "");
    const verifyFrontendUrl = `${frontendUrl}/verify-email?token=${encodeURIComponent(
        token
    )}`;
    const verifyBackendUrl = backendUrl
        ? `${backendUrl}/api/auth/verify-email/${encodeURIComponent(token)}`
        : "";

    const subject = "Verificá tu correo electrónico — Gimed";

    const html = `
    <div style="font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial; color:#111;">
      <h2 style="color:#0f172a">Bienvenido${
          safeName ? `, ${safeName}` : ""
      } a Gimed</h2>
      <p>Gracias por registrarte. Para activar tu cuenta hacé clic en el botón de abajo:</p>
      <p style="margin:18px 0;">
        <a href="${verifyFrontendUrl}" style="background:#2563eb;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;display:inline-block;">
          Verificar correo
        </a>
      </p>
      <p style="color:#6b7280;font-size:13px">
        Si el botón no funciona, podés pegar esta URL en tu navegador:
        <br /><a href="${verifyFrontendUrl}" style="color:#2563eb">${verifyFrontendUrl}</a>
      </p>
      ${
          verifyBackendUrl
              ? `<p style="color:#6b7280;font-size:12px">(Enlace alternativo del backend: <a href="${verifyBackendUrl}" style="color:#2563eb">${verifyBackendUrl}</a>)</p>`
              : ""
      }
      <hr style="border:none;border-top:1px solid #e6e9ee;margin:18px 0" />
      <p style="color:#6b7280;font-size:12px">Si no te registraste en Gimed, ignorá este correo.</p>
    </div>
  `;

    const text = `Bienvenido${
        name ? `, ${name}` : ""
    } a Gimed.\nVerificá tu cuenta: ${verifyFrontendUrl}\n\nSi no te registraste, ignorá este correo.`;

    try {
        if (resendClient) {
            const resp = await resendClient.emails.send({
                from: sender,
                to: email,
                subject,
                html,
                text,
            });
            console.info("Verification email sent via Resend to", email);
            return resp;
        } else {
            // Dev fallback: log link so dev can copy/paste
            console.log("\n=== VERIFICATION EMAIL (dev mode) ===");
            console.log("To:", email);
            console.log("Subject:", subject);
            console.log("Frontend URL:", verifyFrontendUrl);
            if (verifyBackendUrl) console.log("Backend URL:", verifyBackendUrl);
            console.log("====================================\n");
            return {
                success: true,
                message: "Verification link logged (dev mode)",
                verifyFrontendUrl,
            };
        }
    } catch (err) {
        console.error("sendVerificationEmail error:", err);
        throw err;
    }
}


/**
 * Send a generic notification email.
 * Used to notify a doctor that patient confirmed.
 */
async function sendNotificationEmail(toEmail, subject, html, text) {
  try {
    if (resendClient) {
      const resp = await resendClient.emails.send({
        from: sender,
        to: toEmail,
        subject,
        html,
        text,
      });
      console.info("Notification email sent via Resend to", toEmail);
      return resp;
    } else {
      console.log("\n=== NOTIFICATION EMAIL (dev mode) ===");
      console.log("To:", toEmail);
      console.log("Subject:", subject);
      if (text) console.log("Text:", text);
      console.log("HTML preview:", html);
      console.log("====================================\n");
      return { success: true, message: "Notification logged (dev mode)" };
    }
  } catch (err) {
    console.error("sendNotificationEmail error:", err);
    throw err;
  }
}

module.exports = {
    sendVerificationEmail,
    sendNotificationEmail,
};
