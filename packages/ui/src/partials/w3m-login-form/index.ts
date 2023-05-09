import { VerificationCtrl } from '@web3modal/core'
import { LitElement, html } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { createRef, ref } from 'lit/directives/ref.js'
import { animate } from 'motion'
import { ThemeUtil } from '../../utils/ThemeUtil'
import styles from './styles.css'

type Valid = boolean | undefined
const buttonRef = createRef()
const submitRef = createRef()
const spinnerRef = createRef()

@customElement('w3m-login-form')
export class W3mForm extends LitElement {
  public static styles = [ThemeUtil.globalCss, styles]

  public async handleSubmit(e: Event) {
    e.preventDefault()
    this.validateMail()

    if (this.valid) {
      this.startSpinner()
      VerificationCtrl.setEmail(this.email)
      // const { error } = await supabase.auth.signInWithOtp({
      //   email: this.email
      // })
      // if (error) {
      //   this.stopSpinner()
      //   this.error = error.message
      //   this.valid = false
      // } else {
      //   this.error = ''
      //   this.valid = true
      //   RouterCtrl.push('Verification')
      // }
    }
  }

  public startSpinner() {
    const submitElement = submitRef.value as Element
    const spinnerElement = spinnerRef.value as Element
    animate(submitElement, { opacity: 0 }, { duration: 0.3, easing: 'ease-in' })
    animate(spinnerElement, { opacity: 1 }, { duration: 0.3, easing: 'ease-in' })
  }

  public stopSpinner() {
    const submitElement = submitRef.value as Element
    const spinnerElement = spinnerRef.value as Element
    animate(spinnerElement, { opacity: 0 }, { duration: 0.3 })
    animate(submitElement, { opacity: 1 }, { duration: 0.3 })
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
  @state() public loading = false
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
        <w3m-button ${ref(submitRef)} type="submit">Continue</w3m-button>
        <svg ${ref(
          spinnerRef
        )} aria-hidden="true" class="spinner" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"></path>
        <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"></path>
      </svg>

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
