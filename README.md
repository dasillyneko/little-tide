# Little Tide

A cozy ASCII aquarium prototype for a Twitch community. Original Buttonfish, Moon jellies, Pebble turtles, Peach axolotls, Cloud rays and a legendary Starlight whale.

## Run

Requires Node.js 18+ to build/test. No npm dependencies.

```
npm run build
npm test
```

Open `dist/index.html` in a browser. The built file is self-contained except optional Google Fonts (system fallbacks work offline). Feed using the demo chat. Every three accepted feeds adds a resident, up to 24. Each demo name has a six-second cooldown. Animals swim toward and eat food. The pond starts with seven residents.

After six feeds, each accepted feed has a 10% demo chance of triggering a 20-second legendary encounter. Type `!catch` to enter once per demo name. One entrant is chosen randomly at the deadline. Settings lets you preview an encounter immediately. Discoveries persist in this browser where localStorage is available; population and feed counts reset on reload. `!collection` reports the named viewer's local discoveries.

## Scope and Twitch integration

This is an interactive visual prototype. Demo names are editable and are not authenticated Twitch identities. There is no Twitch connection, server authority, shared multi-viewer state, subscription purchasing, or prize giveaway. Math.random is appropriate for this prize-free demo, not a real reward draw.

Overlay view hides controls in the current page while retaining its running pond. `?overlay=1` opens a clean ambient overlay (suitable for checking composition in OBS). A separate OBS browser page currently has separate state: chat in another page will not feed it. Shared live operation is a next implementation step, not provided here.

The production integration needs a registered Twitch app and broadcaster authorization, server-side EventSub chat ingestion, user-ID-based rate limiting, event-ID deduplication, shared state broadcast to OBS, reconnect handling, and database-backed discoveries. Keep OAuth tokens off the overlay. Real random prizes also need published eligibility/rules and a server-side audited draw; subscription gifting remains a manual streamer action.

## Files

- `src/core.mjs`: feed/catch rules, independent of the renderer.
- `src/app.js`: canvas swimming, food attraction, demo chat and controls.
- `src/style.css`: responsive UI.
- `src/index.html`: accessible page structure.
- `build.mjs`: embeds the source into `dist/index.html`.
- `test/core.test.mjs`: cooldown, growth cap, encounter eligibility and winner tests.

All creature drawings and application code were created for this project. The original pond inspiration is https://www.daoho.dev/; no source or assets were copied from it.
