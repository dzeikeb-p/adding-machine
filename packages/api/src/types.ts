// Cloudflare Workers environment bindings
declare global {
  interface Bindings {
    VERSION?: string;
    COMMIT_SHA?: string;
    RATE_LIMITER?: RateLimit;
    TEXT_STORE?: KVNamespace;
  }
}

export {};
