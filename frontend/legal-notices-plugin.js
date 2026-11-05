import { existsSync, readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'

const read = (file) => readFileSync(file, 'utf8')
const noticeFiles = (directory) =>
  readdirSync(directory, { withFileTypes: true })
    .filter(
      (entry) =>
        entry.isFile() &&
        /^(licen[cs]e|notice|copying|copyright)([.-]|$)/i.test(entry.name)
    )
    .map((entry) => path.join(directory, entry.name))
    .sort()

// Generate notices from the modules actually included in the build, including
// transitive dependencies. No manually maintained package/version inventory.
export function bundledNotices(moduleIds, frontendRoot) {
  const roots = new Set()
  for (const id of moduleIds) {
    const file = id.split('?')[0].replaceAll('\0', '')
    const matches = [...file.matchAll(/\/node_modules\/(?:@[^/]+\/)?[^/]+/g)]
    const match = matches.at(-1)
    if (match) roots.add(file.slice(0, match.index + match[0].length))
  }
  // Icon CSS and the PWA worker are generated after regular module traversal.
  // Include their installed notices explicitly, including Workbox transitive code.
  for (const name of readdirSync(path.join(frontendRoot, 'node_modules'))) {
    if (name === 'lucide-static' || name.startsWith('workbox-')) {
      roots.add(path.join(frontendRoot, 'node_modules', name))
    }
  }
  const missing = []
  const entries = [...roots].map((root) => {
    const metadata = JSON.parse(read(path.join(root, 'package.json')))
    const files = noticeFiles(root)
    const suppliedNotice = path.join(
      frontendRoot,
      'legal/upstream',
      `${metadata.name.replace('@', '').replace('/', '-')}-${
        metadata.version
      }-LICENSE.txt`
    )
    if (!files.length && existsSync(suppliedNotice)) files.push(suppliedNotice)
    if (!files.length) missing.push(metadata.name)
    const repository =
      typeof metadata.repository === 'string'
        ? metadata.repository
        : metadata.repository?.url
    const registryArchive = `https://registry.npmjs.org/${
      metadata.name
    }/-/${metadata.name.split('/').at(-1)}-${metadata.version}.tgz`
    return {
      name: metadata.name,
      text: [
        `${metadata.name} ${metadata.version}`,
        `License: ${
          typeof metadata.license === 'string'
            ? metadata.license
            : JSON.stringify(metadata.license)
        }`,
        `Source repository: ${
          repository || metadata.homepage || registryArchive
        }`,
        `Package source/download: ${registryArchive}`,
        ...files.map((file) => `${path.basename(file)}\n\n${read(file)}`),
      ].join('\n\n'),
    }
  })
  if (missing.length)
    throw new Error(`Missing bundled license notice: ${missing.join(', ')}`)
  // Local aliased Framework UI and the CRM compatibility shim have no
  // node_modules path, but their MIT notices must accompany the bundle too.
  entries.push(
    {
      name: 'Frappe Framework UI',
      text: `Frappe Framework UI\nSource: https://github.com/frappe/frappe\n\n${read(
        path.resolve(frontendRoot, '../../frappe/LICENSE')
      )}`,
    },
    {
      name: 'Frappe UI compatibility shim',
      text: `Frappe UI compatibility shim\nSource: frontend/compat/framework-frappe-ui.js in the CRM corresponding source\n\n${read(
        path.join(frontendRoot, 'compat/LICENSE.frappe-ui')
      )}`,
    }
  )
  return (
    'THIRD-PARTY NOTICES\nLicense terms and author notices are reproduced below.\n\n' +
    entries
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((entry) => entry.text)
      .join('\n\n' + '='.repeat(72) + '\n\n')
  )
}

export function legalNoticesPlugin(frontendRoot) {
  const branding = JSON.parse(
    read(path.resolve(frontendRoot, '../crm/branding.json'))
  )
  const commit = execFileSync('git', ['rev-parse', 'HEAD'], {
    cwd: frontendRoot,
    encoding: 'utf8',
  }).trim()
  const source = {
    commit,
    sourceUrl: `${branding.repository}/tree/${commit}`,
    archiveUrl: `${branding.repository}/archive/${commit}.zip`,
  }
  return {
    name: 'reybill-legal-notices',
    resolveId(id) {
      if (id === 'virtual:reybill-legal-source') return '\0' + id
    },
    load(id) {
      if (id === '\0virtual:reybill-legal-source')
        return `export default ${JSON.stringify(source)}`
    },
    generateBundle(_options, bundle) {
      this.emitFile({
        type: 'asset',
        fileName: 'legal/source.json',
        source: JSON.stringify(source, null, 2),
      })
      const moduleIds = Object.values(bundle)
        .filter((entry) => entry.type === 'chunk')
        .flatMap((chunk) => Object.keys(chunk.modules))
      this.emitFile({
        type: 'asset',
        fileName: 'legal/AGPL-3.0.txt',
        source: read(path.resolve(frontendRoot, '../LICENSE')),
      })
      this.emitFile({
        type: 'asset',
        fileName: 'legal/THIRD_PARTY_NOTICES.txt',
        source: bundledNotices(moduleIds, frontendRoot),
      })
    },
  }
}
