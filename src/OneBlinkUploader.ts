import uploadToS3 from './uploadToS3'
import {
  AttachmentUploadData,
  StorageConstructorOptions,
  UploadAssetOptions,
  UploadFormSubmissionOptions,
  UploadOptions,
  UploadEmailAttachmentOptions,
  UploadPDFConversionOptions,
  UploadAiBuilderAttachmentOptions,
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
  getBearerToken: StorageConstructorOptions['getBearerToken']

  /**
   * #### Example
   *
   * ```typescript
   * import { OneBlinkUploader } from '@oneblink/uploads'
   *
   * const uploader = new OneBlinkUploader({
   *   apiOrigin: 'https://auth-api.blinkm.io',
   *   region: 'ap-southeast-2',
   *   getBearerToken: () => getAccessToken(),
   * })
   * ```
   */
  constructor(props: StorageConstructorOptions) {
    this.apiOrigin = props.apiOrigin
    this.region = props.region
    this.getBearerToken = props.getBearerToken
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
    formSubmissionDraftId,
    completionTimestamp,
    recaptchas = [],
    onProgress,
    abortSignal,
  }: UploadFormSubmissionOptions & {
    /**
     * The date and time (in ISO format) the form was completed I.e. when the
     * user clicked the submit button
     */
    completionTimestamp?: string
    /** The reCAPTCHA tokens to validate the submission */
    recaptchas?: {
      /** The site key that was used to generate the reCAPTCHA token */
      siteKey: string
      /** A reCAPTCHA token */
      token: string
    }[]
    /** The identifier of the draft to mark as submitted. */
    formSubmissionDraftId?: string
  }) {
    const newS3SubmissionData: SubmissionTypes.NewS3SubmissionData = {
      submission,
      definition,
      device,
      completionTimestamp,
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
      attachmentsAccessToken?: string
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
        jobId,
        previousFormSubmissionApprovalId,
        recaptchas,
        formSubmissionDraftId,
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
        username: username ? encodeURIComponent(username) : undefined,
        fileName: encodeURIComponent(fileName),
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
   *   formSubmissionDraftId: '',
   *   createdAt: new Date().toISOString(),
   *   title: '',
   *   onProgress: (progress) => {
   *     // ...
   *   },
   * })
   * ```
   *
   * @param data The submission upload data and options
   * @returns The upload result
   */
  async uploadFormSubmissionDraft({
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
    formSubmissionDraftId,
    createdAt,
    title,
    lastElementUpdated,
    sectionState,
    onProgress,
    abortSignal,
  }: UploadFormSubmissionOptions & {
    /** The identifier of the draft that a new version should be created for. */
    formSubmissionDraftId: string
    /**
     * The date and time (in ISO format) when the draft data was saved by a
     * user.
     */
    createdAt: string
    /** The title input by a user to identify the draft. */
    title: string
    /** The identifier for the last element that was used before saving draft */
    lastElementUpdated?: SubmissionTypes.NewS3SubmissionData['lastElementUpdated']
    /** The open/closed state of collapsible sections before saving draft */
    sectionState?: SubmissionTypes.NewS3SubmissionData['sectionState']
  }) {
    const newS3SubmissionData: SubmissionTypes.NewS3SubmissionData = {
      submission,
      definition,
      device,
      lastElementUpdated,
      sectionState,
    }
    const tags = generateFormSubmissionTags({
      userToken,
      previousFormSubmissionApprovalId,
      jobId,
    })

    tags.append('formSubmissionDraftId', formSubmissionDraftId)

    return await uploadToS3<SubmissionTypes.FormSubmissionDraftVersion>({
      ...this,
      contentType: 'application/json',
      body: JSON.stringify(newS3SubmissionData),
      key: 'form-submission-draft-versions',
      tags,
      abortSignal,
      onProgress,
      requestBodyHeader: {
        formsAppId,
        formId: definition.id,
        externalId,
        taskId,
        taskActionId,
        taskGroupInstanceId,
        jobId,
        previousFormSubmissionApprovalId,
        createdAt,
        title,
        formSubmissionDraftId,
      },
    })
  }

  /**
   * Upload an asset file. Asset files are always public.
   *
   * #### Example
   *
   * ```ts
   * const abortController = new AbortController()
   * const result = await uploader.uploadAsset({
   *   onProgress: (progress) => {
   *     // ...
   *   },
   *   data: new Blob(['a string of data'], {
   *     type: 'text/plain',
   *   }),
   *   fileName: 'file.txt',
   *   contentType: 'text/plain',
   *   abortSignal: abortController.signal,
   *   organisationId: 'abc123',
   * })
   * ```
   *
   * @param data The asset upload data and options
   * @returns The upload result
   */
  async uploadAsset({
    onProgress,
    abortSignal,
    data,
    contentType,
    fileName,
    organisationId,
  }: UploadOptions &
    UploadAssetOptions & {
      /** The identifier for the organisation that owns the asset */
      organisationId: string
    }) {
    return await uploadToS3<{
      url: string
    }>({
      ...this,
      contentType,
      body: data,
      key: `organisations/${organisationId}/assets`,
      abortSignal,
      onProgress,
      requestBodyHeader: {
        fileName: encodeURIComponent(fileName),
      },
      isPublic: true,
    })
  }

  /**
   * Upload an asset file for a product service such as Product Notifications.
   * Asset files are always public.
   *
   * #### Example
   *
   * ```ts
   * const abortController = new AbortController()
   * const result = await uploader.uploadAttachment({
   *   onProgress: (progress) => {
   *     // ...
   *   },
   *   data: new Blob(['a string of data'], {
   *     type: 'text/plain',
   *   }),
   *   fileName: 'file.txt',
   *   contentType: 'text/plain',
   *   abortSignal: abortController.signal,
   * })
   * ```
   *
   * @param data The asset upload data and options
   * @returns The upload result
   */
  async uploadProductAsset({
    onProgress,
    abortSignal,
    data,
    contentType,
    fileName,
  }: UploadOptions & UploadAssetOptions) {
    return await uploadToS3<{
      url: string
    }>({
      ...this,
      contentType,
      body: data,
      key: `administration/assets`,
      abortSignal,
      onProgress,
      requestBodyHeader: {
        fileName: encodeURIComponent(fileName),
      },
      isPublic: true,
    })
  }

  /**
   * Upload form prefill data.
   *
   * #### Example
   *
   * ```ts
   * const abortController = new AbortController()
   * const result = await uploader.uploadPrefillData({
   *   onProgress: (progress) => {
   *     // ...
   *   },
   *   data: {
   *     field1: 'abc',
   *     field2: 123,
   *   },
   *   formId: 12,
   *   abortSignal: abortController.signal,
   * })
   * ```
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
    return await uploadToS3<{
      preFillFormDataId: string
    }>({
      ...this,
      contentType: 'application/json',
      body: JSON.stringify(prefillData),
      key: `forms/${formId}/pre-fill`,
      abortSignal,
      onProgress,
    })
  }

  /**
   * Upload an email attachment. Email attachments are always private.
   *
   * #### Example
   *
   * ```ts
   * const abortController = new AbortController()
   * const result = await uploader.uploadEmailAttachment({
   *   onProgress: (progress) => {
   *     // ...
   *   },
   *   data: new Blob(['a string of data'], {
   *     type: 'text/plain',
   *   }),
   *   fileName: 'file.txt',
   *   contentType: 'text/plain',
   *   abortSignal: abortController.signal,
   * })
   * ```
   *
   * @param data The email attachment data and options
   * @returns The upload result
   */
  async uploadEmailAttachment({
    onProgress,
    abortSignal,
    data,
    contentType,
    fileName,
  }: UploadOptions & UploadEmailAttachmentOptions) {
    return await uploadToS3({
      ...this,
      contentType,
      body: data,
      key: 'email-attachments',
      abortSignal,
      onProgress,
      requestBodyHeader: {
        filename: encodeURIComponent(fileName),
      },
      isPublic: false,
    })
  }

  /**
   * Upload a PDF for conversion. PDF Conversions are always private.
   *
   * #### Example
   *
   * ```ts
   * const abortController = new AbortController()
   * const result = await uploader.uploadPDFConversion({
   *   onProgress: (progress) => {
   *     // ...
   *   },
   *   data: pdfData,
   *   formId: 1,
   *   abortSignal: abortController.signal,
   * })
   * ```
   *
   * @param data The PDF data and options
   * @returns The upload result
   */
  async uploadPDFConversion({
    onProgress,
    abortSignal,
    data,
    formId,
  }: UploadPDFConversionOptions) {
    return await uploadToS3({
      ...this,
      contentType: 'application/pdf',
      body: data,
      key: `forms/${formId}/pdf-conversion`,
      abortSignal,
      onProgress,
    })
  }

  /**
   * Upload an attachment for use with the AI builder.
   *
   * #### Example
   *
   * ```ts
   * const abortController = new AbortController()
   * const result = await uploader.uploadAiBuilderAttachment({
   *   onProgress: (progress) => {
   *     // ...
   *   },
   *   data: attachmentData,
   *   formId: 1,
   *   abortSignal: abortController.signal,
   * })
   * ```
   *
   * @param data The attachment data and options
   * @returns The upload result
   */
  async uploadAiBuilderAttachment({
    onProgress,
    abortSignal,
    data,
    formId,
    contentType,
    fileName,
  }: UploadAiBuilderAttachmentOptions) {
    return await uploadToS3({
      ...this,
      contentType,
      body: data,
      key: `forms/${formId}/ai-builder/attachments`,
      requestBodyHeader: {
        fileName: encodeURIComponent(fileName),
      },
      abortSignal,
      onProgress,
    })
  }

  /**
   * Upload a volunteer asset file. Asset files are always public.
   *
   * #### Example
   *
   * ```ts
   * const abortController = new AbortController()
   * const result = await uploader.uploadVolunteersAsset({
   *   onProgress: (progress) => {
   *     // ...
   *   },
   *   data: new Blob(['a string of data'], {
   *     type: 'text/plain',
   *   }),
   *   fileName: 'file.txt',
   *   contentType: 'text/plain',
   *   abortSignal: abortController.signal,
   *   formsAppId: 1,
   * })
   * ```
   *
   * @param data The asset upload data and options
   * @returns The upload result
   */
  async uploadVolunteersAsset({
    onProgress,
    abortSignal,
    data,
    contentType,
    fileName,
    formsAppId,
  }: UploadOptions &
    UploadAssetOptions & {
      /** The identifier for the volunteers app that owns the asset */
      formsAppId: number
    }) {
    return await uploadToS3<{
      url: string
    }>({
      ...this,
      contentType,
      body: data,
      key: 'volunteers/assets',
      abortSignal,
      onProgress,
      requestBodyHeader: {
        fileName: encodeURIComponent(fileName),
        formsAppId,
      },
      isPublic: true,
    })
  }
}
