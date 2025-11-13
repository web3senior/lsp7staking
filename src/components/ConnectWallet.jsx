'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import Web3 from 'web3'
import Icon from '../helper/MaterialIcon'
import DefaultPFP from '@/../public/default-pfp.svg'
import { useUpProvider } from '@/contexts/UpProvider'
import styles from './ConnectWallet.module.scss'
import Shimmer from '../helper/Shimmer'

export default function ConnectWallet() {
  const auth = useUpProvider()

  return (
      <ul className={`flex align-items-center justify-content-between`}>
        <li className={`flex align-items-end`}>{!auth.walletConnected ? <>Connect wallet</>:<>&nbsp;</>}</li>
        <li className={`flex justify-content-end align-items-center`}>{auth.walletConnected && <Profile addr={auth.accounts[0]} />}</li>
      </ul>
  )
}

/**
 * Profile
 * @param {String} addr
 * @returns
 */
const Profile = ({ addr }) => {
  const [data, setData] = useState()

  const getProfile = async (addr) => {
    const myHeaders = new Headers()
    myHeaders.append('Content-Type', `application/json`)
    myHeaders.append('Accept', `application/json`)

    const requestOptions = {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify({
        query: `query MyQuery {
  search_profiles(
    args: {search: "${addr}"}
    limit: 1
  ) {
    fullName
    name
    description
    id
    profileImages {
      src
    }
  }
}`,
      }),
    }
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}`, requestOptions)
    if (!response.ok) {
      throw new Response('Failed to ', { status: 500 })
    }
    const data = await response.json()
    setData(data)
    return data
  }

  useEffect(() => {
    getProfile(addr).then(console.log)
  }, [])

  if (!data)
    return (
      <figure className={`${styles.pfp} f-c flex-column gri-gap-050`}>
        <img alt={`Default PFP`} src={DefaultPFP.src} className={`rounded`} />
      </figure>
    )

  return (
    <div className={`__container`} data-width={`small`}>
      <figure className={`${styles.pfp} f-c flex-column gri-gap-050`}>
        <img
          alt={data.data.search_profiles[0].fullName}
          src={`${data.data.search_profiles[0].profileImages.length > 0 ? data.data.search_profiles[0].profileImages[0].src : 'https://ipfs.io/ipfs/bafkreiatl2iuudjiq354ic567bxd7jzhrixf5fh5e6x6uhdvl7xfrwxwzm'}`}
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
