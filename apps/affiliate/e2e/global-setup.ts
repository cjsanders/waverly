import { startStack, stopStack } from './stack'

export default async function globalSetup() {
  try {
    await startStack()
  } catch (error) {
    await stopStack()
    throw error
  }
}
