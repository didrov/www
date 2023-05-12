import { Address, Connector } from '@wagmi/core'
import { createWalletClient, custom } from 'viem'
import { Eip1193Provider, IS_SERVER, W3aSdk } from './sdk'

export const WEB3ACCOUNT_CONNECTOR_ID = 'walletConnect-web3account'

// Based off of:
// - https://github.com/EveripediaNetwork/wagmi-magic-connector/blob/main/src/lib/connectors/magicConnector.ts
// - https://github.com/EveripediaNetwork/wagmi-magic-connector/blob/main/src/lib/connectors/magicAuthConnector.ts

export class Web3AccountConnector extends Connector<Eip1193Provider, {}> {
  // Prefixing with 'walletConnect' so it is filtered out of the UI in Web3Modal:
  // https://github.com/WalletConnect/web3modal/blob/09ff0b85e90ffd4219c680d5a7cde7961cd978be/chains/ethereum/src/client.ts#L85
  id = WEB3ACCOUNT_CONNECTOR_ID
  name = 'Email' // This is displayed in some error messages, so naming it something non-internal
  ready = !IS_SERVER
  sdk: W3aSdk

  constructor() {
    super({ options: {} })

    this.sdk = new W3aSdk()
  }

  async isAuthorized(): Promise<boolean> {
    return this.sdk.isAuthorized()
  }

  async disconnect(): Promise<void> {
    return this.sdk.disconnect()
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

  async getAccount(): Promise<Address> {
    return this.sdk.getAccount()
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
    return this.sdk.getProvider()
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
