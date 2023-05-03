import { RouterCtrl } from '@web3modal/core'
import { html, LitElement } from 'lit'
import { customElement } from 'lit/decorators.js'
import { ThemeUtil } from '../../utils/ThemeUtil'
import styles from './styles.css'

@customElement('w3m-success-view')
export class W3mSuccessView extends LitElement {
  public static styles = [ThemeUtil.globalCss, styles]

  public handleClick() {
    RouterCtrl.push('Login')
  }

  // -- render ------------------------------------------------------- //
  protected render() {
    return html`<w3m-modal-header border=${true} title="Login successfull"></w3m-modal-header>
      <w3m-text variant="medium-regular">Start exploring Web3</w3m-text>
      <w3m-text class="tagline" variant="small-regular" color="secondary"
        >With your wallet, you can explore and interact with DeFi, NFTs, DAOs, and much
        more.</w3m-text
      >
      <w3m-button @click=${this.handleClick}>Restart flow</w3m-button>`
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'w3m-success-view': W3mSuccessView
  }
}
