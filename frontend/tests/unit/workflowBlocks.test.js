import { describe, expect, it, vi } from 'vitest'

// workflowCapabilities reaches frappe-ui's resource plugin, which the node test env cannot load.
vi.mock(
  '../../src/components/Settings/WorkflowAutomations/workflowCapabilities',
  () => ({ capabilitiesFor: () => ({ actions: [] }) })
)

import {
  blockGroups,
  groupActionsByApp,
} from '../../src/components/Settings/WorkflowAutomations/workflowBlocks'
import { newStep } from '../../src/components/Settings/WorkflowAutomations/workflowSteps'

const block = (value) =>
  blockGroups('CRM Lead')
    .flatMap((group) => group.options)
    .find((option) => option.value === value)

describe('wait blocks carry the unit they display', () => {
  it('saves a wait-for-event step with the Days it shows by default', () => {
    const step = newStep(block('WaitForEvent').values)

    expect(JSON.parse(step.params).timeout_unit).toBe('Days')
  })

  it('saves a wait step with the Minutes it shows by default', () => {
    const step = newStep(block('Wait').values)

    expect(JSON.parse(step.params).unit).toBe('Minutes')
  })
})

describe('workflow app presentation preserves technical action identities', () => {
  it('uses centralized ReyBill names while preserving native app IDs and action data', () => {
    const actions = [
      {
        app: 'frappe',
        app_title: 'Frappe Framework',
        action_type: 'SendEmail',
      },
      { app: 'crm', app_title: 'Frappe CRM', action_type: 'CreateDeal' },
      {
        app: 'erpnext',
        app_title: 'ERPNext',
        action_type: 'CreateQuotation',
        permission: 'write',
      },
      { app: 'custom_app', app_title: 'Customer App', action_type: 'Custom' },
    ]
    const groups = groupActionsByApp(actions, (action) => action)
    expect(groups.map((group) => group.group)).toEqual([
      'ReyBill',
      'ReyBill CRM',
      'ReyBill ERP',
      'Customer App',
    ])
    expect(groups.flatMap((group) => group.options)).toEqual(actions)
    expect(groups[2].options[0]).toBe(actions[2])
  })
})
