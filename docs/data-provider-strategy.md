# Watch Sync data provider strategy

Source of truth for content discovery/provider data decisions after the third data-provider research report.

## Now: TMDB-only MVP

- Use TMDB as the MVP metadata, search, discovery, poster/backdrop, synopsis, and provider-filter backbone.
- Treat TMDB provider availability as best-effort only. Availability varies by country, plan, and date; TMDB is not entitlement-grade availability and does not provide a public exact provider-added timestamp/freshness SLA.
- Make country/region a first-class input for browsing/search because provider filters are only meaningful with a region.
- Store user provider preferences as Watch Sync canonical slugs, then map those slugs to source-specific IDs such as TMDB provider IDs.
- Keep TMDB tokens server-side. Browser/client code should call the Watch Sync proxy and must not expose TMDB tokens.
- Keep TMDB attribution visible: “This product uses the TMDB API but is not endorsed or certified by TMDB.” Use approved TMDB marks/credits where required.
- Current TMDB usage is appropriate for a non-commercial or pre-commercial MVP. If Watch Sync becomes commercial, confirm TMDB commercial license coverage before relying on TMDB content/data commercially.

## Next: Watchmode if paid availability/deeplinks are approved

- Add Watchmode only if budget and product need justify stronger availability/deeplink behavior.
- Use Watchmode for paid availability and web/iOS/Android deeplinks, not as an image/logo rights shortcut.
- Do not hotlink or assume rights to Watchmode-hosted third-party images, provider logos, or trademarks.
- Keep TMDB as the metadata/discovery/image source only where TMDB rights allow it.

## Later: contracted availability vendors

- Consider JustWatch or Reelgood under contract when Watch Sync needs stronger country coverage, historical availability, “new on your services,” daily/current legal-offer data, or higher-confidence provider intelligence.
- Treat enterprise vendors such as Gracenote or TiVo as later enterprise options, not MVP dependencies.

## Ratings ladder

- Now: show only `TMDB User Rating` for TMDB vote averages.
- Optional later: add `Trakt Community Rating` or related Trakt community/social signals if product value warrants it.
- Only display `IMDb Rating`, `Rotten Tomatoes` / `Tomatometer` / `Popcornmeter`, or `Metascore` after explicit licenses/source rights for those branded signals are in place.
- Keep user/community ratings visually and textually separate from licensed critic scores.

## Do not claim or display without explicit rights/source support

- Do not claim “new on Netflix today,” exact provider-added dates, or exact availability freshness from TMDB-only data.
- Do not describe TMDB provider results as entitlement-grade, guaranteed, exhaustive, or real-time.
- Do not display provider logos unless a data contract or provider branding terms clearly permit that use.
- Do not display IMDb, Rotten Tomatoes/Tomatometer/Popcornmeter, Metacritic/Metascore, or similar branded ratings from unlabeled aggregator fields or scraped data.
- Do not scrape JustWatch, Reelgood, IMDb, Rotten Tomatoes, Metacritic, TMDB pages, or streaming-provider catalogs.
- Do not add paid vendor integrations until budget, source rights, and terms are approved.
- Do not mix content discovery/provider availability with TV Remote Mode architecture; TV Remote Mode remains about local playback control after the user opens the title themselves.

## Implementation seam

- Keep provider options in one canonical list with stable Watch Sync slugs, human labels, and source-specific IDs.
- Convert old label-based localStorage values to canonical slugs on load.
- Convert slugs to human labels at UI boundaries.
- Convert slugs to provider-source IDs in server/API helper code.
- Keep room/manual sync and TV remote code independent from provider availability data.
