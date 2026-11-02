# Copy-ready Devpost submission

## Project name

Little Tide — Your chat, an ocean

## Tagline

A living ASCII ocean that Twitch chat feeds, grows, and explores together.

## Inspiration

Starting Soon screens and stream breaks are often passive. We wanted to give the community a calm shared space where a small action from one viewer creates something everyone can enjoy. Little Tide turns chat messages into food, ripples, new aquatic friends, and rare discoveries.

## What it does

Little Tide is an interactive background for Twitch streams. Viewers type `!feed` in the streamer's real Twitch chat. Food appears in the water, nearby animals accelerate toward it, and ripples expand from the feeding spot. Every few accepted feeds brings another animal and a school of small fish.

Every five minutes, a silver moonwhale swims across the screen from a random side, even if chat is quiet. Viewers can type `!catch` during a timed encounter, with one free entry per Twitch user ID. The server randomly selects one entrant and saves their discovery. The streamer can invite an encounter directly for a community moment. Optional subscription rewards use a manual fulfillment queue; the application does not purchase gift subscriptions.

The streamer adds a local Browser Source to OBS. A separate control room manages scenes, interactions, saved discoveries and appearance. Each scene supports editable text blocks with font, color, size, positioning, alignment, bold, italic, spacing, opacity and shadow controls. Light and dark themes, uploaded logos and icons, branding, ripple strength and feeding speed are configurable. Food disappears only on mouth contact.

## How we built it

We built a local Node.js service and a TypeScript/canvas interface. The streamer signs in through Twitch's device authorization flow. EventSub WebSockets deliver `channel.chat.message` events. Twitch API requests resolve the broadcaster's identity and can send encounter announcements when the streamer enables them.

The server owns gameplay state, applies cooldowns by Twitch user ID, deduplicates chat events, persists channel-specific data, and broadcasts updates to the dashboard and OBS over server-sent events. OAuth tokens stay on the local service and are excluded from the repository. The Twitch connection handles session handover, disconnections, token refresh and revocation.

The ASCII rasterizer and schooling foundation are adapted from the MIT-licensed ASCII Sharks project by drewdi / stackedlol. Our original additions include aquatic silhouettes, peaceful food attraction, Twitch-driven growth and encounters, authorization, shared state, persistence, customization, streamer controls and the OBS experience. The upstream license and attribution are included.

## How we used Codex

The entrant directed the product idea and its revisions. Codex helped implement the Twitch integration, adapt the rendering engine, build original creature silhouettes and feeding effects, create the control room and design editor, and develop automated tests and setup documentation. We iterated through the build conversation, rejected an early visual direction, adopted a denser ASCII style, and added real Twitch interaction and streamer customization.

## Challenges we ran into

We needed to connect actual Twitch chat to an OBS view without exposing tokens or relying on a simulated chat interface. We also needed feeding movement to feel responsive while keeping the ocean calm. Persisting encounters across restarts and preventing duplicate entries required server-owned rules. Visual testing caught a degenerate fin shape that filled the moonwhale's bounding box; we fixed the geometry and added a regression test.

## Accomplishments

Little Tide combines a shared Twitch experience with a stream-ready background and a flexible design editor. The code includes 23 automated tests covering identity-based cooldowns, population growth, encounter rewards, persistence, settings validation, connection recovery, multi-client updates, feeding acceleration and moonwhale rasterization. TypeScript and production build checks pass.

## What we learned

An overlay becomes a community experience when viewers can create visible, shared consequences. Reliable authentication, reconnection and persistent identity matter as much as the animation. Clear streamer controls make those interactions easier to use during a real broadcast.

## What's next

More aquatic species and habitats, longer-term community goals, richer saved discovery displays, and additional streamer-created scene presets.

## Built with

OpenAI Codex, Twitch EventSub, Twitch API, TypeScript, JavaScript, Node.js, HTML Canvas, CSS, server-sent events, OBS Browser Source, esbuild, ASCII Sharks (MIT).

## Links to fill before submitting

- Code repository: https://github.com/dasillyneko/little-tide
- YouTube demonstration: paste the Public video URL.
- Codex session ID: copy the actual session ID from the main build thread's `/status`.
- Website/testing: this is an installed local application; point judges to the repository's README. `localhost` is not a public deployment.

## Attribution

ASCII Sharks: https://github.com/stackedlol/ascii-sharks — MIT, copyright 2026 drewdi. See THIRD_PARTY_NOTICES.md for the complete license and pinned upstream commit.
