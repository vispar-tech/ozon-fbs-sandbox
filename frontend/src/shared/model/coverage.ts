import type { components } from './generated/backend-api.js'

type BackendSchemas = components['schemas']

export type OzonCoverage = BackendSchemas['OzonCoverage']

export type OzonCoverageGroup = BackendSchemas['OzonCoverageGroup']

export type OzonCoverageTag = BackendSchemas['OzonCoverageTag']

export type OzonCoverageMethod = BackendSchemas['OzonCoverageMethod']

export type OzonCoverageSource = BackendSchemas['OzonCoverageSource']
