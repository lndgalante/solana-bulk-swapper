// eslint-disable-next-line unicorn/prefer-node-protocol
import { Buffer } from 'buffer'
import { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { Avatar, Button, Input, Listbox, ListboxItem, Navbar, NavbarBrand, NavbarContent, NavbarItem, Slider, Spinner, useDisclosure } from '@nextui-org/react'
import BigNumber from 'bignumber.js'
import { toast } from 'sonner'

// components
import { useQuery } from '@tanstack/react-query'
import { edenTreaty } from '@elysiajs/eden'
import { Connection, VersionedTransaction } from '@solana/web3.js'
import type { App } from '../../api/src/index'
import { CustomRadio, CustomRadioGroup } from './components/Radio'
import WalletModal from './components/WalletModal'

const client = edenTreaty<App>('http://localhost:3000')

const connection = new Connection('https://mainnet.helius-rpc.com/?api-key=4eb2dbba-8de6-4d60-8cf3-61d77f84f518', 'confirmed')

const TOKENS_LIST = [
  {
    address: 'So11111111111111111111111111111111111111112',
    decimals: 9,
    logoURI: 'https://img.fotofolio.xyz/?url=https%3A%2F%2Fraw.githubusercontent.com%2Fsolana-labs%2Ftoken-list%2Fmain%2Fassets%2Fmainnet%2FSo11111111111111111111111111111111111111112%2Flogo.png',
    symbol: 'SOL',
    name: 'Solana',
    getFormattedOutput(outputAmount: string) {
      return new BigNumber(outputAmount).dividedBy(new BigNumber(10).pow(9))
    },
  },
  {
    address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    decimals: 6,
    logoURI: 'https://img.fotofolio.xyz/?url=https%3A%2F%2Fraw.githubusercontent.com%2Fsolana-labs%2Ftoken-list%2Fmain%2Fassets%2Fmainnet%2FEPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v%2Flogo.png',
    symbol: 'USDC',
    name: 'USD Coin',
    getFormattedOutput(outputAmount: string) {
      return new BigNumber(outputAmount).dividedBy(new BigNumber(10).pow(6))
    },
  },
  {
    address: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
    decimals: 6,
    logoURI: 'https://arweave.net/hQiPZOsRZXGXBJd_82PhVdlM_hACsT_q6wqwf5cSY7I',
    symbol: 'Bonk',
    name: 'Bonk',
    getFormattedOutput(outputAmount: string) {
      return new BigNumber(outputAmount).dividedBy(new BigNumber(10).pow(6))
    },
  },
]
export function getTruncatedText(text: string, length: number, separator: string): string {
  return `${text.substring(0, length)}${separator}${text.substring(text.length - length)}`
}

export function getShortAddress(address: string) {
  return getTruncatedText(address, 4, '...')
}

async function getTokensMetadata(tokenListAddresses: string[]) {
  const response = await fetch('https://mainnet.helius-rpc.com/?api-key=4eb2dbba-8de6-4d60-8cf3-61d77f84f518', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 'my-id',
      method: 'searchAssets',
      params: {
        ownerAddress: tokenListAddresses[0],
      },
    }),
  })
  const { result } = await response.json()

  return result
}

async function getAssetsByOwner(ownerAddress: string) {
  const response = await fetch('https://mainnet.helius-rpc.com/?api-key=4eb2dbba-8de6-4d60-8cf3-61d77f84f518', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 'my-id',
      method: 'getAssetsByOwner',
      params: {
        ownerAddress,
        page: 1, // Starts at 1
        limit: 1000,
        displayOptions: {
          showFungible: true,
          showNativeBalance: true,
        },
      },
    }),
  })
  const { result } = await response.json()

  return result.items.filter((item) => {
    return item.interface === 'FungibleToken' && item?.token_info?.price_info
  }).map((item: any) => {
    const shortAddress = getShortAddress(item.id)
    const fiatValue = getFiatTokenValue({ balance: item.token_info.balance, decimals: item.token_info.decimals, price_info: item.token_info.price_info }).toFixed(2)
    const balanceFormatted = formatBalance({ balance: item.token_info.balance, decimals: item.token_info.decimals }).toFixed(2)

    return {
      ...item,
      shortAddress,
      fiatValue,
      balanceFormatted,
    }
  }).sort((a: any, b: any) => b.fiatValue - a.fiatValue)
}
interface TokenInfo {
  symbol: string
  balance: number
  supply: number
  decimals: number
  token_program: string
  associated_token_address: string
  price_info: {
    price_per_token: number
    total_price: number
    currency: string
  }
}

function getFiatTokenValue({
  balance,
  decimals,
  price_info,
}: {
  balance: TokenInfo['balance']
  decimals: TokenInfo['decimals']
  price_info: TokenInfo['price_info']
}): BigNumber {
  if (!price_info)
    return new BigNumber(0)

  // const adjustedBalance = balance / 10 ** decimals // Adjusting for decimals
  const adjustedBalance = new BigNumber(balance).dividedBy(new BigNumber(10).pow(decimals))

  // const fiatValue = adjustedBalance * price_info.price_per_token
  const fiatValue = new BigNumber(adjustedBalance).times(price_info.price_per_token)
  return fiatValue
}

export type TokensToSwap = Record<string, {
  mint: string
  value: number
  tokenInfo: TokenInfo
}>

function formatBalance({ balance, decimals }: {
  balance: TokenInfo['balance']
  decimals: TokenInfo['decimals']
}) {
  const tokenBalance = new BigNumber(balance)
  const tokenDecimals = new BigNumber(10).pow(decimals)

  // Adjusting the balance based on the number of decimals
  const adjustedBalance = tokenBalance.dividedBy(tokenDecimals)

  // Formatting the balance with commas as thousand separators
  return adjustedBalance.toNumber() // 'toFormat(2)' formats the number with two decimal places
}

export default function App() {
  // react hooks
  const [tokenQuery, setTokenQuery] = useState('')
  const [selectedKeys, setSelectedKeys] = useState(new Set(['']))

  // data to send to API
  const [tokenToSwapAddress, setTokenToSwapAddress] = useState<string | undefined>(undefined)
  const [tokensToSwap, setTokensToSwap] = useState<TokensToSwap>({})

  // next-ui hooks
  const { isOpen, onOpen, onOpenChange } = useDisclosure()

  // solana hooks
  const { publicKey, disconnect, signTransaction, sendTransaction } = useWallet()
  const publicKeyString = publicKey?.toBase58() ?? ''

  // helpers
  const totalTokensToSwap = Object.keys(tokensToSwap).length
  const hasTokensToSwap = totalTokensToSwap > 0
  const tokenToSwap = TOKENS_LIST.find(token => token.address === tokenToSwapAddress)

  async function getQuotesForTokens() {
    if (!tokenToSwap)
      return null

    const tokens = Object.values(tokensToSwap)
    const data = await client.quotes.post({ inputMints: tokens, outputMint: tokenToSwap })

    return data
  }

  // query hooks
  // TODO: Handle error state
  const { data: walletAssets, isLoading: isLoadingWalletAssets, error: walletAssetsError } = useQuery({ queryKey: ['assets'], queryFn: () => getAssetsByOwner(publicKeyString), enabled: publicKeyString !== '' })
  const { data: quotes, isLoading: isLoadingQuotes, error: quotesError } = useQuery({ queryKey: ['quotes', tokensToSwap], queryFn: () => getQuotesForTokens(), enabled: Boolean(hasTokensToSwap && tokenToSwap) })

  // const { data: tokensFromData } = useQuery({ queryKey: ['tokens-from'], queryFn: () => getTokensMetadata(tokenListAddresses) })

  // handlers
  function handleTokenValueChange(value: string) {
    setTokenToSwapAddress(value)
  }

  function handleSelectedKeysChange(set: Set<string>) {
    const values = Array.from(set).filter(Boolean)

    for (const tokenId in tokensToSwap) {
      if (!values.includes(tokenId)) {
        setTokensToSwap((prevTokensToSwap) => {
          const newTokensToSwap = { ...prevTokensToSwap }
          delete newTokensToSwap[tokenId]
          return newTokensToSwap
        })
      }
    }

    setSelectedKeys(set)
  }

  async function handleSwapTokens() {
    try {
      if (!quotes || !signTransaction)
        return null

      const data = await client.swap.post({ quotes: quotes.data, userPublicKey: publicKeyString }, {
        enabled: Boolean(quotes),
      })

      if (!data || !data.data)
        return

      const id = toast.loading('Swapping your tokens')

      await Promise.all(data.data.map(async (transaction: string) => {
        const transactionBuffer = Buffer.from(transaction, 'base64')
        const versionedTransaction = VersionedTransaction.deserialize(transactionBuffer)

        // Sign the transaction
        const signature = await sendTransaction(versionedTransaction, connection)

        await connection.confirmTransaction(signature, 'confirmed')
        return signature
      }))

      toast.dismiss(id)
      toast.success('All tokens successfully swapped')

      setSelectedKeys(new Set(['']))
      setTokensToSwap({})
    }
    catch (error) {
      // toast.error(`We couldn't swap the tokens at the moment, please try again later.`)
      console.log('\n ~ handleSwapTokens ~ error:', error)
    }
  }

  // constants
  const tokenQueryLowerCase = tokenQuery.toLowerCase()
  const tokenList = Array.isArray(walletAssets) ? walletAssets.filter((token: any) => token?.content?.metadata?.symbol?.toLowerCase().includes(tokenQueryLowerCase) || token?.content?.metadata?.name?.includes(tokenQueryLowerCase)) : []

  const allTokensToSwapFiatValue = Object.values(tokensToSwap).reduce((acc, token) => {
    const fiatValue = getFiatTokenValue({ balance: token.value, decimals: token.tokenInfo.decimals, price_info: token.tokenInfo.price_info })
    return acc.plus(fiatValue)
  }, new BigNumber(0))

  const totalTokensToSwapFormatted = quotes
    ? quotes.data?.reduce((acc, quote) => {
      const { outAmount, outputMint } = quote

      const tokenToSwap = TOKENS_LIST.find(token => token.address === outputMint)

      if (!tokenToSwap)
        return acc

      return acc + tokenToSwap.getFormattedOutput(outAmount).toNumber()
    }, 0).toFixed(4)
    : null

  return (
    <>
      <Navbar maxWidth="sm" className="pb-8">
        <NavbarBrand>
          <p className="font-bold text-2xl text-zinc-100">MultiSwap</p>
        </NavbarBrand>
        <NavbarContent justify="end">
          <NavbarItem className="pt-2">
            {publicKey
              ? (
                <Button color="primary" variant="light" onClick={disconnect}>
                  Disconnect Wallet
                </Button>
                )
              : (
                <Button color="default" onClick={onOpen}>
                  Connect Wallet
                </Button>
                )}
          </NavbarItem>
        </NavbarContent>
      </Navbar>
      <main className="max-w-xl m-auto flex flex-col gap-6 pb-4">

        {/* Pick to */}
        <CustomRadioGroup
          label="Pick a token to swap to"
          orientation="horizontal"
          value={tokenToSwapAddress}
          onValueChange={handleTokenValueChange}
        >
          {TOKENS_LIST.map(token => (
            <CustomRadio
              key={token.address}
              value={token.address}
            >
              <div className="flex gap-4 items-center">
                <Avatar name={token.symbol} size="sm" radius="full" isBordered src={token.logoURI} />
                <div className="flex flex-col">
                  <span className="text-small text-foreground">{token.symbol}</span>
                  <span className="text-small text-foreground opacity-70">
                    {token.name}
                  </span>
                </div>

              </div>
            </CustomRadio>
          ))}
        </CustomRadioGroup>

        {/* Pick from */}
        <div className="flex flex-col gap-2">
          <span className="text-foreground-700">Pick one or more token to swap from</span>
          <div className="flex flex-col p-2 border-2 border-default rounded-lg min-h-[420px]">
            {!publicKey
              ? (
                <div className="flex flex-1 justify-center items-center">
                  <p className="text-small text-foreground opacity-80">Please connect your wallet to display your tokens</p>
                </div>
                )
              : null}

            {isLoadingWalletAssets
              ? (
                <div className="flex flex-1 justify-center items-center">
                  <Spinner label="Loading wallet tokens..." color="primary" labelColor="foreground" />
                </div>
                )
              : null}

            {tokenList && tokenList.length > 0
              ? (
                <div>
                  <Input
                    size="sm"
                    placeholder="Search by token name or symbol"
                    value={tokenQuery}
                    onValueChange={setTokenQuery}
                  />
                </div>
                )
              : null}

            {publicKey && tokenList && tokenList.length > 0
              ? (
                <Listbox
                  aria-label="Multiple selection example"
                  variant="flat"
                  disallowEmptySelection
                  selectionMode="multiple"
                  selectedKeys={selectedKeys}
                  onSelectionChange={handleSelectedKeysChange}
                  classNames={{
                    list: 'max-h-[392px] overflow-scroll scrollbar-hide',
                  }}
                >
                  {
                    tokenList.map((token: any) => (
                      <ListboxItem key={token.id}>
                        <div className="flex flex-row justify-between  pl-2 pr-4 h-[52px]">
                          <div className="flex gap-4 items-center">
                            <Avatar name={token?.content?.metadata?.symbol ?? ''} size="sm" radius="full" isBordered src={token.content.links.image} />
                            <div className="flex flex-col   w-[90px]">
                              <span className="text-small text-foreground">{token?.content?.metadata?.symbol ?? '-'}</span>
                              <span className="text-small text-foreground opacity-70">{token.shortAddress}</span>
                            </div>

                            <div className="flex flex-col ml-4">
                              {token?.token_info?.price_info
                                ? (
                                  <>
                                    <span className="text-small text-foreground">
                                      $
                                      {token.fiatValue}
                                    </span>
                                    <span className="text-small text-foreground opacity-70">{token.balanceFormatted}</span>
                                  </>
                                  )
                                : null}

                            </div>
                          </div>

                          <div className="flex flex-col min-w-[180px]">
                            <Slider
                              label={`${tokensToSwap[token.id] ? 'Amount' : 'Slide amount to swap'}`}
                              step={0.01}
                              defaultValue={token?.token_info?.balance / 2}
                              minValue={0.1}
                              onChangeEnd={(value) => {
                                if (value === 0.1) {
                                  setSelectedKeys((prevSelectedKeys) => {
                                    const newSelectedKeys = new Set(prevSelectedKeys)
                                    newSelectedKeys.delete(token.id)
                                    return newSelectedKeys
                                  })
                                }

                                setTokensToSwap((prevTokensToSwap) => {
                                  const newTokensToSwap = { ...prevTokensToSwap }
                                  newTokensToSwap[token.id] = {
                                    mint: token.id,
                                    value: value as number,
                                    tokenInfo: token.token_info,
                                  }
                                  return newTokensToSwap
                                })
                              }}
                              getValue={(tokens) => {
                                if (!tokensToSwap[token.id])
                                  return ''

                                return `${formatBalance({ balance: (tokens as number), decimals: token?.token_info?.decimals }).toFixed(2)} ($${getFiatTokenValue({ balance: (tokens as number), decimals: token?.token_info?.decimals, price_info: token?.token_info?.price_info }).toFixed(2)})`
                              }}
                              maxValue={token?.token_info?.balance}
                              className={`max-w-md text-center ${selectedKeys.has(token.id) ? 'visible' : 'hidden'}`}
                            />
                          </div>
                        </div>
                      </ListboxItem>
                    ))
                  }

                </Listbox>
                )
              : null}

          </div>
          <div className={`flex just transition-all mt-2 ${hasTokensToSwap && tokenToSwap ? 'opacity-100' : 'opacity-0'}`}>

            <Button color="primary" size="md" variant="shadow" fullWidth isLoading={isLoadingQuotes} isDisabled={!quotes} onClick={handleSwapTokens}>
              {/* {isLoadingQuotes ? 'Loading quotes...' : `Swap` } */}
              {isLoadingQuotes ? 'Loading quotes...' : `Swap ${totalTokensToSwap} tokens for ${totalTokensToSwapFormatted} ${tokenToSwap?.symbol} ($${allTokensToSwapFiatValue.toFixed(2)})` }
            </Button>
          </div>
        </div>

        {/* Modal Wallet */}
        <WalletModal isOpen={isOpen} onOpenChange={onOpenChange} />

      </main>

    </>
  )
}
