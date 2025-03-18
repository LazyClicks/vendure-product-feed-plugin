import { Mutation, Resolver } from "@nestjs/graphql";
import { Allow, Ctx, RequestContext } from "@vendure/core";
import { productFeedPerm } from "../constants";
import { ProductFeedBuilderService } from "../service/product-feed-builder.service";

@Resolver()
export class ProductAdminResolver {
  constructor(
    private productFeedBuilderService: ProductFeedBuilderService
  ) {}

  @Mutation()
  @Allow(productFeedPerm.Permission)
  async rebuildProduct(@Ctx() ctx: RequestContext) {
    return this.productFeedBuilderService.addChannelRebuildToQueue(
      ctx.channelId
    );
  }
}
