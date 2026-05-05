import { describe, expect, it } from 'vitest'
import { buildRecommendationSearchApiUrl, filterRecommendations } from './recommendations'

describe('mock recommendation filtering', () => {
  it('filters by provider and query', () => {
    expect(filterRecommendations('', ['Hulu']).map((item) => item.title)).toContain('Only Murders in the Building')
    expect(filterRecommendations('sci-fi', []).map((item) => item.title)).toEqual(expect.arrayContaining(['Arrival', 'Dune: Part Two']))
    expect(filterRecommendations('mission', ['Paramount+']).map((item) => item.title)).toEqual(['Mission: Impossible — Fallout'])
  })

  it('builds the optional live TMDB API URL without exposing tokens', () => {
    const url = buildRecommendationSearchApiUrl(' dune ', ['Max', 'Hulu'], 'US')
    expect(url).toBe('/api/recommendations/tmdb?q=dune&region=US&providers=Max%2CHulu')
  })
})
