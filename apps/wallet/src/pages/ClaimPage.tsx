import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Sparkles, RefreshCw } from 'lucide-react';
import { walletApi } from '../services/api';

export function ClaimPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function autoClaim() {
      if (!id) return;
      try {
        const card = await walletApi.claimCard(id);
        // Instant redirect to the new punch card
        navigate(`/card/${card.id}`, { replace: true });
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Failed to claim loyalty card');
        }
      }
    }

    autoClaim();
  }, [id, navigate]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#FAF8F5] p-6 text-stone-900 text-center">
      <div className="w-full max-w-sm rounded-3xl border border-stone-200 bg-white p-8 shadow-sm flex flex-col items-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F5EFE6] border border-[#E6D9C6] mb-4">
          <Sparkles className="h-8 w-8 text-[#4A3525]" />
        </div>

        <h1 className="text-xl font-black text-stone-900">Claiming your Punch Card</h1>
        <p className="mt-1 text-sm text-stone-500 max-w-xs">
          Adding your digital loyalty card to your wallet...
        </p>

        {error ? (
          <div className="mt-6 w-full rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
            {error}
          </div>
        ) : (
          <div className="mt-6">
            <RefreshCw className="h-6 w-6 animate-spin text-[#4A3525]" />
          </div>
        )}
      </div>
    </div>
  );
}
