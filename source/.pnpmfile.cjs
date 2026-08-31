// pnpm hook: give the @typescript-eslint packages their own nested
// TypeScript 6 so they can type-lint, while the project root keeps
// TypeScript 7 (the new native compiler) for build/typecheck.
//
// typescript-eslint does not yet support TypeScript 7 (no JS compiler API),
// and pnpm overrides intentionally do not re-resolve peerDependencies, so we
// convert the "typescript" peer of each @typescript-eslint/* package into a
// regular pinned dependency v6.0.3. This keeps TS 6 out of the root graph.

const LINT_TYPESCRIPT_VERSION = '6.0.3'

function readPackage(pkg) {
  const isLintTs = pkg.name && (pkg.name === 'typescript-eslint' || pkg.name.startsWith('@typescript-eslint/'))
  if (isLintTs) {
    if (pkg.peerDependencies && pkg.peerDependencies.typescript) {
      delete pkg.peerDependencies.typescript
      if (pkg.peerDependenciesMeta) delete pkg.peerDependenciesMeta.typescript
    }
    pkg.dependencies = Object.assign({}, pkg.dependencies, {
      typescript: LINT_TYPESCRIPT_VERSION
    })
  }
  return pkg
}

module.exports = {
  hooks: { readPackage }
}
