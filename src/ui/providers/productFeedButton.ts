import { addActionBarItem } from "@vendure/admin-ui/core";
import gql from "graphql-tag";
import { firstValueFrom } from "rxjs";

export default addActionBarItem({
      id: "productFeedButton",
      label: "Rebuild product feed ",
      locationId: "product-list",
      onClick: async (_event, context) => {
        try {
          await firstValueFrom(
            context.dataService.mutate(gql`
              mutation RebuildProduct {
                rebuildProduct {
                  id
                  state
                }
              }
            `)
          );
          context.notificationService.success("Rebuilding product feed ");
        } catch (error) {
          context.notificationService.error("Error rebuilding product feed ");
        }
      },
      requiresPermission: "ProductFeedRebuild",
      buttonState: (context) => {
        return context.dataService
          .query<{
            activeChannel: { customFields: { productOutput: string } };
          }>(
            gql`
              query {
                activeChannel {
                  customFields {
                    productOutput
                  }
                }
              }
            `
          )
          .mapSingle((data) => {
            return {
              disabled: false,
              visible:
                data.activeChannel.customFields.productOutput !=
                "disabled",
            };
          });
      },
    })