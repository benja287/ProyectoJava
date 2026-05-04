type SendEmailInput = {
  toEmail: string;
  toName?: string;
  subject: string;
  /**
   * Cuerpo en texto plano (siempre legible). Poné este campo en EmailJS como `{{message}}`.
   */
  message: string;
  /**
   * Opcional: HTML bonito. En EmailJS, en un bloque de contenido **HTML**, usá algo como `{{{message_html}}}`
   * (triple llave si tu plantilla es Handlebars) o solo `{{message_html}}` si no escapa HTML.
   * Si la plantilla es solo texto, ignorá este campo y usá bien `{{message}}` con texto plano.
   */
  messageHtml?: string;
};

type SendEmailResult = {
  sent: boolean;
  reason?: string;
};

/**
 * Envía correo real mediante EmailJS si hay credenciales configuradas.
 * Requiere:
 * - VITE_EMAILJS_SERVICE_ID
 * - VITE_EMAILJS_TEMPLATE_ID
 * - VITE_EMAILJS_PUBLIC_KEY
 *
 * **Plantilla en emailjs.com:** borrá el texto de ejemplo en inglés ("A message … has been received").
 * Solo HTML en `message` si no mandás `messageHtml` muestra etiquetas feas en el cliente: usá texto en `message`
 * y, si querés diseño HTML, repetí contenido en `message_html` y referenciá ese campo en contenido tipo HTML.
 */
export async function sendTransactionalEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
  const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
  const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

  if (!serviceId || !templateId || !publicKey) {
    return { sent: false, reason: 'email_not_configured' };
  }

  try {
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        service_id: serviceId,
        template_id: templateId,
        user_id: publicKey,
        template_params: {
          to_email: input.toEmail,
          to_name: input.toName || '',
          subject: input.subject,
          message: input.message,
          ...(input.messageHtml ? { message_html: input.messageHtml } : {}),
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { sent: false, reason: `email_api_error:${errorText}` };
    }

    return { sent: true };
  } catch (error) {
    return {
      sent: false,
      reason: error instanceof Error ? error.message : 'unknown_email_error',
    };
  }
}
