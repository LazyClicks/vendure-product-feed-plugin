import { AvailableStock, Channel, ProductVariant } from '@vendure/core';
import { Writable } from 'stream';

declare module '@vendure/core/dist/entity/custom-entity-fields' {
    interface CustomChannelFields {
        productFeedRebuild: boolean;
        productFeedFile?: string;
        productFeedShopUrl?: string;
        productFeedOutput: 'disabled' | 'url' | 'sftp';
        productFeedSftpServer?: string;
        productFeedSftpPort?: number;
        productFeedSftpUser?: string;
        productFeedSftpPassword?: string;
    }
}

export type ProductFeedStrategyOptions = {
    assetUrlPrefix: string;
    productUrl: (shopUrl: string, variant: ProductVariant) => string;
}

export type Extra = { channel: Channel, options: ProductFeedStrategyOptions}
export declare class ProductFeedStrategy {
    constructor();
    getExtention: () => string
    create(file: Writable, extra: Extra): void
    addProduct(variant: ProductVariant, stock: AvailableStock, extra: Extra): void
    end(extra: Extra): void
}

interface IProductFeedStrategy {
    new(): ProductFeedStrategy
}

type FeedStrategy = {
    getFileName: (channel: Channel) => string
    strategy: IProductFeedStrategy
}
export interface ProductFeedPluginOptions extends ProductFeedStrategyOptions {
    feedStrategy: FeedStrategy,
    folder?: string
  }