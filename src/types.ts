import { AWSTypes } from '@oneblink/types'

export type ProgressListenerEvent = { progress: number; total: number }
export type ProgressListener = (progress: ProgressListenerEvent) => void

/** The properties to be passed to the OneBlinkUploader class */
export type OneBlinkUploaderProps = {
  /** The API origin URL used to communicate with the OneBlink API */
  apiOrigin: string
  /** The AWS region to upload the submission to */
  region: string
  /**
   * A function that returns a promise resolving to an access token. If the
   * promise resolves to a truthy value, the `x-oneblink-authorization` header
   * will be set with the value.
   */
  getIdToken: () => Promise<string | undefined>
}

export type BaseResponse = {
  s3: AWSTypes.S3Configuration
}
