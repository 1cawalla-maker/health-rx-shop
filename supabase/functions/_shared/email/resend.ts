import { Resend } from 'npm:resend@4.1.2'

type SendEmailArgs = {
  to: string | string[]
  subject: string
  html?: string
  text?: string
  replyTo?: string
  attachments?: Array<{
    filename: string
    content: string // base64
    contentType?: string
  }>
}

export function getEmailFrom(): string {
  const from = Deno.env.get('EMAIL_FROM')
  if (!from) throw new Error('Missing EMAIL_FROM')
  return from
}

export function getResendClient(): Resend {
  const apiKey = Deno.env.get('RESEND_API_KEY')
  if (!apiKey) throw new Error('Missing RESEND_API_KEY')
  return new Resend(apiKey)
}

export async function sendEmail(args: SendEmailArgs) {
  const resend = getResendClient()
  const from = getEmailFrom()

  const result = await resend.emails.send({
    from,
    to: args.to,
    subject: args.subject,
    html: args.html,
    text: args.text,
    replyTo: args.replyTo,
    attachments: args.attachments,
  })

  return result
}
