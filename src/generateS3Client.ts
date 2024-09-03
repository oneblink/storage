import { S3Client } from '@aws-sdk/client-s3'
import { AwsCredentialIdentity } from '@smithy/types'
import { StorageConstructorOptions } from './types'
import { getOneBlinkHttpHandler } from './http-handlers'
import { OneBlinkRequestHandler } from './OneBlinkRequestHandler'
import { RequestBodyHeader } from './http-handlers/types'

const RETRY_ATTEMPTS = 3

export function generateS3Client<T>({
  region,
  apiOrigin,
  getBearerToken,
  requestBodyHeader,
}: StorageConstructorOptions & {
  requestBodyHeader?: RequestBodyHeader
}) {
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
  const url = new URL(apiOrigin)
  url.pathname = '/storage'
  const [bucket, ...domainParts] = url.hostname.split('.')
  url.hostname = domainParts.join('.')

  return {
    bucket,
    oneBlinkRequestHandler,
    s3Client: new S3Client({
      endpoint: url.href,
      region,
      maxAttempts: RETRY_ATTEMPTS,
      requestHandler: oneBlinkRequestHandler,
      credentials: {} as AwsCredentialIdentity,
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
    }),
  }
}
