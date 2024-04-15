import uploadToS3, { UploadToS3Props } from './uploadToS3'
import { OneBlinkUploaderProps, ProgressListener } from './types'
import { SubmissionTypes } from '@oneblink/types'

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
    submission,
    definition,
    device,
    userToken,
    previousFormSubmissionApprovalId,
    jobId,
    formsAppId,
    externalId,
    taskId,
    taskActionId,
    taskGroupInstanceId,
    recaptchas,
    onProgress,
    abortSignal,
  }: {
    /** The submission data */
    submission: SubmissionTypes.NewS3SubmissionData['submission']
    /** The form that is being submitted */
    definition: SubmissionTypes.NewS3SubmissionData['definition']
    /** The device the form is being submitted */
    device?: SubmissionTypes.NewS3SubmissionData['device']
    /** The identifier for the forms app that is being submitted from */
    formsAppId?: number
    /** An encrypted token that represents the user */
    userToken?: string
    /** The external identifier that represents the submission */
    externalId?: string /**
     * The identifier for the previous FormSubmissionApproval that lead to a
     * clarification request
     */
    previousFormSubmissionApprovalId?: string
    /** The identifier of the job that will be marked as submitted */
    jobId?: string
    /** The identifier of the task that will be marked as completed */
    taskId?: string
    /** The identifier of the task action that was used to complete the task */
    taskActionId?: string
    /**
     * The identifier of the task group instance that the completed task is
     * associated with
     */
    taskGroupInstanceId?: string
    /** The reCAPTCHA tokens to validate the submission */
    recaptchas: {
      /** A reCAPTCHA token */
      token: string
    }[]
  } & Pick<UploadToS3Props, 'onProgress' | 'abortSignal'>) {
    const newS3SubmissionData: SubmissionTypes.NewS3SubmissionData = {
      submission,
      definition,
      device,
    }
    return uploadToS3<{
      submissionTimestamp: string
      submissionId: string
      pdfAccessToken?: string
      preventPayment: boolean
    }>({
      ...this,
      body: JSON.stringify(newS3SubmissionData),
      key: `forms/${definition.id}/submission`,
      tags: {
        userToken,
        previousFormSubmissionApprovalId,
        jobId,
      },
      abortSignal,
      onProgress,
      requestBodyHeader: {
        formsAppId,
        externalId,
        taskId,
        taskActionId,
        taskGroupInstanceId,
        recaptchas,
        jobId,
        previousFormSubmissionApprovalId,
      },
    })
  }

  // TODO: Add other upload types
  // `forms/${formId}/attachment` === uploading attachment submission
  // `organisations/${organisationId}/assets/${fileName}` === uploading asset e.g. public app image
}

export { ProgressListener }
