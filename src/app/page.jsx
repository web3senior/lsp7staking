'use client'

import { useState, useEffect, useId, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { initStakingContract, initBanditContract, initFabsContract, getTotalStaked, getPendingRewards, getBalanceOfBandit, getStakedBalance, getTotalDailyRewards } from '@/util/communication'
import { toast } from 'react-hot-toast'
import DefaultPFP from '@/../public/default-pfp.svg'
import Web3 from 'web3'
import logo from '@/../public/logo.svg'
import ABI from '@/abi/lsp7staking.json'
import Loading from '@/components/Loading'
import moment from 'moment'
import LSP7ABI from '@/abi/lsp7.json'
import { useUpProvider } from '@/contexts/UpProvider'
import styles from './Page.module.scss'
import Shimmer from '@/helper/Shimmer'

moment.defineLocale('en-short', {
  relativeTime: {
    future: 'in %s',
    past: '%s', //'%s ago'
    s: '1s',
    ss: '%ds',
    m: '1m',
    mm: '%dm',
    h: '1h',
    hh: '%dh',
    d: '1d',
    dd: '%dd',
    M: '1mo',
    MM: '%dmo',
    y: '1y',
    yy: '%dy',
  },
})

export default function Page() {
  const [activeTab, setActiveTab] = useState('stake')
  const [rewardsModal, setRewardsModasl] = useState(false)
  const [totalStaked, setTotalStaked] = useState(0)
  const [isApproved, setIsApproved] = useState(false)
  const [totalDailyRewards, setTotalDailyRewards] = useState(0)
  const { web3, contract } = initStakingContract()
  const auth = useUpProvider()

  const handleStake2 = (e) => {
    const t = toast.loading(`Waiting for transaction's confirmation`)
    console.log(giftModalMessage.current.value)
    const message = giftModalMessage.current.value

    try {
      // window.lukso.request({ method: 'eth_requestAccounts' }).then((accounts) => {})
      const web3 = new Web3(auth.provider)

      // Create a Contract instance
      const contract = new web3.eth.Contract(ABI, process.env.NEXT_PUBLIC_LUKSO_PROVIDER)
      contract.methods
        .stake(auth.contextAccounts[0], selectedEmoji.item.emojiId, web3.utils.toHex(message))
        .send({
          from: auth.accounts[0],
          value: selectedEmoji.item.price,
        })
        .then((res) => {
          console.log(res)

          toast.success(`Done`)
          toast.dismiss(t)

          party.confetti(document.body, {
            count: party.variation.range(20, 40),
          })
        })
        .catch((error) => {
          toast.dismiss(t)
        })
    } catch (error) {
      console.log(error)
      toast.dismiss(t)
    }
  }

  const handleApprove = (e) => {
    const t = toast.loading(`Waiting for transaction's confirmation`)

    try {
      // window.lukso.request({ method: 'eth_requestAccounts' }).then((accounts) => {})
      const web3 = new Web3(auth.provider)

      const amount = document.querySelector(`input[name="amount"]`).value

      // Create a Contract instance
      const contract = new web3.eth.Contract(LSP7ABI, process.env.NEXT_PUBLIC_BANDIT_CONTRACT)
      contract.methods
        .authorizeOperator(process.env.NEXT_PUBLIC_STAKING_CONTRACT, web3.utils.toWei(amount, `ether`), `0x`)
        .send({ from: auth.accounts[0] })
        .then((res) => {
          console.log(res)

          setIsApproved(true)

          toast.success(`Done`)
          toast.dismiss(t)
        })
        .catch((error) => {
          toast.dismiss(t)
        })
    } catch (error) {
      console.log(error)
      toast.dismiss(t)
    }
  }

  const handleStake = (e) => {
    const t = toast.loading(`Waiting for transaction's confirmation`)

    try {
      // window.lukso.request({ method: 'eth_requestAccounts' }).then((accounts) => {})
      const web3 = new Web3(auth.provider)

      const amount = document.querySelector(`input[name="amount"]`).value

      // Create a Contract instance
      const contract = new web3.eth.Contract(ABI, process.env.NEXT_PUBLIC_STAKING_CONTRACT)
      contract.methods
        .stake(web3.utils.toWei(amount, `ether`))
        .send({ from: auth.accounts[0] })
        .then((res) => {
          console.log(res)

          toast.success(`Done`)
          toast.dismiss(t)

          party.confetti(document.body, {
            count: party.variation.range(20, 40),
          })
        })
        .catch((error) => {
          toast.dismiss(t)
        })
    } catch (error) {
      console.log(error)
      toast.dismiss(t)
    }
  }

  useEffect(() => {
    getTotalStaked().then((result) => {
      setTotalStaked(web3.utils.fromWei(result, `ether`))
    })

    getTotalDailyRewards().then((result) => {
      console.log(result)
      setTotalDailyRewards(result)
    })
  }, [])

  return (
    <div className={`${styles.page} ms-motion-slideDownIn`}>
      {rewardsModal && <RewardsModal setRewardsModasl={setRewardsModasl} />}

      <header className={`${styles.header}`}>
        <div className={`__container`} data-width={`medium`}>
          <ul className={`flex align-items-center justify-content-between`}>
            <li className={`flex justify-content-start align-items-center`}>
              {auth.walletConnected ? (
                <Profile addr={auth.accounts[0]} />
              ) : (
                <>
                  <img alt={`Default PFP`} src={DefaultPFP.src} className={`rounded`} />
                </>
              )}
            </li>
            <li className={`flex justify-content-end`}>
              {!auth.walletConnected ? (
                <span>Connect Profile</span>
              ) : (
                <button className={`${styles.btnRewards} d-f-c gap-050`} onClick={() => setRewardsModasl(true)}>
                  Rewards{' '}
                  <svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M8.33675 12.5V10M13.3335 2.50004H14.1668C15.0873 2.50004 15.8335 3.24623 15.8335 4.16671C15.8335 5.54742 14.7142 6.66671 13.3335 6.66671M13.3335 2.50004C13.3335 1.57957 12.5873 0.833374 11.6668 0.833374H5.00016C4.07969 0.833374 3.3335 1.57957 3.3335 2.50004M13.3335 2.50004V5.00004C13.3335 7.76146 11.0949 10 8.3335 10C5.57207 10 3.3335 7.76146 3.3335 5.00004V2.50004M3.3335 2.50004H2.50016C1.57969 2.50004 0.833496 3.24623 0.833496 4.16671C0.833496 5.54742 1.95279 6.66671 3.3335 6.66671M12.5002 14.1667C12.5002 13.2462 11.754 12.5 10.8335 12.5H5.8335C4.91302 12.5 4.16683 13.2462 4.16683 14.1667C4.16683 15.0872 4.91302 15.8334 5.8335 15.8334H10.8335C11.754 15.8334 12.5002 15.0872 12.5002 14.1667Z"
                      stroke="white"
                      strokeWidth="1.66667"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              )}
            </li>
          </ul>
        </div>

        <div className={`${styles.alert}`}>Unstaking initiates a 7-day cool-down period before tokens are returned to your wallet.</div>
      </header>

      <div className={`__container flex flex-column align-items-center`} data-width={`medium`}>
        <h1 className={`${styles.welcome} flex flex-row align-items-center`}>
          Stake
          <img alt={``} src={logo.src} style={{ width: `80px` }} />
          and earn rewards
        </h1>

        <div className={`card ${styles.tabs} w-100`}>
          <ul className={`flex flex-row align-items-center justify-content-between gap-1 w-100`}>
            <li className={`w-100`}>
              <button className={`flex flex-row align-items-center justify-content-center gap-025 ${activeTab === 'stake' ? styles.activeTab : ''}`} onClick={() => setActiveTab('stake')}>
                <b>Stake</b>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M16.6666 12.2917V15C16.6666 15.9205 15.9204 16.6667 14.9999 16.6667H4.99992C4.07944 16.6667 3.33325 15.9205 3.33325 15V12.2917M9.99992 3.33337V12.7084M9.99992 3.33337L13.7499 7.08337M9.99992 3.33337L6.24992 7.08337"
                    stroke="#555555"
                    strokeWidth="1.66667"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </li>
            <li className={`w-100`}>
              <button className={`flex flex-row align-items-center justify-content-center gap-025 ${activeTab === 'unstake' ? styles.activeTab : ''}`} onClick={() => setActiveTab('unstake')}>
                <b>Unstake</b>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M16.6666 12.5V15C16.6666 15.9205 15.9204 16.6667 14.9999 16.6667H4.99992C4.07944 16.6667 3.33325 15.9205 3.33325 15V12.5M9.99992 12.0834V3.33337M9.99992 12.0834L7.08325 9.16671M9.99992 12.0834L12.9166 9.16671"
                    stroke="#555555"
                    strokeWidth="1.66667"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </li>
          </ul>
        </div>

        <>
          <div className={`card w-100`}>
            <div className={`card__body`}>
              <ul className={`flex flex-row align-items-center justify-content-between w-100`}>
                <li className={`flex flex-column align-items-start`}>
                  <b>42%</b>
                  <span style={{ color: `var(--gray-600)` }}>Current APR</span>
                </li>
                <li>
                  <span className={`${styles.divider}`}></span>
                </li>
                <li className={`flex flex-column align-items-start`}>
                  <b>{totalDailyRewards ? Intl.NumberFormat('en-US').format(parseFloat(Web3.utils.fromWei(Number(totalDailyRewards.totalBanditReward), `ether`)).toFixed(2)) : 0} $BANDIT</b>
                  <b>{totalDailyRewards ? Intl.NumberFormat('en-US').format(parseFloat(Web3.utils.fromWei(Number(totalDailyRewards.totalFabsReward), `ether`)).toFixed(2)) : 0} $FABS</b>
                  <span style={{ color: `var(--gray-600)` }}>Daily Rewards</span>
                </li>
                <li>
                  <span className={`${styles.divider}`}></span>
                </li>
                <li className={`flex flex-column align-items-start`}>
                  <b>{totalDailyRewards ? Intl.NumberFormat('en-US').format(parseFloat(Web3.utils.fromWei(Number(totalDailyRewards.totalBanditReward) * 30, `ether`)).toFixed(2)) : 0} $BANDIT</b>
                  <b>{totalDailyRewards ? Intl.NumberFormat('en-US').format(parseFloat(Web3.utils.fromWei(Number(totalDailyRewards.totalFabsReward) * 30, `ether`)).toFixed(2)) : 0} $FABS</b>
                  <span style={{ color: `var(--gray-600)` }}>Monthly Rewards</span>
                </li>
              </ul>

              <div className={`mt-20`}>
                <div className={`flex flex-row align-items-center justify-content-between`}>
                  <h3>Pool Capacity</h3>
                  <h3 style={{ color: `var(--color-primary)` }}>{(totalStaked / 5000000) * 100}% Full</h3>
                </div>

                <progress value={totalStaked} min={0} max={5000000} />

                <ul className={`flex flex-row align-items-center justify-content-between w-100 `}>
                  <li className={`flex flex-column align-items-start`} title={`${Intl.NumberFormat('en-US').format(totalStaked)} $BANDIT`}>
                    {new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(totalStaked)}
                    &nbsp; Staked
                  </li>
                  <li className={`flex flex-column align-items-start`}>5.0M Limit</li>
                </ul>
              </div>
            </div>
          </div>

          <div className={`card w-100`}>
            <div className={`card__body`}>
              <InputBox activeTab={activeTab} />

              {activeTab === `stake` && (
                <>
                  {!isApproved ? (
                    <button className={`btn mt-20`} style={{ background: `var(--blue-light-600)` }} disabled={!auth.walletConnected} onClick={(e) => handleApprove(e)}>
                      Approve
                    </button>
                  ) : (
                    <button className={`btn mt-20`} disabled={!auth.walletConnected} onClick={(e) => handleStake(e)}>
                      Stake
                    </button>
                  )}
                </>
              )}

              {activeTab === `unstake` && (
                <>
                  <button className={`btn mt-20`} disabled={!auth.walletConnected} onClick={(e) => handleStake(e)}>
                    Untake
                  </button>
                </>
              )}

              <p className={`text-center mt-10`}>
                Don’t have $BANDIT? <Link href={`#`}>Buy here</Link>
              </p>
            </div>
          </div>
        </>
      </div>

      {/* <div className={`__container`} data-width={`large`}>
        <LastGift />
      </div> */}
    </div>
  )
}

const InputBox = ({ activeTab }) => {
  const [userInfo, setUserInfo] = useState()
  const [balance, setBalance] = useState(0)
  const { web3, contract } = initStakingContract()
  const auth = useUpProvider()
  const inputRef = useRef()

  useEffect(() => {
    if (auth.walletConnected) {
      getBalanceOfBandit(auth.accounts[0]).then((balance) => {
        console.log(balance)
        setBalance(balance)
      })

      getStakedBalance(auth.accounts[0]).then((result) => {
        console.log(result)
        setUserInfo(result)
      })
    } else {
      setBalance(0)
      setUserInfo(null)
    }
  }, [auth.walletConnected])

  return (
    <div className={`flex flex-column align-items-start`}>
      <div className={`${styles.inputBox} flex flex-row align-items-start`}>
        <input ref={inputRef} name={`amount`} type="number" placeholder={`0.00`} />
        <button
          onClick={() => {
            if (activeTab === `stake`) {
              balance ? (inputRef.current.value = web3.utils.fromWei(balance, `ether`)) : 0
            } else {
              userInfo.stakedAmount ? (inputRef.current.value = web3.utils.fromWei(userInfo.stakedAmount, `ether`)) : 0
            }
          }}
        >
          MAX
        </button>
      </div>
      <span>Available: {balance ? Intl.NumberFormat('en-US').format(web3.utils.fromWei(balance, `ether`)) : 0} $BANDIT</span>
      <span>Staked Balance: {userInfo ? <span>{Intl.NumberFormat('en-US').format(web3.utils.fromWei(userInfo.stakedAmount, `ether`))}</span> : 0} $BANDIT</span>
    </div>
  )
}

const RewardsModal = ({ setRewardsModasl }) => {
  const [pendingRewards, setPendingRewards] = useState(0)
  const [banditTokenInfo, setBanditTokenInfo] = useState(0)
  const [fabsTokenInfo, setFabsTokenInfo] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [commentContent, setCommentContent] = useState('')
  const auth = useUpProvider()
  const { web3, contract } = initStakingContract()

  async function get_lsp7(contract) {
    console.log(contract)
    let myHeaders = new Headers()
    myHeaders.append('Content-Type', `application/json`)
    myHeaders.append('Accept', `application/json`)

    let requestOptions = {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify({
        query: `query MyQuery {
  Asset(where: {id: {_eq: "${contract}"}}) {
    id
    isLSP7
    lsp4TokenName
    lsp4TokenSymbol
    lsp4TokenType
    name
    totalSupply
    owner_id
    icons {
      id
      src
      url
    }
    transfers(order_by: {blockNumber: desc}, limit: 5) {
      value
      transaction_id
      from {
        id
        fullName
        profileImages {
          src
        }
        isEOA
      }
      to {
        id
        fullName
        profileImages {
          src
        }
        isEOA
      }
    }
    holders(order_by: {balance: desc}, limit: 100) {
      balance
      profile {
        name
        fullName
        id
        isEOA
        isContract
        profileImages {
          src
        }
        tags
      }
    }
  }
}`,
      }),
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}`, requestOptions)
    if (!response.ok) {
      return { result: false, message: `Failed to fetch query` }
    }
    const data = await response.json()
    return data
  }

  const stakingAge = (val) => {
    // Assuming pendingRewards.timeElapsed = 10368n
    var durationSeconds = Number(val)
    var duration = moment.duration(durationSeconds, 'seconds')

    // Get the parts
    var days = duration.days()
    var hours = duration.hours()
    var minutes = duration.minutes()
    var seconds = duration.seconds()

    // Build a formatted string (You'll need to write the logic for this in your template)
    var ageOfStake = `${days ? days + 'd ' : ''}${hours}h ${minutes}m ${seconds}s`
    return ageOfStake
    // Output for 10368 seconds: "2h 52m 48s"
  }

  useEffect(() => {
    getPendingRewards(auth.accounts[0]).then((result) => {
      console.log(result)
      setPendingRewards(result)
      setIsLoading(false)
    })

    get_lsp7(process.env.NEXT_PUBLIC_BANDIT_CONTRACT).then((result) => {
      console.log(result)
      setBanditTokenInfo(result)
    })
    get_lsp7(process.env.NEXT_PUBLIC_FABS_CONTRACT).then((result) => {
      console.log(result)
      setFabsTokenInfo(result)
    })
  }, [])

  if (error) {
    return <span>{error}</span>
  }

  return (
    <div className={`${styles.commentModal} animate fade`} onClick={() => setRewardsModasl()}>
      <div className={`${styles.commentModal__container}`} onClick={(e) => e.stopPropagation()}>
        <header className={`${styles.commentModal__container__header}`}>
          <div className={`flex-1 flex`}>
            <h3>Claim Your Rewards</h3>
          </div>
          <div className={``} style={{ cursor: `pointer` }} aria-label="Close" onClick={() => setRewardsModasl()}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 1L15 15M15 1L1 15" stroke="black" strokeWidth="2" stroke-linecap="round" />
            </svg>
          </div>
        </header>

        <main className={`${styles.commentModal__container__main}`}>
          {isLoading ? (
            <div className="flex flex-column gap-1">
              <Shimmer style={{ width: `100%`, height: `80px` }} />
              <Shimmer style={{ width: `100%`, height: `80px` }} />
              <Shimmer style={{ width: `100%`, height: `40px` }} />
              <div className="flex flex-column align-items-center jusity-content-center gap-1">
                <Shimmer style={{ width: `40%`, height: `10px` }} />
                <Shimmer style={{ width: `60%`, height: `10px` }} />
              </div>
            </div>
          ) : (
            <>
              <div className={`card`}>
                <div className={`card__body flex gap-050`}>
                  {banditTokenInfo ? (
                    <img style={{ aspectRatio: `1/1`, width: `48px`, border: `1px solid var(--black-100)` }} alt={``} src={banditTokenInfo.data.Asset[0].icons[0].src} className={`rounded`} />
                  ) : (
                    <img alt={``} src={DefaultPFP.src} className={`rounded`} />
                  )}

                  <div>
                    <b style={{ color: `var(--color-primary)` }}>
                      <span>$BANDIT </span>
                      <span style={{ borderRadius: `4px`, background: `var(--rose-100)`, padding: `.1rem .2rem` }}>70%</span>
                    </b>
                    <p style={{ color: `var(--black-600)` }}>Primary reward token</p>
                  </div>

                  <div className="flex-1 flex flex-column align-items-end">
                    <h2>{parseFloat(web3.utils.fromWei(pendingRewards.banditReward, `ether`)).toFixed(6)}</h2>
                    <p style={{ color: `var(--black-600)` }}>Pending</p>
                  </div>
                </div>
              </div>

              <div className={`card`}>
                <div className={`card__body flex gap-050`}>
                  {fabsTokenInfo ? (
                    <img style={{ aspectRatio: `1/1`, width: `48px`, border: `1px solid var(--black-100)` }} alt={``} src={fabsTokenInfo.data.Asset[0].icons[0].src} className={`rounded`} />
                  ) : (
                    <img alt={``} src={DefaultPFP.src} className={`rounded`} />
                  )}
                  <div>
                    <b style={{ color: `var(--blue)` }}>
                      $FABS <span style={{ borderRadius: `4px`, background: `var(--blue-100)`, padding: `.1rem .2rem` }}>30%</span>
                    </b>
                    <p style={{ color: `var(--black-600)` }}>Secondary reward token</p>
                  </div>

                  <div className="flex-1 flex flex-column align-items-end">
                    <h2>{parseFloat(web3.utils.fromWei(pendingRewards.fabsReward, `ether`)).toFixed(6)}</h2>
                    <p style={{ color: `var(--black-600)` }}>Pending</p>
                  </div>
                </div>
              </div>

              <button
                title={`Staking age: ${stakingAge(pendingRewards.timeElapsed)}`}
                className={`flex align-items-center justify-content-center gap-050`}
                style={{ borderRadius: `8px`, padding: `1rem`, background: `var(--color-primary)`, color: `var(--white)` }}
              >
                Claim Rewards
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M11.6665 8.33331C13.0472 8.33331 14.1665 7.21402 14.1665 5.83331C14.1665 4.4526 13.0472 3.33331 11.6665 3.33331C10.2858 3.33331 9.1665 4.4526 9.1665 5.83331C9.1665 7.21402 10.2858 8.33331 11.6665 8.33331Z"
                    stroke="white"
                    strokeWidth="1.66667"
                    stroke-linecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M10.6912 3.33335C10.3481 2.36236 9.422 1.66669 8.3335 1.66669C6.95279 1.66669 5.8335 2.78598 5.8335 4.16669C5.8335 5.5474 6.95279 6.66669 8.3335 6.66669C8.62566 6.66669 8.90616 6.61656 9.16683 6.52443"
                    stroke="white"
                    strokeWidth="1.66667"
                    stroke-linecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M3.3335 16.6668H4.16683C4.16683 16.6668 7.16408 17.7002 9.16683 17.5002C11.3055 17.2865 14.7735 15.3123 16.1137 14.5067C16.4618 14.2974 16.6668 13.9209 16.6668 13.5148C16.6668 12.7183 15.8991 12.1471 15.1362 12.3759L9.16683 14.1668"
                    stroke="white"
                    strokeWidth="1.66667"
                    stroke-linecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M3.3335 12.0835L6.59669 10.9958C6.91788 10.8887 7.25747 10.848 7.59487 10.8761L11.0307 11.1624C11.5931 11.2094 11.9906 11.7334 11.884 12.2875C11.7505 12.9817 11.2424 13.5442 10.5653 13.7473L9.16683 14.1669"
                    stroke="white"
                    strokeWidth="1.66667"
                    stroke-linecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              <p className={`text-center mt-20`} style={{ textWrap: `balance`, color: `var(--black-600)`, margin: `1rem auto`, maxWidth: `400px` }}>
                Rewards are distributed continuously and can be claimed at any time without penalties.
              </p>
            </>
          )}
        </main>

        <footer className={`${styles.commentModal__footer}  flex flex-column align-items-start`}></footer>
      </div>
    </div>
  )
}

/**
 * Profile
 * @param {String} addr
 * @returns
 */
const Profile = ({ addr }) => {
  const [profile, setProfile] = useState()

  async function getUniversalProfile(addr) {
    const myHeaders = new Headers()
    myHeaders.append('Content-Type', `application/json`)
    myHeaders.append('Accept', `application/json`)

    const requestOptions = {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify({
        query: `query MyQuery {
  Profile(where: {id: {_eq: "${addr.toLowerCase()}"}}) {
    id
    fullName
    name
    tags
        links {
      id
      title
      url
    }
    standard
    transactions_aggregate {
      aggregate {
        count
      }
    }
    profileImages {
      src
      url
    }
    name
    isEOA
    isContract
    followed_aggregate {
      aggregate {
        count
      }
    }
    following_aggregate {
      aggregate {
        count
      }
    }
    description
    createdBlockNumber
    createdTimestamp
    lastMetadataUpdate
    url
  }
}`,
      }),
    }
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}`, requestOptions)
    if (!response.ok) {
      throw new Response('Failed to ', { status: 500 })
    }
    const data = await response.json()
    return data
  }
  useEffect(() => {
    getUniversalProfile(addr).then((result) => setProfile(result))
  }, [])

  if (!profile)
    return (
      <figure className={`${styles.pfp} f-c flex-column gri-gap-050`}>
        <img alt={`Default PFP`} src={DefaultPFP.src} className={`rounded`} />
      </figure>
    )

  return (
    <div className={`__container`} data-width={`small`}>
      <figure className={`${styles.pfp} f-c flex-column gri-gap-050`}>
        <img
          alt={profile.data.Profile[0].fullName}
          src={`${profile.data.Profile[0].profileImages.length > 0 ? profile.data.Profile[0].profileImages[0].src : 'https://ipfs.io/ipfs/bafkreiatl2iuudjiq354ic567bxd7jzhrixf5fh5e6x6uhdvl7xfrwxwzm'}`}
          className={`rounded`}
        />
        {/* <figcaption>@{data.data.search_profiles[0].name}</figcaption> */}
      </figure>
      {/* <div className={`text-center text-dark`}>
        <div className={`card__body`} style={{ padding: `0rem` }}>
          <small>{data.data.search_profiles[0].description}</small>
        </div>
      </div> */}
    </div>
  )
}
