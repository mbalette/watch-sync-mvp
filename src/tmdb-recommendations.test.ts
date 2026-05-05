import { describe, expect, it } from 'vitest'
import {
  buildTmdbDiscoverUrl,
  buildTmdbSearchUrl,
  createTmdbDiscoverResponse,
  createTmdbRecommendationResponse,
  mapTmdbSearchItem,
  providerIdsForRecommendationProviders,
  TMDB_PROVIDER_IDS,
} from './tmdb-recommendations'

describe('TMDB recommendation API helpers', () => {
  it('builds a safe search URL with query, region, and optional provider ids', () => {
    const url = buildTmdbSearchUrl('arrival', ['Netflix', 'Max'], 'US')
    expect(url.toString()).toContain('/search/multi')
    expect(url.searchParams.get('query')).toBe('arrival')
    expect(url.searchParams.get('include_adult')).toBe('false')
    expect(url.searchParams.get('region')).toBe('US')
    expect(url.searchParams.get('watch_region')).toBe('US')
    expect(url.searchParams.get('requested_watch_providers')).toBe('8|1899')
    expect(TMDB_PROVIDER_IDS.Netflix).toBe(8)
  })

  it('uses canonical provider slugs or legacy labels for TMDB provider ids', () => {
    expect(providerIdsForRecommendationProviders(['netflix', 'Max', 'apple-tv-plus', 'Unknown'])).toEqual([8, 1899, 350])
  })

  it('maps movie/tv results and rejects person or blank title results', () => {
    expect(mapTmdbSearchItem({ id: 1, media_type: 'person', name: 'Actor' })).toBeNull()
    expect(mapTmdbSearchItem({ id: 2, media_type: 'movie', title: '', overview: 'x' })).toBeNull()
    expect(mapTmdbSearchItem({ id: 3, media_type: 'tv', name: 'Andor', first_air_date: '2022-09-21', overview: 'Spy story', vote_average: 8.2 })).toMatchObject({
      source: 'tmdb',
      sourceId: 'tv_3',
      mediaType: 'tv',
      title: 'Andor',
      year: '2022',
      ratingLabel: 'TMDB User Rating',
      ratingValue: '8.2',
    })
  })

  it('builds discover URLs for provider-filtered movies and shows', () => {
    const movieUrl = buildTmdbDiscoverUrl({ mediaType: 'movie', providers: ['Hulu', 'Max'], region: 'US', category: 'popular' })
    expect(movieUrl.pathname).toBe('/3/discover/movie')
    expect(movieUrl.searchParams.get('watch_region')).toBe('US')
    expect(movieUrl.searchParams.get('with_watch_providers')).toBe('15|1899')
    expect(movieUrl.searchParams.get('with_watch_monetization_types')).toBe('flatrate')
    expect(movieUrl.searchParams.get('sort_by')).toBe('popularity.desc')

    const tvUrl = buildTmdbDiscoverUrl({ mediaType: 'tv', providers: ['Disney+'], region: 'us', category: 'recent' })
    expect(tvUrl.pathname).toBe('/3/discover/tv')
    expect(tvUrl.searchParams.get('air_date.gte')).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(tvUrl.searchParams.get('air_date.lte')).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('returns explicit setup status for discover when no TMDB token is configured', async () => {
    const response = await createTmdbDiscoverResponse({ providers: ['Hulu'], mediaType: 'all', category: 'popular', env: {} })
    expect(response.status).toBe(501)
    expect(response.body.ok).toBe(false)
    expect(response.body.error).toContain('TMDB')
    expect(response.body.fallback).toBe('mock')
  })

  it('returns explicit setup status when no TMDB token is configured', async () => {
    const response = await createTmdbRecommendationResponse({ query: 'dune', providers: ['Max'], env: {} })
    expect(response.status).toBe(501)
    expect(response.body.ok).toBe(false)
    expect(response.body.error).toContain('TMDB')
    expect(response.body.fallback).toBe('mock')
  })
})
