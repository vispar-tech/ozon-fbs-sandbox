import { groupKey, tagKey } from './coverageFilters.js'

import type { OzonCoverageGroup } from '@/shared/model/index.js'

export function countMethods(groups: OzonCoverageGroup[]): number {
  let total = 0
  for (const group of groups) {
    for (const tag of group.tags) {
      total += tag.methods.length
    }
  }
  return total
}

export function collectNodeKeys(groups: OzonCoverageGroup[]): string[] {
  const keys: string[] = []
  for (const group of groups) {
    keys.push(groupKey(group.name))
    for (const tag of group.tags) {
      keys.push(tagKey(group.name, tag.name))
    }
  }
  return keys
}
