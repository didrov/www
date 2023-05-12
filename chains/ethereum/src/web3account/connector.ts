import { Address, Connector } from '@wagmi/core'
import { createWalletClient, custom } from 'viem'
// import { getAddress } from 'ethers/lib/utils.js'
import { AuthModule } from '@magic-sdk/provider/dist/types/modules/auth'
import { BaseMessage, MAGIC_NUMBER, Message, Params, isBaseMessage } from './message'

export const WEB3ACCOUNT_CONNECTOR_ID = 'walletConnect-web3account'

const IFRAME_ID = 'walletconnect-web3account-iframe'
const IFRAME_API = 'https://web3account-iframe.pages.dev' // 'http://localhost:3001'

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
  // magic: Magic
  iframe: HTMLIFrameElement
  iframeMsgIndex = 0 // unique number for every sent message so that replies can be subscribed to via a new message handler
  inited = false
  login: ReturnType<AuthModule['loginWithEmailOTP']> | null = null

  // iframe ready state
  iframeReady = false
  notifyReady: (() => void)[] = []

  constructor() {
    super({ options: {} })

    if (IS_SERVER) {
      this.iframe = <any>null
    } else {
      const existingIframe = document.getElementById(IFRAME_ID)
      if (existingIframe) {
        existingIframe.remove()
      }
      const iframe = document.createElement('iframe')
      iframe.id = iframe.name = IFRAME_ID
      iframe.style.display = 'none'
      iframe.src = IFRAME_API

      // Watch for iframe to be ready
      const messageHandler = (e: MessageEvent) => {
        if (e.origin == IFRAME_API) {
          this.iframeReady = true
          for (const notifyReady of this.notifyReady) {
            notifyReady()
          }
          window.removeEventListener('message', messageHandler)
        }
      }
      window.addEventListener('message', messageHandler)

      document.body.append(iframe)
      this.iframe = iframe
    }
  }

  async postMessage(message: any): Promise<void> {
    const post = (contentWindow: Window) => contentWindow.postMessage(message, IFRAME_API)
    if (this.iframeReady) {
      post(this.iframe.contentWindow!)
    } else {
      return new Promise<void>(resolve => {
        this.notifyReady.push(() => {
          if (this.iframeReady) {
            post(this.iframe.contentWindow!)
            resolve()
          } else {
            throw new Error('this.iframe.contentWindow still null after notifyReady was called')
          }
        })
      })
    }
  }

  getReply(): string {
    return `${this.iframeMsgIndex++}`
  }

  call<T>(msg: Params): Promise<BaseMessage & T> {
    const reply = this.getReply()

    const promise = new Promise<BaseMessage & T>((resolve, _reject) => {
      const messageHandler: (event: MessageEvent) => void = ({ origin, data }) => {
        if (!isBaseMessage(data)) return
        if (origin != IFRAME_API) return
        if (data.reply != reply) return
        window.removeEventListener('message', messageHandler)
        resolve(data as BaseMessage & T)
      }
      window.addEventListener('message', messageHandler)
    })

    const message: Message = {
      MAGIC_NUMBER,
      reply,
      ...msg
    }
    this.postMessage(message)

    return promise
  }

  async isAuthorized(): Promise<boolean> {
    return this.call<{ isLoggedIn: boolean }>({ method: 'isLoggedIn' }).then(msg => msg.isLoggedIn)
  }

  async disconnect(): Promise<void> {
    return this.call({ method: 'logout' })
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
    return this.call<{ error: string | undefined }>({
      method: 'sendEmailVerification',
      email
    }).then(msg => {
      if (msg.error) throw msg.error
    })
  }

  async verifyEmail(code: string): Promise<boolean> {
    return this.call<{ error: string } | { error: null; verified: boolean }>({
      method: 'verifyEmail',
      code
    }).then(msg => {
      if (msg.error != null) throw msg.error
      else return msg.verified
    })
  }

  async getAccount(): Promise<Address> {
    return this.call<{ error: string } | { error: null; address: Address }>({
      method: 'getAddress'
    }).then(msg => {
      if (msg.error != null) throw msg.error
      else return msg.address
    })
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

  async getProvider(/* { chainId } */): Promise<Eip1193Provider> {
    const that = this
    const provider = {
      request(args: any[]): Promise<any> {
        return that.call<{ response: any }>({ method: 'request', args }).then(res => res.response)
      }
    }

    if (!this.inited) {
      // TODO Refactor this addEventListener, origin verification, and removeEventListener from here and above into a function
      const messageHandler: (event: MessageEvent) => void = ({ origin, data }) => {
        if (!isBaseMessage(data)) return
        if (origin != IFRAME_API) return
        // if (data.reply != reply) return
        // window.removeEventListener('message', messageHandler)

        // TODO Refactor out this type of incomming message to not use a `reply`
        if (data.reply == 'accountsChanged') this.onAccountsChanged((data as any).params)
        if (data.reply == 'chainChanged') this.onChainChanged((data as any).params)
        if (data.reply == 'disconnect') this.onDisconnect()
      }
      window.addEventListener('message', messageHandler)

      const message: Message = {
        MAGIC_NUMBER,
        reply: 'initEvents'
      } as Message
      await this.postMessage(message)

      this.inited = true
    }

    return provider
  }

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
    throw new Error('unsupported onAccountsChanged')
    // if (accounts.length === 0) this.emit('disconnect')
    // else this.emit('change', { account: getAddress(accounts[0]) })
  }

  protected onChainChanged(_chainId: string | number): void {
    throw new Error('unsupported onChainChanged')
    // const id = normalizeChainId(chainId)
    // const unsupported = this.isChainUnsupported(id)
    // this.emit('change', { chain: { id, unsupported } })
  }

  protected onDisconnect(): void {
    throw new Error('unsupported onDisconnect')
    // console.warn('DISCONNECT')
    // this.emit('disconnect')
  }
}
