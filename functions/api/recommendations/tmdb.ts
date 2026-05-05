import { createTmdbRecommendationResponse } from '../../../src/tmdb-recommendations'

type PagesContext = {
  request: Request
  env: {
    TMDB_READ_ACCESS_TOKEN?: string
    TMDB_API_TOKEN?: string
  }
}

export async function onRequestGet(context: PagesContext): Promise<Response> {
  const url = new URL(context.request.url)
  const providers = url.searchParams.getAll('providers').flatMap((value) => value.split(',')).map((value) => value.trim()).filter(Boolean)
  try {
    const result = await createTmdbRecommendationResponse({
      query: url.searchParams.get('q') ?? url.searchParams.get('query') ?? '',
      providers,
      region: url.searchParams.get('region') ?? 'US',
      env: context.env,
    })
    return Response.json(result.body, {
      status: result.status,
      headers: { 'Cache-Control': result.status === 200 ? 'public, max-age=300' : 'no-store' },
    })
  } catch (error) {
    return Response.json({
      ok: false,
      source: 'tmdb',
      error: error instanceof Error ? error.message : 'TMDB recommendation search failed.',
      fallback: 'mock',
      attribution: 'This product uses the TMDB API but is not endorsed or certified by TMDB.',
    }, { status: 502, headers: { 'Cache-Control': 'no-store' } })
  }
}
