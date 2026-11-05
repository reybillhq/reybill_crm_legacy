import { afterEach, describe, expect, it } from 'vitest'
import { createApp, h, nextTick, ref } from 'vue'
import path from 'node:path'
import feather from 'feather-icons'
import FeatherIcon from '../../compat/FeatherIcon.vue'
import { frameworkUiCompatibility } from '../../compat/framework-ui-plugin.js'

const frameworkRoot = '/bench/apps/frappe/ui/src'
const compatibilityEntry =
  '/bench/apps/crm/frontend/compat/framework-frappe-ui.js'

describe('frozen Framework UI compatibility boundary', () => {
  const plugin = frameworkUiCompatibility(frameworkRoot, compatibilityEntry)
  const resolveId = plugin.resolveId.handler

  it('adapts only bare frappe-ui imports from linked Framework source', () => {
    expect(
      resolveId(
        'frappe-ui',
        `${frameworkRoot}/components/Onboarding/HelpModal.vue?vue&type=script`,
      ),
    ).toBe(compatibilityEntry)
  })

  it('preserves CRM and package imports, including the facade itself', () => {
    for (const importer of [
      '/bench/apps/crm/frontend/src/main.js',
      '/bench/apps/crm/frontend/node_modules/frappe-ui/src/index.ts',
      compatibilityEntry,
      undefined,
    ]) {
      expect(resolveId('frappe-ui', importer)).toBeNull()
    }
  })

  it('does not intercept frappe-ui subpaths or unrelated modules', () => {
    for (const source of ['frappe-ui/icons', 'frappe-ui/experimental', 'vue']) {
      expect(plugin.resolveId.filter.id.test(source)).toBe(false)
      expect(resolveId(source, `${frameworkRoot}/test.ts`)).toBeNull()
    }
  })

  it('does not match sibling paths with the same prefix', () => {
    expect(resolveId('frappe-ui', `${frameworkRoot}-other/test.ts`)).toBeNull()
    expect(resolveId('frappe-ui', path.dirname(frameworkRoot))).toBeNull()
  })
})

describe('original FeatherIcon rendering contract', () => {
  let app
  let host

  afterEach(() => {
    app?.unmount()
    host?.remove()
  })

  function mount(props) {
    host = document.createElement('div')
    document.body.append(host)
    app = createApp(FeatherIcon, props)
    app.mount(host)
    return host.querySelector('svg')
  }

  it('preserves original SVG geometry, viewBox, stroke and utility classes', () => {
    const svg = mount({ name: 'chevrons-right', class: 'h-4' })
    const expected = document.createElement('div')
    expected.innerHTML = feather.icons['chevrons-right'].contents
    expect(svg.innerHTML).toBe(expected.innerHTML)
    expect(svg.getAttribute('viewBox')).toBe('0 0 24 24')
    expect(svg.getAttribute('stroke')).toBe('currentColor')
    expect(svg.getAttribute('stroke-width')).toBe('1.5')
    expect(svg.classList.contains('h-4')).toBe(true)
    expect(svg.classList.contains('shrink-0')).toBe(true)
    expect(svg.hasAttribute('width')).toBe(false)
    expect(svg.hasAttribute('height')).toBe(false)
  })

  it('preserves attributes, click callbacks and custom stroke width', () => {
    let clicks = 0
    const svg = mount({
      name: 'x',
      strokeWidth: 2,
      'aria-label': 'Close',
      onClick: () => clicks++,
    })
    svg.dispatchEvent(new MouseEvent('click'))
    expect(clicks).toBe(1)
    expect(svg.getAttribute('aria-label')).toBe('Close')
    expect(svg.getAttribute('stroke-width')).toBe('2')
  })

  it('updates the icon when its native name prop changes', async () => {
    const name = ref('search')
    host = document.createElement('div')
    document.body.append(host)
    app = createApp({ setup: () => () => h(FeatherIcon, { name: name.value }) })
    app.mount(host)
    expect(host.querySelector('.feather-search')).not.toBeNull()
    name.value = 'download'
    await nextTick()
    expect(host.querySelector('.feather-download')).not.toBeNull()
    expect(host.querySelector('.feather-search')).toBeNull()
  })
})
