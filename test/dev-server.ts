import { GoogleProductFeedStrategy } from "./../src/strategy/google-product-feed-strategy";
import { createSftpMockServer } from "@micham/sftp-mock-server";
import { AdminUiPlugin } from "@vendure/admin-ui-plugin";
import { AssetServerPlugin } from "@vendure/asset-server-plugin";
import {
  DefaultLogger,
  DefaultSearchPlugin,
  LogLevel,
  Logger,
  mergeConfig,
} from "@vendure/core";
import {
  SqljsInitializer,
  createTestEnvironment,
  registerInitializer,
  testConfig,
} from "@vendure/testing";
import { compileUiExtensions } from "@vendure/ui-devkit/compiler";
import { gql } from "graphql-tag";
import path from "path";
import { initialData } from "./data/initial-data";
import {
  ProductFeedPlugin,
  ProductFeedBuilderService,
} from "../src";

require("dotenv").config();

const sftpConfig = {
  port: 9999,
  hostname: "127.0.0.1",
  user: "alice",
  password: "password",
};

(async () => {
  const mockServer = await createSftpMockServer({
    port: sftpConfig.port.toString(),
    hostname: sftpConfig.hostname,
    users: { [sftpConfig.user]: { password: sftpConfig.password } },
    debug: Logger.debug,
  });

  process.on("exit", () => {
    mockServer.close();
    console.log("SFTP server closed");
  });

  registerInitializer(
    "sqljs",
    new SqljsInitializer(path.join(__dirname, "./.data"))
  );

  const devConfig = mergeConfig(testConfig, {
    logger: new DefaultLogger({ level: LogLevel.Debug }),
    plugins: [
      AssetServerPlugin.init({
        assetUploadDir: path.join(__dirname, ".data/assets"),
        route: "assets",
      }),
      ProductFeedPlugin.init({
        assetUrlPrefix: "http://localhost:3050/assets",
        folder: "custom-product-",
        feedStrategy: {
          getFileName: (channel) => `google-${channel.code}`,
          strategy: GoogleProductFeedStrategy,
        },
      }),
      DefaultSearchPlugin,
      AdminUiPlugin.init({
        port: 3002,
        route: "admin",
        app: compileUiExtensions({
          outputPath: path.join(__dirname, "../admin-ui"),
          extensions: [ProductFeedPlugin.ui],
          devMode: true,
        }),
      }),
    ],
    apiOptions: {
      shopApiPlayground: true,
      adminApiPlayground: true,
    },
  });
  const { server, adminClient } = createTestEnvironment(devConfig);

  await server.init({
    initialData,
    productsCsvPath: path.join(__dirname, "./data/products-import.csv"),
  });

  await adminClient.asSuperAdmin();

  const updateChannelMutation = gql`
    mutation UpdateChannel($input: UpdateChannelInput!) {
      updateChannel(input: $input) {
        ... on Channel {
          id
        }
      }
    }
  `;

  await adminClient.query(updateChannelMutation, {
    input: {
      id: "T_1",
      customFields: {
        productFeedOutput: "sftp",
        productFeedShopUrl: "https://www.shop.com",
        productFeedSftpServer: sftpConfig.hostname,
        productFeedSftpPort: sftpConfig.port,
        productFeedSftpUser: sftpConfig.user,
        productFeedSftpPassword: sftpConfig.password,
      },
    },
  });

  const updateMutation = gql`
    mutation {
      updateProduct(
        input: {
          id: "T_1"
          translations: [{ languageCode: en, name: "New name test" }]
        }
      ) {
        id
        name
      }
    }
  `;
  await adminClient.query(updateMutation);

  await server.app.get(ProductFeedBuilderService).buildAllFeeds();
})();
