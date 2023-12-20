import { Avatar, Button, Modal, ModalBody, ModalContent } from '@nextui-org/react'
import { useWallet } from '@solana/wallet-adapter-react'

interface Props {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export default function WalletModal({ isOpen, onOpenChange }: Props) {
  // solana hooks
  const { select, wallets, publicKey, disconnect } = useWallet()

  // constants
  const installedWallets = wallets.filter(wallet => wallet.readyState === 'Installed')

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <ModalContent>
        {() => (
          <ModalBody>

            <div className=" p-4">
              { !publicKey
                ? installedWallets.length > 0
                  ? (
                    <div className="flex flex-col gap-2">
                      <p>Pick a wallet to connect to</p>
                      {installedWallets.map(wallet => (
                        <Button
                          key={wallet.adapter.name}
                          onClick={() => {
                            select(wallet.adapter.name)

                            onOpenChange(false)
                          }}
                          size="lg"
                          startContent={<Avatar size="sm" radius="full" src={wallet.adapter.icon} alt={wallet.adapter.name} />}
                        >
                          {wallet.adapter.name}
                        </Button>
                      ))}

                    </div>
                    )
                  : (
                    <span>No wallet found. Please download a supported Solana wallet</span>
                    )
                : (
                  <div className="flex flex-col gap-4">
                    <span>{publicKey.toBase58()}</span>
                    <Button onClick={disconnect}>disconnect wallet</Button>
                  </div>
                  )}
            </div>
          </ModalBody>
        )}
      </ModalContent>
    </Modal>
  )
}
