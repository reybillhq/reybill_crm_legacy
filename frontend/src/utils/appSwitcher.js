import branding from '@/branding'

// The registry already applies the current user's native app permissions.
// Change presentation only; never mutate registry/cache data or enumerate apps.
export function crmSwitcherApps(apps = [], translate = (value) => value) {
  return [
    {
      name: 'frappe',
      title: translate(branding.platformName),
      logo: branding.iconLight,
      route: '/desk',
    },
    ...(apps || [])
      .filter((app) => !branding.excludedSwitcherApps.includes(app.name))
      .map((app) => ({
        ...app,
        title: translate(app.name === 'crm' ? branding.appName : app.title),
        ...(app.name === 'crm' ? { logo: branding.appIcon } : {}),
      })),
  ]
}
