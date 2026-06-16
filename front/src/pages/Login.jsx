import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Link } from "react-router-dom";
import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";
export function Login({
  apiUrl,
  onLogin,
  handleGoogleLogin,
  GOOGLE_CLIENT_ID,
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const response = await fetch(`${apiUrl}/login`, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({ email: email, password: password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "login error");
      }

      onLogin(data.token);
      console.log(data.token);
    } catch (err) {
      console.log("Invalid credentials");
      setError(err.message);
    }
  };
  return (
    <div className="flex h-screen items-center justify-center ">
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
                  onChange={(e) => setEmail(e.target.value)}
                  required
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
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
            <CardFooter className="flex-col gap-2">
              <Button type="submit" className="w-full">
                Login
              </Button>
              <GoogleOAuthProvider
                clientId={
                  GOOGLE_CLIENT_ID ||
                  "449318029169-r53vkhiu2pcfoohcdacqks1j9737l5e2.apps.googleusercontent.com"
                }
              >
                <GoogleLogin
                  variant="outline"
                  className="w-full"
                  onSuccess={handleGoogleLogin}
                  onError={() => {
                    console.log("Login Failed");
                  }}
                />
              </GoogleOAuthProvider>
            </CardFooter>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
export default Login;
