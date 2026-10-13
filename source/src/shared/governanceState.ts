// File: source/src/shared/governanceState.ts
/**
 * @file governanceState.ts
 * @description Advanced PhD-grade multi-agent governance contracts, invariant checks,
 * evolutionary self-improvement protocols, and concurrent swarm synergy (Rule 17 Divide & Conquer).
 * @author Station 1: Lead Systems Architect & Station 2: Principal Builder
 * @version 1.3.0
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
  /** The normalized string representation (e.g., '1.3.0'). */
  raw: string
}

/**
 * Represents a single atomic task node within an Architect Directed Acyclic Graph (DAG).
 */
export interface DagTaskNode {
  /** Unique task identifier (e.g., 'TASK-UI-01'). */
  id: string
  /** Subsystem domain category (e.g., 'FRONTEND', 'BACKEND', 'DATABASE', 'SCHEMA'). */
  domain: 'FRONTEND' | 'BACKEND' | 'DATABASE' | 'SECURITY' | 'SCHEMA'
  /** Array of parent task IDs that must complete before this task can execute. */
  dependencies: string[]
  /** Target relative or absolute file path allocated for spatial mapping. */
  targetFilePath: string
}

/**
 * Partitioned execution batch grouping independent tasks for concurrent sub-agent execution.
 */
export interface SwarmPartition {
  /** Distinct partition layer index in topological order. */
  layerIndex: number
  /** List of independent task nodes that can be executed simultaneously by parallel Builders. */
  independentTasks: DagTaskNode[]
}

/**
 * Synthesis report resulting from War Room branch reconciliation.
 */
export interface WarRoomFusionResult {
  /** Total number of concurrent modules merged. */
  modulesMerged: number
  /** Flag verifying whether all parallel branches synthesized without conflict. */
  hasConflict: boolean
  /** Timestamp ISO string when fusion was validated. */
  fusedAt: string
}

/**
 * Structured evolution report generated after major milestones (Rule 15).
 */
export interface EvolutionReport {
  /** Target version benchmarked by this milestone. */
  version: string
  /** Array of new capabilities or visiting professor skills synthesized during execution. */
  newSkillsAcquired: string[]
  /** Architectural patterns, optimizations, or invariants discovered. */
  architecturalOptimizations: string[]
  /** Anticipated throughput and acceleration impact on subsequent projects. */
  futureImpactSummary: string
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
    longTermMemoryLedger: boolean
    postActionEvolution: boolean
    dynamicSkillSynthesis: boolean
    executiveEvolutionReporting: boolean
    concurrentExecutionSwarmSynergy: boolean
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
    minor: 3,
    patch: 0,
    raw: '1.3.0'
  },
  selfHealingRetries: 0,
  maxAllowedRetries: 3,
  lastChangelog:
    'Activated Rule 17: Concurrent Execution & Swarm Synergy (Divide & Conquer DAG Task Partitioning & War Room Fusion).',
  activeRuleSet: {
    autonomousSelfHealing: true,
    spatialMapping: true,
    cryptographicHygiene: true,
    semanticVersioning: true,
    stateTrackerAppendage: true,
    destructiveActionLock: true,
    academicGradeDocumentation: true,
    strictSingleResponsibility: true,
    longTermMemoryLedger: true,
    postActionEvolution: true,
    dynamicSkillSynthesis: true,
    executiveEvolutionReporting: true,
    concurrentExecutionSwarmSynergy: true
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
  const versionStr = state?.version?.raw ?? '1.3.0'
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

/**
 * Partitions a DAG of tasks into parallel execution layers based on dependency resolution (Rule 17).
 *
 * @param tasks - Array of task nodes from the Architect's specification DAG.
 * @returns Array of partitions where each layer contains mutually independent tasks.
 * @throws Does not throw; returns empty partitions on empty input.
 * @complexity Time: O(V + E) where V is number of tasks and E is dependency count. Space: O(V) auxiliary.
 */
export function partitionDagTasks(tasks: DagTaskNode[]): SwarmPartition[] {
  if (!Array.isArray(tasks) || tasks.length === 0) {
    return []
  }
  const resolved = new Set<string>()
  const remaining = [...tasks]
  const partitions: SwarmPartition[] = []
  let layer = 0

  while (remaining.length > 0) {
    const independent = remaining.filter((t) => t.dependencies.every((dep) => resolved.has(dep)))
    if (independent.length === 0) {
      // Cycle detection fallback: group remaining to prevent infinite loop
      partitions.push({ layerIndex: layer, independentTasks: remaining })
      break
    }
    independent.forEach((t) => resolved.add(t.id))
    partitions.push({ layerIndex: layer, independentTasks: independent })
    independent.forEach((t) => {
      const idx = remaining.findIndex((r) => r.id === t.id)
      if (idx !== -1) remaining.splice(idx, 1)
    })
    layer++
  }
  return partitions
}

/**
 * Reconciles and validates the fusion of concurrently generated module outputs in the War Room (Rule 17).
 *
 * @param moduleFiles - Array of target file paths generated across parallel Builder sub-agents.
 * @returns Summary verification confirming zero duplicate target path collisions.
 * @throws Does not throw.
 * @complexity Time: O(N) where N is the number of module files. Space: O(N) for set deduplication.
 */
export function fuseSwarmBranches(moduleFiles: string[]): WarRoomFusionResult {
  if (!Array.isArray(moduleFiles)) {
    return { modulesMerged: 0, hasConflict: false, fusedAt: new Date().toISOString() }
  }
  const uniquePaths = new Set(moduleFiles)
  const hasCollision = uniquePaths.size !== moduleFiles.length
  return {
    modulesMerged: uniquePaths.size,
    hasConflict: hasCollision,
    fusedAt: new Date().toISOString()
  }
}
