import { ClientCtrl, RouterCtrl, VerificationCtrl } from '@web3modal/core'
import {
  WEB3ACCOUNT_CONNECTOR_ID,
  Web3AccountConnector
} from '@web3modal/ethereum/src/web3accountConnector'
import { LitElement, html } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { createRef, ref } from 'lit/directives/ref.js'
import { ThemeUtil } from '../../utils/ThemeUtil'
import styles from './styles.css'

type Email = string
type Valid = boolean | undefined
const buttonRef = createRef()

@customElement('w3m-login-form')
export class W3mForm extends LitElement {
  public static styles = [ThemeUtil.globalCss, styles]

  public handleSubmit(e: Event) {
    e.preventDefault()
    this.validateMail()

    if (this.valid) {
      ;(async () => {
        const connector = ClientCtrl.client().getConnectorById(
          WEB3ACCOUNT_CONNECTOR_ID
        ) as Web3AccountConnector
        await connector.sendEmailVerification(this.email)
        VerificationCtrl.setEmail(this.email)
        RouterCtrl.push('Verification')
      })()
    }
  }

  public validateMail() {
    const isValidEmail = /[a-z0-9]+@[a-z]+\.[a-z]{2,3}/u.exec(this.email)?.length
    if (isValidEmail) {
      this.error = ''
      this.valid = true
    } else {
      this.error = 'Please fill in a correct e-mail'
      this.valid = false
    }
  }

  public handleBlur() {
    this.validateMail()
  }

  public handleKeypress(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      const element = buttonRef?.value as HTMLElement
      element.click()
    }
  }

  public updateValue(e: Event) {
    const element = e.currentTarget as HTMLInputElement
    this.email = element.value
  }

  // -- state & properties ------------------------------------------- //

  @state() public email: Email = ''
  @state() public error = ''
  @state() public valid: Valid = undefined

  // -- render ------------------------------------------------------- //
  protected render() {
    return html` <form @submit=${this.handleSubmit}>
      <div class="wrapper">
        <w3m-input
          type="email"
					.onInput=${this.updateValue.bind(this)}
					.onKeypress=${this.handleKeypress.bind(this)}
					.onBlur=${this.handleBlur.bind(this)}
          placeholder="E-mail"
					error=${this.error}
					valid=${this.valid}
        ></w3m-input>
      </div>
      <button ${ref(buttonRef)} class="wrapper wrapper--button">
        <w3m-button type="submit">Continue</w3m-button>
      </div>
    </button>
		</form>`
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'w3m-login-form': W3mForm
  }
}
