import type { Address } from '@wagmi/core'
import type { BaseMessage, Message, Params } from './message'
import { MAGIC_NUMBER, isBaseMessage } from './message'

export const IS_SERVER = typeof window === 'undefined'

export interface Eip1193Provider {
  request: (params: unknown[]) => Promise<unknown>
}

const IFRAME_ID = 'walletconnect-web3account-iframe'
const IFRAME_API = 'https://web3account-iframe.pages.dev'

export class W3aSdk {
  private readonly iframe: HTMLIFrameElement
  // Unique number for every sent message so that replies can be subscribed to via a new message handler
  private iframeMsgIndex = 0

  // Iframe ready state
  private iframeReady = false
  private readonly notifyReady: (() => void)[] = []

  private providerInited = false

  public constructor() {
    if (IS_SERVER) {
      this.iframe = null as unknown as HTMLIFrameElement
    } else {
      const existingIframe = document.getElementById(IFRAME_ID)
      if (existingIframe) {
        existingIframe.remove()
      }
      const iframe = document.createElement('iframe')
      iframe.id = IFRAME_ID
      iframe.name = IFRAME_ID
      iframe.style.display = 'none'
      iframe.src = IFRAME_API

      // Watch for iframe to be ready
      const messageHandler = (e: MessageEvent) => {
        if (e.origin === IFRAME_API) {
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

  private async postMessage(message: unknown): Promise<void> {
    function post(contentWindow: Window | null) {
      if (!contentWindow) {
        throw new Error('iframe.contentWindow is null')
      }
      contentWindow.postMessage(message, IFRAME_API)
    }

    if (this.iframeReady) {
      post(this.iframe.contentWindow)

      return Promise.resolve()
    }

    return new Promise<void>(resolve => {
      this.notifyReady.push(() => {
        if (this.iframeReady) {
          post(this.iframe.contentWindow)
          resolve()
        } else {
          throw new Error('this.iframe.contentWindow still null after notifyReady was called')
        }
      })
    })
  }

  private getReply(): string {
    const reply = `${this.iframeMsgIndex}`
    this.iframeMsgIndex += 1

    return reply
  }

  private async call<T>(msg: Params): Promise<BaseMessage & T> {
    const reply = this.getReply()

    const promise = new Promise<BaseMessage & T>((resolve, _reject) => {
      function messageHandler({ origin, data }: MessageEvent) {
        if (!isBaseMessage(data)) {
          return
        }
        if (origin !== IFRAME_API) {
          return
        }
        if (data.reply !== reply) {
          return
        }
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

  public async isAuthorized(): Promise<boolean> {
    return this.call<{ isLoggedIn: boolean }>({ method: 'isLoggedIn' }).then(msg => msg.isLoggedIn)
  }

  public async disconnect(): Promise<void> {
    return this.call({ method: 'logout' })
  }

  public async getAccount(): Promise<Address> {
    return this.call<{ error: undefined; address: Address } | { error: string }>({
      method: 'getAddress'
    }).then(msg => {
      if (msg.error === undefined) {
        return msg.address
      }
      throw new Error(msg.error)
    })
  }

  public async getProvider(): Promise<Eip1193Provider> {
    const self = this
    const provider = {
      async request(args: unknown[]): Promise<unknown> {
        return self
          .call<{ response: unknown }>({ method: 'request', args })
          .then(res => res.response)
      }
    }

    if (!this.providerInited) {
      // TODO Refactor this addEventListener, origin verification, and removeEventListener from here and above into a function
      const messageHandler: (event: MessageEvent) => void = ({ origin, data }) => {
        if (!isBaseMessage(data)) {
          return
        }
        if (origin !== IFRAME_API) {
          return
        }
        /*
         * If (data.reply != reply) return
         * window.removeEventListener('message', messageHandler)
         */

        // TODO Refactor out this type of incomming message to not use a `reply`
        if (data.reply === 'accountsChanged') {
          this.onAccountsChanged((data as unknown as { params: string[] }).params)
        }
        if (data.reply === 'chainChanged') {
          this.onChainChanged((data as unknown as { params: number | string }).params)
        }
        if (data.reply === 'disconnect') {
          this.onDisconnect()
        }
      }
      window.addEventListener('message', messageHandler)

      const message: Message = {
        MAGIC_NUMBER,
        reply: 'initEvents'
      } as Message
      await this.postMessage(message)

      this.providerInited = true
    }

    return provider
  }

  public async sendEmailVerification(email: string): Promise<void> {
    return this.call<{ error: string | undefined }>({
      method: 'sendEmailVerification',
      email
    }).then(msg => {
      if (msg.error) {
        throw new Error(msg.error)
      }
    })
  }

  public async verifyEmail(code: string): Promise<boolean> {
    return this.call<{ error: undefined; verified: boolean } | { error: string }>({
      method: 'verifyEmail',
      code
    }).then(msg => {
      if (msg.error === undefined) {
        return msg.verified
      }
      throw new Error(msg.error)
    })
  }

  /*
   * Leaving errors here for now since Magic doesn't call this anyways.
   * If this changes, propogate these events to the connector.
   */
  protected onAccountsChanged(_accounts: string[]): void {
    throw new Error('unsupported onAccountsChanged')
  }
  protected onChainChanged(_chainId: number | string): void {
    throw new Error('unsupported onChainChanged')
  }
  protected onDisconnect(): void {
    throw new Error('unsupported onDisconnect')
  }
}
