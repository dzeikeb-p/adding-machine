import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerPrompts } from './prompts.js';
import { registerResources } from './resources.js';
import { registerTools } from './tools.js';

export function createMcpServer(): McpServer {
  const server = new McpServer({
    name: 'adding-machine',
    version: '0.1.0',
  });

  registerTools(server);
  registerPrompts(server);
  registerResources(server);

  return server;
}
