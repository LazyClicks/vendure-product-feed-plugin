import { Injectable, OnModuleInit } from "@nestjs/common";
import {
  Channel,
  ConfigService,
  ID,
  JobQueue,
  JobQueueService,
  RequestContext,
  TransactionalConnection,
} from "@vendure/core";
import Client from "ssh2-sftp-client";

@Injectable()
export class ProductFeedUploadService implements OnModuleInit {
  private jobQueue: JobQueue<{
    channelId: ID;
    filePath: string;
    fileName: string;
  }>;
  private sftpClient: Client;

  constructor(
    private jobQueueService: JobQueueService,
    private connection: TransactionalConnection,
    private configService: ConfigService
  ) {
    this.sftpClient = new Client();
  }

  async onModuleInit() {
    this.jobQueue = await this.jobQueueService.createQueue({
      name: "product-feed-upload",
      process: async (job) => {
        const sftpConfig = await this.getSftpConfigFromChannel(
          job.data.channelId
        );

        if (!sftpConfig) {
          job.fail(new Error("SFTP config is not set correctly"));
          return;
        }

        return this.doUploadToSftp(
          sftpConfig,
          job.data.filePath,
          job.data.fileName
        );
      },
    });
  }

  public async uploadToSftp(
    channel: Channel,
    filePath: string,
    fileName: string
  ) {
    return this.jobQueue.add({ channelId: channel.id, filePath, fileName });
  }

  private async doUploadToSftp(
    sftConfig: {
      host: string;
      port: number;
      username: string;
      password: string;
    },
    filePath: string,
    fileName: string
  ): Promise<{ file: string }> {
    await this.sftpClient.connect(sftConfig);

    await this.sftpClient.delete(fileName, true);
    await this.sftpClient.put(Buffer.from(filePath), fileName);
    await this.sftpClient.end();

    return {
      file: fileName,
    };
  }

  async getXmlFromChannel(ctx: RequestContext) {
    const channel = await this.connection
      .getRepository(ctx, Channel)
      .findOneOrFail({ where: { id: ctx.channelId } });

    const { assetOptions } = this.configService;
    const { assetStorageStrategy } = assetOptions;

    return (
      channel.customFields.productFeedFile &&
      assetStorageStrategy.readFileToBuffer(
        channel.customFields.productFeedFile
      )
    );
  }

  private async getSftpConfigFromChannel(channelId: ID) {
    const channel = await this.connection.rawConnection
      .getRepository(Channel)
      .findOneOrFail({ where: { id: channelId } });

    if (
      !channel.customFields.productFeedSftpServer ||
      !channel.customFields.productFeedSftpPort ||
      !channel.customFields.productFeedSftpUser ||
      !channel.customFields.productFeedSftpPassword
    ) {
      return null;
    }

    return {
      host: channel.customFields.productFeedSftpServer,
      port: channel.customFields.productFeedSftpPort,
      username: channel.customFields.productFeedSftpUser,
      password: channel.customFields.productFeedSftpPassword,
    };
  }
}
