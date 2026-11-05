import branding from '@/branding'

// Display examples only; existing templates and their Jinja tokens are untouched.
export function emailTemplateExamples() {
  return {
    subject: __('Payment reminder from {0} - (#{{ name }})', [
      branding.companyName,
    ]),
    html: __(
      '<p>Dear {{ lead_name }},</p>\n\n<p>This is a reminder for the payment of {{ grand_total }}.</p>\n\n<p>Thanks,</p>\n<p>{0}</p>',
      [branding.companyName]
    ),
    text: __(
      'Dear {{ lead_name }}, \n\nThis is a reminder for the payment of {{ grand_total }}. \n\nThanks, \n{0}',
      [branding.companyName]
    ),
  }
}
