import type { AIProvider } from "./ai-provider.js";

/**
 * Registry of AI providers.
 *
 * ADDING A NEW PROVIDER:
 *   1. Implement the AIProvider interface
 *   2. Call registry.register(new YourProvider(...))
 *   3. Reference the provider's id in model-registry.ts
 */
export class ProviderRegistry {
  private readonly providers = new Map<string, AIProvider>();

  register(provider: AIProvider): void {
    if (this.providers.has(provider.id)) {
      throw new Error(`Provider "${provider.id}" is already registered`);
    }
    this.providers.set(provider.id, provider);
  }

  get(providerId: string): AIProvider | undefined {
    return this.providers.get(providerId);
  }

  getOrThrow(providerId: string): AIProvider {
    const provider = this.providers.get(providerId);
    if (!provider) {
      throw new Error(
        `Provider "${providerId}" is not registered. ` +
          `Available: ${[...this.providers.keys()].join(", ")}`,
      );
    }
    return provider;
  }

  listIds(): string[] {
    return [...this.providers.keys()];
  }
}
