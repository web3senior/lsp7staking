This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

# LSP7 Staking dapp
🚀 Stake your $BANDIT now! 🚀
First dApp built on LUKSO for staking LSP7!

💰 Fixed APR: 42%

🎯 Rewards split: 70% $BANDIT | 30% $FABS

🏦 Max pool capacity: 5,000,000 $BANDIT

🔥 Max rewards: 1,470,000 $BANDIT + 630,000 $FABS

To stake, 2 transactions are required:

1️⃣ authorizeOperator() → give the smart contract permission to transfer $BANDIT from your UP / Wallet

2️⃣ stake() → deposit your $BANDIT

💸 Each new stake automatically claims your rewards to your UP or Wallet.

⚠️ Unstaking rules:

7-day cooldown after initiating an unstake
(Full withdrawal available after 7 days)
Cannot initiate another unstake during cooldown
Pending rewards for that amount stop accum

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
