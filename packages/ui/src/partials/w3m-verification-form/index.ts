import { RouterCtrl, VerificationCtrl, supabase } from '@web3modal/core'
import { LitElement, html } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import { ThemeUtil } from '../../utils/ThemeUtil'
import styles from './styles.css'
@customElement('w3m-verification-form')
export class W3mVerificationForm extends LitElement {
  public static styles = [ThemeUtil.globalCss, styles]

  public validateChar = (char: string) => {
    // eslint-disable-next-line prefer-regex-literals, require-unicode-regexp
    const re = new RegExp(/^[0-9]+$/)

    return re.test(char)
  }

  private handleInput(e: Event, index: number) {
    const inputs = [...this.renderRoot.querySelectorAll('.item')]
    const target = e.target as HTMLInputElement
    if (target.value.length > 1) {
      const inputElement = inputs[index] as HTMLInputElement
      this.fillNext(inputElement, target.value, index)
    } else {
      const valid = this.validateChar(target.value[0])
      if (valid) {
        const emptyIndex = this.inputs.findIndex(element => element === '')

        if (emptyIndex === -1) {
          this.focusInputField('next', index)
          // eslint-disable-next-line prefer-destructuring
          this.inputs[index] = target.value[0]
          this.validate()
        } else {
          // eslint-disable-next-line prefer-destructuring
          this.inputs[emptyIndex] = target.value[0]
          const emptyIndexElement = inputs[emptyIndex] as HTMLInputElement
          const indexElement = inputs[index] as HTMLInputElement
          // eslint-disable-next-line prefer-destructuring
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

  private async validate() {
    function isNotEmpty(currentValue: string) {
      return currentValue !== ''
    }

    const canTest = this.inputs.every(isNotEmpty)
    if (canTest) {
      const token = this.inputs.join('')
      const { data, error } = await supabase.auth.verifyOtp({
        email: VerificationCtrl.state.email,
        token,
        type: 'email'
      })
      if (error) {
        this.status = 'error'
      } else if (data.session && data.user) {
        RouterCtrl.push('Success')
      }
    }
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
    // eslint-disable-next-line prefer-destructuring
    el.value = data[0]
    // eslint-disable-next-line prefer-destructuring
    this.inputs[index] = data[0]
    this.validate()

    // eslint-disable-next-line no-param-reassign
    data = data.substring(1)
    if (el.nextElementSibling && data.length) {
      const nextSiblingElement = el.nextElementSibling as HTMLInputElement
      this.fillNext(nextSiblingElement, data, index + 1)
    }
  }

  private load() {
    const input0 = [...this.renderRoot.querySelectorAll('.item')][0] as HTMLInputElement
    input0.select()
    input0.focus()
  }

  // -- state & properties ------------------------------------------- //

  @state() public inputs = ['', '', '', '', '', '']
  @state() public status = ''
  @property() public regex = '/^[0-9]+$/'

  // -- render ------------------------------------------------------- //
  protected render() {
    setTimeout(() => {
      this.load()
    }, 100)

    return html`<div class="wrapper">
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
    </div>`
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'w3m-verification-form': W3mVerificationForm
  }
}
