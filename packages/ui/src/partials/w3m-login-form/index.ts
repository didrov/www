import { ClientCtrl, RouterCtrl, VerificationCtrl } from '@web3modal/core'
import type { Web3AccountConnector } from '@web3modal/ethereum/src/web3accountConnector'
import { WEB3ACCOUNT_CONNECTOR_ID } from '@web3modal/ethereum/src/web3accountConnector'
import { LitElement, html } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { createRef, ref } from 'lit/directives/ref.js'
import { ThemeUtil } from '../../utils/ThemeUtil'
import styles from './styles.css'

type Valid = boolean | undefined
const buttonRef = createRef()
const submitRef = createRef()

@customElement('w3m-login-form')
export class W3mForm extends LitElement {
  public static styles = [ThemeUtil.globalCss, styles]

  public async handleSubmit(e: Event) {
    e.preventDefault()

    if (!this.isAnimating) {
      this.validateMail()
      if (this.valid) {
        const connector = ClientCtrl.client().getConnectorById(
          WEB3ACCOUNT_CONNECTOR_ID
        ) as Web3AccountConnector
        try {
          await connector.sendEmailVerification(this.email)
          this.status = 'start'
          this.isAnimating = true
        } catch (e) {
          this.status = 'error'
          this.error = 'Something went wrong, try again.'
          this.isAnimating = false
        } finally {
          this.status = 'success'
          this.isAnimating = false
          VerificationCtrl.setEmail(this.email)
          RouterCtrl.push('Verification')
        }
      }
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

  @state() public email = ''
  @state() public error = ''
  @state() public status = ''
  @state() public loading = false
  @state() public isAnimating = false
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
          .status=${this.status}
        ></w3m-input>
      </div>
      <button ${ref(buttonRef)} class="wrapper wrapper--button">
        <w3m-button ${ref(submitRef)} type="submit">Continue</w3m-button>
        <w3m-validation-loader
          .button=${submitRef.value}
          .status=${this.status}
          .isAnimating=${this.isAnimating}
        ></w3m-validation-loader>
      </button>
    </form>`
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'w3m-login-form': W3mForm
  }
}
