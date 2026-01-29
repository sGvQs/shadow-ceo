'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { joinGame } from '@/actions/lobby';

export function JoinGameForm() {
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!code.trim()) {
            setError('参加コードを入力してください');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const result = await joinGame(code.trim());
            if (result?.error) {
                setError(result.error);
            }
        } catch (err) {
            setError('エラーが発生しました');
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <Input
                type="text"
                placeholder="参加コード (例: ABC123)"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                maxLength={6}
                className="text-center text-xl font-mono uppercase tracking-widest bg-slate-700/50 border-slate-600"
            />
            {error && (
                <p className="text-red-400 text-sm">{error}</p>
            )}
            <Button
                type="submit"
                variant="secondary"
                className="w-full"
                disabled={isLoading}
            >
                {isLoading ? '参加中...' : '参加する'}
            </Button>
        </form>
    );
}
