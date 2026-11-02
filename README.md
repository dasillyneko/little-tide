# Little Tide

**A living ASCII ocean that Twitch chat feeds and grows.**

Large, shaded koi, rays, turtles and axolotls move through schools of fish. Viewers type `!feed` in real Twitch chat. Food attracts nearby animals; community feeding adds residents. A rare moonwhale encounter lets viewers enter with `!catch`, and one Twitch viewer receives a persistent discovery. Streamers can optionally promise a manually gifted subscription.

This is a local streamer application with a Node.js service, a control room, and a clean OBS Browser Source. There is no simulated chat, viewer-name editor, or public command-injection endpoint.

## Run

Install Node.js 22 or newer (an LTS release is recommended). In this directory:

```sh
npm ci
npm run build
npm start
```

Open **http://127.0.0.1:8787**. Keep the process running while streaming. Use `PORT` to change the port if required. The service binds only to `127.0.0.1`; it is designed to run on the same computer as OBS. No paid API, cloud account, public webhook, or Twitch Extension review is required.

## Connect Twitch

1. Register an application at https://dev.twitch.tv/console/apps/create. Your Twitch account needs a verified email and two-factor authentication.
2. Choose a unique application name, category **Application Integration**, OAuth redirect URL `https://localhost:8787`, and client type **Public**. This app uses the device flow, so the registered HTTPS redirect URL is not visited during sign-in. Open the local app itself at `http://127.0.0.1:8787`.
3. Copy the application's **Client ID** into Little Tide's control room. A Client ID is public; **no client secret is required**. A Confidential app may need to be changed to Public for this flow.
4. Click **Connect with Twitch**, open the supplied Twitch authorization link, and approve as the broadcaster whose channel you want to use. No passwords or tokens are entered into Little Tide.
5. Wait for **CHAT CONNECTED**. Open that channel's real Twitch chat and type `!feed`.

The app requests `user:read:chat` and `user:write:chat`. It subscribes to `channel.chat.message` over EventSub WebSocket using the authorized broadcaster as both `broadcaster_user_id` and `user_id`. Helix `/users` resolves the account. Encounter announcements use Helix `/chat/messages` only if you enable **Announce encounters in my chat**; they are sent as the authorized broadcaster. Announcements default to off.

Tokens stay on the local server in ignored `data/twitch.json`. Tokens are validated on startup and hourly, refreshed after HTTP 401, and removed locally on Disconnect (with a best-effort Twitch revocation). Device authorization has an expiration and supports cancellation. EventSub handles welcome, keepalive timeouts, explicit reconnect handover, unexpected disconnects, subscription recreation and revocation.

## OBS setup

1. Add a **Browser Source** in OBS.
2. Copy the URL from the control room: normally **http://127.0.0.1:8787/overlay**.
3. Set **Width 1920**, **Height 1080**, and **FPS 30**.
4. Choose Ocean, Starting soon, or Be right back from the control room. Put the full-screen ocean behind your camera and stream elements.

This is an opaque full-screen background. It is not a transparent video overlay or a clickable Twitch Extension. Viewers interact through Twitch chat. The server broadcasts the same population, food events, encounters, settings and winners to every open control/OBS page. Swimming is rendered locally; exact frame positions may differ between views. An OBS refresh restores current state, without replaying old snack animations.

## Customize your stream

Open **Design** in the control room. Appearance changes update the control room and OBS together. Choose Midnight/dark or Daylight/light, an accent color, an interface font, sparkle visibility, feeding speed boost (1?3?), and ripple strength (0 turns ripples off).

For each Ocean, Starting Soon or BRB scene, add up to eight text blocks. Edit multiline text, choose one of eight bundled system font stacks or a custom installed font name, and adjust size, color, alignment, position, width, letter spacing, opacity, bold, italic and shadow. Text size is measured at an OBS height of 1080 pixels and scales with the viewport. Custom fonts must be installed on the computer running OBS.

Edits preview in the control room. Click **Apply text to overlay** to save and broadcast the layout. Switching scenes keeps unsaved drafts in the current control-room tab; reloading discards unsaved drafts. **Restore this scene?s default text** prepares a reset that you can review and Apply. Saved layouts persist per channel and are restored after a restart.

The same tab edits the brand name, tagline and chat-instruction wording, with toggles for branding, animal count and connection bar. Click **Apply branding & instructions** to save. These settings do not change the actual `!feed` and `!catch` chat commands.

Moonwhales have a shaded silver finish and moving glints; sparkles are disabled when the browser requests reduced motion. Feeding creates three expanding water rings and animals accelerate toward the snack, slowing near it and returning to cruising speed afterward. Reduced motion uses quiet, stationary fading rings.

## Rules and controls

- `!feed`: free, once per Twitch user ID per cooldown (8 seconds by default). Renaming a viewer does not bypass the cooldown.
- Every 3 accepted feeds adds a large animal until the cap of 12 and seven schooling fish until the cap of 220. Feeding continues to attract animals at capacity.
- After 12 feeds, each eligible feed has a 6% moonwhale appearance chance, with at least 5 minutes between random visits. Streamers can also invite one through the controls.
- `!catch`: one free entry per Twitch user ID during an active encounter. Default entry window: 45 seconds. Late/duplicate entries are rejected. Server-side `crypto.randomInt` selects one entrant equally.
- No entrants means no winner. Population, settings, active encounter, entrants, discoveries and reward queue are saved per broadcaster in `data/pond-<id>.json` using serialized atomic writes. An expired encounter resolves when the same channel resumes after restart.
- Pause blocks new feeds/encounters and pauses motion. An already announced encounter still accepts entries and closes on its original deadline.
- Settings control scenes, HUD, swimming pace, cooldown, arrival frequency, encounter odds/window, and announcements.

## Optional sub rewards

Collection-only is the default. Set **Remaining sub rewards** above zero to attach one manual sub reward to future encounters. A reward already promised to an active encounter cannot be withdrawn by editing the budget. A winner consumes one slot and appears in the queue. Buy the gift yourself on Twitch, then click **Mark sub gifted**. The app does not purchase gifts or verify payment; “fulfilled” is your manual record.

Before enabling prizes, publish applicable promotion rules, eligibility, duration, odds mechanics, treatment of an already subscribed winner, and Twitch's required non-sponsorship disclaimer. Entry is free, and paid activity never changes odds. Random visits and discretionary streamer-invited encounters should be described in those rules. Twitch promotion terms: https://www.twitch.tv/p/terms-of-service.

## Validation

```sh
npm test
npm run typecheck
npm run build
```

Tests use recorded-shape/synthetic Twitch messages and fake OAuth responses; they make no real Twitch calls. They cover user-ID cooldowns, event deduplication, population limits, restart-safe winner/reward state, settings validation, token refresh serialization, EventSub session handover, and the real HTTP/SSE service with multiple clients.

**Live verification is still required with your registered Public Client ID and broadcaster authorization.** A rendered aquarium or passing mocked integration tests do not prove that your channel is connected. Record a real `!feed` arriving through Twitch and affecting OBS before submission.

The generated `outputs/aquarium.html` is an offline visual inspection artifact; it deliberately does not connect Twitch. Use `npm start` for the product. Existing `.openai` metadata is from the earlier static prototype; static hosting alone cannot run this Node/EventSub application.

## Data and troubleshooting

- Never commit `data/`, `.env`, credentials, or tokens. The app does not serve these paths. Client IDs can be shared, but tokens cannot.
- Keep a private backup of `data/` with the service stopped. Restore the same folder to preserve discoveries.
- If Twitch will not authorize, verify Public client type and sign in as the intended broadcaster. If the status says disconnected or revoked, reconnect.
- If OBS is blank, verify the service is running, the URL/port matches, and the Browser Source has nonzero dimensions.
- EventSub does not replay messages lost while disconnected. Wait for CHAT CONNECTED before testing commands.
- The service is for local use. Do not expose its port to the internet; it has local Host/Origin and mutation-token checks, not a multi-tenant hosted account system.

## Attribution and hackathon scope

The ASCII rasterizer and schooling foundations are adapted from **[stackedlol/ascii-sharks](https://github.com/stackedlol/ascii-sharks)**, MIT, copyright 2026 drewdi, pinned at `a0074c16a106f0abc665fe9712ca445f8f98ad8e`. Its license is retained in `src/ocean/LICENSE` and `THIRD_PARTY_NOTICES.md`.

Original additions: aquatic animal shape definitions, peaceful feeding attraction, chat-driven population growth, Twitch device authorization and EventSub integration, local shared-state service, identity-based game rules, persistence, encounter/reward lifecycle, streamer UI, OBS presentation and tests. Do not claim the upstream rendering engine as original hackathon work.

See [SUBMISSION.md](SUBMISSION.md) for the submission draft, recording plan and remaining checklist. Everything needed to build is in this repository; external authorization remains a user setup step.
