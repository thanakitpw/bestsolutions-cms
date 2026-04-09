import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

// Fire-and-forget — ไม่ await ใน caller (ใช้ void sendLineNotify(...))
export async function sendLineNotify(token: string, message: string): Promise<void> {
  try {
    const response = await fetch('https://notify-api.line.me/api/notify', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ message }),
    })
    if (!response.ok) {
      console.error('[LINE Notify] Failed:', response.status, await response.text())
    }
  } catch (err) {
    console.error('[LINE Notify] Error:', err)
    // ไม่ re-throw — notification ล้มเหลวไม่กระทบ main flow
  }
}

export async function sendEmail(options: {
  to: string
  subject: string
  html: string
}): Promise<void> {
  try {
    const { error } = await resend.emails.send({
      from: 'noreply@bestsolutions.co.th',
      to: options.to,
      subject: options.subject,
      html: options.html,
    })
    if (error) {
      console.error('[Resend] Failed:', error)
    }
  } catch (err) {
    console.error('[Resend] Error:', err)
    // ไม่ re-throw — email ล้มเหลวไม่กระทบ main flow
  }
}
