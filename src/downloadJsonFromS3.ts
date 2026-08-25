import { GetObjectCommand, GetObjectCommandOutput } from '@aws-sdk/client-s3'
import { DownloadOptions, StorageConstructorOptions } from './types.js'
import { generateS3Client } from './generateS3Client.js'
import OneBlinkStorageError from './OneBlinkStorageError.js'

export type DownloadedJson<T> = {
  data: T
  versionId: string | undefined
}

export async function downloadJsonFromS3WithMetadata<T>({
  key,
  abortSignal,
  versionId,
  ...storageConstructorOptions
}: DownloadOptions &
  StorageConstructorOptions & {
    key: string
    versionId?: string
  }): Promise<DownloadedJson<T> | undefined> {
  const { s3Client, bucket, oneBlinkRequestHandler } = generateS3Client({
    ...storageConstructorOptions,
    requestBodyHeader: undefined,
  })

  try {
    const getObjectCommandOutput =
      await oneBlinkRequestHandler.sendS3Command<GetObjectCommandOutput>(
        async () =>
          await s3Client.send(
            new GetObjectCommand({
              Bucket: bucket,
              Key: key,
              VersionId: versionId,
            }),
            {
              abortSignal,
            },
          ),
      )

    const data =
      await oneBlinkRequestHandler.oneBlinkHttpHandler.parseGetObjectCommandOutputAsJson<T>(
        getObjectCommandOutput,
      )
    return data === undefined
      ? undefined
      : {
          data,
          versionId: getObjectCommandOutput.VersionId,
        }
  } catch (error) {
    if (error instanceof OneBlinkStorageError && error.httpStatusCode === 403) {
      return
    } else {
      throw error
    }
  }
}

export default async function downloadJsonFromS3<T>(
  options: Parameters<typeof downloadJsonFromS3WithMetadata<T>>[0],
): Promise<T | undefined> {
  return (await downloadJsonFromS3WithMetadata<T>(options))?.data
}
