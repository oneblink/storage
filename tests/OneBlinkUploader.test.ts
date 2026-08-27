import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SubmissionTypes } from '@oneblink/types'

import OneBlinkUploader from '../src/OneBlinkUploader.js'
import uploadToS3 from '../src/uploadToS3.js'

vi.mock('../src/uploadToS3.js', () => ({
  default: vi.fn(),
}))

describe('OneBlinkUploader', () => {
  beforeEach(() => {
    vi.mocked(uploadToS3).mockReset()
  })

  it('uploads an edited submission using the submission meta edit path', async () => {
    const uploader = new OneBlinkUploader({
      apiOrigin: 'https://example.com',
      region: 'ap-southeast-2',
      getBearerToken: async () => 'token',
    })
    const definition = {
      id: 123,
    } as SubmissionTypes.NewS3SubmissionData['definition']
    const context: SubmissionTypes.FormSubmissionMetaEditContext = {
      type: 'FORM_SUBMISSION_APPROVAL',
      formSubmissionApprovalId: 'approval-123',
      notes: 'Approved after review',
      cannedResponseKey: 'looks-good',
      internalNotes: 'Checked by the approvals team',
      notificationEmailAddress: ['approver@example.com'],
    }

    await uploader.uploadFormSubmissionEdit({
      submission: { name: 'edited value' },
      definition,
      device: { type: 'CORDOVA', model: 'test' },
      completionTimestamp: '2026-08-24T01:02:03.000Z',
      submissionId: 'submission-123',
      context,
      editedS3ObjectVersionId: 'edited-version-id',
    })

    expect(uploadToS3).toHaveBeenCalledOnce()
    expect(uploadToS3).toHaveBeenCalledWith({
      apiOrigin: 'https://example.com',
      region: 'ap-southeast-2',
      getBearerToken: expect.any(Function),
      contentType: 'application/json',
      body: JSON.stringify({
        submission: { name: 'edited value' },
        definition,
        device: { type: 'CORDOVA', model: 'test' },
        completionTimestamp: '2026-08-24T01:02:03.000Z',
      }),
      key: 'form-submission-meta/submission-123/edit',
      abortSignal: undefined,
      onProgress: undefined,
      requestBodyHeader: {
        editedS3ObjectVersionId: 'edited-version-id',
        context,
      },
    })
  })
})
