import { AvailableStock, ProductVariant } from "@vendure/core";
import { Writable } from "stream";
import { createCB } from "xmlbuilder2";
import { XMLBuilderCB } from "xmlbuilder2/lib/interfaces";
import { getAssetUrl, getProductUrl } from "../helpers";
import { Extra, ProductFeedStrategy } from "../types";

export class GoogleProductFeedStrategy
  implements ProductFeedStrategy
{
  private xml: XMLBuilderCB;

  private getAvailabiltiy(variant: ProductVariant, stock: AvailableStock) {
    if (variant.trackInventory === "TRUE") {
      stock.stockOnHand > 1 ? "in_stock" : "out_of_stock";
    }

    return "in_stock";
  }

  getExtention() {
    return "xml";
  }

  create(file: Writable, { channel }: Extra) {
    const xml = createCB({
      data: (text: string) => {
        file.write(text);
      },
      prettyPrint: true,
    });

    xml.on("end", () => {
      file.end();
    });

    const root = xml.dec({ version: "1.0" });

    const rssEl = root
      .ele("rss")
      .att("xmlns:g", "http://base.google.com/ns/1.0")
      .att("version", "2.0");

    const channelEle = rssEl.ele("channel");

    channelEle.ele("title").txt(`${channel.code} product catelog`).up();
    channelEle
      .ele("link")
      .txt(channel.customFields.productFeedShopUrl || "")
      .up();
    channelEle.ele("description").txt(`All products for ${channel.code}`).up();

    this.xml = channelEle;
  }

  addProduct(
    variant: ProductVariant,
    stock: AvailableStock,
    { channel, options }: Extra
  ): void {
    const item = this.xml.ele("item");

    item.ele("g:id").txt(variant.sku).up();
    item.ele("g:title").txt(variant.name).up();
    item.ele("g:description").txt(variant.product.description).up();

    item.ele("g:link").txt(getProductUrl(variant, channel, options)).up();

    const asset = variant.featuredAsset ?? variant.product.featuredAsset;
    if (asset) {
      item.ele("g:image_link").txt(getAssetUrl(asset.preview, options)).up();
    }

    item
      .ele("g:price")
      .txt(`${variant.priceWithTax / 100} ${variant.currencyCode}`)
      .up();

    const availablability = this.getAvailabiltiy(variant, stock);

    item.ele("g:availability").txt(availablability).up();

    item.up();
  }

  end() {
    this.xml.end();
  }
}
