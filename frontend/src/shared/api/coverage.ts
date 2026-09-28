import type { OzonCoverage } from '@/shared/model/coverage.js'

const COVERAGE_PATH = '/api/ozon-coverage'

export async function getOzonCoverage (): Promise<OzonCoverage> {
  const response = await fetch(COVERAGE_PATH)
  if (!response.ok) {
    throw new Error(`Не удалось загрузить покрытие: HTTP ${response.status}`)
  }
  const data: unknown = await response.json()
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- body shape is fixed by the /api/ozon-coverage contract
  return data as OzonCoverage
}
