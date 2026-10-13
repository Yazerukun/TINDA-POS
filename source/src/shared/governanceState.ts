// File: source/src/shared/governanceState.ts
/**
 * @file governanceState.ts
 * @description Advanced PhD-grade multi-agent governance contracts, invariant checks,
 * and fail-safe protocol definitions for the TINDA POS agent swarm.
 * @author Station 1: Lead Systems Architect & Station 2: Principal Builder
 * @version 1.1.0
 */

/**
 * Represents a semantic version conforming to the SemVer 2.0.0 specification.
 */
export interface SemanticVersion {
  /** The major version component, incremented for incompatible changes. */
  major: number
  /** The minor version component, incremented for backward-compatible features. */
  minor: number
  /** The patch version component, incremented for backward-compatible bug fixes. */
  patch: number
  /** The normalized string representation (e.g., '1.0.0'). */
  raw: string
}

/**
 * State record representing the swarm governance rules and runtime invariant counters.
 */
export interface GovernanceState {
  /** Current continuous semantic version of the agent system. */
  version: SemanticVersion
  /** Counter for internal autonomous repair attempts. */
  selfHealingRetries: number
  /** Maximum allowable internal self-healing attempts before executive escalation. */
  maxAllowedRetries: number
  /** Single-sentence technical summary of the latest state delta. */
  lastChangelog: string
  /** Configuration map of actively enforced governance invariants. */
  activeRuleSet: {
    autonomousSelfHealing: boolean
    spatialMapping: boolean
    cryptographicHygiene: boolean
    semanticVersioning: boolean
    stateTrackerAppendage: boolean
    destructiveActionLock: boolean
    academicGradeDocumentation: boolean
    strictSingleResponsibility: boolean
  }
}

/**
 * Pattern matching destructive command signatures to enforce Rule 6 Fail-Safe protocol.
 */
const DESTRUCTIVE_COMMAND_REGEX =
  /\b(DROP\s+TABLE|DROP\s+DATABASE|TRUNCATE\s+TABLE|rm\s+-rf|rmdir\s+\/s|del\s+\/f|\.remove\(\)|\.unlinkSync\(\))\b/i

/**
 * Initial baseline governance state initialized for the swarm.
 */
export const INITIAL_GOVERNANCE_STATE: GovernanceState = {
  version: {
    major: 1,
    minor: 1,
    patch: 0,
    raw: '1.1.0'
  },
  selfHealingRetries: 0,
  maxAllowedRetries: 3,
  lastChangelog:
    'Activated Rules 6 (Destructive Action Lock), 7 (Academic Docstrings), and 8 (Strict SRP) into system governance.',
  activeRuleSet: {
    autonomousSelfHealing: true,
    spatialMapping: true,
    cryptographicHygiene: true,
    semanticVersioning: true,
    stateTrackerAppendage: true,
    destructiveActionLock: true,
    academicGradeDocumentation: true,
    strictSingleResponsibility: true
  }
}

/**
 * Formats the mandatory state tracker appendage string for output appending.
 *
 * @param state - The active governance state instance.
 * @returns The formatted single-line markdown status tracker footer.
 * @throws Does not throw; guarantees safe string fallback on nullish state.
 * @complexity Time: O(1) constant time string interpolation. Space: O(1) auxiliary space.
 */
export function formatSystemStateFooter(state: GovernanceState): string {
  const versionStr = state?.version?.raw ?? '1.0.0'
  const logStr = state?.lastChangelog ?? 'System state initialized.'
  return `📌 **System State:** [Version ${versionStr}] | **Changelog:** ${logStr}`
}

/**
 * Evaluates whether a proposed code block or terminal command constitutes a destructive action.
 *
 * @param payload - The command string or code snippet to inspect.
 * @returns True if a destructive signature is detected; false otherwise.
 * @throws Does not throw; returns false on empty or non-string inputs.
 * @complexity Time: O(M) where M is the character length of the payload. Space: O(1) auxiliary space.
 */
export function isDestructiveAction(payload: string): boolean {
  if (typeof payload !== 'string' || payload.trim().length === 0) {
    return false
  }
  return DESTRUCTIVE_COMMAND_REGEX.test(payload)
}

/**
 * Verifies that a synthesized code block declares an explicit file path on line 1.
 *
 * @param codeBlock - The raw synthesized code block to validate.
 * @returns True if line 1 contains an explicit file mapping header; false otherwise.
 * @throws Does not throw; returns false on empty inputs.
 * @complexity Time: O(L) where L is the length of line 1. Space: O(1) auxiliary space.
 */
export function validateSpatialMapping(codeBlock: string): boolean {
  if (typeof codeBlock !== 'string' || codeBlock.trim().length === 0) {
    return false
  }
  const firstLine = codeBlock.trimStart().split('\n')[0]?.trim() || ''
  return (
    firstLine.startsWith('// File:') ||
    firstLine.startsWith('/* File:') ||
    firstLine.startsWith('<!-- File:') ||
    firstLine.startsWith('# File:')
  )
}

/**
 * Evaluates a function implementation against the Strict Single Responsibility Principle line-count constraint.
 *
 * @param functionBody - The source code text of an individual function.
 * @param maxLogicalLines - Maximum allowed logical lines before requiring atomic decomposition (default: 50).
 * @returns True if the function adheres to line-count limits; false if decomposition is required.
 * @throws Does not throw; returns true for empty bodies.
 * @complexity Time: O(K) where K is the number of lines in the function body. Space: O(K) for line splitting.
 */
export function validateFunctionSrp(functionBody: string, maxLogicalLines = 50): boolean {
  if (typeof functionBody !== 'string') {
    return true
  }
  const lines = functionBody
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith('//') && !l.startsWith('/*') && !l.startsWith('*'))
  return lines.length <= maxLogicalLines
}
