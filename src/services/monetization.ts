/**
 * Future monetisation integration points. Nothing here talks to a store or an ad network yet, and the
 * core game never depends on these: every job, upgrade and object category is earned by playing.
 *
 * When a provider is added (e.g. a payments SDK or a rewarded-ad SDK), implement `MonetizationProvider`
 * and pass it to `setMonetizationProvider` from the root layout.
 */
export type ProductId = 'remove_ads' | 'cosmetic_pack_garden' | 'cosmetic_pack_retro' | 'theme_night_shop' | 'bonus_customer_jobs';

export interface MonetizationProvider {
  /** Purchases a product; resolves to true when it was bought. */
  purchase(product: ProductId): Promise<boolean>;
  /** Restores previous purchases (iOS requirement). */
  restore(): Promise<ProductId[]>;
  /** Shows a rewarded video for a hint; resolves to true when the reward was earned. */
  showRewardedHint(): Promise<boolean>;
  owns(product: ProductId): boolean;
}

/** Default: no store, nothing purchasable, no ads. */
const offline: MonetizationProvider = {
  purchase: async () => false,
  restore: async () => [],
  showRewardedHint: async () => false,
  owns: () => false,
};

let provider: MonetizationProvider = offline;

export function setMonetizationProvider(p: MonetizationProvider): void {
  provider = p;
}

export function monetization(): MonetizationProvider {
  return provider;
}

/** Whether optional paid features should be shown at all (false until a provider is configured). */
export function storeAvailable(): boolean {
  return provider !== offline;
}
