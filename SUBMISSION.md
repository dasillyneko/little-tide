# Hackathon submission preparation

## Proposed title

Little Tide — Your chat, an ocean

## Short description

Turn a stream's quiet moments into a living ASCII ocean. Twitch viewers feed the animals together, welcome new inhabitants, and discover rare moonwhales. The streamer adds one URL to OBS and controls the experience from a local dashboard, with editable scene text, fonts, colors, light/dark themes and feeding effects.

## Project description draft

Little Tide gives viewers a calm, collective activity during Starting Soon, breaks, and chatting streams. A `!feed` command in Twitch chat drops food into the ocean, attracts nearby animals, and contributes toward new residents. Each viewer acts through their authenticated Twitch identity. There are no paid entries or odds boosts.

A rare moonwhale occasionally surfaces. Viewers type `!catch` during the entry window, and the server chooses one entrant to receive a saved discovery. Streamers can optionally fund a manually gifted-sub reward, with a queue that tracks promised and fulfilled rewards.

We built an installed Twitch integration using device authorization, EventSub WebSockets for `channel.chat.message`, and the Twitch API for broadcaster identity and optional encounter announcements. A local Node server owns the game state, deduplicates events, applies cooldowns, persists discoveries per channel, and broadcasts updates to the control room and OBS Browser Source. The overlay contains no OAuth tokens.

The visual foundation is the MIT-licensed ASCII Sharks rasterizer and schooling simulation by drewdi / stackedlol. Our contribution adds distinct aquatic creatures, peaceful food attraction, Twitch-driven gameplay, authorization and reconnect handling, shared state, persistence, streamer controls, encounters and OBS scenes. Upstream attribution and license are included.

## How Codex was used

The project idea and direction came from the entrant: an ASCII aquatic background where Twitch viewers feed animals and discover rare creatures. Codex implemented and iterated on the renderer adaptation, Twitch service, game state, controls, tests, and documentation. The entrant rejected an early prototype and directed the more detailed ASCII style and real Twitch integration. Record the actual build conversation and source changes in the demonstration.

## Video plan — target 2 minutes 40 seconds

1. **0:00–0:15** — Show the ocean in an actual Twitch broadcast. Explain the one-sentence idea.
2. **0:15–0:50** — Show a real viewer sending `!feed` in Twitch chat, then the food response in OBS. Have three viewers feed or wait through the configured cooldown to show a new arrival.
3. **0:50–1:25** — Invite a moonwhale from the streamer controls. Show real `!catch` entries and the server-selected discovery. Use a 15-second entry window for the recording, configured before the encounter.
4. **1:25–1:45** — Show saved discoveries, scene switching, and the clean OBS source. If discussing sub rewards, accurately label them as manually gifted; do not imply automatic purchases.
5. **1:45–2:15** — Explain EventSub → local game server → OBS, plus cooldowns and deduplication. Show a brief code/test view.
6. **2:15–2:40** — Show the Codex build thread and explain what Codex helped implement. Credit ASCII Sharks and describe the original work built on it.

Do not replace live Twitch footage with synthetic integration tests or the offline visual artifact. Avoid unlicensed music/game footage or third-party material you do not have permission to include.

## Remaining before submission

- [ ] Register/use a Public Twitch application and authorize the broadcaster.
- [ ] Verify `!feed` and `!catch` through the real Twitch channel and OBS.
- [ ] Record the under-three-minute video and make it viewable on YouTube.
- [ ] Provide a GitHub/GitLab/Bitbucket repository URL containing source, assets, notices, lockfile and setup instructions. If private, grant judges the access specified by Devpost.
- [ ] Replace this draft with the entrant's final description and actual testing results.
- [ ] Get the Codex session ID from the main build thread's `/status`; do not substitute the T3 conversation ID.
- [ ] Add team members, complete the Devpost form, and click Submit. A saved draft is not submitted.
- [ ] Confirm the deadline on the official event page and preserve submitted artifacts for judging.

Reference: https://twitchcon-codex.devpost.com/rules
