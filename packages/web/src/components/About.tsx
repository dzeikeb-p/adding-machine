const BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? '';

const P: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 'var(--text-base)',
  lineHeight: 1.8,
  marginBottom: '1.25rem',
  maxWidth: '62ch',
};

const H2: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 'var(--text-sm)',
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  marginTop: '2rem',
  marginBottom: '0.75rem',
  borderBottom: '1px solid var(--color-ink)',
  paddingBottom: '0.25rem',
};

export function About() {
  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', padding: '2rem 1.5rem 4rem' }}>
      <h1 style={{ ...H2, fontSize: '0.9rem', marginTop: 0 }}>About</h1>

      <p style={P}>
        Brion Gysin (1916–1986) discovered the cut-up by accident in summer 1959 at the Beat Hotel
        in Paris. A stack of newspapers used as a cutting mat was sliced through with a razor; the
        rearranged strips read as new, coherent prose. William S. Burroughs systematised the
        technique: take a page, cut down and across the middle, rearrange the four sections.
      </p>

      <p style={P}>
        In 1960, Gysin collaborated with mathematician Ian Sommerville on a Honeywell Series 200
        mainframe to generate every permutation of short phrases — most famously{' '}
        <em>I AM THAT I AM</em> (the Divine Tautology{' '}
        <a
          href="https://www.blueletterbible.org/verse/kjv/exo/3/14/"
          target="_blank"
          rel="noreferrer"
          style={{ color: 'var(--color-ink)', textDecorationColor: 'var(--color-accent)' }}
        >
          from Exodus 3:14
        </a>
        ). These were broadcast on the
        BBC Third Programme as <em>The Permutated Poems of Brion Gysin</em>. The computer was
        Gysin's adding machine: a combinatorial engine for language.
      </p>

      <p style={P}>
        Burroughs called the result a <strong>third mind</strong> — the text neither the human wrote
        nor the machine authored, emerging from their collision. That is the spirit of this
        instrument.
      </p>

      <h2 style={H2}>Operations</h2>

      <p style={P}>
        <strong>Quadrant.</strong> Gysin's literal razor method. The text is laid on a rectangular
        grid, cut vertically and horizontally, and the four quadrants reassembled: bottom-right with
        top-left on top, bottom-left with top-right below. Original phrases collide across the seam.
      </p>

      <p style={P}>
        <strong>Shuffle.</strong> The most flexible digital cut-up. Text is tokenised by unit — word,
        n-gram, sentence, line, or clause — and the chunks are randomised with a seeded Fisher–Yates
        shuffle. Set a seed to reproduce any result exactly.
      </p>

      <p style={P}>
        <strong>Fold-In.</strong> Burroughs' extension of the technique. Two source texts are folded
        together at a configurable ratio: the first portion of each line comes from one text, the
        remainder from the other. The voices interleave.
      </p>

      <p style={P}>
        <strong>Permutate.</strong> Sommerville mode. Every distinct ordering of a short phrase.{' '}
        <em>I AM THAT I AM</em> (five words, two pairs of duplicates) yields exactly 30 distinct
        lines. Phrases of more than seven words must use sample mode.
      </p>

      <h2 style={H2}>Reproducibility</h2>

      <p style={P}>
        Every run produces a seed. Lock the seed to repeat the exact same cut. The seed is a
        hexadecimal string fed into a mulberry32 PRNG; the same seed plus the same input always
        produces the same output.
      </p>

      <h2 style={H2}>Sharing</h2>

      <p style={P}>
        Every run also produces a <strong>hash</strong> — a 64-character SHA-256 fingerprint of
        your input. After a run, the interface shows a <em>Reproduce this cut-up</em> panel with a{' '}
        <strong>Copy hash</strong> button.
      </p>

      <p style={P}>
        Share the hash and seed with anyone. They paste the hash into the input field, enter the
        same seed, select the same method, and get the identical result — on any device, without
        ever seeing the original text. The machine stores the input automatically; the hash is a
        stable address for it on Cloudflare's global network.
      </p>

      <p style={P}>
        This is not cryptography — anyone with the hash can retrieve the stored text. Do not submit
        text you consider private.
      </p>

      <h2 style={H2}>Technical</h2>

      <p style={P}>
        The algorithms live in{' '}
        <code style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85em' }}>
          @adding-machine/core
        </code>{' '}
        — a zero-runtime-dependency TypeScript library. The REST API runs on Cloudflare Workers
        (Hono). This interface is a React + Vite + Tailwind v4 application deployed on Cloudflare
        Pages.
      </p>

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '2rem' }}>
        <a
          href={`${BASE}/docs`}
          target="_blank"
          rel="noreferrer"
          className="ctrl-btn"
          style={{ textDecoration: 'none' }}
        >
          API Reference
        </a>
        <a
          href={`${BASE}/openapi.json`}
          target="_blank"
          rel="noreferrer"
          className="ctrl-btn"
          style={{ textDecoration: 'none' }}
        >
          OpenAPI Spec
        </a>
      </div>

      <p
        style={{
          ...P,
          marginTop: '3rem',
          fontSize: 'var(--text-xs)',
          color: 'var(--color-rule)',
          fontStyle: 'italic',
        }}
      >
        "Cut the words and see how they fall." — William S. Burroughs
      </p>
    </div>
  );
}
