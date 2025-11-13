import Link from 'next/link'
import Image from 'next/image'
import ConnectWallet from './ConnectWallet'
import styles from './Header.module.scss'

export default function Header() {
  return (
    <>
      <header className={`${styles.header}`}>
        <div className={`__container`} data-width={`medium`}>
          <ConnectWallet />
        </div>

        <div className={`${styles.alert}`}>Unstaking initiates a 7-day cool-down period before tokens are returned to your wallet.</div>
      </header>
    </>
  )
}
