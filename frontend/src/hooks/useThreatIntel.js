import { useQuery } from '@tanstack/react-query'
import { threatIntelApi } from '../services/api'

export function useCVESearch(params, options = {}) {
  return useQuery({
    queryKey: ['cve-search', params],
    queryFn: () => threatIntelApi.searchCVE(params),
    enabled: !!params.keyword && params.keyword.length >= 3,
    ...options
  })
}

export function useLatestCVEs(params = {}, options = {}) {
  return useQuery({
    queryKey: ['cve-latest', params],
    queryFn: () => threatIntelApi.getLatestCVEs(params),
    ...options
  })
}

export function useCVEStats(options = {}) {
  return useQuery({
    queryKey: ['cve-stats'],
    queryFn: () => threatIntelApi.getCVEStats(),
    ...options
  })
}

export function useCVEById(cveId, options = {}) {
  return useQuery({
    queryKey: ['cve', cveId],
    queryFn: () => threatIntelApi.getCVEById(cveId),
    enabled: !!cveId,
    ...options
  })
}

export function useCompositeScore(cveId, options = {}) {
  return useQuery({
    queryKey: ['cve-composite', cveId],
    queryFn: () => threatIntelApi.getCompositeScore(cveId),
    enabled: !!cveId,
    ...options
  })
}

export function useAWSServiceCVEs(service, options = {}) {
  return useQuery({
    queryKey: ['cve-aws', service],
    queryFn: () => threatIntelApi.searchByAWSService(service),
    enabled: !!service,
    ...options
  })
}

export function useKEVCatalog(params = {}, options = {}) {
  return useQuery({
    queryKey: ['kev-catalog', params],
    queryFn: () => threatIntelApi.getKEVCatalog(params),
    ...options
  })
}
