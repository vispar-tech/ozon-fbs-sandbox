import type {
  OzonCoverageGroup,
  OzonCoverageMethod,
  OzonCoverageTag,
} from '@/shared/model/index.js'

const GROUP_KEY_PREFIX = 'group:'
const TAG_KEY_PREFIX = 'tag:'
const TAG_KEY_SEPARATOR = '::'

export interface CoverageFilter {
  text: string
  pendingOnly: boolean
}

export function groupKey(groupName: string): string {
  return `${GROUP_KEY_PREFIX}${groupName}`
}

export function tagKey(groupName: string, tagName: string): string {
  return `${TAG_KEY_PREFIX}${groupName}${TAG_KEY_SEPARATOR}${tagName}`
}

export function isFilterActive(filter: CoverageFilter): boolean {
  return filter.text.trim() !== '' || filter.pendingOnly
}

export function filterCoverage(
  groups: OzonCoverageGroup[],
  filter: CoverageFilter,
): OzonCoverageGroup[] {
  const needle = filter.text.trim().toLowerCase()
  const filtered: OzonCoverageGroup[] = []
  for (const group of groups) {
    const tags: OzonCoverageTag[] = []
    let groupTotal = 0
    let groupImplemented = 0
    for (const tag of group.tags) {
      const tagMatchesText = needle !== '' && tag.name.toLowerCase().includes(needle)
      const methods = tag.methods.filter((method) =>
        matchesFilter(method, tagMatchesText, needle, filter.pendingOnly),
      )
      if (methods.length === 0) {
        continue
      }
      const implementedMethods = methods.filter((method) => method.implemented)
      groupTotal += methods.length
      groupImplemented += implementedMethods.length
      tags.push({
        name: tag.name,
        total: methods.length,
        implemented_total: implementedMethods.length,
        methods,
      })
    }
    if (tags.length === 0) {
      continue
    }
    filtered.push({
      name: group.name,
      total: groupTotal,
      implemented_total: groupImplemented,
      tags,
    })
  }
  return filtered
}

function matchesFilter(
  method: OzonCoverageMethod,
  tagMatchesText: boolean,
  needle: string,
  pendingOnly: boolean,
): boolean {
  if (pendingOnly && method.implemented) {
    return false
  }
  if (needle === '' || tagMatchesText) {
    return true
  }
  return method.path.toLowerCase().includes(needle) || method.title.toLowerCase().includes(needle)
}
