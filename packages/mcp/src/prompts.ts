import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

export function registerPrompts(server: McpServer) {
  server.prompt(
    'cutup_news',
    "Instructs the model to fetch today's headlines and run them through cutup_shuffle at the phrase level — as Burroughs did constantly with Time and Life magazines.",
    () => ({
      messages: [
        {
          role: 'user' as const,
          content: {
            type: 'text' as const,
            text: [
              "Gather today's top news headlines — use your knowledge of recent events, or fetch them if you have web access.",
              'Combine all the headlines into a single block of text.',
              'Call the cutup_shuffle tool with unit="phrase" on that text.',
              'Present the shuffled result as a found poem, with no commentary.',
              'Then, below a hairline rule, name the method used and the seed, so the result is reproducible.',
            ].join('\n'),
          },
        },
      ],
    }),
  );

  server.prompt(
    'divine_tautology',
    'Runs cutup_permutate on "I AM THAT I AM" and displays all 30 permutations with appropriate ceremony — replicating Gysin and Sommerville\'s 1960 Honeywell broadcast.',
    () => ({
      messages: [
        {
          role: 'user' as const,
          content: {
            type: 'text' as const,
            text: [
              'Call the cutup_permutate tool with:',
              '  phrase = "I AM THAT I AM"',
              '  mode = "all"',
              '',
              'This phrase has 5 words with two pairs of duplicates (I×2, AM×2, THAT×1).',
              'The number of distinct permutations is 5! / (2! × 2!) = 30.',
              '',
              'Display each of the 30 lines as a separate stanza.',
              'Precede the poem with a one-sentence note: Brion Gysin and Ian Sommerville',
              'generated these permutations on a Honeywell Series 200 mainframe and broadcast',
              'them on the BBC Third Programme in 1960.',
              '',
              'Add nothing. Remove nothing. The machine speaks.',
            ].join('\n'),
          },
        },
      ],
    }),
  );
}
