/* eslint-disable prefer-destructuring */
import { ClientCtrl, CoreUtil, ModalCtrl, ToastCtrl } from '@web3modal/core'
import type { Web3AccountConnector } from '@web3modal/ethereum/src/web3account/connector'
import { WEB3ACCOUNT_CONNECTOR_ID } from '@web3modal/ethereum/src/web3account/connector'
import { LitElement, html } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { ThemeUtil } from '../../utils/ThemeUtil'
import styles from './styles.css'
@customElement('w3a-otp-form')
export class W3aOtpForm extends LitElement {
  public static styles = [ThemeUtil.globalCss, styles]

  private handleInput(e: Event, index: number) {
    const inputs = [...this.renderRoot.querySelectorAll('.item')]
    const target = e.target as HTMLInputElement
    if (target.value.length > 1) {
      const inputElement = inputs[index] as HTMLInputElement
      this.fillNext(inputElement, target.value, index)
    } else {
      const valid = CoreUtil.isValidChar(target.value[0])
      if (valid) {
        const emptyIndex = this.inputs.findIndex(element => element === '')

        if (emptyIndex === -1) {
          this.focusInputField('next', index)

          this.inputs[index] = target.value[0]
          this.validate()
        } else {
          this.inputs[emptyIndex] = target.value[0]
          const emptyIndexElement = inputs[emptyIndex] as HTMLInputElement
          const indexElement = inputs[index] as HTMLInputElement
          emptyIndexElement.value = target.value[0]
          if (emptyIndex < index) {
            indexElement.value = ''
          } else {
            indexElement.value = this.inputs[index]
          }

          this.focusInputField('next', emptyIndex)
          this.validate()
        }
      } else {
        target.value = ''
        this.inputs[index] = ''
      }
    }
  }

  public handleStart() {
    this.loaderStatus = 'start'
    this.isAnimating = true
  }

  public handleError() {
    ToastCtrl.openToast('Code invalid', 'error')
    this.isAnimating = false
    this.loaderStatus = 'error'
    this.status = 'error'
  }

  public handleSuccess() {
    this.isAnimating = false
    this.loaderStatus = 'success'
    this.status = 'success'
    setTimeout(() => {
      this.connect()
    }, 1000)
  }

  public async verifyEmailWithConnector(code: string) {
    const connector = ClientCtrl.client().getConnectorById(
      WEB3ACCOUNT_CONNECTOR_ID
    ) as Web3AccountConnector

    const verified = await connector.verifyEmail(code)

    if (verified) {
      this.handleSuccess()
    } else {
      this.handleError()
    }
  }

  private validate() {
    function isNotEmpty(currentValue: string) {
      return currentValue !== ''
    }

    const canTest = this.inputs.every(isNotEmpty)
    if (canTest && !this.isAnimating) {
      this.handleStart()
      const code = this.inputs.join('')
      this.verifyEmailWithConnector(code)
    }
  }

  public async connect() {
    await ClientCtrl.client().connectConnector(WEB3ACCOUNT_CONNECTOR_ID)
    ModalCtrl.close()
  }

  public focusInputField = (dir: 'next' | 'prev', index: number) => {
    const inputs = [...this.renderRoot.querySelectorAll('.item')]
    if (dir === 'next') {
      const nextIndex = index + 1
      const inputField = inputs[nextIndex < inputs.length ? nextIndex : index] as HTMLInputElement
      inputField.focus()
      inputField.select()
    }
    if (dir === 'prev') {
      const nextIndex = index - 1
      const inputField = inputs[nextIndex > -1 ? nextIndex : index] as HTMLInputElement
      inputField.focus()
      inputField.select()
    }
  }

  private handleKeydown(e: KeyboardEvent, index: number) {
    if (e.key === 'Backspace') {
      // eslint-disable-next-line no-negated-condition
      if ((e.target as HTMLInputElement).value !== '') {
        this.inputs[index] = ''
      } else {
        this.focusInputField('prev', index)
      }
    }
  }

  private fillNext(el: HTMLInputElement, data: string, index: number) {
    el.value = data[0]
    this.inputs[index] = data[0]
    const dataString = data.substring(1)
    if (!this.inputs.includes('') && dataString === '') {
      this.validate()
    }
    if (el.nextElementSibling && dataString.length) {
      const nextSiblingElement = el.nextElementSibling as HTMLInputElement
      this.fillNext(nextSiblingElement, dataString, index + 1)
    }
  }

  public firstUpdated() {
    const input0 = [...this.renderRoot.querySelectorAll('.item')][0] as HTMLInputElement
    input0.select()
    input0.focus()
  }

  // -- state & properties ------------------------------------------- //

  @state() public inputs = ['', '', '', '', '', '']
  @state() public status = ''
  @state() public loaderStatus = ''
  @state() public isAnimating = false

  // -- render ------------------------------------------------------- //
  protected render() {
    return html`<div class="w3a-container">
        ${this.inputs.map(
          (input, index) =>
            html`
              <input
                @input=${(e: Event) => {
                  this.handleInput(e, index)
                }}
                @keydown=${(e: KeyboardEvent) => {
                  this.handleKeydown(e, index)
                }}
                id=${index}
                data-id=${index}
                class=${`item ${this.status}`}
                type="number"
                pattern="[0-9]*"
                min="0"
                max="9"
                maxlength="1"
                placeholder="1"
                value=${input}
              />
            `
        )}
      </div>
      <div class="w3a-otp-container">
        <w3a-loader .status=${this.loaderStatus}></w3a-loader>
      </div> `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'w3a-otp-form': W3aOtpForm
  }
}
