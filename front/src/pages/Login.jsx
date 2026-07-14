import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import { useAuth } from '@/context/AuthContext';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { toast } from 'sonner';
import { useApi } from '@/hooks/useApi';

export function Login() {
  const { onLogin, googleClientId, handleGoogleLogin, handleDemoLogin } =
    useAuth();
  const { post } = useApi();
  const { loading, run } = useAsyncAction();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleDemo = () => run(handleDemoLogin);

  const handleSubmit = (e) => {
    e.preventDefault();
    run(async () => {
      const data = await post('/login', { email, password });
      if (!data?.token) throw new Error('No token received from server');
      onLogin(data.token);
    });
  };

  return (
    <div className="flex h-screen items-center justify-center">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Login to your account</CardTitle>
          <CardDescription>
            Enter your email below to login to your account
          </CardDescription>
          <CardAction>
            <Button asChild variant="link">
              <Link to="/register">Sign Up</Link>
            </Button>
          </CardAction>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  <a
                    href="#"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <CardFooter className="flex-col gap-4 mt-6 px-0 pb-2">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Logging in...' : 'Login'}
              </Button>
              <Button
                type="button"
                onClick={handleDemo}
                className="w-full"
                variant="secondary"
                disabled={loading}
              >
                {loading ? 'Logging in...' : 'Try demo'}
              </Button>

              <div className="relative w-full py-2">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-muted" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    OR
                  </span>
                </div>
              </div>

              <div className="w-full flex justify-center">
                <GoogleOAuthProvider
                  clientId={
                    googleClientId || import.meta.env.VITE_GOOGLE_CLIENT_ID
                  }
                >
                  <GoogleLogin
                    onSuccess={(googleToken) =>
                      run(() => handleGoogleLogin(googleToken))
                    }
                    onError={() => {
                      console.error('Login Failed');
                      toast.error('Google Login Failed', {
                        description:
                          'Could not authenticate with your Google account.',
                      });
                    }}
                  />
                </GoogleOAuthProvider>
              </div>
            </CardFooter>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default Login;
