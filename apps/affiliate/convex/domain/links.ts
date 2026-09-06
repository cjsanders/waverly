export interface LinkTarget {
  providerKey: string
  programKey: string
  originalDestinationUrl: string
  normalizedDestinationUrl: string
  providerTrackingUrl: string
}

export function targetRequiresNewVersion(current: LinkTarget, next: LinkTarget): boolean {
  return (
    current.providerKey !== next.providerKey ||
    current.programKey !== next.programKey ||
    current.originalDestinationUrl !== next.originalDestinationUrl ||
    current.normalizedDestinationUrl !== next.normalizedDestinationUrl ||
    current.providerTrackingUrl !== next.providerTrackingUrl
  )
}

export function nextLinkVersion(currentVersion: number): number {
  if (!Number.isInteger(currentVersion) || currentVersion < 1) {
    throw new Error('Current link version must be a positive integer')
  }
  return currentVersion + 1
}
