import { RouterCtrl } from '@web3modal/core'
import { html, LitElement } from 'lit'
import { customElement } from 'lit/decorators.js'
import { SvgUtil } from '../../utils/SvgUtil'
import { ThemeUtil } from '../../utils/ThemeUtil'
import styles from './styles.css'

@customElement('w3a-login-email-button')
export class W3aLoginEmailButton extends LitElement {
  public static styles = [ThemeUtil.globalCss, styles]

  // -- state & properties ------------------------------------------- //

  // -- private ------------------------------------------------------ //
  private onClick() {
    RouterCtrl.push('Login')
  }

  // -- render ------------------------------------------------------- //
  protected render() {
    return html`
      <div class="w3m-container">
        <button @click=${this.onClick} class="button">
          ${SvgUtil.MAIL_ICON}
          <w3m-text variant="medium-regular" color="secondary"> Login with e-mail</w3m-text>
        </button>
      </div>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'w3a-login-email-button': W3aLoginEmailButton
  }
}
