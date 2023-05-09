import { AuthModule } from '@magic-sdk/provider/dist/types/modules/auth'
import { Address, Connector, normalizeChainId } from '@wagmi/core'
import { ethers } from 'ethers'
import { getAddress } from 'ethers/lib/utils.js'
import { Magic } from 'magic-sdk'

export const WEB3ACCOUNT_CONNECTOR_ID = 'walletConnect-web3account'

const IS_SERVER = typeof window === 'undefined'

// Based off of:
// - https://github.com/EveripediaNetwork/wagmi-magic-connector/blob/main/src/lib/connectors/magicConnector.ts
// - https://github.com/EveripediaNetwork/wagmi-magic-connector/blob/main/src/lib/connectors/magicAuthConnector.ts

export class Web3AccountConnector extends Connector {
  // Prefixing with 'walletConnect' so it is filtered out of the UI in Web3Modal:
  // https://github.com/WalletConnect/web3modal/blob/09ff0b85e90ffd4219c680d5a7cde7961cd978be/chains/ethereum/src/client.ts#L85
  id = WEB3ACCOUNT_CONNECTOR_ID
  name = 'Web3Account'
  ready = !IS_SERVER
  magic: Magic
  inited = false
  login: ReturnType<AuthModule['loginWithEmailOTP']> | null = null

  constructor() {
    super({ options: {} })

    if (IS_SERVER) {
      this.magic = <any>null
    } else {
      const pk = 'pk_live_26F7E275782BA6E7' // TODO rotate & externalize
      this.magic = new Magic(pk)
    }
  }

  async isAuthorized(): Promise<boolean> {
    return this.magic.user.isLoggedIn()
  }

  async disconnect(): Promise<void> {
    await this.magic.user.logout()
  }

  async connect(_config?: { chainId?: number | undefined } | undefined) {
    if (await this.isAuthorized()) {
      // Handle auto connect
      return {
        provider: this.getProvider(),
        chain: {
          id: 0, // await this.getChainId(),
          unsupported: false
        },
        account: await this.getAccount()
      }
    } else {
      throw new Error(
        'Not already logged in, must call sendEmailVerification() and verifyEmail() instead to login'
      )
    }
  }

  async sendEmailVerification(email: string): Promise<void> {
    const login = this.magic.auth.loginWithEmailOTP({ email, showUI: false })
    this.login = login
    return new Promise((resolve, reject) => login.on('email-otp-sent', resolve).on('error', reject))
  }

  async verifyEmail(code: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (!this.login) throw new Error('cannot verifyEmail if not logging in')
      this.login
        .on('error', reject)
        .on('done', _ => resolve(true))
        .on('invalid-email-otp', () => resolve(false))
        .emit('verify-email-otp', code)
    })
  }

  async getAccount(): Promise<`0x${string}`> {
    const signer = await this.getSigner()
    const account = await signer.getAddress()
    if (account.startsWith('0x')) return account as Address
    return `0x${account}`
  }

  async getChainId(): Promise<number> {
    // const networkOptions = this.magicSdkConfiguration?.network
    // if (typeof networkOptions === 'object') {
    //   const chainID = networkOptions.chainId
    //   if (chainID) {
    //     return normalizeChainId(chainID)
    //   }
    // }
    throw new Error('Chain ID is not defined')
  }

  async getProvider(): Promise<any> {
    const provider = this.magic.rpcProvider
    if (!this.inited) {
      provider.on('accountsChanged', this.onAccountsChanged)
      provider.on('chainChanged', this.onChainChanged)
      provider.on('disconnect', this.onDisconnect)
      this.inited = true
    }

    return provider
  }

  async getSigner(): Promise<any> {
    const provider = new ethers.providers.Web3Provider(await this.getProvider())
    return provider.getSigner()
  }

  protected onAccountsChanged(accounts: string[]): void {
    if (accounts.length === 0) this.emit('disconnect')
    else this.emit('change', { account: getAddress(accounts[0]) })
  }

  protected onChainChanged(chainId: string | number): void {
    const id = normalizeChainId(chainId)
    const unsupported = this.isChainUnsupported(id)
    this.emit('change', { chain: { id, unsupported } })
  }

  protected onDisconnect(): void {
    this.emit('disconnect')
  }
}
