import type { Asset, Dependency } from '@/db/types'

export interface CascadeResult {
  affectedAssetIds: string[]
  affectedEdges: string[]
  phases: CascadePhase[]
}

export interface CascadePhase {
  phase: number
  assetIds: string[]
}

/**
 * BFS from failed assets through downstream dependencies.
 * Returns affected assets grouped by cascade phase (distance from failure).
 */
export function computeCascade(
  failedAssetIds: string[],
  _assets: Asset[],
  dependencies: Dependency[]
): CascadeResult {
  const downstream = new Map<string, Dependency[]>()
  for (const dep of dependencies) {
    const existing = downstream.get(dep.upstreamAssetId) ?? []
    existing.push(dep)
    downstream.set(dep.upstreamAssetId, existing)
  }

  const visited = new Set<string>(failedAssetIds)
  const affectedEdges: string[] = []
  const phases: CascadePhase[] = [{ phase: 0, assetIds: [...failedAssetIds] }]

  let frontier = [...failedAssetIds]
  let phase = 1

  while (frontier.length > 0) {
    const nextFrontier: string[] = []
    for (const assetId of frontier) {
      const deps = downstream.get(assetId) ?? []
      for (const dep of deps) {
        if (dep.dependencyType === 'Optional') continue
        affectedEdges.push(dep.id)
        if (!visited.has(dep.downstreamAssetId)) {
          visited.add(dep.downstreamAssetId)
          nextFrontier.push(dep.downstreamAssetId)
        }
      }
    }
    if (nextFrontier.length > 0) {
      phases.push({ phase, assetIds: nextFrontier })
    }
    frontier = nextFrontier
    phase++
  }

  return {
    affectedAssetIds: [...visited],
    affectedEdges,
    phases,
  }
}

/**
 * Topological sort of assets based on dependencies.
 * Returns recovery order: restore upstream assets first.
 */
export function recoveryOrder(
  assets: Asset[],
  dependencies: Dependency[]
): Asset[] {
  const inDegree = new Map<string, number>()
  const downstream = new Map<string, string[]>()
  const assetMap = new Map<string, Asset>()

  for (const a of assets) {
    inDegree.set(a.id, 0)
    downstream.set(a.id, [])
    assetMap.set(a.id, a)
  }

  for (const dep of dependencies) {
    if (!inDegree.has(dep.upstreamAssetId) || !inDegree.has(dep.downstreamAssetId)) continue
    inDegree.set(
      dep.downstreamAssetId,
      (inDegree.get(dep.downstreamAssetId) ?? 0) + 1
    )
    downstream.get(dep.upstreamAssetId)?.push(dep.downstreamAssetId)
  }

  const queue: string[] = []
  for (const [id, deg] of inDegree) {
    if (deg === 0) queue.push(id)
  }

  const sorted: Asset[] = []
  while (queue.length > 0) {
    const id = queue.shift()!
    const asset = assetMap.get(id)
    if (asset) sorted.push(asset)
    for (const child of downstream.get(id) ?? []) {
      const newDeg = (inDegree.get(child) ?? 1) - 1
      inDegree.set(child, newDeg)
      if (newDeg === 0) queue.push(child)
    }
  }

  return sorted
}

/**
 * Find single points of failure: assets whose removal affects many downstream assets.
 */
export function findSinglePointsOfFailure(
  assets: Asset[],
  dependencies: Dependency[]
): Array<{ asset: Asset; downstreamCount: number }> {
  const results: Array<{ asset: Asset; downstreamCount: number }> = []

  for (const asset of assets) {
    const cascade = computeCascade([asset.id], assets, dependencies)
    const downstreamCount = cascade.affectedAssetIds.length - 1
    if (downstreamCount > 0) {
      results.push({ asset, downstreamCount })
    }
  }

  return results.sort((a, b) => b.downstreamCount - a.downstreamCount)
}
