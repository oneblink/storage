export default function generateFormSubmissionTags({
  userToken,
  previousFormSubmissionApprovalId,
  jobId,
}: {
  userToken: string | undefined
  previousFormSubmissionApprovalId: string | undefined
  jobId: string | undefined
}) {
  const tags = new URLSearchParams()
  if (userToken) {
    tags.append('userToken', userToken)
  }
  if (previousFormSubmissionApprovalId) {
    tags.append(
      'previousFormSubmissionApprovalId',
      previousFormSubmissionApprovalId,
    )
  }
  if (jobId) {
    tags.append('jobId', jobId)
  }
  return tags
}
