import branding from '@/branding'

// Display examples only; existing templates and their Jinja tokens are untouched.
export function emailTemplateExamples(translate = __) {
  return {
    subject: translate('Payment reminder from {0} - (#{{ name }})', [
      branding.companyName,
    ]),
    html: translate(
      '<p>Dear {{ lead_name }},</p>\\n\\n<p>This is a reminder for the payment of {{ grand_total }}.</p>\\n\\n<p>Thanks,</p>\\n<p>{0}</p>',
      [branding.companyName]
    ),
    text: translate(
      'Dear {{ lead_name }}, \\n\\nThis is a reminder for the payment of {{ grand_total }}. \\n\\nThanks, \\n{0}',
      [branding.companyName]
    ),
  }
}
