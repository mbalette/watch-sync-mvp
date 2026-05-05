import type { WatchRecommendation } from './domain'

export const RECOMMENDATION_PROVIDERS = ['Netflix', 'Prime Video', 'Disney+', 'Paramount+', 'Max', 'Hulu', 'Peacock', 'Apple TV+'] as const
export type RecommendationProvider = typeof RECOMMENDATION_PROVIDERS[number]

type BrowseCategory = 'popular' | 'new' | 'recent'
type MockRecommendation = WatchRecommendation & { categories: BrowseCategory[] }

export const MOCK_RECOMMENDATIONS: MockRecommendation[] = [
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
    categories: ['popular'],
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
    categories: ['popular', 'recent'],
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
    categories: ['popular', 'new'],
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
    categories: ['popular', 'recent'],
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
    categories: ['popular'],
  },

  {
    source: 'mock',
    sourceId: 'poker-face-2023',
    mediaType: 'tv',
    title: 'Poker Face',
    year: '2023',
    overview: 'A case-of-the-week mystery comedy with easy episode-by-episode watch-party energy.',
    providers: ['Peacock'],
    ratingLabel: 'TMDB demo',
    ratingValue: '7.8',
    externalUrl: 'https://www.themoviedb.org/tv/120998-poker-face',
    categories: ['popular', 'recent'],
  },
  {
    source: 'mock',
    sourceId: 'severance-2022',
    mediaType: 'tv',
    title: 'Severance',
    year: '2022',
    overview: 'A tense, premium mystery series that works well for couples who want theories between episodes.',
    providers: ['Apple TV+'],
    ratingLabel: 'TMDB demo',
    ratingValue: '8.4',
    externalUrl: 'https://www.themoviedb.org/tv/95396-severance',
    categories: ['popular', 'new'],
  },
  {
    source: 'mock',
    sourceId: 'oppenheimer-2023',
    mediaType: 'movie',
    title: 'Oppenheimer',
    year: '2023',
    overview: 'A long, intense prestige movie pick for nights when everyone is ready for a serious watch.',
    providers: ['Peacock', 'Prime Video'],
    ratingLabel: 'TMDB demo',
    ratingValue: '8.1',
    externalUrl: 'https://www.themoviedb.org/movie/872585-oppenheimer',
    categories: ['popular', 'new'],
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
    categories: ['popular'],
  },
]

export function filterRecommendations(
  query: string,
  providers: string[],
  options: { mediaType?: 'movie' | 'tv' | 'all'; category?: BrowseCategory } = {},
): WatchRecommendation[] {
  const normalizedQuery = query.trim().toLowerCase()
  return MOCK_RECOMMENDATIONS.filter((item) => {
    const matchesQuery = !normalizedQuery
      || item.title.toLowerCase().includes(normalizedQuery)
      || item.overview.toLowerCase().includes(normalizedQuery)
    const matchesProviders = providers.length === 0 || providers.some((provider) => item.providers.includes(provider))
    const matchesMedia = !options.mediaType || options.mediaType === 'all' || item.mediaType === options.mediaType
    const matchesCategory = !options.category || item.categories.includes(options.category)
    return matchesQuery && matchesProviders && matchesMedia && matchesCategory
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
