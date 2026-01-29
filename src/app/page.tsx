import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
            Shadow CEO
          </h1>
          <nav className="flex items-center gap-4">
            <SignedOut>
              <SignInButton mode="modal">
                <Button variant="outline">ログイン</Button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Link href="/lobby">
                <Button>ロビーへ</Button>
              </Link>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-7xl font-extrabold mb-6">
            <span className="bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
              投資と裏切り
            </span>
            <br />
            <span className="text-slate-200">のボードゲーム</span>
          </h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            現代社会のインフラ構築をテーマにしたカタン風ボードゲーム。
            表面上の事業ポイントを競いつつ、裏では投資配当で真の勝者を目指せ。
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <Card className="bg-slate-800/50 border-slate-700 hover:border-amber-500/50 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-3xl">💰</span>
                投資フェーズ
              </CardTitle>
              <CardDescription>
                ゲーム開始前に初期資金を自分含む全プレイヤーへ秘密裏に分配
              </CardDescription>
            </CardHeader>
            <CardContent className="text-slate-400">
              自分に全額投資？強そうな他人に分散投資？あなたの戦略が試される。
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 hover:border-amber-500/50 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-3xl">🏢</span>
                事業拡大フェーズ
              </CardTitle>
              <CardDescription>
                リソースを集め、オフィスを建設し事業ポイントを稼げ
              </CardDescription>
            </CardHeader>
            <CardContent className="text-slate-400">
              誰かが6BPに到達したらゲーム終了。でも勝者は別に決まる...？
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 hover:border-amber-500/50 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-3xl">🎰</span>
                決算フェーズ
              </CardTitle>
              <CardDescription>
                ランダムボーナスと投資情報の開示。真の勝者が明らかに！
              </CardDescription>
            </CardHeader>
            <CardContent className="text-slate-400">
              最終獲得マネー = 投資先の事業ポイント × 投資比率の合計
            </CardContent>
          </Card>
        </div>

        {/* CTA */}
        <div className="text-center">
          <SignedOut>
            <SignInButton mode="modal">
              <Button size="lg" className="text-lg px-8 py-6 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700">
                今すぐプレイ
              </Button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <Link href="/lobby">
              <Button size="lg" className="text-lg px-8 py-6 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700">
                ゲームを始める
              </Button>
            </Link>
          </SignedIn>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-700 py-6">
        <div className="container mx-auto px-4 text-center text-slate-500 text-sm">
          © 2026 Shadow CEO. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
