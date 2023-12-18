import { useState } from 'react'
import { Avatar, Button } from '@nextui-org/react'

// components
import { CustomRadio, CustomRadioGroup } from './components/Radio'

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

export default function App() {
  // react hooks
  const [tokenToSwapAddress, setTokenToSwapAddress] = useState<string | undefined>(undefined)
  console.log('\n ~ App ~ tokenToSwapAddress:', tokenToSwapAddress)

  // handlers
  function handleTokenValueChange(value: string) {
    setTokenToSwapAddress(value)
  }

  return (
    <div className="p-2 pt-4">
      <main className="max-w-xl m-auto flex flex-col gap-6">

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
            <div className="flex flex-1 justify-center items-center">
              <Button color="primary">
                Connect Wallet
              </Button>
            </div>
          </div>
        </div>

      </main>

    </div>
  )
}
