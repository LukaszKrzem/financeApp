import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertTriangle } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, isChunkError: false };
  }

  static getDerivedStateFromError(error) {
    const isChunkError =
      error?.name === 'ChunkLoadError' ||
      error?.message?.includes('Failed to fetch dynamically imported module') ||
      error?.message?.includes('Importing a module script failed');

    return { hasError: true, isChunkError };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);

    if (this.state.isChunkError) {
      const lastReload = sessionStorage.getItem('chunk-reload-timestamp');
      const now = Date.now();
      if (!lastReload || now - parseInt(lastReload, 10) > 10000) {
        sessionStorage.setItem('chunk-reload-timestamp', now.toString());
        window.location.reload();
      }
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center">
          <div className="max-w-md w-full p-6 bg-card border border-border rounded-xl shadow-lg flex flex-col items-center space-y-4">
            <div className="p-3 bg-amber-500/10 rounded-full text-amber-500">
              <AlertTriangle className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-bold text-foreground">
              {this.state.isChunkError
                ? 'Dostępna jest nowa wersja aplikacji'
                : 'Coś poszło nie tak'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {this.state.isChunkError
                ? 'Aplikacja została zaktualizowana. Odśwież stronę, aby pobrać najnowszą wersję.'
                : 'Wystąpił niespodziewany błąd. Spróbuj odświeżyć stronę.'}
            </p>
            <Button onClick={this.handleReload} className="w-full gap-2">
              <RefreshCw className="h-4 w-4" />
              Odśwież aplikację
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
