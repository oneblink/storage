import { PutObjectCommandInput } from '@aws-sdk/client-s3'
import { Upload, Progress } from '@aws-sdk/lib-storage'
import { StorageConstructorOptions, UploadOptions } from './types'
import { RequestBodyHeader } from './http-handlers/types'
import { generateS3Client } from './generateS3Client'

/** The properties to be passed to the uploadToS3 function */
interface UploadToS3Props extends UploadOptions, StorageConstructorOptions {
  /** The key of the file that is being uploaded. */
  key: string
  /**
   * The body of the request. This can be a string, a Buffer, a Blob, a
   * ReadableStream, or a Readable.
   */
  body: PutObjectCommandInput['Body']
  /** Optional header to be included in the request to the OneBlink API */
  requestBodyHeader?: RequestBodyHeader
  /** An optional set of tags that will be applied to the uploaded file */
  tags?: URLSearchParams
  /** A standard MIME type describing the format of the contents */
  contentType: PutObjectCommandInput['ContentType']
  /** Set to `true` to make the upload available to download publicly */
  isPublic?: boolean
}

async function uploadToS3<T>({
  key,
  body,
  tags = new URLSearchParams(),
  onProgress,
  abortSignal,
  contentType,
  isPublic,
  ...storageConstructorOptions
}: UploadToS3Props) {
  const { s3Client, bucket, oneBlinkRequestHandler } = generateS3Client<T>(
    storageConstructorOptions,
  )

  if (isPublic) {
    tags.append('public-read', 'yes')
  }

  const managedUpload = new Upload({
    client: s3Client,
    partSize: 5 * 1024 * 1024,
    queueSize:
      oneBlinkRequestHandler.oneBlinkHttpHandler.determineUploadQueueSize(),
    // Related github issue: https://github.com/aws/aws-sdk-js-v3/issues/2311
    // This is a variable that is set to false by default, setting it to true
    // means that it will force the upload to fail when one part fails on
    // an upload. The S3 client has built in retry logic to retry uploads by default
    leavePartsOnError: true,
    params: {
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      Tagging: tags.toString(),
    },
  })

  managedUpload.on('httpUploadProgress', (progress) => {
    if (onProgress && progress.total) {
      const percent = determineUploadProgressAsPercentage({
        ...progress,
        total: progress.total,
      })
      onProgress({ progress: percent, total: 100 })
    }
  })

  abortSignal?.addEventListener('abort', () => {
    managedUpload.abort()
  })

  await oneBlinkRequestHandler.sendS3Command(
    async () => await managedUpload.done(),
  )

  if (!oneBlinkRequestHandler.oneblinkResponse) {
    throw new Error(
      'No response from server. Something went wrong in "@oneblink/storage".',
    )
  }
  return oneBlinkRequestHandler.oneblinkResponse
}

export default uploadToS3

export const determineUploadProgressAsPercentage = (
  progress: Required<Pick<Progress, 'total'>> & Omit<Progress, 'total'>,
) => {
  const percent = ((progress.loaded || 0) / progress.total) * 100
  return Math.floor(percent)
}
