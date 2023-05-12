/* eslint-disable no-nested-ternary */
/* eslint-disable no-negated-condition */
import { html, LitElement } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { ThemeUtil } from '../../utils/ThemeUtil'
import styles from './styles.css'

type Type = 'email' | 'text'

@customElement('w3m-input')
export class W3mInput extends LitElement {
  public static styles = [ThemeUtil.globalCss, styles]

  // -- state & properties ------------------------------------------- //
  @property() public type: Type = 'email'
  @property() public placeholder? = undefined
  @property() public valid? = undefined

  @property() public error? = undefined
  @property() public status? = ''
  @property() public onInput: () => void = () => null
  @property() public onBlur: () => void = () => null
  @property() public onKeypress: () => void = () => null

  // -- render ------------------------------------------------------- //
  protected render() {
    return html`<input
        placeholder=${this.placeholder}
        @input=${this.onInput}
        @blur=${this.onBlur}
        @keypress=${this.onKeypress}
        type=${this.type}
        class=${this.error !== ''
          ? 'error-border'
          : this.status === 'success'
          ? 'valid-border'
          : ''}
        required
      />

      <p class="error">${this.error}</p> `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'w3m-input': W3mInput
  }
}
