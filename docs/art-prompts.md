# Hunter class art — prompt pack

Six classes × three evolution tiers = 18 portraits. Tiers follow Rank:
**Initiate** (E–D), **Veteran** (C–B), **Ascendant** (A, S, National).

## How to add art

1. Generate with any image tool (ChatGPT, Midjourney, Canva, Leonardo, Ideogram). Portrait **3:4**.
2. Name the file `<class>-<tier>.png` (or .jpg), e.g. `scholar-veteran.png`.
3. Drop them in a Google Drive folder called **Life Leveling Art** and tell Claude, or run locally:

```bash
npm run add-portrait -- ~/Downloads/scholar-veteran.png scholar veteran
```

The script crops to 3:4, resizes to 600×800 WebP (~60 KB) and registers it. Missing art falls back to the SVG hologram, so art can land one image at a time.

Say *adult* for initiate-tier characters; "young" prompts can trip the safety filter. Avoid trademarked words in prompts (game names, "D&D", franchise names). Image filters reject them.

## Shared style (append to every prompt)

> Painterly digital illustration like a classic tabletop role-playing game rulebook, dramatic lighting, strong cool blue rim light, deep navy-black background with faint mist, character centered and fully visible from head to boots, original character design, no text, no logo, no watermark, no border.

Ascendant tier also adds: *radiant blue aura around the body, wisps of violet shadow smoke curling at the feet*.

## Canva media IDs (full-resolution originals, 1088×1456)

The app ships 448×600 versions, captured by placing each original on a 1088×1456 page in a scratch Canva design and saving the page preview (the draft was discarded, not saved). That covers the largest on-screen size. For true 1088×1456 files, download the originals below and run `npm run add-portrait -- <file> <path> <tier>`.

| File | Canva |
|---|---|
| warrior-initiate | https://www.canva.com/M/MAHWp8Z6UaU |
| warrior-veteran | https://www.canva.com/M/MAHWp7BiIb0 |
| warrior-ascendant | https://www.canva.com/M/MAHWp1d3oaU |
| merchant-initiate | https://www.canva.com/M/MAHWp2CHkFQ |
| merchant-veteran | https://www.canva.com/M/MAHWp_i8Meg |
| merchant-ascendant | https://www.canva.com/M/MAHWp0rF5wA |
| scholar-initiate | https://www.canva.com/M/MAHWpy5oOC0 |
| scholar-veteran | https://www.canva.com/M/MAHWpwNyHjg |
| scholar-ascendant | https://www.canva.com/M/MAHWp0c6y3c |
| monk-initiate | https://www.canva.com/M/MAHWp4HZuoI |
| monk-veteran | https://www.canva.com/M/MAHWp37VgHk |
| monk-ascendant | https://www.canva.com/M/MAHWp6GM1tw |
| keeper-initiate | https://www.canva.com/M/MAHWp_X3w7E |
| keeper-veteran | https://www.canva.com/M/MAHWp7skHUs |
| keeper-ascendant | https://www.canva.com/M/MAHWp-0widc |
| custom-initiate | https://www.canva.com/M/MAHWpwvvwcg |
| custom-veteran | https://www.canva.com/M/MAHWp125JWs |
| custom-ascendant | https://www.canva.com/M/MAHWp3XRANU |

## Prompts

| File | Status | Prompt (then add the shared style) |
|---|---|---|
| warrior-initiate | done | Full-body fantasy character portrait of a human warrior at the start of their journey: worn leather armor over a padded gambeson, simple iron longsword, dented round shield, determined stance, young face with a small scar. |
| warrior-veteran | done | Full-body fantasy character portrait of a battle-hardened veteran warrior: dark steel plate armor over chainmail, fur-lined cloak, heavy greatsword resting on one shoulder with faint glowing blue runes along the blade, confident planted stance, weathered face. |
| warrior-ascendant | done | Full-body fantasy character portrait of a legendary ascended warrior-king: ornate obsidian and silver full plate armor etched with glowing blue runes, massive runic greatsword crackling with blue energy, tattered dark royal cape, crown-like helm, overwhelming presence. |
| merchant-initiate | done | Full-body fantasy character portrait of a young traveling merchant-rogue at the start of their journey: hooded brown travel cloak, simple leather vest, a coin purse and small ledger on the belt, one plain dagger, pack on the back, sharp clever eyes. |
| merchant-veteran | done | Full-body fantasy character portrait of a seasoned guildmaster rogue-merchant: fitted black leather armor with gold trim, long dark coat, twin curved daggers at the hips, heavy gold rings, a ledger chained to the belt, gold coins flipping between the fingers, confident smirk. |
| merchant-ascendant | done | Full-body fantasy character portrait of a legendary ascended merchant-prince and master of a shadow guild: ornate dark coat embroidered with glowing gold filigree, twin enchanted daggers glowing blue, a slowly orbiting ring of floating gold coins around the body, commanding regal pose. |
| scholar-initiate | done | Full-body fantasy character portrait of an adult scholar-mage at the start of their journey, in their late twenties: plain grey wool robes, a leather satchel of books and scrolls, a small brass lantern, simple wooden staff, focused thoughtful expression. |
| scholar-veteran | done | Full-body fantasy character portrait of an experienced battle arcanist: deep blue robes embroidered with silver runes, a leather-bound spellbook floating open beside them, crystal-topped staff glowing blue, a belt of vials and scroll cases, calm commanding stance. |
| scholar-ascendant | done | Full-body fantasy character portrait of a legendary archmage: flowing midnight robes patterned like a star map, a halo of slowly orbiting glowing glyphs, several ancient books floating in the air, staff of twisted silver crowned with a blazing blue crystal, eyes glowing faintly. |
| monk-initiate | done | Full-body fantasy character portrait of a young novice monk at the start of their journey: simple undyed wrap clothing, barefoot, wooden quarterstaff, wooden prayer beads, shaved head, calm disciplined stance. |
| monk-veteran | done | Full-body fantasy character portrait of a seasoned martial monk: dark sleeveless gi with a sash, hand wraps faintly glowing blue, long prayer beads, iron-shod staff held behind the back, lean muscular build, battle-ready fighting stance. |
| monk-ascendant | done | Full-body fantasy character portrait of a legendary grandmaster monk levitating slightly above the ground: flowing white and deep blue robes, glowing blue energy flowing along the arms, a ring of floating prayer beads orbiting the body, serene face, eyes closed. |
| keeper-initiate | done | Full-body fantasy character portrait of a young town guardian at the start of their journey: padded tunic with a simple emblem of a hearth, spear, wooden kite shield, a lantern on the belt, steady protective stance. |
| keeper-veteran | done | Full-body fantasy character portrait of a veteran knight-guardian: polished steel plate armor, tall tower shield bearing a hearth emblem, warhammer, blue tabard, unbreakable defensive stance. |
| keeper-ascendant | done | Full-body fantasy character portrait of a legendary holy guardian paladin: radiant silver and white plate armor with glowing blue seams, massive tower shield blazing with a hearth sigil of light, winged helm, cape of light, protective radiant stance. |
| custom-initiate | done | Full-body fantasy character portrait of a lone wanderer at the start of their journey: hooded grey travel cloak, walking staff, bedroll and satchel, worn boots, face half in shadow. |
| custom-veteran | done | Full-body fantasy character portrait of a seasoned ranger-wanderer: weathered green-grey cloak, longbow across the back, short sword at the hip, a map case and compass, alert confident stance. |
| custom-ascendant | done | Full-body fantasy character portrait of a legendary mythic wanderer: cloak that shimmers like a night sky full of stars, staff topped with a glowing blue compass-rose crystal, faint glowing path of light beneath the feet, knowing half-smile. |
