import type { ReactNode } from 'react';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ToastProvider } from '@/components/ToastProvider';
import { AlertProvider } from '@/components/Alert';

export default function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AlertProvider>
          {children}
        </AlertProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
