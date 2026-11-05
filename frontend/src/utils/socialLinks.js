// Only populate branding.socialLinks after checking the account against an
// authoritative ReyBill source. URL validation alone does not verify ownership.
const platforms = {
  linkedin: { label: 'LinkedIn', hosts: ['linkedin.com', 'www.linkedin.com'] },
  instagram: {
    label: 'Instagram',
    hosts: ['instagram.com', 'www.instagram.com'],
  },
  facebook: { label: 'Facebook', hosts: ['facebook.com', 'www.facebook.com'] },
  youtube: { label: 'YouTube', hosts: ['youtube.com', 'www.youtube.com'] },
  x: {
    label: 'X (Twitter)',
    hosts: ['x.com', 'www.x.com', 'twitter.com', 'www.twitter.com'],
  },
}

export function verifiedSocialLinks(entries = []) {
  const seen = new Set()
  return entries.flatMap((entry) => {
    const platform = platforms[entry.platform]
    if (!platform || entry.verified !== true || seen.has(entry.platform))
      return []
    try {
      const url = new URL(entry.url)
      if (
        url.protocol !== 'https:' ||
        !platform.hosts.includes(url.hostname) ||
        url.username ||
        url.password ||
        url.port ||
        !url.pathname.replaceAll('/', '')
      )
        return []
      seen.add(entry.platform)
      return [
        { platform: entry.platform, label: platform.label, url: url.href },
      ]
    } catch {
      return []
    }
  })
}
