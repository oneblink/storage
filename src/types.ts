export type ProgressListenerEvent = { progress: number; total: number }
export type ProgressListener = (progress: ProgressListenerEvent) => void

export interface OneBlinkUploaderProps {
  apiOrigin: string
  region: string
  getIdToken: () => Promise<string | void>
}
