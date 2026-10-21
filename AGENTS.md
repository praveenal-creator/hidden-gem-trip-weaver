<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Roamly architecture
- AI trip plans are generated server-side in `src/lib/ai.server.ts` (Lovable AI Gateway, Responses API, strict JSON schema) and called only via auth-protected server functions in `src/lib/trips.functions.ts` — keeps the API key off the client.
- Whole itinerary is stored as one `plan` jsonb column on `trips` (types in `src/lib/trip-types.ts`) — the plan is always regenerated/refined as a unit.
- Maps use Leaflet + free CARTO/OSM tiles, lazy-loaded behind `ClientOnly` (Leaflet touches `window`); weather comes from keyless Open-Meteo in the browser.
- Booking links are deep-link searches built in `links` (trip-types.ts), not affiliate APIs.
- Map rendering (react-leaflet, `src/components/TripMap.tsx`, lazy-loaded) is separate from map data (`src/lib/map-data.ts`) and location search (`src/lib/geocoding.ts` Geocoder interface, no provider yet) — so a geocoding provider can be added without touching the map.
- Map tiles are the standard OpenStreetMap tiles with visible attribution and no bulk prefetching, per the OSM tile usage policy.
