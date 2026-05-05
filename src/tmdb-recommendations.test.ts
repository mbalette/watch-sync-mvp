import { describe, expect, it } from 'vitest'
import {
  buildTmdbSearchUrl,
  createTmdbRecommendationResponse,
  mapTmdbSearchItem,
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
    expect(TMDB_PROVIDER_IDS.Netflix).toBe(8)
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
      ratingLabel: 'TMDB',
      ratingValue: '8.2',
    })
  })

  it('returns explicit setup status when no TMDB token is configured', async () => {
    const response = await createTmdbRecommendationResponse({ query: 'dune', providers: ['Max'], env: {} })
    expect(response.status).toBe(501)
    expect(response.body.ok).toBe(false)
    expect(response.body.error).toContain('TMDB')
    expect(response.body.fallback).toBe('mock')
  })
})
