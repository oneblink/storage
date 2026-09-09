import { HttpRequest, HttpResponse } from '@smithy/protocol-http'
import { describe, expect, it, vi } from 'vitest'
import { OneBlinkRequestHandler } from '../src/OneBlinkRequestHandler.js'

describe('OneBlinkRequestHandler', () => {
  it('adds configured query parameters to the outgoing request', async () => {
    const handleRequest = vi.fn().mockResolvedValue(
      new HttpResponse({
        statusCode: 200,
        headers: {},
      }),
    )
    const handler = new OneBlinkRequestHandler(
      { handleRequest } as never,
      undefined,
      { asSubmitted: 'true' },
    )
    const request = new HttpRequest({
      protocol: 'https:',
      hostname: 'example.com',
      method: 'GET',
      path: '/submission',
      headers: {},
      query: { 'x-id': 'GetObject' },
    })

    await handler.handle(request)

    expect(request.query).toEqual({
      'x-id': 'GetObject',
      asSubmitted: 'true',
    })
    expect(handleRequest).toHaveBeenCalledWith(request)
  })
})
