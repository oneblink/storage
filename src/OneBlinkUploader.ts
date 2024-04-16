import uploadToS3 from './uploadToS3'
import { StorageConstructorOptions, UploadFormSubmissionOptions } from './types'
import { SubmissionTypes } from '@oneblink/types'
import generateFormSubmissionTags from './generateFormSubmissionTags'

/**
 * Used to create an instance of the OneBlinkUploader, exposing methods to
 * upload submissions and other types of files
 */
export class OneBlinkUploader {
  apiOrigin: StorageConstructorOptions['apiOrigin']
  region: StorageConstructorOptions['region']
  getIdToken: StorageConstructorOptions['getIdToken']

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
  constructor(props: StorageConstructorOptions) {
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
   *   submission: {
   *     // ...
   *   },
   *   definition: {
   *     // ...
   *   },
   *   formsAppId: 1,
   *   onProgress: (progress) => {
   *     // ...
   *   },
   * })
   * ```
   *
   * @param data The submission upload data and options
   * @returns The upload result
   */
  async uploadSubmission({
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
  }: UploadFormSubmissionOptions & {
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
    recaptchas?: {
      /** A reCAPTCHA token */
      token: string
    }[]
  }) {
    const newS3SubmissionData: SubmissionTypes.NewS3SubmissionData = {
      submission,
      definition,
      device,
    }
    const tags = generateFormSubmissionTags({
      userToken,
      previousFormSubmissionApprovalId,
      jobId,
    })

    return await uploadToS3<{
      submissionTimestamp: string
      submissionId: string
      pdfAccessToken?: string
      preventPayment: boolean
    }>({
      ...this,
      contentType: 'application/json',
      body: JSON.stringify(newS3SubmissionData),
      key: `forms/${definition.id}/submission`,
      tags,
      abortSignal,
      onProgress,
      requestBodyHeader: {
        formsAppId,
        externalId,
        taskId,
        taskActionId,
        taskGroupInstanceId,
        recaptchas: recaptchas || {},
        jobId,
        previousFormSubmissionApprovalId,
      },
    })
  }

  /**
   * Upload a draft submission.
   *
   * #### Example
   *
   * ```ts
   * const result = await uploader.uploadDraftSubmission({
   *   submission: {
   *     // ...
   *   },
   *   definition: {
   *     // ...
   *   },
   *   formsAppId: 1,
   *   onProgress: (progress) => {
   *     // ...
   *   },
   * })
   * ```
   *
   * @param data The submission upload data and options
   * @returns The upload result
   */
  async uploadDraftSubmission({
    submission,
    definition,
    device,
    userToken,
    previousFormSubmissionApprovalId,
    jobId,
    formsAppId,
    externalId,
    lastElementUpdated,
    onProgress,
    abortSignal,
  }: UploadFormSubmissionOptions & {
    /** The identifier for the last element that was used before saving draft */
    lastElementUpdated?: SubmissionTypes.NewS3SubmissionData['lastElementUpdated']
  }) {
    return await uploadToS3<{
      submissionTimestamp: string
      draftDataId: string
    }>({
      ...this,
      contentType: 'application/json',
      body: JSON.stringify({
        definition,
        submission,
        formsAppId,
        lastElementUpdated,
        externalId,
        device,
      }),
      key: `forms/${definition.id}/drafts`,
      tags: generateFormSubmissionTags({
        userToken,
        jobId,
        previousFormSubmissionApprovalId,
      }),
      abortSignal,
      onProgress,
    })
  }
}
