import uploadToS3 from './uploadToS3'
import {
  AttachmentUploadData,
  StorageConstructorOptions,
  UploadFormSubmissionOptions,
  UploadOptions,
} from './types'
import { SubmissionTypes } from '@oneblink/types'
import generateFormSubmissionTags from './generateFormSubmissionTags'

/**
 * Used to create an instance of the OneBlinkUploader, exposing methods to
 * upload submissions and other types of files
 */
export default class OneBlinkUploader {
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
      key: `forms/${definition.id}/submissions`,
      tags,
      abortSignal,
      onProgress,
      requestBodyHeader: {
        formsAppId,
        externalId,
        taskId,
        taskActionId,
        taskGroupInstanceId,
        recaptchas: recaptchas || [],
        jobId,
        previousFormSubmissionApprovalId,
      },
    })
  }

  /**
   * Upload an form submission attachment.
   *
   * #### Example
   *
   * ```ts
   * const abortController = new AbortController()
   * const result = await uploader.uploadAttachment({
   *   formId: 1,
   *   data: new Blob(['a string of data'], {
   *     type: 'text/plain',
   *   }),
   *   fileName: 'file.txt',
   *   contentType: 'text/plain',
   *   isPrivate: true,
   *   abortSignal: abortController.signal,
   * })
   * ```
   *
   * @param data The attachment upload data and options
   * @returns The upload result
   */
  async uploadAttachment({
    formId,
    fileName,
    contentType,
    isPrivate,
    data,
    username,
    onProgress,
    abortSignal,
  }: UploadOptions & {
    /** The identifier for the form that is being completed */
    formId: number
    /** The name of the file being uploaded */
    fileName: string
    /** A standard MIME type describing the format of the contents */
    contentType: string
    /** Set to `true` to prevent the file from being downloaded publicly */
    isPrivate: boolean
    /** The file data to upload */
    data: AttachmentUploadData
    /** A username to allow a single user to download the attachment file */
    username?: string
  }) {
    return await uploadToS3<{
      url: string
      attachmentDataId: string
      uploadedAt: string
    }>({
      ...this,
      contentType,
      body: data,
      key: `forms/${formId}/attachments`,
      abortSignal,
      onProgress,
      isPublic: !isPrivate,
      contentDisposition: `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
      requestBodyHeader: {
        username,
        fileName,
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

  /**
   * Upload form prefill data.
   *
   * #### Example
   *
   * @param data The prefill upload data and options
   * @returns The upload result
   */
  async uploadPrefillData({
    formId,
    prefillData,
    onProgress,
    abortSignal,
  }: UploadOptions & {
    /** The identifier for the form that the prefill data is associated with */
    formId: number
    /** The prefill data to upload */
    prefillData: SubmissionTypes.NewS3SubmissionData['submission']
  }) {
    return await uploadToS3({
      ...this,
      contentType: 'application/json',
      body: JSON.stringify(prefillData),
      key: `forms/${formId}/prefill`,
      abortSignal,
      onProgress,
    })
  }
}
