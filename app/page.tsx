import Link from 'next/link';
import { Package, User, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function Home() {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-zinc-50 font-sans dark:bg-black p-4">
      <div className="w-full max-w-2xl">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Package className="size-16 text-primary" />
            </div>
            <CardTitle className="text-3xl">会社備品管理システム</CardTitle>
            <CardDescription className="text-base">
              会社の備品を効率的に管理するアプリケーション
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Link href="/equipment">
              <Button className="w-full" size="lg">
                <Package />
                備品一覧を見る
              </Button>
            </Link>
            <Link href="/loans/my-loans">
              <Button className="w-full" size="lg" variant="outline">
                <User />
                マイページ（借用状況）
              </Button>
            </Link>
            <Link href="/loans">
              <Button className="w-full" size="lg" variant="outline">
                <History />
                貸出履歴を見る
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
