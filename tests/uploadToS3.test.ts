import {
  determineQueueSize,
  determineUploadProgressAsPercentage,
} from '../src/uploadToS3'

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

describe('determineQueueSize', () => {
  it('should return 1 when no connection', () => {
    Object.defineProperty(global.window, 'navigator', {
      value: {},
      writable: true,
    })
    expect(determineQueueSize()).toBe(1)
  })

  it('should return 1 when no effectiveType', () => {
    Object.defineProperty(global.window, 'navigator', {
      value: {
        connection: {},
      },
      writable: true,
    })
    expect(determineQueueSize()).toBe(1)
  })

  it('should return 10 when 4g', () => {
    Object.defineProperty(global.window, 'navigator', {
      value: {
        connection: { effectiveType: '4g' },
      },
      writable: true,
    })
    expect(determineQueueSize()).toBe(10)
  })

  it('should return 2 when 3g', () => {
    Object.defineProperty(global.window, 'navigator', {
      value: {
        connection: { effectiveType: '3g' },
      },
      writable: true,
    })
    expect(determineQueueSize()).toBe(2)
  })

  it('should return 1 when 2g or unknown', () => {
    Object.defineProperty(global.window, 'navigator', {
      value: {
        connection: { effectiveType: '2g' },
      },
      writable: true,
    })
    console.log(global.window.navigator)
    expect(determineQueueSize()).toBe(1)
    Object.defineProperty(global.window, 'navigator', {
      value: {
        connection: { effectiveType: 'unknown' },
      },
      writable: true,
    })
    expect(determineQueueSize()).toBe(1)
  })

  it('should return 10 for node environments', () => {
    Object.defineProperty(global, 'window', {
      value: undefined,
      writable: true,
    })

    expect(determineQueueSize()).toBe(10)
  })
})
