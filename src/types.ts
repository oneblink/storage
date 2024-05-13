import { PutObjectCommandInput } from '@aws-sdk/client-s3'
import { SubmissionTypes } from '@oneblink/types'

export type ProgressListenerEvent = { progress: number; total: number }
export type ProgressListener = (progress: ProgressListenerEvent) => void

/** The properties to be passed to the Storage class constructors */
export type StorageConstructorOptions = {
  /** The API origin URL used to communicate with the OneBlink API */
  apiOrigin: string
  /** The AWS region to upload the submission to */
  region: string
  /**
   * A function that returns a promise resolving to a Bearer token. If the
   * promise resolves to a truthy value, the `authorization` header will be set
   * with the value.
   */
  getBearerToken: () => Promise<string | undefined>
}

export type UploadOptions = {
  /** An optional progress listener for tracking the progress of the upload */
  onProgress?: ProgressListener
  /** An optional AbortSignal that can be used to abort the upload */
  abortSignal?: AbortSignal
}

export type AttachmentUploadData = NonNullable<PutObjectCommandInput['Body']>

export type UploadFormSubmissionOptions = UploadOptions & {
  /** The submission data */
  submission: SubmissionTypes.NewS3SubmissionData['submission']
  /** The form that is being submitted */
  definition: SubmissionTypes.NewS3SubmissionData['definition']
  /** The device the form is being submitted */
  device?: SubmissionTypes.NewS3SubmissionData['device']
  /** The identifier for the forms app that is being submitted from */
  formsAppId: number
  /** An encrypted token that represents the user */
  userToken?: string
  /** The external identifier that represents the submission */
  externalId?: string
  /**
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
}

export type UploadAssetOptions = UploadOptions & {
  /** The file data to upload */
  data: AttachmentUploadData
  /** A standard MIME type describing the format of the contents */
  contentType: string
  /** The name of the file being uploaded */
  fileName: string
}

export type UploadPDFConversionOptions = UploadOptions & {
  /** The PDF File to upload */
  data: AttachmentUploadData
  /** The id of the Form that the PDF Conversion is occurring on */
  formId: number
}

export type UploadEmailAttachmentOptions = UploadAssetOptions
