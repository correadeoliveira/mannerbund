import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Toast = { message: string; error?: boolean };
interface UIState {
  userId: string;
  demoOpen: boolean;
  toast?: Toast;
  switchUser: (id: string) => void;
  toggleDemo: () => void;
  notify: (message: string, error?: boolean) => void;
  dismiss: () => void;
}
export const useUI = create<UIState>()(
  persist(
    (set) => ({
      userId: 'u1',
      demoOpen: false,
      switchUser: (userId) => set({ userId }),
      toggleDemo: () => set((s) => ({ demoOpen: !s.demoOpen })),
      notify: (message, error = false) => set({ toast: { message, error } }),
      dismiss: () => set({ toast: undefined }),
    }),
    { name: 'mannerbund-ui', partialize: (state) => ({ userId: state.userId }) },
  ),
);
export async function act<T>(
  operation: () => Promise<T>,
  success?: string,
): Promise<T | undefined> {
  try {
    const result = await operation();
    if (success) useUI.getState().notify(success);
    return result;
  } catch (error) {
    useUI
      .getState()
      .notify(
        error instanceof Error
          ? error.message
          : 'Não foi possível salvar. Verifique o armazenamento do navegador e tente novamente.',
        true,
      );
    return undefined;
  }
}
