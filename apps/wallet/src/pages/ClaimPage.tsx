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
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-indigo-600 to-violet-700 p-6 text-white text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md mb-4">
        <Sparkles className="h-8 w-8 text-white" />
      </div>

      <h1 className="text-2xl font-black">Claiming your Punch Card</h1>
      <p className="mt-1 text-sm text-indigo-100 max-w-xs">
        Adding your digital loyalty card to your wallet...
      </p>

      {error ? (
        <div className="mt-6 rounded-xl bg-red-500/20 border border-red-400 p-4 text-sm text-white">
          {error}
        </div>
      ) : (
        <div className="mt-6">
          <RefreshCw className="h-6 w-6 animate-spin text-white/80" />
        </div>
      )}
    </div>
  );
}
