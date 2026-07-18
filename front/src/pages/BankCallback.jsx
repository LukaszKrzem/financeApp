import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useData } from '@/context/DataContext';

import { useApi } from '@/hooks/useApi';

export default function BankCallback() {
  const { post } = useApi();
  const { refreshData } = useData();

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing');
  const [errorMessage, setErrorMessage] = useState('');

  const isProcessing = useRef(false);

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

    if (isProcessing.current) return;
    isProcessing.current = true;

    const completeAuthorization = async () => {
      try {
        const data = await post('/api/banking/callback', { code });

        toast.success('Bank connected successfully', {
          description: `Imported ${data.imported_accounts} account(s).`,
        });
        refreshData();
        navigate('/accounts', { replace: true });
      } catch (err) {
        console.error('Error completing bank authorization:', err);
        setStatus('error');
        setErrorMessage(err.message);
      }
    };

    completeAuthorization();
  }, [searchParams, post, navigate, refreshData]);

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
            variant="link"
            onClick={() => navigate('/accounts', { replace: true })}
          >
            Back to Accounts
          </Button>
        </>
      )}
    </div>
  );
}
