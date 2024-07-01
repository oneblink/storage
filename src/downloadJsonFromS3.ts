import { GetObjectCommand, GetObjectCommandOutput } from '@aws-sdk/client-s3'
import { DownloadOptions, StorageConstructorOptions } from './types'
import { generateS3Client } from './generateS3Client'
import OneBlinkStorageError from './OneBlinkStorageError'

export default async function downloadJsonFromS3<T>({
  key,
  abortSignal,
  ...storageConstructorOptions
}: DownloadOptions &
  StorageConstructorOptions & {
    key: string
  }): Promise<T | undefined> {
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
            }),
            {
              abortSignal,
            },
          ),
      )

    return oneBlinkRequestHandler.oneBlinkHttpHandler.parseGetObjectCommandOutputAsJson<T>(
      getObjectCommandOutput,
    )
  } catch (error) {
    if (error instanceof OneBlinkStorageError && error.httpStatusCode === 403) {
      return
    } else {
      throw error
    }
  }
}
