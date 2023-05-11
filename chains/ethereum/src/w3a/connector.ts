import { Address, Connector } from '@wagmi/core'
import { createWalletClient, custom } from 'viem'
// import { getAddress } from 'ethers/lib/utils.js'
import { AuthModule } from '@magic-sdk/provider/dist/types/modules/auth'
import { Magic } from 'magic-sdk'

export const WEB3ACCOUNT_CONNECTOR_ID = 'walletConnect-web3account'

// const IFRAME_API = 'http://localhost:3001'

const IS_SERVER = typeof window === 'undefined'

type Eip1193Provider = { request: (...params: any) => Promise<any> }

// Based off of:
// - https://github.com/EveripediaNetwork/wagmi-magic-connector/blob/main/src/lib/connectors/magicConnector.ts
// - https://github.com/EveripediaNetwork/wagmi-magic-connector/blob/main/src/lib/connectors/magicAuthConnector.ts

export class Web3AccountConnector extends Connector<Eip1193Provider, {}> {
  // Prefixing with 'walletConnect' so it is filtered out of the UI in Web3Modal:
  // https://github.com/WalletConnect/web3modal/blob/09ff0b85e90ffd4219c680d5a7cde7961cd978be/chains/ethereum/src/client.ts#L85
  id = WEB3ACCOUNT_CONNECTOR_ID
  name = 'Web3Account'
  ready = !IS_SERVER
  magic: Magic
  // iframe: HTMLIFrameElement
  iframeMsgIndex = 0 // unique number for every sent message so that replies can be subscribed to via a new message handler
  inited = false
  login: ReturnType<AuthModule['loginWithEmailOTP']> | null = null

  constructor() {
    super({ options: {} })

    // this.magic = <any>null
    if (IS_SERVER) {
      this.magic = <any>null
      // this.iframe = <any>null
    } else {
      const pk = 'pk_live_26F7E275782BA6E7' // TODO rotate & externalize
      this.magic = new Magic(pk)
      // const iframe = document.createElement('iframe')
      // iframe.id = iframe.name = 'w3a-iframe'
      // iframe.style.display = 'none'
      // iframe.src = IFRAME_API
      // this.iframe = iframe
    }
  }

  // getReply(): string {
  //   return `${this.iframeMsgIndex++}`
  // }

  // call<T>(msg: Params): Promise<BaseMessage & T> {
  //   const reply = this.getReply()

  //   const promise = new Promise<BaseMessage & T>((resolve, _reject) => {
  //     const messageHandler: (event: MessageEvent) => void = ({ origin, data }) => {
  //       if (!isBaseMessage(data)) return
  //       if (origin != IFRAME_API) return
  //       if (data.reply != reply) return
  //       window.removeEventListener('message', messageHandler)
  //       resolve(data as BaseMessage & T)
  //     }
  //     window.addEventListener('message', messageHandler)
  //   })

  //   const message: Message = {
  //     MAGIC_NUMBER,
  //     reply,
  //     ...msg
  //   }
  //   assertDefined(this.iframe.contentWindow).postMessage(message, IFRAME_API)

  //   return promise
  // }

  // subscribe<T>(msg: Params, handler: () => void): Promise<BaseMessage & T> {
  //   const reply = this.getReply()

  //   const promise = new Promise<BaseMessage & T>((resolve, _reject) => {
  //     const messageHandler: (event: MessageEvent) => void = ({ origin, data }) => {
  //       if (!isBaseMessage(data)) return
  //       if (origin != IFRAME_API) return
  //       if (data.reply != reply) return
  //       window.removeEventListener('message', messageHandler)
  //       resolve(data as BaseMessage & T)
  //     }
  //     window.addEventListener('message', messageHandler)
  //   })

  //   const message: Message = {
  //     MAGIC_NUMBER,
  //     reply,
  //     ...msg
  //   }
  //   assertDefined(this.iframe.contentWindow).postMessage(message, IFRAME_API)

  //   return promise
  // }

  async isAuthorized(): Promise<boolean> {
    return this.magic.user.isLoggedIn()

    // const reply = this.getReply()
    // const promise = new Promise<boolean>((resolve, _reject) => {
    //   const messageHandler: (event: MessageEvent) => void = ({ origin, data }) => {
    //     if (!isMessage(data)) return
    //     if (origin != IFRAME_API) return
    //     if (data.reply != reply) return
    //     window.removeEventListener('message', messageHandler)
    //     resolve(data.isLoggedIn)
    //   }
    //   window.addEventListener('message', messageHandler)
    // })
    // const message: Message = {
    //   MAGIC_NUMBER,
    //   method: 'isLoggedIn',
    //   reply
    // }
    // assertDefined(this.iframe.contentWindow).postMessage(message, IFRAME_API)
    // return promise

    // return this.call<{ isLoggedIn: boolean }>({ method: 'isLoggedIn' }).then(msg => msg.isLoggedIn)
  }

  async disconnect(): Promise<void> {
    await this.magic.user.logout()

    // const reply = this.getReply()
    // const promise = new Promise<void>((resolve, _reject) => {
    //   const messageHandler: (event: MessageEvent) => void = ({ origin, data }) => {
    //     if (!isMessage(data)) return
    //     if (origin != IFRAME_API) return
    //     if (data.reply != reply) return
    //     window.removeEventListener('message', messageHandler)
    //     resolve()
    //   }
    //   window.addEventListener('message', messageHandler)
    // })
    // const message: Message = {
    //   MAGIC_NUMBER,
    //   method: 'logout',
    //   reply
    // }
    // assertDefined(this.iframe.contentWindow).postMessage(message, IFRAME_API)
    // return promise

    // return this.call({ method: 'logout' })
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

    // return this.call<{ error: string | undefined }>({
    //   method: 'sendEmailVerification',
    //   email
    // }).then(msg => {
    //   if (msg.error) throw msg.error
    // })
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

    // return this.call<{ error: string } | { error: null; verified: boolean }>({
    //   method: 'verifyEmail',
    //   code
    // }).then(msg => {
    //   if (msg.error != null) throw msg.error
    //   else return msg.verified
    // })
  }

  async getAccount(): Promise<Address> {
    const account = (await this.magic.user.getMetadata()).publicAddress
    if (!account)
      throw new Error(
        'publicAddress is null -> (await this.magic.user.getMetadata()).publicAddress'
      )
    // const signer = await this.getSigner()
    // const account = await signer.getAddress()
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

  async getProvider(): Promise<Eip1193Provider> {
    const provider = this.magic.rpcProvider

    if (!this.inited) {
      provider.on('accountsChanged', this.onAccountsChanged)
      provider.on('chainChanged', this.onChainChanged)
      provider.on('disconnect', this.onDisconnect)
      this.inited = true
    }

    return provider
  }

  // async getSigner(): Promise<any> {
  //   const provider = new ethers.providers.Web3Provider(await this.getProvider())
  //   return provider.getSigner()
  // }
  async getWalletClient({ chainId }: { chainId?: number } = {}): ReturnType<
    Connector['getWalletClient']
  > {
    const [provider, account] = await Promise.all([
      this.getProvider(/*{ chainId }*/),
      this.getAccount()
    ])
    const chain = this.chains.find(x => x.id === chainId)
    if (!provider) throw new Error('provider is required.')
    return createWalletClient({
      account,
      chain,
      transport: custom(provider)
    })
  }

  protected onAccountsChanged(_accounts: string[]): void {
    // if (accounts.length === 0) this.emit('disconnect')
    // else this.emit('change', { account: getAddress(accounts[0]) })
  }

  protected onChainChanged(_chainId: string | number): void {
    // const id = normalizeChainId(chainId)
    // const unsupported = this.isChainUnsupported(id)
    // this.emit('change', { chain: { id, unsupported } })
  }

  protected onDisconnect(): void {
    this.emit('disconnect')
  }
}
