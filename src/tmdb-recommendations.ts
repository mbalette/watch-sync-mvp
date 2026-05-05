import type { WatchRecommendation } from './domain'

export const TMDB_PROVIDER_IDS: Record<string, number> = {
  Netflix: 8,
  'Prime Video': 9,
  'Disney+': 337,
  'Paramount+': 531,
  Max: 1899,
  Hulu: 15,
}

type TmdbEnv = {
  TMDB_READ_ACCESS_TOKEN?: string
  TMDB_API_TOKEN?: string
}

type TmdbSearchItem = {
  id?: number
  media_type?: string
  title?: string
  name?: string
  release_date?: string
  first_air_date?: string
  overview?: string
  vote_average?: number
  poster_path?: string | null
}

type WatchProviderEntry = {
  provider_id?: number
  provider_name?: string
}

type TmdbWatchProviderRegion = {
  flatrate?: WatchProviderEntry[]
  free?: WatchProviderEntry[]
  ads?: WatchProviderEntry[]
  rent?: WatchProviderEntry[]
  buy?: WatchProviderEntry[]
}

type TmdbWatchProviderResponse = {
  results?: Record<string, TmdbWatchProviderRegion>
}

export type TmdbRecommendationApiBody = {
  ok: boolean
  source: 'tmdb'
  items?: WatchRecommendation[]
  error?: string
  fallback?: 'mock'
  attribution: string
}

export type TmdbRecommendationApiResponse = {
  status: number
  body: TmdbRecommendationApiBody
}

const TMDB_BASE_URL = 'https://api.themoviedb.org/3'
const TMDB_ATTRIBUTION = 'This product uses the TMDB API but is not endorsed or certified by TMDB.'

function normalizeRegion(region: string | undefined): string {
  const normalized = (region ?? 'US').trim().toUpperCase().replace(/[^A-Z]/g, '')
  return normalized.length === 2 ? normalized : 'US'
}

function selectedProviderIds(providers: string[]): number[] {
  return providers
    .map((provider) => TMDB_PROVIDER_IDS[provider])
    .filter((id): id is number => typeof id === 'number')
}

export function buildTmdbSearchUrl(query: string, providers: string[] = [], region = 'US'): URL {
  const url = new URL('/3/search/multi', TMDB_BASE_URL)
  url.searchParams.set('query', query.trim())
  url.searchParams.set('include_adult', 'false')
  url.searchParams.set('language', 'en-US')
  url.searchParams.set('page', '1')
  const watchRegion = normalizeRegion(region)
  url.searchParams.set('region', watchRegion)
  url.searchParams.set('watch_region', watchRegion)
  const ids = selectedProviderIds(providers)
  if (ids.length > 0) url.searchParams.set('requested_watch_providers', ids.join('|'))
  return url
}

export function mapTmdbSearchItem(item: TmdbSearchItem, providers: string[] = []): WatchRecommendation | null {
  const mediaType = item.media_type === 'movie' ? 'movie' : item.media_type === 'tv' ? 'tv' : null
  if (!mediaType || typeof item.id !== 'number') return null
  const title = mediaType === 'movie' ? item.title : item.name
  if (!title?.trim()) return null
  const date = mediaType === 'movie' ? item.release_date : item.first_air_date
  const year = typeof date === 'string' && date.length >= 4 ? date.slice(0, 4) : undefined
  const ratingValue = typeof item.vote_average === 'number' && item.vote_average > 0 ? item.vote_average.toFixed(1) : undefined
  return {
    source: 'tmdb',
    sourceId: `${mediaType}_${item.id}`,
    mediaType,
    title: title.trim(),
    year,
    overview: item.overview?.trim() || 'No overview available from TMDB yet.',
    providers,
    ratingLabel: 'TMDB',
    ratingValue: ratingValue ?? 'n/a',
    externalUrl: `https://www.themoviedb.org/${mediaType === 'movie' ? 'movie' : 'tv'}/${item.id}`,
  }
}

function providerNamesForRegion(payload: TmdbWatchProviderResponse, region: string): string[] {
  const buckets = payload.results?.[region]
  if (!buckets) return []
  const seen = new Map<number, string>()
  for (const bucket of [buckets.flatrate, buckets.free, buckets.ads, buckets.rent, buckets.buy]) {
    for (const provider of bucket ?? []) {
      if (typeof provider.provider_id === 'number' && provider.provider_name) seen.set(provider.provider_id, provider.provider_name)
    }
  }
  return [...seen.values()]
}

async function fetchTmdbJson(url: URL, token: string): Promise<unknown> {
  const response = await fetch(url, {
    headers: {
      accept: 'application/json',
      authorization: `Bearer ${token}`,
    },
  })
  if (!response.ok) throw new Error(`TMDB returned ${response.status}`)
  return response.json()
}

async function fetchProvidersForItem(item: TmdbSearchItem, token: string, region: string): Promise<string[]> {
  if (typeof item.id !== 'number') return []
  const kind = item.media_type === 'movie' ? 'movie' : item.media_type === 'tv' ? 'tv' : null
  if (!kind) return []
  const url = new URL(`/3/${kind}/${item.id}/watch/providers`, TMDB_BASE_URL)
  const payload = await fetchTmdbJson(url, token) as TmdbWatchProviderResponse
  return providerNamesForRegion(payload, region)
}

function matchesSelectedProviders(itemProviders: string[], selectedProviders: string[]): boolean {
  if (selectedProviders.length === 0) return true
  return selectedProviders.some((provider) => itemProviders.includes(provider))
}

export async function createTmdbRecommendationResponse({
  query,
  providers = [],
  region = 'US',
  env,
}: {
  query: string
  providers?: string[]
  region?: string
  env: TmdbEnv
}): Promise<TmdbRecommendationApiResponse> {
  const token = env.TMDB_READ_ACCESS_TOKEN ?? env.TMDB_API_TOKEN
  if (!token) {
    return {
      status: 501,
      body: {
        ok: false,
        source: 'tmdb',
        error: 'TMDB search is not configured. Add TMDB_READ_ACCESS_TOKEN to enable live recommendations.',
        fallback: 'mock',
        attribution: TMDB_ATTRIBUTION,
      },
    }
  }
  const trimmedQuery = query.trim()
  if (!trimmedQuery) {
    return {
      status: 400,
      body: { ok: false, source: 'tmdb', error: 'Enter a title or keyword to search TMDB.', attribution: TMDB_ATTRIBUTION },
    }
  }
  const watchRegion = normalizeRegion(region)
  const searchPayload = await fetchTmdbJson(buildTmdbSearchUrl(trimmedQuery, providers, watchRegion), token) as { results?: TmdbSearchItem[] }
  const candidates = (searchPayload.results ?? []).filter((item) => item.media_type === 'movie' || item.media_type === 'tv').slice(0, 8)
  const items: WatchRecommendation[] = []
  for (const candidate of candidates) {
    const itemProviders = await fetchProvidersForItem(candidate, token, watchRegion).catch(() => [])
    if (!matchesSelectedProviders(itemProviders, providers)) continue
    const item = mapTmdbSearchItem(candidate, itemProviders.length > 0 ? itemProviders : providers)
    if (item) items.push(item)
  }
  return {
    status: 200,
    body: { ok: true, source: 'tmdb', items, attribution: TMDB_ATTRIBUTION },
  }
}
