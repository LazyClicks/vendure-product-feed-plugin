import { ProductVariant, Channel } from "@vendure/core";
import { ProductFeedStrategyOptions } from "./types";

export const getProductUrl = (
  variant: ProductVariant,
  channel: Channel,
  options: ProductFeedStrategyOptions
) => {
  return options.productUrl(
    channel.customFields.productFeedShopUrl?.trim() || "",
    variant
  );
};

export const getAssetUrl = (
  asset: string,
  options: ProductFeedStrategyOptions
) => {
  return `${options.assetUrlPrefix.trim()}/${asset}`;
};
