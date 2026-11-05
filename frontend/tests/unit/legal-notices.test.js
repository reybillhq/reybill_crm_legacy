// @vitest-environment node
import {
  readFileSync,
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  rmSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, it, expect } from 'vitest'
import { bundledNotices, legalNoticesPlugin } from '../../legal-notices-plugin'

const frontendRoot = path.resolve(import.meta.dirname, '../..')
describe('distributed dependency notices', () => {
  it('keeps original CRM copyright, license and source access in prominent linked materials', () => {
    const plugin = legalNoticesPlugin(frontendRoot)
    const assets = []
    plugin.generateBundle.call(
      { emitFile: (asset) => assets.push(asset) },
      {},
      {}
    )
    const information = assets.find((asset) =>
      asset.fileName.endsWith('LICENSE_INFORMATION.txt')
    ).source
    const notices = assets.find((asset) =>
      asset.fileName.endsWith('THIRD_PARTY_NOTICES.txt')
    ).source
    const agpl = readFileSync(path.join(frontendRoot, '../LICENSE'), 'utf8')
    expect(information).toContain(
      'Frappe Technologies Pvt. Ltd. and contributors'
    )
    expect(information).toContain('ReyBill does not claim ownership')
    expect(information).toContain(
      'Source Download: https://github.com/reybillhq/reybill_crm/archive/'
    )
    expect(information).toContain(agpl)
    expect(notices).toContain(
      'Original CRM source: © Frappe Technologies Pvt. Ltd.'
    )
    expect(
      assets.find((asset) => asset.fileName.endsWith('AGPL-3.0.txt')).source
    ).toBe(agpl)
  })

  it('includes transitive package license text, versions, source and local aliased licenses', () => {
    const notices = bundledNotices(
      [
        path.join(
          frontendRoot,
          'node_modules/vue/dist/vue.runtime.esm-bundler.js'
        ),
        path.join(
          frontendRoot,
          'node_modules/@vue/shared/dist/shared.esm-bundler.js'
        ),
      ],
      frontendRoot
    )
    expect(notices).toContain('vue 3.')
    expect(notices).toContain('@vue/shared 3.')
    expect(notices).toContain('Copyright (c) 2018-present, Yuxi (Evan) You')
    expect(notices).toContain('https://registry.npmjs.org/vue/-/vue-')
    expect(notices).toContain('Frappe Framework UI')
    expect(notices).toContain('Frappe UI compatibility shim')
    expect(notices).toContain('Frappe Technologies')
  })
  it('fails the build if a distributed package has no license notice', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'crm-legal-test-'))
    try {
      const pkg = path.join(root, 'node_modules/example')
      mkdirSync(pkg, { recursive: true })
      writeFileSync(
        path.join(pkg, 'package.json'),
        '{"name":"example","version":"1.0.0","license":"MIT"}'
      )
      expect(() =>
        bundledNotices([path.join(pkg, 'index.js')], frontendRoot)
      ).toThrow('Missing bundled license notice: example')
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })
})
