import { LitElement, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { createRef, ref } from 'lit/directives/ref.js'
import { animate } from 'motion'
import { ThemeUtil } from '../../utils/ThemeUtil'
import styles from './styles.css'

const spinnerRef = createRef()
const outlineRef = createRef()
const checkmarkRef = createRef()
const errorRef = createRef()

@customElement('w3a-loader')
export class W3aLoader extends LitElement {
  public static styles = [ThemeUtil.globalCss, styles]

  public successSpinner() {
    const spinnerElement = spinnerRef.value as Element
    const outlineElement = outlineRef.value as Element
    const checkmarkElement = checkmarkRef.value as Element
    animate(
      spinnerElement,
      { backgroundColor: '#22be56', fill: 'transparent' },
      { duration: 0.3, easing: 'ease-in' }
    )
    animate(checkmarkElement, { opacity: 1 }, { duration: 0.3, easing: 'ease-in' })
    animate(outlineElement, { fill: 'transparent' }, { duration: 0.3, easing: 'ease-in' })
  }

  public errorSpinner() {
    const spinnerElement = spinnerRef.value as Element
    const outlineElement = outlineRef.value as Element
    const errorElement = errorRef.value as Element

    animate(
      spinnerElement,
      { backgroundColor: '#f05142', fill: 'transparent' },
      { duration: 0.3, easing: 'ease-in' }
    )
    animate(errorElement, { opacity: 1 }, { duration: 0.3, easing: 'ease-in' })
    animate(outlineElement, { fill: 'transparent' }, { duration: 0.3, easing: 'ease-in' })

    setTimeout(() => {
      this.resetSpinner()
    }, 1000)
  }

  public startSpinner() {
    const spinnerElement = spinnerRef.value as Element

    animate(spinnerElement, { opacity: 1 }, { duration: 0.3, easing: 'ease-in' })
    if (this.button) {
      animate(this.button, { opacity: 0 }, { duration: 0.3, easing: 'ease-in' })
    }
  }

  public resetSpinner() {
    const root: HTMLElement | null = document.querySelector(':root')
    if (root) {
      const style = getComputedStyle(root)
      const fg3 = style.getPropertyValue('--w3m-color-fg-3')
      const background = style.getPropertyValue('--w3m-background-color')

      const spinnerElement = spinnerRef.value as Element
      const errorElement = errorRef.value as Element
      const outlineElement = outlineRef.value as Element

      animate(errorElement, { opacity: 0 }, { duration: 0.3, easing: 'ease-in' })
      animate(spinnerElement, { opacity: 0 }, { duration: 0.3, easing: 'ease-in' })
      animate(
        spinnerElement,
        { backgroundColor: 'transparent', fill: background },
        { duration: 0.3, easing: 'ease-in' }
      )
      animate(
        spinnerElement,
        { backgroundColor: 'transparent', fill: background },
        { duration: 0.3, easing: 'ease-in' }
      )
      animate(outlineElement, { fill: fg3 }, { duration: 0.3, easing: 'ease-in' })
      if (this.button) {
        animate(this.button, { opacity: 1 }, { duration: 0.3, delay: 0.3, easing: 'ease-in' })
      }
    }
  }

  public stopSpinner() {
    const spinnerElement = spinnerRef.value as Element
    animate(spinnerElement, { opacity: 0 }, { duration: 0.3 })
    if (this.button) {
      animate(this.button, { opacity: 1 }, { duration: 0.3 })
    }
  }

  public updated() {
    if (this.status === 'start') {
      this.startSpinner()
    } else if (this.status === 'success') {
      this.successSpinner()
    } else if (this.status === 'error') {
      this.errorSpinner()
    }
  }

  // -- state & properties ------------------------------------------- //
  @property() public status? = undefined
  @property() public button?: Element = undefined

  // -- render ------------------------------------------------------- //
  protected render() {
    return html`
      <svg
        ${ref(spinnerRef)}
        aria-hidden="true"
        class="w3a-spinner"
        viewBox="0 0 100 101"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          ${ref(outlineRef)}
          d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
          fill="currentColor"
        ></path>
        <path
          d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
          fill="currentFill"
        ></path>
      </svg>
      <svg ${ref(checkmarkRef)} class="w3a-checkmark" width="13" height="12" viewBox="0 0 13 12">
        <path
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M12.155.132a.75.75 0 0 1 .232 1.035L5.821 11.535a1 1 0 0 1-1.626.09L.665 7.21a.75.75 0 1 1 1.17-.937L4.71 9.867a.25.25 0 0 0 .406-.023L11.12.364a.75.75 0 0 1 1.035-.232Z"
          fill="#fff"
        />
      </svg>
      <svg ${ref(errorRef)} class="w3a-error" width="12" height="12" viewBox="0 0 12 12">
        <path
          d="M9.94 11A.75.75 0 1 0 11 9.94L7.414 6.353a.5.5 0 0 1 0-.708L11 2.061A.75.75 0 1 0 9.94 1L6.353 4.586a.5.5 0 0 1-.708 0L2.061 1A.75.75 0 0 0 1 2.06l3.586 3.586a.5.5 0 0 1 0 .708L1 9.939A.75.75 0 1 0 2.06 11l3.586-3.586a.5.5 0 0 1 .708 0L9.939 11Z"
          fill="#fff"
        />
      </svg>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'w3a-loader': W3aLoader
  }
}
