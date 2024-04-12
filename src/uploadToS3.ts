import { PutObjectCommandInput, S3Client, Tag } from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'
import { HttpHandlerOptions } from '@smithy/types'
import { HttpRequest } from '@smithy/protocol-http'
import { FetchHttpHandler } from '@smithy/fetch-http-handler'
import { OneBlinkUploaderProps, ProgressListener } from './types'
import { AWSTypes } from '@oneblink/types'

const RETRY_ATTEMPTS = 3

export type BaseResponse = {
  s3: AWSTypes.S3Configuration
}
type RequestBodyHeader = Record<string, unknown>
// Our own custom request handler to allow setting customer headers for
// authentication. Also allow the response header which includes dynamic
// data from the lambda at edge to be retrieved and held for later when
// the upload has completed.
class OBRequestHandler<T> extends FetchHttpHandler {
  constructor({
    getIdToken,
    requestBodyHeader,
  }: {
    getIdToken: OneBlinkUploaderProps['getIdToken']
    requestBodyHeader?: RequestBodyHeader
  }) {
    super()
    this.getIdToken = getIdToken
    this.requestBodyHeader = requestBodyHeader
  }

  getIdToken: OneBlinkUploaderProps['getIdToken']
  requestBodyHeader?: RequestBodyHeader
  response?: T & BaseResponse

  async handle(request: HttpRequest, options?: HttpHandlerOptions) {
    const token = await this.getIdToken()
    if (token) {
      request.headers['x-oneblink-authorization'] = 'Bearer ' + token
    }
    if (this.requestBodyHeader) {
      request.headers['x-oneblink-request-body'] = JSON.stringify(
        this.requestBodyHeader,
      )
    }
    if (this.response) {
      request.query['key'] = this.response.s3.key
    }
    const result = await super.handle(request, options)
    console.log('result', result)
    const response = result.response.headers['x-oneblink-response'] as
      | string
      | undefined
    if (response) {
      this.response = JSON.parse(response)
    }
    return result
  }
}

const endpointSuffix = '/storage'

export interface UploadToS3Props {
  key: string
  body: PutObjectCommandInput['Body']
  requestBodyHeader?: RequestBodyHeader
  tags: Record<string, string | undefined>
  onProgress?: ProgressListener
  abortSignal?: AbortSignal
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
}: OneBlinkUploaderProps & UploadToS3Props) {
  try {
    const requestHandler = new OBRequestHandler<T>({
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

    const managedUpload = new Upload({
      client: s3Client,
      partSize: 5 * 1024 * 1024,
      queueSize: determineQueueSize(),
      tags: Object.entries(tags).reduce<Tag[]>((memo, [Key, Value]) => {
        if (!!Key && !!Value) {
          memo.push({ Key, Value })
        }
        return memo
      }, []),
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
        Bucket: 'storage.test.oneblink.io',
        Key: key,
        Body: body,
        ContentType: 'application/json',
        ServerSideEncryption: 'AES256',
        Expires: new Date(new Date().setFullYear(new Date().getFullYear() + 1)), // Max 1 year
        CacheControl: 'max-age=31536000', // Max 1 year(365 days),
        ACL: 'private',
      },
    })

    managedUpload.on('httpUploadProgress', (progress) => {
      console.log('Progress', progress)
      if (onProgress && progress.total) {
        const percent = ((progress.loaded || 0) / progress.total) * 100
        onProgress({ progress: Math.floor(percent), total: 100 })
      }
    })

    abortSignal?.addEventListener('abort', () => {
      managedUpload.abort()
    })

    await managedUpload.done()

    if (!requestHandler.response) {
      throw new Error(
        'No response from server. Something went wrong in the OneBlink/uploads SDK.',
      )
    }
    return requestHandler.response
  } catch (err) {
    if (abortSignal?.aborted) {
      return
    }
    throw err
  }
}

export default uploadToS3

const determineQueueSize = () => {
  let queueSize = 1 // default to 1 as the lowest common denominator
  // Return as though using highest speed for Node environments
  if (!window) return 10
  if (
    window.navigator &&
    'connection' in window.navigator &&
    !!window.navigator.connection &&
    // @ts-expect-error effectiveType prop is still in draft
    window.navigator.connection.effectiveType
  ) {
    // @ts-expect-error effectiveType prop is still in draft
    switch (window.navigator.connection.effectiveType) {
      case 'slow-2g':
      case '2g':
        queueSize = 1
        break
      case '3g':
        queueSize = 2
        break
      case '4g':
        queueSize = 10
        break
    }
  }

  return queueSize
}
