import uploadToS3, { UploadToS3Props } from './uploadToS3'
import { OneBlinkUploaderProps, ProgressListener } from './types'
import { SubmissionEventTypes, SubmissionTypes } from '@oneblink/types'

class OneBlinkUploader {
  apiOrigin: OneBlinkUploaderProps['apiOrigin']
  region: OneBlinkUploaderProps['region']
  getIdToken: OneBlinkUploaderProps['getIdToken']

  constructor({ apiOrigin, region, getIdToken }: OneBlinkUploaderProps) {
    this.apiOrigin = apiOrigin
    this.region = region
    this.getIdToken = getIdToken
  }

  uploadSubmission({
    body,
    formId,
    ...props
  }: {
    body: SubmissionTypes.NewS3SubmissionData
    formId: number
    tags: SubmissionEventTypes.S3SubmissionTags
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
      uploadedAt: string
      submissionId: string
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

export default OneBlinkUploader
export { ProgressListener }
