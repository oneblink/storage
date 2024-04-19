import { OneBlinkNodeJsHandler } from '../../src/http-handlers/NodeJsHandler'

describe('determineQueueSize', () => {
  const oneBlinkNodeJsHandler = new OneBlinkNodeJsHandler({
    getIdToken: async () => undefined,
  })
  const determineQueueSize = oneBlinkNodeJsHandler.determineQueueSize

  it('should return 10 for node environments', () => {
    expect(determineQueueSize()).toBe(10)
  })
})
