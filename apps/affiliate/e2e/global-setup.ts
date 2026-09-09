import { reportStackLogs, startStack, stopStack } from './stack'

export default async function globalSetup() {
  try {
    await startStack()
  } catch (error) {
    reportStackLogs()
    await stopStack()
    throw error
  }
}
