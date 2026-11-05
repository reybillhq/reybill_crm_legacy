import path from 'node:path'

// Keep the frozen Framework source and CRM's current frappe-ui package intact.
export function frameworkUiCompatibility(frameworkUiRoot, compatibilityEntry) {
  const frameworkPrefix = path.resolve(frameworkUiRoot) + path.sep

  return {
    name: 'crm-framework-ui-compatibility',
    enforce: 'pre',
    resolveId: {
      filter: { id: /^frappe-ui$/ },
      handler(source, importer) {
        if (source === 'frappe-ui' && importer?.startsWith(frameworkPrefix)) {
          return compatibilityEntry
        }
        return null
      },
    },
  }
}
