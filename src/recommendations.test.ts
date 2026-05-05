import { describe, expect, it } from 'vitest'
import {
  buildRecommendationDiscoverApiUrl,
  buildRecommendationSearchApiUrl,
  filterRecommendations,
  getRecommendationProviderLabel,
  normalizeRecommendationProviderSlugs,
  normalizeRecommendationRegion,
  RECOMMENDATION_PROVIDERS,
  RECOMMENDATION_PROVIDER_OPTIONS,
} from './recommendations'

describe('mock recommendation filtering', () => {
  it('filters by provider, query, media type, and browse category', () => {
    expect(filterRecommendations('', ['Hulu']).map((item) => item.title)).toContain('Only Murders in the Building')
    expect(filterRecommendations('sci-fi', []).map((item) => item.title)).toEqual(expect.arrayContaining(['Arrival', 'Dune: Part Two']))
    expect(filterRecommendations('mission', ['Paramount+']).map((item) => item.title)).toEqual(['Mission: Impossible — Fallout'])
    expect(filterRecommendations('', [], { mediaType: 'movie' }).every((item) => item.mediaType === 'movie')).toBe(true)
    expect(filterRecommendations('', ['Hulu'], { category: 'recent' }).map((item) => item.title)).toContain('Only Murders in the Building')
    expect(filterRecommendations('', ['Apple TV+'], { category: 'new' }).map((item) => item.title)).toContain('Severance')
  })

  it('includes major free TMDB provider chip labels for browse UX and canonical option data', () => {
    expect(RECOMMENDATION_PROVIDERS).toEqual(expect.arrayContaining(['Hulu', 'Max', 'Netflix', 'Peacock', 'Apple TV+']))
    expect(RECOMMENDATION_PROVIDER_OPTIONS).toEqual(expect.arrayContaining([
      expect.objectContaining({ slug: 'netflix', label: 'Netflix', tmdbProviderId: 8 }),
      expect.objectContaining({ slug: 'hulu', label: 'Hulu', tmdbProviderId: 15 }),
    ]))
  })

  it('normalizes provider preferences from old labels or new slugs to stable slugs', () => {
    expect(normalizeRecommendationProviderSlugs(['Hulu', 'max', 'Unknown', 'Apple TV+'])).toEqual(['hulu', 'max', 'apple-tv-plus'])
    expect(getRecommendationProviderLabel('apple-tv-plus')).toBe('Apple TV+')
    expect(getRecommendationProviderLabel('Hulu')).toBe('Hulu')
  })

  it('normalizes recommendation regions to a safe two-letter uppercase country code', () => {
    expect(normalizeRecommendationRegion(' ca ')).toBe('CA')
    expect(normalizeRecommendationRegion('usa')).toBe('US')
    expect(normalizeRecommendationRegion('1x')).toBe('US')
  })

  it('builds provider-filtered TMDB discover API URLs with canonical slugs and non-US region without exposing tokens', () => {
    const url = buildRecommendationDiscoverApiUrl({ providers: ['Hulu', 'max'], mediaType: 'all', category: 'popular', region: 'CA' })
    expect(url).toBe('/api/recommendations/discover?region=CA&providers=hulu%2Cmax&mediaType=all&category=popular')
  })

  it('builds the optional live TMDB API URL with canonical slugs and non-US region without exposing tokens', () => {
    const url = buildRecommendationSearchApiUrl(' dune ', ['Max', 'hulu'], 'GB')
    expect(url).toBe('/api/recommendations/tmdb?q=dune&region=GB&providers=max%2Chulu')
  })
})
