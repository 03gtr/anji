# Adding personal memories (privately)

The Memory Corridor (Act VI) has six frames. Each frame is a memory: a short
scene, a question about it, and an optional reward. Until real memories are
added, the frames use **fictional story memories** (moments from the game
itself), so the act always works.

**Never put real memories in this repository** — it is public.

## 1. Write a memories file

Create a file such as `memories.json` *outside* the repository (or in the
git-ignored `private/` folder):

```json
{
  "memories": [
    {
      "id": "first-coffee",
      "title": "عنوان الذكرى",
      "category": "everyday",
      "kind": "personal",
      "enabled": true,
      "dateLabel": "شتاء (اختياري)",
      "scene": "وصف قصير للمشهد كما تحب تحكيه.",
      "puzzle": "choice",
      "question": "سؤال جوابه تعرفه هي.",
      "options": [
        { "id": "a", "label": "خيار" },
        { "id": "b", "label": "خيار ثاني" },
        { "id": "c", "label": "خيار ثالث" }
      ],
      "answer": "b",
      "hints": ["تلميح لطيف", "تلميح أوضح"],
      "dialogue": [{ "s": "anji", "e": "soft", "t": "سطر بعد الحل (اختياري)" }],
      "reward": "unlock:bow-gold",
      "art": "story-2-snooki"
    }
  ]
}
```

| Field | Notes |
| --- | --- |
| `id` | lowercase letters, digits and `-` |
| `category` | `clinic`, `funny`, `racing`, `colors`, `music`, `birthday`, `gym`, `animals`, `flowers`, `everyday`, `story` |
| `puzzle` | `choice` (pick one), `order` (put options in order; `answer` lists every id) or `reveal` (just the scene) |
| `enabled` | must be `true` to appear |
| `dialogue` speakers | `anji` (expressions: neutral smile laugh surprised thinking skeptical soft worried determined smirk), `snooki` (happy smug confused shocked dramatic sniff proud guilty serious), `ryan` (back, turn), `note` |
| `reward` | optional effect, e.g. `unlock:bow-gold` (see `src/game/data/items.js` → `COSMETICS`) |
| `art` | optional: the name of a painted panel in `private-art/` |

Invalid entries are skipped (the import tells you how many). Personal memories
fill the frames first, in file order; story memories fill the rest.

## 2. Put it in the game — choose one

**A. On her device (recommended, nothing leaves the phone).**
Open the game → ⚙️ Settings → «ذكريات خاصة» → «استيراد ملف ذكريات», pick the
file. It is stored only in that browser. «إزالة الذكريات المستوردة» removes it.

**B. In a local build.** Save the file as `private/memories.json` (git-ignored)
and run `npm run build`. ⚠️ That build *contains* the memories — publishing it
publishes them.

## Notes

- No real event is invented by the game; the only personal content is what you
  write in this file.
- Music: do not add copyrighted recordings. Owner-supplied, properly licensed
  audio can be registered through `audio.registerSample(name, arrayBuffer)`.
