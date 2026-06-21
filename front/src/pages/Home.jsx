import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="space-y-4 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground lg:text-5xl">
          SmartBudget
        </h1>
        <p className="text-lg text-muted-foreground">
          Aplikacja do zarządzania Twoimi finansami
        </p>
      </div>

      <div className="mt-8 flex w-full max-w-sm flex-col gap-4 sm:flex-row sm:justify-center">
        <Button asChild size="lg" className="w-full sm:w-auto">
          <Link to="/login">Log in</Link>
        </Button>

        <Button
          asChild
          variant="outline"
          size="lg"
          className="w-full sm:w-auto"
        >
          <Link to="/register">Sign up</Link>
        </Button>
      </div>
    </div>
  );
}

export default Home;
