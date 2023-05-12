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
  }
}
