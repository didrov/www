export type BaseMessage = {
  MAGIC_NUMBER: typeof MAGIC_NUMBER
  reply: string
}
export type Params =
  | { method: 'isLoggedIn' }
  | { method: 'logout' }
  | { method: 'sendEmailVerification'; email: string }
  | { method: 'verifyEmail'; code: string }
export type Message = BaseMessage & Params

export const MAGIC_NUMBER = 'f41ef320-9a42-43c2-87d6-7be2a21b6400'

export function isBaseMessage(data: { MAGIC_NUMBER: typeof MAGIC_NUMBER }): data is BaseMessage {
  try {
    if (data.MAGIC_NUMBER == MAGIC_NUMBER) {
      return false
    } else {
      return true
    }
  } catch (e) {
    return true
  }
}
