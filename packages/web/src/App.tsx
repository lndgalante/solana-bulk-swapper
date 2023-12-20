import { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { Avatar, Button, Input, Listbox, ListboxItem, Navbar, NavbarBrand, NavbarContent, NavbarItem, Spinner, useDisclosure } from '@nextui-org/react'
import BigNumber from 'bignumber.js'

// components
import { useQuery } from '@tanstack/react-query'
import { CustomRadio, CustomRadioGroup } from './components/Radio'
import WalletModal from './components/WalletModal'

const TOKENS_LIST = [
  {
    address: 'So11111111111111111111111111111111111111112',
    decimals: 9,
    logoURI: 'https://img.fotofolio.xyz/?url=https%3A%2F%2Fraw.githubusercontent.com%2Fsolana-labs%2Ftoken-list%2Fmain%2Fassets%2Fmainnet%2FSo11111111111111111111111111111111111111112%2Flogo.png',
    symbol: 'SOL',
    name: 'Solana',
  },
  {
    address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    decimals: 6,
    logoURI: 'https://img.fotofolio.xyz/?url=https%3A%2F%2Fraw.githubusercontent.com%2Fsolana-labs%2Ftoken-list%2Fmain%2Fassets%2Fmainnet%2FEPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v%2Flogo.png',
    symbol: 'USDC',
    name: 'USD Coin',
  },
  {
    address: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
    decimals: 6,
    logoURI: 'https://img.fotofolio.xyz/?url=https%3A%2F%2Fraw.githubusercontent.com%2Fsolana-labs%2Ftoken-list%2Fmain%2Fassets%2Fmainnet%2FEs9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB%2Flogo.svg',
    symbol: 'USDT',
    name: 'USDT',
  },
]

export function getTruncatedText(text: string, length: number, separator: string): string {
  return `${text.substring(0, length)}${separator}${text.substring(text.length - length)}`
}

export function getShortAddress(address: string) {
  return getTruncatedText(address, 4, '...')
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
        },
      },
    }),
  })
  const { result } = await response.json()

  return result.items.filter(item => item.interface === 'FungibleToken').map((item: any) => {
    const shortAddress = getShortAddress(item.id)
    const totalValue = getTotalTokenValue(item.token_info).toFixed(4)
    const balanceFormatted = formatBalance(item.token_info)

    return {
      ...item,
      shortAddress,
      totalValue,
      balanceFormatted,
    }
  }).sort((a: any, b: any) => b.totalValue - a.totalValue)
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

function getTotalTokenValue(tokenInfo: TokenInfo): number {
  const { balance, decimals, price_info } = tokenInfo

  if (!price_info)
    return 0

  const adjustedBalance = balance / 10 ** decimals // Adjusting for decimals
  const totalValue = adjustedBalance * price_info.price_per_token
  return totalValue
}

function formatBalance(tokenInfo: TokenInfo) {
  const balance = new BigNumber(tokenInfo.balance)
  const decimals = new BigNumber(10).pow(tokenInfo.decimals)

  // Adjusting the balance based on the number of decimals
  const adjustedBalance = balance.dividedBy(decimals)

  // Formatting the balance with commas as thousand separators
  return adjustedBalance.toFormat(2) // 'toFormat(2)' formats the number with two decimal places
}

export default function App() {
  // react hooks
  const [tokenQuery, setTokenQuery] = useState('')
  const [selectedKeys, setSelectedKeys] = useState('')
  const [tokenToSwapAddress, setTokenToSwapAddress] = useState<string | undefined>(undefined)

  // next-ui hooks
  const { isOpen, onOpen, onOpenChange } = useDisclosure()

  // solana hooks
  const { publicKey, disconnect } = useWallet()
  const publicKeyString = publicKey?.toBase58() ?? ''

  // query hooks
  // TODO: Handle error state
  const { data, isLoading, error } = useQuery({ queryKey: ['assets'], queryFn: () => getAssetsByOwner(publicKeyString), enabled: publicKeyString !== '' })
  console.log('\n ~ App ~ data:', data)
  console.log('\n ~ App ~ isLoading:', isLoading)
  console.log('\n ~ App ~ error:', error)

  // handlers
  function handleTokenValueChange(value: string) {
    setTokenToSwapAddress(value)
  }

  function handleSelectedKeysChange(value: string) {
    setSelectedKeys(value)
  }

  // constants
  const tokenQueryLowerCase = tokenQuery.toLowerCase()
  const tokenList = Array.isArray(data) ? data.filter((token: any) => token?.content?.metadata?.symbol?.toLowerCase().includes(tokenQueryLowerCase) || token?.content?.metadata?.name?.includes(tokenQueryLowerCase)) : []
  console.log('\n ~ App ~ tokenList:', tokenList)

  return (
    <>
      <Navbar maxWidth="sm" className="pb-8">
        <NavbarBrand>
          <p className="font-bold text-2xl text-zinc-100">TradorSwapper</p>
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
                  <span className="text-small text-foreground">{token.name}</span>
                  <span className="text-small text-foreground opacity-70">{token.symbol}</span>
                </div>

              </div>
            </CustomRadio>
          ))}
        </CustomRadioGroup>

        {/* Pick from */}
        <div className="flex flex-col gap-2">
          <span className="text-foreground-500">Pick tokens to swap from</span>
          <div className="flex flex-col p-2 border-2 border-default rounded-lg min-h-[420px]">
            {!publicKey
              ? (
                <div className="flex flex-1 justify-center items-center">
                  <p className="text-small text-foreground opacity-80">Please connect your wallet to display your tokens</p>
                </div>
                )
              : null}

            {isLoading
              ? (
                <div className="flex flex-1 justify-center items-center">
                  <Spinner label="Loading wallet tokens..." color="primary" labelColor="foreground" />
                </div>
                )
              : null}

            {data && data.length > 0
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

            {tokenList && tokenList.length > 0
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
                        <div className="flex flex-row justify-between  pl-2 pr-4">
                          <div className="flex gap-4 items-center">
                            <Avatar name={token?.content?.metadata?.symbol ?? ''} size="sm" radius="full" isBordered src={token.content.links.image} />
                            <div className="flex flex-col">
                              <span className="text-small text-foreground">{token?.content?.metadata?.symbol ?? '-'}</span>
                              <span className="text-small text-foreground opacity-70">{token.shortAddress}</span>
                            </div>
                          </div>

                          <div className="flex flex-col text-right">
                            {token?.token_info?.price_info
                              ? (
                                <>
                                  <span className="text-small text-foreground">
                                    $
                                    {token.totalValue}
                                  </span>
                                  <span className="text-small text-foreground opacity-70">{token.formattedBalance}</span>
                                </>
                                )
                              : null}

                          </div>
                        </div>
                      </ListboxItem>
                    ))
                  }

                </Listbox>
                )
              : null}
          </div>
        </div>

        {/* Modal Wallet */}
        <WalletModal isOpen={isOpen} onOpenChange={onOpenChange} />
      </main>
    </>
  )
}
