// src/app/crowdfund-guide/page.tsx
"use client";

import { useEffect } from 'react';
import Image from 'next/image';

// Image imports
import crowdfundHome from '/public/assets/crowdfund-home.jpeg';
import crowdfundHome2 from '/public/assets/crowdfund-home2.jpeg';
import create1 from '/public/assets/create-1.jpeg';
import create2 from '/public/assets/create-2.jpeg';
import activeCrowdfund from '/public/assets/active-crowdfund.jpeg';
import completedCrowdfund from '/public/assets/completed-crowdfund.jpeg';
import crowfundDetailActive from '/public/assets/crowfund-detail-active.jpeg';
import crowfundDetailCompleted from '/public/assets/crowfund-detail-completed.jpeg';
import solanaLogo from '/public/assets/solana_logo.jpeg';
import walletImage from '/public/assets/wallet_image2.jpeg';

const CrowdfundGuide: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-white text-black overflow-y-auto">
      {/* Main Content */}
      <main className="pt-16 sm:pt-20 pb-10 px-4 sm:px-6 md:px-8 lg:px-12 max-w-5xl mx-auto">
        {/* Introduction */}
        <section className="mb-10 sm:mb-12">
          <h1
            className="text-5xl font-bold text-gray-900 mb-4 text-center"
            style={{ fontWeight: 300 }}
          >
            Crowdfund.fun Guide
          </h1>
          <p className="text-gray-700 text-sm sm:text-base">
            This guide explains how to raise funds and donate on Crowdfund.fun using Solana. Create a campaign, gather support, and launch your token on Pump.fun effortlessly. Follow the steps below to get started!
          </p>
        </section>

        {/* Prerequisites */}
        <section className="mb-10 sm:mb-12">
          <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 text-black">Prerequisites</h2>
          <ul className="list-disc list-inside text-gray-700 text-sm sm:text-base space-y-2 sm:space-y-3">
            <li>
              <strong>Solana Wallet</strong>: Install a wallet like Phantom or Solflare in your browser.
              <Image
                src={walletImage}
                alt="Wallet Connection Example"
                className="mt-3 sm:mt-4 rounded-lg shadow-md w-full sm:w-3/4 md:w-2/3 lg:w-1/2 h-auto"
                width={600}
                height={400}
              />
            </li>
            <li>
              <strong>SOL Balance</strong>: Ensure you have SOL in your wallet on Solana Mainnet:
              <ul className="list-circle list-inside ml-4 mt-1 space-y-1 text-sm sm:text-base">
                <li>
                  <strong>0.1 SOL</strong> for creating a crowdfund (gas fees for transferring SOL,
                  creating the token on Pump.fun, and sending tokens to the target wallet).
                </li>
                <li>
                  <strong>0.01 to 10 SOL</strong> per donation if contributing to funds.
                </li>
                <li>Additional SOL for transaction fees.</li>
              </ul>
              <Image
                src={solanaLogo}
                alt="Solana Logo"
                className="mt-3 sm:mt-4 rounded-lg shadow-md w-20 sm:w-24 h-auto"
                width={96}
                height={96}
              />
            </li>
            <li>
              <strong>Crowdfund.fun Account</strong>: Connect your wallet on the homepage to register or
              log in.
            </li>
          </ul>
        </section>

        {/* Step-by-Step Guide */}
        <section className="mb-10 sm:mb-12">
          <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 text-black">
            How to Raise Funds
          </h2>
          <div className="space-y-6 sm:space-y-8">
            {/* Step 1 */}
            <div>
              <h3 className="text-lg sm:text-xl font-medium mb-2 text-black">
                Step 1: Connect Your Solana Wallet
              </h3>
              <p className="text-gray-700 text-sm sm:text-base">
                Visit the Crowdfund.fun homepage and click "Connect Wallet" to link your Solana wallet
                (e.g., Phantom).
              </p>
              <Image
                src={crowdfundHome}
                alt="Crowdfund.fun Homepage"
                className="mt-3 sm:mt-4 rounded-lg shadow-md w-full sm:w-3/4 md:w-2/3 lg:w-1/2 h-auto"
                width={600}
                height={400}
              />
              <p className="text-gray-700 text-sm sm:text-base mt-3 sm:mt-4">
                Select your wallet from the prompt, and once connected, this registers you on the platform automatically.
              </p>
              <Image
                src={crowdfundHome2}
                alt="Crowdfund.fun Homepage Additional View"
                className="mt-3 sm:mt-4 rounded-lg shadow-md w-full sm:w-3/4 md:w-2/3 lg:w-1/2 h-auto"
                width={600}
                height={400}
              />
            </div>

            {/* Step 2 */}
            <div>
              <h3 className="text-lg sm:text-xl font-medium mb-2 text-black">Step 2: Create a Fund</h3>
              <p className="text-gray-700 text-sm sm:text-base">
                Click "Create Fund" and fill out the form with the following details:
                <ul className="list-disc list-inside mt-2 space-y-1 text-sm sm:text-base text-gray-700">
                  <li>
                    <strong>Image</strong>: Upload a banner or logo for your fund.
                  </li>
                  <li>
                    <strong>Fund Name</strong>: A unique name for your campaign.
                  </li>
                  <li>
                    <strong>Token Name</strong>: Name of the token to be created.
                  </li>
                  <li>
                    <strong>Token Ticker</strong>: Short ticker symbol (e.g., $FUND).
                  </li>
                  <li>
                    <strong>Token Description</strong>: Brief description of your token’s purpose.
                  </li>
                  <li>
                    <strong>Percent Supply to Buy</strong>: Choose 5%, 10%, 25%, 50%, or 75% of the
                    token supply to buy on Pump.fun when launched.
                  </li>
                  <li>
                    <strong>Target Solana Wallet</strong>: Wallet address to receive the developer’s
                    bought tokens.
                  </li>
                  <li>
                    <strong>Optional Links</strong>: Twitter URL, Telegram URL, or website URL for
                    promotion.
                  </li>
                </ul>
                <strong>Note</strong>: Creating a fund costs 0.1 SOL, used as gas fees for transferring
                SOL and donations to the Pump.fun wallet, creating the token on Pump.fun, and sending
                the token to your target Solana wallet.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3 sm:mt-4">
                <Image
                  src={create1}
                  alt="Create Fund Form Part 1"
                  className="rounded-lg shadow-md w-full h-auto"
                  width={600}
                  height={400}
                />
                <Image
                  src={create2}
                  alt="Create Fund Form Part 2"
                  className="rounded-lg shadow-md w-full h-auto"
                  width={600}
                  height={400}
                />
              </div>
            </div>

            {/* Step 3 */}
            <div>
              <h3 className="text-lg sm:text-xl font-medium mb-2 text-black">
                Step 3: Receive Donations
              </h3>
              <p className="text-gray-700 text-sm sm:text-base">
                Once your fund is created, it’s listed on the Crowdfund.fun platform. Other users can
                donate between 0.01 and 10 SOL to help you reach your target. You can track progress on
                your fund’s page.
              </p>
              <Image
                src={crowfundDetailActive}
                alt="Active Fund Donation Page"
                className="mt-3 sm:mt-4 rounded-lg shadow-md w-full sm:w-3/4 md:w-2/3 lg:w-1/2 h-auto"
                width={600}
                height={400}
              />
            </div>

            {/* Step 4 */}
            <div>
              <h3 className="text-lg sm:text-xl font-medium mb-2 text-black">
                Step 4: Token Creation on Pump.fun
              </h3>
              <p className="text-gray-700 text-sm sm:text-base">
                When your fund reaches its target, the token is automatically created on Pump.fun using
                part of the 0.1 SOL gas fee. The percentage of the token supply you selected (5%–75%) is
                bought initially and sent to the target Solana wallet you provided, using the remaining
                gas fee for the transfer.
              </p>
            </div>

            {/* Step 5 */}
            <div>
              <h3 className="text-lg sm:text-xl font-medium mb-2 text-black">Step 5: Fund Completion</h3>
              <p className="text-gray-700 text-sm sm:text-base">
                Your fund is now complete! Users can view it in the "Completed Crowdfunds" section on
                the Crowd page. Share your token’s Pump.fun link via Twitter, Telegram, or your website
                to attract more interest.
              </p>
              <Image
                src={crowfundDetailCompleted}
                alt="Completed Fund Page"
                className="mt-3 sm:mt-4 rounded-lg shadow-md w-full sm:w-3/4 md:w-2/3 lg:w-1/2 h-auto"
                width={600}
                height={400}
              />
            </div>
          </div>
        </section>

        {/* Viewing Crowdfunds */}
        <section className="mb-10 sm:mb-12">
          <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 text-black">
            Viewing Active and Completed Crowdfunds
          </h2>
          <p className="text-gray-700 text-sm sm:text-base">
            Explore all crowdfunds on the "Crowd" page of Crowdfund.fun. Active campaigns are open for
            donations, while completed ones show successful token launches. Click any fund to view
            details or donate.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3 sm:mt-4">
            <Image
              src={activeCrowdfund}
              alt="Active Crowdfunds Overview"
              className="rounded-lg shadow-md w-full h-auto"
              width={600}
              height={400}
            />
            <Image
              src={completedCrowdfund}
              alt="Completed Crowdfunds Overview"
              className="rounded-lg shadow-md w-full h-auto"
              width={600}
              height={400}
            />
          </div>
        </section>

        {/* How to Donate */}
        <section className="mb-10 sm:mb-12">
          <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 text-black">How to Donate</h2>
          <div className="space-y-6 sm:space-y-8">
            <div>
              <h3 className="text-lg sm:text-xl font-medium mb-2 text-black">Step 1: Browse Funds</h3>
              <p className="text-gray-700 text-sm sm:text-base">
                Go to the "Crowd" page and browse active crowdfunds. You can donate directly using the
                "Donate" button on a fund’s listing or click "View" to open its details for more
                information.
              </p>
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-medium mb-2 text-black">Step 2: Donate SOL</h3>
              <p className="text-gray-700 text-sm sm:text-base">
                Click "Donate" on the Crowd page or from the fund’s details page. Enter an amount
                between 0.01 and 10 SOL, then confirm the transaction in your Solana wallet. Your
                donation will be added to the fund’s total, helping it reach its goal.
              </p>
              <Image
                src={crowfundDetailActive}
                alt="Donation Interface"
                className="mt-3 sm:mt-4 rounded-lg shadow-md w-full sm:w-3/4 md:w-2/3 lg:w-1/2 h-auto"
                width={600}
                height={400}
              />
            </div>
          </div>
        </section>

        {/* Troubleshooting */}
        <section className="mb-10 sm:mb-12">
          <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 text-black">
            Troubleshooting
          </h2>
          <ul className="list-disc list-inside text-gray-700 text-sm sm:text-base space-y-2 sm:space-y-3">
            <li>
              <strong>Wallet Not Connecting</strong>: Ensure your wallet extension is installed,
              unlocked, and set to Solana Mainnet. Refresh and try again.
            </li>
            <li>
              <strong>Insufficient SOL</strong>: Verify you have at least 0.1 SOL for creating a fund
              or 0.01–10 SOL for donations, plus extra for transaction fees.
            </li>
            <li>
              <strong>Form Errors</strong>: Check that all required fields (image, fund name, token
              details, etc.) are filled correctly.
            </li>
            <li>
              <strong>Donation Not Showing</strong>: Confirm the transaction in your wallet and refresh
              the fund page. Contact support if issues persist.
            </li>
          </ul>
        </section>

        {/* Footer */}
        <footer className="text-center text-gray-500 text-sm sm:text-base">
          <p>
            Need help? Contact us on{' '}
            <a
              href="https://x.com/Crowdfunddotfun"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              X @CrowdfundFun
            </a>
          </p>
        </footer>
      </main>
    </div>
  );
};

export default CrowdfundGuide;