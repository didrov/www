import { ClientCtrl, CoreUtil, RouterCtrl, VerificationCtrl } from '@web3modal/core'
import type { Web3AccountConnector } from '@web3modal/ethereum/src/web3account/connector'
import { WEB3ACCOUNT_CONNECTOR_ID } from '@web3modal/ethereum/src/web3account/connector'
import { LitElement, html } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { createRef, ref } from 'lit/directives/ref.js'
import { ThemeUtil } from '../../utils/ThemeUtil'
import styles from './styles.css'

type Valid = boolean | undefined
const buttonRef = createRef()
const submitRef = createRef()

@customElement('w3a-login-form')
export class W3aLoginForm extends LitElement {
  public static styles = [ThemeUtil.globalCss, styles]

  public async handleSubmit(e: Event) {
    e.preventDefault()

    if (!this.isAnimating) {
      this.validateMail()
      if (this.valid) {
        this.handleStart()
        const connector = ClientCtrl.client().getConnectorById(
          WEB3ACCOUNT_CONNECTOR_ID
        ) as Web3AccountConnector
        try {
          await connector.sendEmailVerification(this.email)
        } catch (error) {
          this.handleError()
        }
        this.handleSuccess()
      }
    }
  }

  public handleStart() {
    this.status = 'start'
    this.isAnimating = true
  }

  public handleSuccess() {
    this.status = 'success'
    this.isAnimating = false
    setTimeout(() => {
      VerificationCtrl.setEmail(this.email)
      RouterCtrl.push('Otp')
    }, 500)
  }

  public handleError() {
    this.status = 'error'
    this.error = 'Something went wrong, try again.'
    this.isAnimating = false
  }

  public validateMail() {
    const isValidEmail = CoreUtil.isValidEmail(this.email)
    if (isValidEmail) {
      this.error = ''
      this.valid = true
    } else {
      this.error = 'Please fill in a correct e-mail'
      this.valid = false
    }
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
      <div class="w3m-container">
        <w3m-input
          type="email"
          .onInput=${this.updateValue.bind(this)}
          .onKeypress=${this.handleKeypress.bind(this)}
          placeholder="E-mail"
          error=${this.error}
          valid=${this.valid}
          .status=${this.status}
        ></w3m-input>
      </div>
      <button ${ref(buttonRef)} class="w3m-container w3m-container-button">
        <w3m-button ${ref(submitRef)} type="submit">Continue</w3m-button>
        <w3a-loader .button=${submitRef.value} .status=${this.status}></w3a-loader>
      </button>
    </form>`
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'w3a-login-form': W3aLoginForm
  }
}
