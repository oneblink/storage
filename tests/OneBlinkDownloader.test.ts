import { beforeEach, describe, expect, it, vi } from 'vitest'
import OneBlinkDownloader from '../src/OneBlinkDownloader.js'
import { downloadJsonFromS3WithMetadata } from '../src/downloadJsonFromS3.js'

vi.mock('../src/downloadJsonFromS3.js', () => ({
  default: vi.fn(),
  downloadJsonFromS3WithMetadata: vi.fn(),
}))

describe('OneBlinkDownloader', () => {
  beforeEach(() => {
    vi.mocked(downloadJsonFromS3WithMetadata).mockReset()
  })

  it('downloads a submission with its S3 object version', async () => {
    vi.mocked(downloadJsonFromS3WithMetadata).mockResolvedValue({
      data: {
        submission: { value: 'reviewed' },
        definition: { id: 123 },
      } as never,
      versionId: 'reviewed-version-id',
    })
    const downloader = new OneBlinkDownloader({
      apiOrigin: 'https://example.com',
      region: 'ap-southeast-2',
      getBearerToken: async () => 'token',
    })

    await expect(
      downloader.downloadSubmission({
        formId: 123,
        submissionId: 'submission-id',
      }),
    ).resolves.toEqual({
      data: {
        submission: { value: 'reviewed' },
        definition: { id: 123 },
      },
      versionId: 'reviewed-version-id',
    })
    expect(downloadJsonFromS3WithMetadata).toHaveBeenCalledWith({
      apiOrigin: 'https://example.com',
      region: 'ap-southeast-2',
      getBearerToken: downloader.getBearerToken,
      key: 'forms/123/submissions/submission-id',
      abortSignal: undefined,
    })
  })
})
