import { Address } from '@wagmi/core'
import { BaseMessage, MAGIC_NUMBER, Message, Params, isBaseMessage } from './message'

export const IS_SERVER = typeof window === 'undefined'

export type Eip1193Provider = { request: (...params: any) => Promise<any> }

const IFRAME_ID = 'walletconnect-web3account-iframe'
const IFRAME_API = 'https://web3account-iframe.pages.dev' // 'http://localhost:3001'

export class W3aSdk {
  iframe: HTMLIFrameElement
  iframeMsgIndex = 0 // unique number for every sent message so that replies can be subscribed to via a new message handler
  inited = false
  // login: ReturnType<AuthModule['loginWithEmailOTP']> | null = null

  // iframe ready state
  iframeReady = false
  notifyReady: (() => void)[] = []

  constructor() {
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

  async getAccount(): Promise<Address> {
    return this.call<{ error: string } | { error: null; address: Address }>({
      method: 'getAddress'
    }).then(msg => {
      if (msg.error != null) throw msg.error
      else return msg.address
    })
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

  // Leaving errors here for now since Magic doesn't call this anyways.
  // If this changes, propogate these events to the connector.
  protected onAccountsChanged(_accounts: string[]): void {
    throw new Error('unsupported onAccountsChanged')
  }
  protected onChainChanged(_chainId: string | number): void {
    throw new Error('unsupported onChainChanged')
  }
  protected onDisconnect(): void {
    throw new Error('unsupported onDisconnect')
  }
}
