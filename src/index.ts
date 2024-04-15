import uploadToS3, { UploadToS3Props } from './uploadToS3'
import { OneBlinkUploaderProps, ProgressListener } from './types'
import { SubmissionEventTypes, SubmissionTypes } from '@oneblink/types'

/**
 * Used to create an instance of the OneBlinkUploader, exposing methods to
 * upload submissions and other types of files
 */
export class OneBlinkUploader {
  apiOrigin: OneBlinkUploaderProps['apiOrigin']
  region: OneBlinkUploaderProps['region']
  getIdToken: OneBlinkUploaderProps['getIdToken']

  /**
   * #### Example
   *
   * ```typescript
   * import { OneBlinkUploader } from '@oneblink/uploads'
   *
   * const uploader = new OneBlinkUploader({
   *   apiOrigin: 'https://auth-api.blinkm.io',
   *   region: 'ap-southeast-2',
   *   getIdToken: () => getAccessToken(),
   * })
   * ```
   */
  constructor(props: OneBlinkUploaderProps) {
    this.apiOrigin = props.apiOrigin
    this.region = props.region
    this.getIdToken = props.getIdToken
  }

  /**
   * Upload a submission.
   *
   * #### Example
   *
   * ```ts
   * const result = await uploader.uploadSubmission({
   *   body: {
   *     // ...
   *   },
   *   onProgress: (progress) => {
   *     // ...
   *   },
   *   formId: 123,
   *   tags: {
   *     // ...
   *   },
   *   requestBodyHeader: {
   *     // ...
   *   },
   * })
   * ```
   *
   * @param data The submission upload data and options
   * @returns The upload result
   */
  uploadSubmission({
    body,
    formId,
    ...props
  }: {
    /** The submission data */
    body: SubmissionTypes.NewS3SubmissionData
    /** The ID of the form the submission belongs to */
    formId: number
    /** Tags associated with the uploaded object */
    tags: SubmissionEventTypes.S3SubmissionTags
    /**
     * A header to be included in the upload request used to create the
     * submission meta
     */
    requestBodyHeader: {
      formsAppId?: number
      externalId?: string
      previousFormSubmissionId?: string
      jobId?: string
      taskId?: string
      taskActionId?: string
      taskGroupInstanceId?: string
      recaptchas: {
        token: string
      }[]
    }
  } & Pick<UploadToS3Props, 'onProgress' | 'abortSignal'>) {
    console.log('Uploading submission...')

    return uploadToS3<{
      submissionTimestamp: string
      submissionId: string
      pdfAccessToken?: string
      preventPayment: boolean
    }>({
      ...this,
      body: JSON.stringify(body),
      key: `forms/${formId}/submission`,
      ...props,
    })
  }

  // TODO: Add other upload types
  // `forms/${formId}/attachment` === uploading attachment submission
  // `organisations/${organisationId}/assets/${fileName}` === uploading asset e.g. public app image
}

export { ProgressListener }
