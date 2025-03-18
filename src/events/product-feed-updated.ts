import { RequestContext, VendureEvent } from "@vendure/core";

/**
 * @description
 * This event is fired whenever a ProductReview is submitted.
 */
export class ProductFeedUpdatedEvent extends VendureEvent {
  constructor(
    public ctx: RequestContext,
    public fileName: string,
    public filePath: string
  ) {
    super();
  }
}
