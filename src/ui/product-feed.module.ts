import { NgModule } from "@angular/core";
import { SharedModule } from "@vendure/admin-ui/core";
import productFeedButton from "./providers/productFeedButton";
@NgModule({
  imports: [SharedModule],
  providers: [
    productFeedButton
  ],
})
export class ProductFeedModule {}