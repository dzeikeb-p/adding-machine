import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { describe, expect, it } from 'vitest';
import { createMcpServer } from './server.js';

async function makeClient() {
  const server = createMcpServer();
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await server.connect(serverTransport);
  const client = new Client({ name: 'test-client', version: '1.0.0' });
  await client.connect(clientTransport);
  return client;
}

describe('MCP tools', () => {
  it('cutup_quadrant returns text content', async () => {
    const client = await makeClient();
    const result = await client.callTool({
      name: 'cutup_quadrant',
      arguments: { text: 'AAAABBBB\nCCCCDDDD\nEEEEFFFF\nGGGGHHHH', seed: 'test' },
    });
    expect(result.content).toHaveLength(1);
    expect(result.content[0]).toMatchObject({ type: 'text' });
    const text = (result.content[0] as { type: 'text'; text: string }).text;
    expect(text.length).toBeGreaterThan(0);
    expect(result._meta).toMatchObject({ seed: 'test' });
  });

  it('cutup_shuffle returns same bag of words', async () => {
    const client = await makeClient();
    const input = 'the quick brown fox jumps over the lazy dog';
    const result = await client.callTool({
      name: 'cutup_shuffle',
      arguments: { text: input, unit: 'word', seed: 'test' },
    });
    const text = (result.content[0] as { type: 'text'; text: string }).text;
    const inputWords = input.split(' ').sort();
    const outputWords = text.split(' ').sort();
    expect(outputWords).toEqual(inputWords);
  });

  it('cutup_fold interleaves two texts', async () => {
    const client = await makeClient();
    const result = await client.callTool({
      name: 'cutup_fold',
      arguments: {
        textA: 'AAAABBBB\nCCCCDDDD',
        textB: 'EEEEFFFF\nGGGGHHHH',
        foldRatio: 0.5,
      },
    });
    const text = (result.content[0] as { type: 'text'; text: string }).text;
    expect(text).toBe('AAAAFFFF\nCCCCHHHH');
  });

  it('cutup_permutate "I AM THAT I AM" produces 30 lines', async () => {
    const client = await makeClient();
    const result = await client.callTool({
      name: 'cutup_permutate',
      arguments: { phrase: 'I AM THAT I AM', mode: 'all' },
    });
    const text = (result.content[0] as { type: 'text'; text: string }).text;
    expect(text.split('\n')).toHaveLength(30);
  });

  it('cutup_permutate returns isError for phrases > 7 words with mode=all', async () => {
    const client = await makeClient();
    const result = await client.callTool({
      name: 'cutup_permutate',
      arguments: { phrase: 'one two three four five six seven eight', mode: 'all' },
    });
    expect(result.isError).toBe(true);
  });

  it('seed reproducibility across tool calls', async () => {
    const client = await makeClient();
    const args = { text: 'cut up these words right here', unit: 'word', seed: 'repro' };
    const r1 = await client.callTool({ name: 'cutup_shuffle', arguments: args });
    const r2 = await client.callTool({ name: 'cutup_shuffle', arguments: args });
    expect((r1.content[0] as { text: string }).text).toBe(
      (r2.content[0] as { text: string }).text,
    );
  });
});

describe('MCP prompts', () => {
  it('cutup_news prompt exists and returns user messages', async () => {
    const client = await makeClient();
    const result = await client.getPrompt({ name: 'cutup_news', arguments: {} });
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0]?.role).toBe('user');
    const content = result.messages[0]?.content;
    expect(content?.type).toBe('text');
  });

  it('divine_tautology prompt references the correct phrase', async () => {
    const client = await makeClient();
    const result = await client.getPrompt({ name: 'divine_tautology', arguments: {} });
    const text = (result.messages[0]?.content as { type: 'text'; text: string })?.text ?? '';
    expect(text).toContain('I AM THAT I AM');
    expect(text).toContain('30');
  });
});

describe('MCP resources', () => {
  it('lists three resources', async () => {
    const client = await makeClient();
    const { resources } = await client.listResources();
    expect(resources).toHaveLength(3);
    const uris = resources.map((r) => r.uri);
    expect(uris).toContain('gysin://minutes-to-go/preface');
    expect(uris).toContain('gysin://third-mind/cut-up-method');
    expect(uris).toContain('gysin://divine-tautology');
  });

  it('reads divine-tautology resource', async () => {
    const client = await makeClient();
    const result = await client.readResource({ uri: 'gysin://divine-tautology' });
    expect(result.contents).toHaveLength(1);
    const content = result.contents[0] as { text: string };
    expect(content.text).toContain('I AM THAT I AM');
  });
});
