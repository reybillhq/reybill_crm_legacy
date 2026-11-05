import { describe, expect, it } from 'vitest'
import { emailTemplateExamples } from '../../src/utils/emailTemplateExamples'
import branding from '../../src/branding'

describe('email template display examples', () => {
  it('uses the official company while preserving editable Jinja placeholders', () => {
    const examples = emailTemplateExamples((key, values) =>
      key.replace('{0}', values[0])
    )
    for (const text of Object.values(examples)) {
      expect(text).toContain(branding.companyName)
      expect(text).not.toMatch(/Frapp[eé]|ERPNext|ReyBill Sales/)
    }
    expect(examples.subject).toContain('{{ name }}')
    expect(examples.html).toContain('{{ lead_name }}')
    expect(examples.html).toContain('{{ grand_total }}')
    expect(examples.text).toContain('{{ grand_total }}')
  })
})
