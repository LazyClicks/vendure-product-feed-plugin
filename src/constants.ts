import { PermissionDefinition } from '@vendure/core';

export const loggerCtx = 'ProductFeed';
export const PLUGIN_INIT_OPTIONS = Symbol('PLUGIN_INIT_OPTIONS');

export const productFeedPerm = new PermissionDefinition({
    name: 'ProductFeedRebuild',
    description: 'Allow to manually trigger a rebuild for the product  feed'
});