import { PutObjectCommandInput, S3Client } from '@aws-sdk/client-s3'
import { Upload, Progress } from '@aws-sdk/lib-storage'
import { StorageConstructorOptions, UploadOptions } from './types'
import OneBlinkStorageError from './OneBlinkStorageError'
import { getRequestHandler } from './http-handlers'
import { RequestBodyHeader } from './http-handlers/types'

const RETRY_ATTEMPTS = 3

const endpointSuffix = '/storage'

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
  region,
  apiOrigin,
  key,
  body,
  requestBodyHeader,
  tags,
  getIdToken,
  onProgress,
  abortSignal,
  contentType,
  isPublic,
}: UploadToS3Props) {
  const RequestHandler = getRequestHandler()
  const requestHandler = new RequestHandler<T>({
    getIdToken,
    requestBodyHeader,
  })

  const s3Client = new S3Client({
    // The suffix on the end is important as it will allow us to route
    // traffic to S3 via lambda at edge instead of going to our API
    endpoint: `${apiOrigin}${endpointSuffix}`,
    region: region,
    requestHandler,
    // Have to put something here otherwise the SDK throws errors.
    // Might be able to remove the validation from the middleware somehow?
    credentials: {
      accessKeyId: 'AWS_ACCESS_KEY_ID',
      secretAccessKey: 'AWS_SECRET_ACCESS_KEY',
    },
    maxAttempts: RETRY_ATTEMPTS,
  })

  if (isPublic) {
    if (!tags) {
      tags = new URLSearchParams()
    }
    tags?.append('public-read', 'yes')
  }

  const managedUpload = new Upload({
    client: s3Client,
    partSize: 5 * 1024 * 1024,
    queueSize: requestHandler.determineQueueSize(),
    //Related github issue: https://github.com/aws/aws-sdk-js-v3/issues/2311
    //This is a variable that is set to false by default, setting it to true
    //means that it will force the upload to fail when one part fails on
    //an upload. The S3 client has built in retry logic to retry uploads by default
    leavePartsOnError: true,
    params: {
      // Bucket needs to have something to avoid client side errors
      // Also needs to have a `.` in it to prevent SDK from using the
      // new S3 bucket domain concept with includes the bucket in the
      // domain instead of the path. We need it in the path to use the
      // API as the domain.
      Bucket: apiOrigin.split('.').slice(-2).join('.'),
      Key: key,
      Body: body,
      ContentType: contentType,
      ServerSideEncryption: 'AES256',
      Expires: new Date(new Date().setFullYear(new Date().getFullYear() + 1)), // Max 1 year
      CacheControl: 'max-age=31536000', // Max 1 year(365 days),
      ACL: 'bucket-owner-full-control',
      Tagging: tags?.toString(),
    },
  })

  managedUpload.on('httpUploadProgress', (progress) => {
    console.log('S3 upload progress for key', key, progress)
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

  try {
    await managedUpload.done()
  } catch (error) {
    if (requestHandler.failResponse) {
      throw new OneBlinkStorageError(requestHandler.failResponse.message, {
        httpStatusCode: requestHandler.failResponse.statusCode,
        originalError: error instanceof Error ? error : undefined,
      })
    }
    throw error
  }

  if (!requestHandler.oneblinkResponse) {
    throw new Error(
      'No response from server. Something went wrong in "@oneblink/uploads".',
    )
  }
  return requestHandler.oneblinkResponse
}

export default uploadToS3

export const determineUploadProgressAsPercentage = (
  progress: Required<Pick<Progress, 'total'>> & Omit<Progress, 'total'>,
) => {
  const percent = ((progress.loaded || 0) / progress.total) * 100
  return Math.floor(percent)
}
