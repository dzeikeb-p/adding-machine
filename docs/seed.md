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
