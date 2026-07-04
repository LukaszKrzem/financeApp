import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

export default function BankCallback({ token, apiUrl, setRefreshing }) {
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
        const response = await fetch(`${apiUrl}/api/banking/callback`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ code }),
        });
        const data = await response.json();

        if (!response.ok) {
          const message = Array.isArray(data.detail)
            ? data.detail.map((d) => d.msg).join(', ')
            : data.detail || 'Bank authorization failed';
          throw new Error(message);
        }

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
  }, []);

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
          <button
            onClick={() => navigate('/accounts', { replace: true })}
            className="text-sm underline text-primary"
          >
            Back to Accounts
          </button>
        </>
      )}
    </div>
  );
}
