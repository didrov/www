import { VerificationCtrl } from '@web3modal/core'
import { html, LitElement } from 'lit'
import { customElement } from 'lit/decorators.js'
import { ThemeUtil } from '../../utils/ThemeUtil'
import styles from './styles.css'

@customElement('w3m-verification-view')
export class W3mVerificationView extends LitElement {
  public static styles = [ThemeUtil.globalCss, styles]

  // -- render ------------------------------------------------------- //
  protected render() {
    return html`<w3m-modal-header border=${true} title="Login with email"></w3m-modal-header>
      <w3m-text variant="medium-regular">Enter the verification code</w3m-text>
      <w3m-text class="tagline" variant="small-regular" color="secondary"
        >Code sent to ${VerificationCtrl.state.email}</w3m-text
      >
      <w3m-verification-form></w3m-verification-form>
      <w3m-text class="retry" variant="small-regular" color="secondary"
        >Didn't receive it? <span class="highlight">Resend code</span></w3m-text
      >`
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'w3m-verification-view': W3mVerificationView
  }
}
