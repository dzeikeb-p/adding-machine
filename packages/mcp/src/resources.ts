import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

// Short excerpts kept well within fair-use length.
const TEXTS: Record<string, { name: string; mimeType: string; text: string }> = {
  'gysin://minutes-to-go/preface': {
    name: 'Minutes to Go — Preface',
    mimeType: 'text/plain',
    text: [
      'Minutes to Go (1960) — Preface excerpt',
      '',
      'The cut-up method brings to writers the collage, which has been used',
      'by painters for fifty years. And used by the moving and still camera.',
      'In fact all street shots from movie or still cameras are by the nature',
      'of the process cut-ups. I have frequently spoken to the camera crew',
      'who must make a series of cuts to get a shot — the result is a cut-up.',
      '',
      '— William S. Burroughs, 1960',
    ].join('\n'),
  },

  'gysin://third-mind/cut-up-method': {
    name: 'The Third Mind — The Cut-Up Method of Brion Gysin',
    mimeType: 'text/plain',
    text: [
      'The Third Mind (1978) — excerpt',
      '',
      'Take a page. Cut down the middle and across the middle. You have four',
      'sections: 1 2 3 4. Now rearrange the sections placing section four with',
      'section one and section two with section three. And you have a new page.',
      '',
      'Sometimes it says much the same thing. Sometimes something quite different',
      '— (cutting up political speeches is an interesting exercise) — in any',
      'case you will find that it says something and something quite definite.',
      '',
      '— William S. Burroughs',
    ].join('\n'),
  },

  'gysin://divine-tautology': {
    name: 'The Divine Tautology',
    mimeType: 'text/plain',
    text: [
      'I AM THAT I AM',
      '',
      'Exodus 3:14. The phrase Brion Gysin and Ian Sommerville ran through',
      'a Honeywell Series 200 mainframe in 1960 to generate all permutations.',
      'Broadcast on the BBC Third Programme as The Permutated Poems of Brion Gysin.',
      '',
      '5 words. 2 pairs of duplicates (I×2, AM×2). 30 distinct permutations.',
    ].join('\n'),
  },
};

export function registerResources(server: McpServer) {
  for (const [uri, { name, mimeType, text }] of Object.entries(TEXTS)) {
    server.resource(uri, uri, { name }, async () => ({
      contents: [{ uri, mimeType, text }],
    }));
  }
}
