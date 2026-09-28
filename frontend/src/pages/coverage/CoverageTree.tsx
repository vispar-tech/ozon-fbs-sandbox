import { ArrowUpRightIcon, CheckCircleIcon, MinusCircleIcon } from '@heroicons/react/24/outline'
import clsx from 'clsx'
import type { JSX } from 'react'

import { groupKey, tagKey } from './CoverageHelpers.js'
import styles from './CoverageTree.module.scss'

import type { OzonCoverageGroup, OzonCoverageMethod } from '@/shared/model/coverage.js'
import { Disclosure, Icon } from '@/shared/ui/actions/index.js'
import { Badge } from '@/shared/ui/feedback/index.js'

interface CoverageTreeProps {
  groups: OzonCoverageGroup[]
  expanded: Record<string, boolean>
  defaultOpen: boolean
  onToggle: (key: string, currentlyOpen: boolean) => void
}

interface MethodRowProps {
  method: OzonCoverageMethod
}

export function CoverageTree ({ groups, expanded, defaultOpen, onToggle }: CoverageTreeProps): JSX.Element {
  return (
    <div className={styles.tree}>
      {groups.map((group) => {
        const groupNodeId = groupKey(group.name)
        const isOpen = expanded[groupNodeId] ?? defaultOpen
        return (
          <section key={groupNodeId} className={styles.group}>
            <h2>
              <Disclosure expanded={isOpen} onToggle={() => { onToggle(groupNodeId, isOpen) }}>
                <span className={styles.nodeName}>{group.name}</span>
                <span className={styles.counts}>
                  <Badge variant={group.implemented_total > 0 ? 'green' : 'default'} size='sm'>
                    {group.implemented_total} из {group.total}
                  </Badge>
                </span>
              </Disclosure>
            </h2>
            {isOpen && (
              <div className={styles.groupBody}>
                {group.tags.map((tag) => {
                  const tagNodeId = tagKey(group.name, tag.name)
                  const isTagOpen = expanded[tagNodeId] ?? defaultOpen
                  return (
                    <div key={tagNodeId} className={styles.tagBlock}>
                      <h3>
                        <Disclosure
                          size='sm'
                          expanded={isTagOpen}
                          onToggle={() => { onToggle(tagNodeId, isTagOpen) }}
                        >
                          <span className={styles.nodeName}>{tag.name}</span>
                          <span className={styles.counts}>
                            <Badge variant={tag.implemented_total > 0 ? 'green' : 'default'} size='sm'>
                              {tag.implemented_total} из {tag.total}
                            </Badge>
                          </span>
                        </Disclosure>
                      </h3>
                      {isTagOpen && (
                        <ul className={styles.methods}>
                          {tag.methods.map((method) => (
                            <MethodRow key={method.operation_id} method={method} />
                          ))}
                        </ul>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        )
      })}
    </div>
  )
}

function MethodRow ({ method }: MethodRowProps): JSX.Element {
  return (
    <li
      className={clsx(
        styles.method,
        method.implemented ? styles.methodDone : styles.methodPending
      )}
    >
      <Icon
        icon={method.implemented ? CheckCircleIcon : MinusCircleIcon}
        size='xs'
        className={method.implemented ? styles.markerDone : styles.markerPending}
      />
      <span className={styles.statusText}>{method.implemented ? 'Реализовано' : 'Не реализовано'}</span>
      <span className={styles.methodPath}>{method.path}</span>
      {method.title !== '' && <span className={styles.methodTitle}>{method.title}</span>}
      <a
        className={styles.docLink}
        href={method.doc_url}
        target='_blank'
        rel='noreferrer'
        aria-label={`Документация: ${method.path}`}
      >
        <span className={styles.docLinkText}>Документация</span>
        <Icon icon={ArrowUpRightIcon} size='xs' />
      </a>
    </li>
  )
}
