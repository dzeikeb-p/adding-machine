# The Seed

## What the seed does

Every cut-up operation that involves randomness (shuffle, fold, permutation) needs a source of randomness. The seed is the input to that random number generator. The key property: **same text + same seed = identical output, every time, on any device, forever.**

Under the hood it's a short hex string (e.g. `a3f2c19d44b87e01`) that gets fed into a deterministic algorithm (mulberry32). The algorithm produces a specific sequence of numbers, which controls exactly how chunks get shuffled or how permutations get ordered.

---

## How to use it in the web interface

**Leaving it blank** — the machine generates a cryptographically random seed, runs the cut-up, and shows you the seed it used in the output. Every run produces something different.

**Setting a seed manually** — type any string into the seed field before running. The same string always produces the same result. You can use anything: `beat-hotel`, `1959`, your own name — the seed is just a string that gets hashed into a number.

**The 🎲 Randomize button** — generates a fresh random seed and populates the field without running the machine. Useful if you want to lock in a seed before you've decided on your input text.

**Lock Seed toggle** — appears after the first run. When locked, clicking *Run Again* reuses the same seed. When unlocked, *Run Again* generates a new random seed each time.

---

## Practical uses

**Reproducing a result you liked** — after a run, the seed is shown above the output. Copy it, paste it back into the seed field, and you'll get that exact cut-up again even days later.

**Comparing methods on the same randomness** — set the same seed, switch between Shuffle and Quadrant, run both. The underlying randomness is identical, so you're comparing methods on equal footing rather than different random rolls.

**Sharing a specific result** — if you tell someone the input text and the seed, they can reproduce exactly what you generated. Determinism is what makes the output citable and shareable — it's the difference between "I got this interesting result" and "here's exactly how to get it yourself."

**Iterating on an input** — lock the seed while you refine the input text. This lets you hear how the same randomness interacts with different versions of a text, rather than having the randomness change at the same time as the words.

---

## Sharing a result

Every run also produces a **hash** — a 64-character fingerprint of your input text. The hash and seed together are a complete, compact reference to any cut-up you've made.

After a run, the web interface shows a **"Reproduce this cut-up"** panel below the output with a **Copy hash** button. Share the hash and seed with anyone, and they can reproduce the exact result:

1. Paste the hash into the input field (the label changes to `↳ stored text` to confirm it was recognised)
2. Enter the same seed
3. Select the same method
4. Run — identical output, on any device

**You never need to share the original text.** The machine stores the input automatically when you run a cut-up. The hash is a stable address for that text on Cloudflare's global network.

### Via the API

The same lookup works through the REST API. Pass the hash as the `text` field:

```bash
curl -X POST https://adding-machine-api.sheartworldwide.workers.dev/v1/cutup/shuffle \
  -H "Content-Type: application/json" \
  -d '{
    "text": "c2fc801d36fbe9d3da090de80144f6c0970150427bf352cb1cb623896f50261d",
    "options": { "seed": "beat-hotel", "unit": "word" }
  }'
```

The API returns `404` with a clear message if the hash is not found.

### Fold-in

For fold-in results, two hashes are involved — one for each source text. The **"Reproduce this cut-up"** panel shows a hash for each input. Share both hashes plus the seed and the receiver can reproduce the folded result with either text independently reusable in other operations.

### A note on storage

Input texts are stored indefinitely on Cloudflare's KV infrastructure. There is no account required and no sensitive data is associated with a hash — only the text you submitted. Do not submit text you consider private.
