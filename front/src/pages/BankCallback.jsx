import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/apiFetch';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';

export default function BankCallback() {
  const { token, apiUrl } = useAuth();
  const { setRefreshing } = useData();

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      setStatus('error');
      setErrorMessage(`Bank authorization was cancelled or failed: ${error}`);
      return;
    }

    if (!code) {
      setStatus('error');
      setErrorMessage('No authorization code received from the bank.');
      return;
    }

    const completeAuthorization = async () => {
      try {
        const data = await apiFetch(`${apiUrl}/api/banking/callback`, token, {
          method: 'POST',
          body: JSON.stringify({ code }),
        });

        toast.success('Bank connected successfully', {
          description: `Imported ${data.imported_accounts} account(s).`,
        });
        setRefreshing((prev) => prev + 1);
        navigate('/accounts', { replace: true });
      } catch (err) {
        console.error('Error completing bank authorization:', err);
        setStatus('error');
        setErrorMessage(err.message);
      }
    };

    completeAuthorization();
  }, [searchParams, apiUrl, token, navigate, setRefreshing]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center p-8 gap-4">
      {status === 'processing' ? (
        <>
          <div className="size-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">
            Connecting your bank account...
          </p>
        </>
      ) : (
        <>
          <p className="text-destructive font-medium">Connection failed</p>
          <p className="text-sm text-muted-foreground">{errorMessage}</p>
          <Button
            onClick={() => navigate('/accounts', { replace: true })}
            className="text-sm underline text-primary"
          >
            Back to Accounts
          </Button>
        </>
      )}
    </div>
  );
}
