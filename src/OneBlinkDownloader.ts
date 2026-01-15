import { DownloadOptions, StorageConstructorOptions } from './types.js'
import downloadJsonFromS3 from './downloadJsonFromS3.js'
import { SubmissionTypes } from '@oneblink/types'
/**
 * Used to create an instance of the OneBlinkDownloader, exposing methods to
 * download submissions and other types of files
 */
export default class OneBlinkDownloader {
  apiOrigin: StorageConstructorOptions['apiOrigin']
  region: StorageConstructorOptions['region']
  getBearerToken: StorageConstructorOptions['getBearerToken']

  /**
   * #### Example
   *
   * ```typescript
   * import { OneBlinkDownloader } from '@oneblink/storage'
   *
   * const downloader = new OneBlinkDownloader({
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
   * Download a form submission.
   *
   * #### Example
   *
   * ```ts
   * const result = await downloader.downloadSubmission({
   *   submissionId: '5ad46e62-f466-451c-8cd6-29ba23ac50b7',
   *   formId: 1,
   *   abortSignal: new AbortController().signal,
   * })
   * ```
   *
   * @param data The submission upload data and options
   * @returns The submission
   */
  async downloadSubmission({
    submissionId,
    formId,
    abortSignal,
  }: DownloadOptions & {
    /** The identifier of the submission. */
    submissionId: string
    /** The identifier of the form associated with the submission. */
    formId: number
  }) {
    return await downloadJsonFromS3<SubmissionTypes.S3SubmissionData>({
      ...this,
      key: `forms/${formId}/submissions/${submissionId}`,
      abortSignal,
    })
  }

  /**
   * Download a draft form submission.
   *
   * #### Example
   *
   * ```ts
   * const result = await downloader.downloadDraftSubmission({
   *   formSubmissionDraftVersionId: '5ad46e62-f466-451c-8cd6-29ba23ac50b7',
   *   formId: 1,
   *   abortSignal: new AbortController().signal,
   * })
   * ```
   *
   * @param data The submission upload data and options
   * @returns The submission
   */
  async downloadDraftSubmission({
    formSubmissionDraftVersionId,
    abortSignal,
  }: DownloadOptions & {
    /** The identifier of the draft form submission version. */
    formSubmissionDraftVersionId: string
  }) {
    return await downloadJsonFromS3<SubmissionTypes.S3SubmissionData>({
      ...this,
      key: `form-submission-draft-versions/${formSubmissionDraftVersionId}`,
      abortSignal,
    })
  }

  /**
   * Download pre-fill form submission data.
   *
   * #### Example
   *
   * ```ts
   * const result = await downloader.downloadPrefillData({
   *   preFillFormDataId: '5ad46e62-f466-451c-8cd6-29ba23ac50b7',
   *   formId: 1,
   *   abortSignal: new AbortController().signal,
   * })
   * ```
   *
   * @param data The submission upload data and options
   * @returns The submission
   */
  async downloadPrefillData<T extends Record<string, unknown>>({
    preFillFormDataId,
    formId,
    abortSignal,
  }: DownloadOptions & {
    /** The identifier of the pre-fill data. */
    preFillFormDataId: string
    /** The identifier of the form associated with the pre-fill data. */
    formId: number
  }) {
    return await downloadJsonFromS3<T>({
      ...this,
      key: `forms/${formId}/pre-fill/${preFillFormDataId}`,
      abortSignal,
    })
  }
}
