import { useEffect, useState } from 'react';
import { liveQuery } from 'dexie';
import { Button } from '../components/ui';
import { DataContext, VisitorContext } from '../state/context';
import { guildDb } from './repository';
import { createGuildExperience, experience } from './experience';
import { seedGuilds, worldTime, type GuildWorld } from './world';
import { GuildContext, type Runtime } from './context';
import { visitorId } from './scripts';
import { markSrc } from '../lib/assets';

export function GuildProvider({ children }: { children: React.ReactNode }) {
  const [runtime, setRuntime] = useState<Runtime>();
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [temporary, setTemporary] = useState(false);
  useEffect(() => {
    let active = true;
    if (temporary) {
      let world = seedGuilds();
      let tail = Promise.resolve();
      const actions = createGuildExperience({
        change<T>(operation: (draft: GuildWorld) => Promise<T>) {
          const transaction = tail.then(async () => {
            const draft = structuredClone(world);
            const result = await operation(draft);
            world = draft;
            if (active) setRuntime({ world, actions });
            return result;
          });
          tail = transaction.then(
            () => {},
            () => {},
          );
          return transaction;
        },
      });
      setRuntime({ world, actions });
      return () => {
        active = false;
      };
    }
    let subscription: { unsubscribe(): void } | undefined;
    const error = () => {
      if (active) setFailed(true);
    };
    void guildDb
      .initialize()
      .then(() => {
        if (!active) return;
        subscription = liveQuery(() => guildDb.worlds.get('app')).subscribe({
          next: (world) => {
            if (active && world) setRuntime({ world, actions: experience });
          },
          error,
        });
      })
      .catch(error);
    return () => {
      active = false;
      subscription?.unsubscribe();
    };
  }, [attempt, temporary]);
  if (failed)
    return (
      <main className="boot-screen">
        <h1>Seu navegador bloqueou o armazenamento</h1>
        <p>
          Você pode fazer a visita agora. Neste modo, o progresso dura enquanto esta página estiver
          aberta.
        </p>
        <Button
          onClick={() => {
            setFailed(false);
            setTemporary(true);
          }}
        >
          Continuar nesta aba
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            setFailed(false);
            setAttempt((a) => a + 1);
          }}
        >
          Tentar salvar novamente
        </Button>
      </main>
    );
  if (!runtime)
    return (
      <main className="boot-screen">
        <img src={markSrc} alt="Mannerbund" />
        <p role="status">Abrindo as guildas…</p>
      </main>
    );
  return (
    <GuildContext.Provider value={runtime}>
      <DataContext.Provider value={runtime.world}>
        <VisitorContext.Provider value={{ userId: visitorId, now: worldTime(runtime.world) }}>
          {children}
        </VisitorContext.Provider>
      </DataContext.Provider>
    </GuildContext.Provider>
  );
}
