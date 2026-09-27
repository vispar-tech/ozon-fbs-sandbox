import type { JSX } from 'react'
import { useEffect, useRef, useState } from 'react'

import { buildCurlCommand, buildFetchSnippet } from './RequestsSnippets.js'
import styles from './RequestsTab.module.scss'
import type { OperationsState, ResponseState } from './RequestsTabHelpers.js'
import {
  buildRequestInput,
  isActiveResponseSending,
  pickActiveResponse,
  pickBody,
  pickSelectedOperation,
  resolveHeaders,
  toErrorMessage,
  validateJsonBody
} from './RequestsTabHelpers.js'
import { OperationPanel, OperationsRail, RequestPanel, ResponsePanel } from './RequestsTabSections.js'

import { getSellerOperations, sendSellerRequest } from '@/shared/api/seller.js'
import type { CabinetSummary } from '@/shared/model/index.js'
import { Spinner } from '@/shared/ui/feedback/index.js'

interface RequestsTabProps {
  cabinet: CabinetSummary
}

export function RequestsTab ({ cabinet }: RequestsTabProps): JSX.Element {
  const [operationsState, setOperationsState] = useState<OperationsState>({ status: 'loading' })
  const [reloadKey, setReloadKey] = useState(0)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  // Exception to the "forms always go through useAutoForm" rule of
  // frontend/AGENTS.md, which allows hand-rolled useState plus update helpers
  // "only in exceptional cases, with a comment justifying why". This is such a
  // case; the four facts below were verified against useAutoForm.tsx:
  // 1) FieldRenderer supports only FieldType = 'text' | 'number' | 'email' |
  //    'select' | 'toggle', rendering Toggle / Select / Input. There is no
  //    Textarea branch, so the request-body editor could not go through it in
  //    any case.
  // 2) The hook is submit-oriented — onSubmit, handleSubmit, isSubmitting and
  //    zod validation that runs before sending. This tab must deliberately not
  //    pre-validate: the Ozon four-step error contract (401/16, 400/3, 400/4,
  //    404/5) is what the feature exists to demonstrate, and client-side
  //    validation would swallow it.
  // 3) `fields` is a fixed array and `values` is seeded exactly once, from
  //    getInitialValues(fields, initialValues) in the useState initializer, so a
  //    field added later starts empty and is never given its initial value. The
  //    header inputs are enumerated from operation.requiredHeaders, which only
  //    exists after the OpenAPI schema loads, so selecting a different operation
  //    means a different `fields` array — which is exactly why body and header
  //    state are kept in per-operation Records rather than one `values` object.
  // 4) handleChange(name, newValue) assigns a whole flat key
  //    (setValues(prev => ({ ...prev, [name]: value }))); per frontend/AGENTS.md,
  //    `name` is a flat key in `values` and dot-paths are not resolved, so there
  //    is nothing to lean on for a nested shape.
  const [bodies, setBodies] = useState<Record<string, string>>({})
  const [headerValues, setHeaderValues] = useState<Record<string, string>>({})
  const [includeApiKeyInCurl, setIncludeApiKeyInCurl] = useState(false)
  const [responses, setResponses] = useState<Record<string, ResponseState>>({})
  const [responseSeq, setResponseSeq] = useState(0)
  // The JSON error is announced through FieldMessage role='alert', so it is
  // shown only once the body editor was blurred or a send was attempted —
  // otherwise a screen-reader user gets a stream of alerts while typing.
  const [bodyTouched, setBodyTouched] = useState(false)
  const responseRef = useRef<HTMLDivElement>(null)
  const previousResponseStatus = useRef<ResponseState['status'] | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadOperations (): Promise<void> {
      setOperationsState({ status: 'loading' })
      try {
        const operations = await getSellerOperations()
        if (!cancelled) {
          setOperationsState({ status: 'ready', operations })
        }
      } catch (error) {
        if (!cancelled) {
          setOperationsState({ status: 'error', message: toErrorMessage(error) })
        }
      }
    }

    void loadOperations()
    return () => { cancelled = true }
  }, [reloadKey])

  const operations = operationsState.status === 'ready' ? operationsState.operations : []
  const selected = pickSelectedOperation(operations, selectedId)
  const body = pickBody(selected, bodies)
  const jsonError = validateJsonBody(body)
  const bodyError = bodyTouched ? jsonError : null
  const activeResponse = pickActiveResponse(responses, selected)
  const headers = resolveHeaders(selected, headerValues, cabinet)
  const requestInput = buildRequestInput(selected, body, headers, includeApiKeyInCurl)
  const sending = isActiveResponseSending(activeResponse)

  // Validation feedback is per-operation: switching methods starts from the
  // "not yet announced" state again.
  useEffect(() => {
    setBodyTouched(false)
  }, [selected?.id])

  // A result only "arrives" through the sending → done/failed transition;
  // scrolling is deliberately nearest-block so the viewport is not hijacked
  // when the response card is already visible.
  useEffect(() => {
    const resultArrived = previousResponseStatus.current === 'sending'
      && activeResponse !== null
      && (activeResponse.status === 'done' || activeResponse.status === 'failed')
    previousResponseStatus.current = activeResponse?.status ?? null
    if (resultArrived) {
      responseRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [activeResponse])

  function handleBodyChange (value: string): void {
    if (selected === null) {
      return
    }
    setBodies((previous) => ({ ...previous, [selected.id]: value }))
  }

  function handleHeaderChange (name: string, value: string): void {
    setHeaderValues((previous) => ({ ...previous, [name]: value }))
  }

  function handleRetry (): void {
    setReloadKey((previous) => previous + 1)
  }

  async function handleSend (): Promise<void> {
    setBodyTouched(true)
    if (requestInput === null || sending || jsonError !== null) {
      return
    }
    const { operation: { id: opId } } = requestInput
    setResponses((previous) => ({ ...previous, [opId]: { status: 'sending' } }))
    try {
      const result = await sendSellerRequest(requestInput)
      setResponses((previous) => ({ ...previous, [opId]: { status: 'done', result } }))
      setResponseSeq((previous) => previous + 1)
    } catch (error) {
      setResponses((previous) => ({ ...previous, [opId]: { status: 'failed', message: toErrorMessage(error) } }))
    }
  }

  // The rail owns the error and empty states for the operations list: the retry
  // affordance lives there, and the rail renders at every width — its media
  // query only collapses the grid, it never hides the rail. So the work column
  // has just two cases of its own: still loading, or `selected === null`,
  // which covers failed and empty alike because the rail auto-selects the
  // first operation.
  function renderWorkColumn (): JSX.Element | null {
    if (operationsState.status === 'loading') {
      return (
        <div className={styles.responseCenter}>
          <Spinner size='lg' label='Загрузка методов' />
        </div>
      )
    }
    if (selected === null) {
      return null
    }
    return (
      <>
        <RequestPanel
          operation={selected}
          body={body}
          jsonError={jsonError}
          bodyError={bodyError}
          headers={headers}
          includeApiKeyInCurl={includeApiKeyInCurl}
          sending={sending}
          curlCommand={requestInput === null ? '' : buildCurlCommand(requestInput)}
          fetchSnippet={requestInput === null ? '' : buildFetchSnippet(requestInput)}
          onBodyChange={handleBodyChange}
          onBodyBlur={() => { setBodyTouched(true) }}
          onHeaderChange={handleHeaderChange}
          onIncludeApiKeyInCurlChange={setIncludeApiKeyInCurl}
          onSend={() => { void handleSend() }}
        />
        <div ref={responseRef}>
          <ResponsePanel operation={selected} response={activeResponse} seq={responseSeq} />
        </div>
        <OperationPanel key={selected.id} operation={selected} />
      </>
    )
  }

  return (
    <div className={styles.layout}>
      <OperationsRail
        state={operationsState}
        activeId={selected === null ? null : selected.id}
        onSelect={setSelectedId}
        onRetry={handleRetry}
      />
      <div className={styles.work}>
        {renderWorkColumn()}
      </div>
    </div>
  )
}
