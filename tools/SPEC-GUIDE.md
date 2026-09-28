# Lesson spec guide (for illustration + key boxes)

Write ONE JSON file: tools/specs/<course-slug>.json — an array with one object per lesson (in order), shape:

{
  "n": 1,                               // lesson number (matches <h3 id="lesson-N">)
  "title": "exact lesson title",
  "key_points": ["...", "...", "..."],  // 3–4 crisp points (each one sentence, ≤ 22 words) drawn from THIS lesson's text
  "verse": {"ref": "Book 1:2", "text": "exact King James Version wording"},   // a verse this lesson quotes or plainly rests on; KJV wording must be exact — prefer a verse quoted in the lesson text itself
  "scene": {
    "file": "<course-slug>-N",          // e.g. "apologetics-1"
    "sky": "dawn|day|dusk|night|gold|storm|hall",
    "ground": "hills|desert|sea|floor|plain|table|none",
    "rays": [x, y] or null,             // light rays from a point (usually [400,-40] top centre); omit or null if none
    "glow": [x, y, r] or null,          // soft glow behind the focal object
    "items": [ {"el":"bible","x":400,"y":330,"s":1.1}, ... ],   // 3–6 elements, drawn in order (back to front)
    "caption": "one short line under the picture (≤ 12 words), plain and dignified",
    "alt": "one sentence describing the picture"
  }
}

Canvas is 800 wide × 450 high. Horizon/ground line is about y=330 (sea starts y=300; floor/table start y=330). Elements are drawn centred on (x,y) and are ~150–250 px wide at scale s=1 — so s 0.5–0.7 for background/side objects, 0.9–1.3 for the focal object. Put objects that stand on the ground with y ≈ 300–380 (their centre); sky objects (sun, moon, cloud, dove, star) y ≈ 80–160. Keep the focal object near x=400. Mountains/city/temple/tent go behind (list them first) at y ≈ 230–260; "path" is a ground element (y ≈ 300) leading toward the horizon.

Available elements (el): sun, moon, cloud, bible, scroll, lamp, candle, cross, crown, sword, shield, scales, coins, sheaf, tree, city, temple, tomb, dove, fire, water, chains (broken chain), trumpet, mountain, path, gate, tent, chalice, bread, pillar, star, keyring, anchor, hourglass, seal, podium, book_stack, sunrise_arc, thunder, olive_branch, wall, harp, helmet, hand_lamp_stand (a seven-branched lampstand).

Choose scenes that fit the lesson's subject with dignity and warmth. No people, no faces, nothing dark, grotesque, or occult; for lessons about hell/judgment/persecution use restraint (e.g. a storm sky with a single lamp, a broken chain, an empty tomb, an anchor in the sea, a crown) — the picture should point to hope and truth, never dwell on horror. Vary the scenes across the course (different skies, grounds and focal objects). Every lesson gets its own scene.
