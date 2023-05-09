import type { Session, User } from '@supabase/gotrue-js/src/lib/types'
import { proxy, subscribe as valtioSub } from 'valtio/vanilla'
import type { VerificationCtrlState } from '../types/controllerTypes'
// -- initial state ------------------------------------------------ //
const state = proxy<VerificationCtrlState>({
  email: ''
})

// -- controller --------------------------------------------------- //
export const VerificationCtrl = {
  state,
  subscribe(callback: (newState: VerificationCtrlState) => void) {
    return valtioSub(state, () => callback(state))
  },

  setEmail(value: string) {
    state.email = value
  },
  setUser(value?: User) {
    state.user = value
  },
  setSession(value?: Session) {
    state.session = value
  }
}
