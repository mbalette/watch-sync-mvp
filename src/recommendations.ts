import type { WatchRecommendation } from './domain'

export const RECOMMENDATION_PROVIDERS = ['Netflix', 'Prime Video', 'Disney+', 'Paramount+', 'Max', 'Hulu'] as const
export type RecommendationProvider = typeof RECOMMENDATION_PROVIDERS[number]

export const MOCK_RECOMMENDATIONS: WatchRecommendation[] = [
  {
    source: 'mock',
    sourceId: 'arrival-2016',
    mediaType: 'movie',
    title: 'Arrival',
    year: '2016',
    overview: 'A thoughtful sci-fi drama about language, time, and connection — strong for a focused date-night watch.',
    providers: ['Netflix', 'Prime Video'],
    ratingLabel: 'TMDB demo',
    ratingValue: '7.6',
    externalUrl: 'https://www.themoviedb.org/movie/329865-arrival',
  },
  {
    source: 'mock',
    sourceId: 'the-bear-2022',
    mediaType: 'tv',
    title: 'The Bear',
    year: '2022',
    overview: 'Fast, emotional, and easy to discuss after each episode. Better for short synced sessions than a long movie.',
    providers: ['Hulu', 'Disney+'],
    ratingLabel: 'TMDB demo',
    ratingValue: '8.2',
    externalUrl: 'https://www.themoviedb.org/tv/136315-the-bear',
  },
  {
    source: 'mock',
    sourceId: 'dune-part-two-2024',
    mediaType: 'movie',
    title: 'Dune: Part Two',
    year: '2024',
    overview: 'Big-screen sci-fi spectacle with strong shared-watch energy if both people can commit to the runtime.',
    providers: ['Max'],
    ratingLabel: 'TMDB demo',
    ratingValue: '8.1',
    externalUrl: 'https://www.themoviedb.org/movie/693134-dune-part-two',
  },
  {
    source: 'mock',
    sourceId: 'only-murders-2021',
    mediaType: 'tv',
    title: 'Only Murders in the Building',
    year: '2021',
    overview: 'Cozy mystery comedy with light cliffhangers and plenty to chat about between episodes.',
    providers: ['Hulu'],
    ratingLabel: 'TMDB demo',
    ratingValue: '8.0',
    externalUrl: 'https://www.themoviedb.org/tv/107113-only-murders-in-the-building',
  },
  {
    source: 'mock',
    sourceId: 'andor-2022',
    mediaType: 'tv',
    title: 'Andor',
    year: '2022',
    overview: 'Prestige sci-fi with grounded tension. Best when both people want something more serious than background TV.',
    providers: ['Disney+'],
    ratingLabel: 'TMDB demo',
    ratingValue: '8.2',
    externalUrl: 'https://www.themoviedb.org/tv/83867-andor',
  },
  {
    source: 'mock',
    sourceId: 'mission-impossible-fallout-2018',
    mediaType: 'movie',
    title: 'Mission: Impossible — Fallout',
    year: '2018',
    overview: 'High-energy action that works well for groups because it is visual, fast, and easy to jump into.',
    providers: ['Paramount+'],
    ratingLabel: 'TMDB demo',
    ratingValue: '7.4',
    externalUrl: 'https://www.themoviedb.org/movie/353081-mission-impossible-fallout',
  },
]

export function filterRecommendations(query: string, providers: string[]): WatchRecommendation[] {
  const normalizedQuery = query.trim().toLowerCase()
  return MOCK_RECOMMENDATIONS.filter((item) => {
    const matchesQuery = !normalizedQuery
      || item.title.toLowerCase().includes(normalizedQuery)
      || item.overview.toLowerCase().includes(normalizedQuery)
    const matchesProviders = providers.length === 0 || providers.some((provider) => item.providers.includes(provider))
    return matchesQuery && matchesProviders
  })
}


export function buildRecommendationSearchApiUrl(query: string, providers: string[], region = 'US'): string {
  const params = new URLSearchParams()
  params.set('q', query.trim())
  params.set('region', region.trim().toUpperCase() || 'US')
  if (providers.length > 0) params.set('providers', providers.join(','))
  return `/api/recommendations/tmdb?${params.toString()}`
}

export function buildRecommendationDiscoverApiUrl({
  providers,
  mediaType,
  category,
  region = 'US',
}: {
  providers: string[]
  mediaType: 'movie' | 'tv' | 'all'
  category: 'popular' | 'new' | 'recent'
  region?: string
}): string {
  const params = new URLSearchParams()
  params.set('region', region.trim().toUpperCase() || 'US')
  if (providers.length > 0) params.set('providers', providers.join(','))
  params.set('mediaType', mediaType)
  params.set('category', category)
  return `/api/recommendations/discover?${params.toString()}`
}
