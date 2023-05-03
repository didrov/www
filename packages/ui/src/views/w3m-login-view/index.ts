import { html, LitElement } from 'lit'
import { customElement } from 'lit/decorators.js'
import { ThemeUtil } from '../../utils/ThemeUtil'
import styles from './styles.css'

@customElement('w3m-login-view')
export class W3mLoginView extends LitElement {
  public static styles = [ThemeUtil.globalCss, styles]

  // -- render ------------------------------------------------------- //
  protected render() {
    return html`<w3m-modal-header border=${true} title="Login with email"></w3m-modal-header>
      <w3m-text variant="medium-regular">Log in with your e-mail to continue</w3m-text>
      <w3m-text class="tagline" variant="small-regular" color="secondary"
        >Please fill in your email</w3m-text
      >
      <w3m-login-form></w3m-login-form>`
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'w3m-login-view': W3mLoginView
  }
}
