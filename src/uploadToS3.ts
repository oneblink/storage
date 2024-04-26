import { PutObjectCommandInput, S3Client } from '@aws-sdk/client-s3'
import { Upload, Progress } from '@aws-sdk/lib-storage'
import { StorageConstructorOptions, UploadOptions } from './types'
import OneBlinkStorageError from './OneBlinkStorageError'
import { RequestBodyHeader } from './http-handlers/types'
import { getOneBlinkHttpHandler } from './http-handlers'
import { OneBlinkRequestHandler } from './OneBlinkRequestHandler'

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
  tags = new URLSearchParams(),
  getBearerToken,
  onProgress,
  abortSignal,
  contentType,
  isPublic,
}: UploadToS3Props) {
  const oneBlinkHttpHandler = getOneBlinkHttpHandler()
  const oneBlinkRequestHandler = new OneBlinkRequestHandler<T>(
    oneBlinkHttpHandler,
    requestBodyHeader,
  )

  // The endpoint we use instead of the the AWS S3 endpoint is
  // formatted internally by the AWS S3 SDK. It will add the Bucket
  // parameter below as the subdomain to the URL (as long as the
  // bucket does not contain a `.`). The logic below allows the final
  // URL used to upload the object to be the origin that is passed in.
  // The suffix on the end is important as it will allow us to route
  // traffic to S3 via lambda at edge instead of going to our API.
  const url = new URL(endpointSuffix, apiOrigin)
  const [bucket, ...domainParts] = url.hostname.split('.')
  url.hostname = domainParts.join('.')

  const s3Client = new S3Client({
    endpoint: url.href,
    region: region,
    maxAttempts: RETRY_ATTEMPTS,
    requestHandler: oneBlinkRequestHandler,
    // Sign requests with our own Authorization header instead
    // of letting AWS SDK attempt to generate credentials
    signer: {
      sign: async (request) => {
        const token = await getBearerToken()
        if (token) {
          request.headers['authorization'] = 'Bearer ' + token
        }

        return request
      },
    },
  })

  if (isPublic) {
    tags.append('public-read', 'yes')
  }

  const managedUpload = new Upload({
    client: s3Client,
    partSize: 5 * 1024 * 1024,
    queueSize: oneBlinkHttpHandler.determineQueueSize(),
    //Related github issue: https://github.com/aws/aws-sdk-js-v3/issues/2311
    //This is a variable that is set to false by default, setting it to true
    //means that it will force the upload to fail when one part fails on
    //an upload. The S3 client has built in retry logic to retry uploads by default
    leavePartsOnError: true,
    params: {
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      ServerSideEncryption: 'AES256',
      Expires: new Date(new Date().setFullYear(new Date().getFullYear() + 1)), // Max 1 year
      CacheControl: 'max-age=31536000', // Max 1 year(365 days),
      ACL: 'bucket-owner-full-control',
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

  try {
    await managedUpload.done()
  } catch (error) {
    if (oneBlinkRequestHandler.failResponse) {
      throw new OneBlinkStorageError(
        oneBlinkRequestHandler.failResponse.message,
        {
          httpStatusCode: oneBlinkRequestHandler.failResponse.statusCode,
          originalError: error instanceof Error ? error : undefined,
        },
      )
    }
    throw error
  }

  if (!oneBlinkRequestHandler.oneblinkResponse) {
    throw new Error(
      'No response from server. Something went wrong in "@oneblink/uploads".',
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
