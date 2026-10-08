import { useCallback, useEffect, useRef, useState } from 'react'

type WalletEvent = 'accountsChanged' | 'chainChanged' | 'connect' | 'disconnect'
type Listener = (data: unknown) => void

type WalletProvider = {
  request: (args: { method: string }) => Promise<unknown>
  on: (event: WalletEvent, listener: Listener) => void
  removeListener: (event: WalletEvent, listener: Listener) => void
}

type WalletAnnouncement = {
  info?: { rdns?: string }
  provider?: WalletProvider
}

const networkNames: Record<string, string> = {
  '1': 'Ethereum Mainnet',
  '11155111': 'Sepolia',
  '31337': 'Local development network',
  '31338': 'ChainLatch Local',
}

function describeError(error: unknown) {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? error.code
      : undefined

  if (code === 4001) return 'Connection request cancelled.'
  if (code === -32002) return 'Open MetaMask and finish the pending request.'
  return 'Could not read your wallet. Check MetaMask and its network, then try again.'
}

export default function WalletConnect() {
  const [provider, setProvider] = useState<WalletProvider | null>(null)
  const [account, setAccount] = useState('')
  const [chainId, setChainId] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const latestRead = useRef(0)

  useEffect(() => {
    function discover(event: Event) {
      const detail = (event as CustomEvent<WalletAnnouncement>).detail
      const candidate = detail?.provider

      if (
        detail?.info?.rdns !== 'io.metamask' ||
        !candidate ||
        typeof candidate.request !== 'function' ||
        typeof candidate.on !== 'function' ||
        typeof candidate.removeListener !== 'function'
      ) return

      setProvider((current) => current ?? candidate)
    }

    window.addEventListener('eip6963:announceProvider', discover)
    window.dispatchEvent(new Event('eip6963:requestProvider'))

    return () => {
      window.removeEventListener('eip6963:announceProvider', discover)
    }
  }, [])

  const refreshWallet = useCallback(async () => {
    if (!provider) return

    const readId = ++latestRead.current
    setAccount('')
    setChainId('')
    setError('')

    try {
      const [accounts, network] = await Promise.all([
        provider.request({ method: 'eth_accounts' }),
        provider.request({ method: 'eth_chainId' }),
      ])

      if (readId !== latestRead.current) return

      if (
        !Array.isArray(accounts) ||
        !accounts.every(
          (value) => typeof value === 'string' && /^0x[0-9a-fA-F]{40}$/.test(value),
        ) ||
        typeof network !== 'string' ||
        !/^0x[0-9a-fA-F]+$/.test(network)
      ) {
        throw new Error('Invalid wallet response')
      }

      setAccount(accounts[0] ?? '')
      setChainId(BigInt(network).toString())
    } catch (cause) {
      if (readId !== latestRead.current) return
      setError(describeError(cause))
    }
  }, [provider])

  useEffect(() => {
    if (!provider) return

    const update: Listener = () => {
      void refreshWallet()
    }

    const disconnect: Listener = () => {
      latestRead.current += 1
      setAccount('')
      setChainId('')
      setError('Network connection lost. Check MetaMask, then reload this page.')
    }

    provider.on('accountsChanged', update)
    provider.on('chainChanged', update)
    provider.on('connect', update)
    provider.on('disconnect', disconnect)
    void refreshWallet()

    return () => {
      latestRead.current += 1
      provider.removeListener('accountsChanged', update)
      provider.removeListener('chainChanged', update)
      provider.removeListener('connect', update)
      provider.removeListener('disconnect', disconnect)
    }
  }, [provider, refreshWallet])

  async function connectWallet() {
    if (!provider || busy) return

    setBusy(true)
    setError('')

    try {
      if (!account) {
        await provider.request({ method: 'eth_requestAccounts' })
      }
      await refreshWallet()
    } catch (cause) {
      setError(describeError(cause))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="status" aria-labelledby="wallet-title">
      <h2 id="wallet-title">Wallet connection</h2>
      <p>Connect MetaMask to view your account and selected network.</p>

      {!provider && (
        <p style={{ marginTop: 16 }}>
          MetaMask not detected. Open this page in the browser where MetaMask
          is installed, then reload.
        </p>
      )}

      <button
        type="button"
        className="project-link"
        onClick={() => void connectWallet()}
        disabled={!provider || busy}
        style={{
          cursor: !provider || busy ? 'not-allowed' : 'pointer',
          opacity: !provider || busy ? 0.5 : 1,
          marginTop: 20,
        }}
      >
        {busy ? 'Please check MetaMask...' : account ? 'Refresh wallet' : 'Connect MetaMask'}
      </button>

      <div role="status" style={{ marginTop: 20 }}>
        <p>Account access: {account ? 'Granted' : 'Not connected'}</p>
        {account && (
          <p style={{ marginTop: 8, overflowWrap: 'anywhere' }}>
            Address: {account}
          </p>
        )}
        {chainId && (
          <p style={{ marginTop: 8 }}>
            Selected network: {networkNames[chainId] ?? 'Other network'}
            {' · '}Chain ID: {chainId}
          </p>
        )}
      </div>

      {error && <p role="alert" style={{ marginTop: 16 }}>{error}</p>}

      <p style={{ marginTop: 20 }}>
        Connection only. No transfers or signatures are requested.
        Transfer protection is not active yet.
      </p>
    </section>
  )
}