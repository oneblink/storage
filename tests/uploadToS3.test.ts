import { determineUploadProgressAsPercentage } from '../src/uploadToS3'

describe('determineUploadProgressAsPercentage', () => {
  it('should return 0 when no progress', () => {
    expect(
      determineUploadProgressAsPercentage({ loaded: undefined, total: 1000 }),
    ).toBe(0)
  })

  it('should return 100 when loaded is equal to total (100%)', () => {
    expect(
      determineUploadProgressAsPercentage({ loaded: 1000, total: 1000 }),
    ).toBe(100)
  })

  it('should return correct percentage number based on progress', () => {
    expect(
      determineUploadProgressAsPercentage({ loaded: 90, total: 300 }),
    ).toEqual(30)
    expect(
      determineUploadProgressAsPercentage({ loaded: 500, total: 1000 }),
    ).toEqual(50)
  })
})
