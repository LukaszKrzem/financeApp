import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useAsyncAction } from '@/hooks/useAsyncAction';

function Home() {
  const { handleDemoLogin } = useAuth();
  const { loading, run } = useAsyncAction();

  const handleDemo = () => run(handleDemoLogin);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="space-y-4 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground lg:text-5xl">
          SmartBudget
        </h1>
        <p className="text-lg text-muted-foreground">
          Manage your finances, smarter.
        </p>
      </div>

      <div className="mt-10 flex w-full max-w-sm flex-col gap-4 px-4">
        <Button
          size="lg"
          className="w-full h-12 cursor-pointer"
          onClick={handleDemo}
          disabled={loading}
        >
          {loading ? 'Loading demo...' : '🚀 Try Demo'}
        </Button>

        <div className="relative w-full py-2">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-3 text-muted-foreground">or</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 w-full">
          <Button asChild variant="outline" className="w-full">
            <Link to="/login">Log in</Link>
          </Button>

          <Button asChild variant="outline" className="w-full">
            <Link to="/register">Sign up</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Home;
