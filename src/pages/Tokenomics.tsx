import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Coins, Flame, Users, TrendingUp, Lock, Gift, ShieldCheck, AlertTriangle } from "lucide-react";

// Token addresses — driven by .env so we can flip from devnet to mainnet
// without code changes. The actual displayed mint comes from the env.
const FOT_MINT_MAINNET = import.meta.env.VITE_FOT_MINT_MAINNET || "";
const FOT_MINT_DEVNET = "4zaq8xFC2grs6u9q9gjSiQCPqmXCJeqKk9b1UiHzRovA";
const IS_MAINNET_LIVE = FOT_MINT_MAINNET.length > 0;
const DISPLAYED_MINT = IS_MAINNET_LIVE ? FOT_MINT_MAINNET : FOT_MINT_DEVNET;
const SOLSCAN_NETWORK = IS_MAINNET_LIVE ? "" : "?cluster=devnet";
const SOLSCAN_URL = `https://solscan.io/token/${DISPLAYED_MINT}${SOLSCAN_NETWORK}`;

const Tokenomics = () => {
  return (
    <div className="min-h-screen">
      <Navigation />

      {/* Hero */}
      <section className="relative pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-5xl text-center">
          <h1 className="text-4xl md:5xl font-bold mb-6 gradient-text">
            FOT Tokenomics
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            The FilmAuth Token (FOT) is a Solana SPL utility token that powers
            on-chain photo and media authentication. Burn-on-use, transparent,
            and built for real-world utility — not hype.
          </p>
        </div>
      </section>

      {/* Network status banner — only shows while on devnet */}
      {!IS_MAINNET_LIVE && (
        <section className="px-4 sm:px-6 lg:px-8 -mt-4">
          <div className="container mx-auto max-w-5xl">
            <Alert className="border-yellow-500/40 bg-yellow-500/10">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <AlertTitle className="text-yellow-500">Devnet preview</AlertTitle>
              <AlertDescription>
                The token shown below is on Solana <strong>devnet</strong> and
                is for testing only. It has no real value and can be reset by
                the Solana Foundation. The mainnet mint will be announced on
                our website and Twitter. See{" "}
                <a href="https://github.com/goodrica/solana-file-auth/blob/main/MAINNET_LAUNCH.md" className="underline">MAINNET_LAUNCH.md</a>{" "}
                for the deployment runbook.
              </AlertDescription>
            </Alert>
          </div>
        </section>
      )}

      {/* Snapshot */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-5xl">
          <div className="grid md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground font-medium">Symbol</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">FOT</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground font-medium">Network</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Solana</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground font-medium">Standard</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">SPL</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground font-medium">Utility Price</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$0.10 / FOT</div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Mint Address
                  {IS_MAINNET_LIVE && (
                    <span className="inline-flex items-center gap-1 text-xs font-normal text-green-500 bg-green-500/10 px-2 py-0.5 rounded">
                      <ShieldCheck className="h-3 w-3" />
                      Mainnet
                    </span>
                  )}
                  {!IS_MAINNET_LIVE && (
                    <span className="inline-flex items-center gap-1 text-xs font-normal text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded">
                      <AlertTriangle className="h-3 w-3" />
                      Devnet
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <a
                  href={SOLSCAN_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm break-all bg-muted px-3 py-2 rounded-md inline-block hover:bg-muted/70 transition-colors"
                >
                  {DISPLAYED_MINT}
                </a>
                <p className="text-xs text-muted-foreground mt-2">
                  Click to verify on Solscan. On mainnet, mint authority and
                  freeze authority will both be revoked.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-4 grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground font-medium">Max Supply</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1,000,000,000 FOT</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Hard-capped on mainnet. Mint authority is revoked after
                  initial distribution — no additional FOT can ever be
                  created.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground font-medium">Authentications per FOT</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1 FOT = 1 burn</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Every photo hash anchored on-chain permanently burns 1 FOT
                  from the user's wallet. Burn transactions are visible on
                  Solscan.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Core mechanics */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold mb-10 text-center">Core Mechanics</h2>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <Flame className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Burn-on-Use</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                Each authentication consumes (burns) 1 FOT — like a digital
                film negative. Once spent, it cannot be reused, creating
                permanent supply pressure tied to real platform usage.
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Lock className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Utility, Not Speculation</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                FOT exists to pay for a tangible service: writing a SHA-256
                hash of your media to the Solana blockchain. The token's value
                is anchored to actual authentication demand.
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Coins className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Affordable by Design</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                Built on Solana's low-fee infrastructure so creators of any
                size can timestamp work without prohibitive cost. Target
                price: $0.10 per authentication.
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Gift className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Airdrops & Referrals</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                New users receive starter FOT via airdrop, and the referral
                program rewards community growth — bootstrapping organic
                adoption rather than paid speculation.
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Supply allocation */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold mb-10 text-center">Supply Allocation</h2>

          <div className="grid md:grid-cols-2 gap-6 items-start">
            <Card>
              <CardHeader>
                <CardTitle>Distribution Model</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  <li className="flex justify-between items-center border-b border-border pb-2">
                    <span className="text-muted-foreground">User airdrops & onboarding</span>
                    <span className="font-semibold">35%</span>
                  </li>
                  <li className="flex justify-between items-center border-b border-border pb-2">
                    <span className="text-muted-foreground">Public sale & purchases</span>
                    <span className="font-semibold">30%</span>
                  </li>
                  <li className="flex justify-between items-center border-b border-border pb-2">
                    <span className="text-muted-foreground">Development & operations</span>
                    <span className="font-semibold">15%</span>
                  </li>
                  <li className="flex justify-between items-center border-b border-border pb-2">
                    <span className="text-muted-foreground">Community & referrals</span>
                    <span className="font-semibold">10%</span>
                  </li>
                  <li className="flex justify-between items-center">
                    <span className="text-muted-foreground">Reserve / partnerships</span>
                    <span className="font-semibold">10%</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <TrendingUp className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Deflationary Pressure</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-3">
                <p>
                  Because every authentication burns a token, the circulating
                  supply naturally contracts as platform usage grows.
                </p>
                <p>
                  Combined with a fixed initial supply, this aligns long-term
                  token holders with the success and adoption of FilmAuth.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How to get FOT */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold mb-10 text-center">How to Get FOT</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <Gift className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Sign Up Airdrop</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                Create an account and connect a Solana wallet to claim your
                welcome FOT.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Users className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Refer Friends</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                Share your referral link from your dashboard and earn FOT for
                every new authenticated user.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Coins className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Purchase Directly</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                Buy FOT in-app at $0.10 per token — credits are instantly
                added to your account for authentications.
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-3xl">
          <p className="text-sm text-muted-foreground text-center">
            FOT is a utility token used to pay for on-chain authentication
            services. It is not an investment, security, or financial product.
            Allocations and pricing may evolve as the project grows — see the
            About page for our transparency commitment.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Tokenomics;
