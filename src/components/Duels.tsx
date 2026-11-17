import { useEffect, useId, useState } from 'react';
import { EyeIcon, LockSimpleIcon, ShieldIcon, SparkleIcon, SwordIcon } from '@phosphor-icons/react';
import {
  defaultCharacter,
  defeatedBy,
  duelMoveLabels,
  duelNeedsAction,
  duelResult,
  isDuelPlayer,
  openDuelBetween,
  validDuelMoves,
} from '../domain/play';
import { connectionBetween } from '../domain/rules';
import type { Duel, DuelMove, DuelMoves } from '../domain/types';
import { app } from '../services/app';
import { CharacterPortrait } from './Character';
import { Button, useApp, useBusy } from './ui';

const moveIcons = { strength: SwordIcon, guard: ShieldIcon, wit: SparkleIcon };
const movesAvailable = Object.keys(duelMoveLabels) as DuelMove[];
const practiceId = 'oponente-de-treino';

export function DuelChallenge({
  opponentId,
  opponentName,
}: {
  opponentId: string;
  opponentName: string;
}) {
  const { data, userId } = useApp();
  const { busy, run } = useBusy();
  const existing = openDuelBetween(data, userId, opponentId);
  if (existing) {
    const needsAction = duelNeedsAction(existing, userId);
    const label = needsAction
      ? existing.status === 'pending'
        ? 'Responder desafio'
        : 'Falta sua jogada'
      : 'Ver duelo';
    return (
      <a
        className={`button button-${needsAction ? 'primary' : 'secondary'}`}
        href={`#duelo-${existing.id}`}
      >
        {label}
      </a>
    );
  }
  return (
    <Button
      variant="secondary"
      aria-label={`Desafiar ${opponentName}`}
      disabled={busy}
      onClick={() => void run(() => app.challengeDuel(userId, opponentId), 'Desafio enviado.')}
    >
      Desafiar
    </Button>
  );
}

export function ProfileDuels() {
  const { data, userId } = useApp();
  const [practiceOpen, setPracticeOpen] = useState(false);
  const mine = data.duels.filter((duel) => isDuelPlayer(duel, userId)).reverse();
  const opened = mine
    .filter((duel) => duel.status === 'pending' || duel.status === 'active')
    .sort((a, b) => Number(duelNeedsAction(b, userId)) - Number(duelNeedsAction(a, userId)));
  const history = mine.filter((duel) => duel.status === 'finished' || duel.status === 'closed');
  const newestFinished = history.find((duel) => duel.status === 'finished');

  return (
    <section className="profile-duels" aria-labelledby="duels-heading">
      <div className="section-heading duel-section-heading">
        <h2 id="duels-heading">Duelos</h2>
        <Button
          variant="secondary"
          aria-expanded={practiceOpen}
          onClick={() => setPracticeOpen(!practiceOpen)}
        >
          {practiceOpen ? 'Fechar treino' : 'Treinar sozinho'}
        </Button>
      </div>
      {practiceOpen && <PracticeDuel key={userId} />}
      {!mine.length && <p className="muted">Escolha uma conexão aceita para enviar um desafio.</p>}
      {opened.map((duel) => (
        <DuelCard duel={duel} key={duel.id} />
      ))}
      {history.length > 0 && (
        <>
          <h3 className="duel-history-heading">Histórico de duelos</h3>
          {history.map((duel) => (
            <DuelCard duel={duel} key={duel.id} autoReveal={duel.id === newestFinished?.id} />
          ))}
        </>
      )}
    </section>
  );
}

function DuelCard({ duel, autoReveal = false }: { duel: Duel; autoReveal?: boolean }) {
  const { data, userId } = useApp();
  const { busy, run } = useBusy();
  const challenger = data.users.find((user) => user.id === duel.challengerId)!;
  const opponent = data.users.find((user) => user.id === duel.opponentId)!;
  const received = opponent.id === userId;
  const myMoves = received ? duel.opponentMoves : duel.challengerMoves;
  const me = received ? opponent : challenger;
  const other = received ? challenger : opponent;
  const result = duelResult(duel);
  const open = result ? openDuelBetween(data, userId, other.id) : undefined;
  const mayRematch = !!result && connectionBetween(data, userId, other.id)?.status === 'accepted';

  return (
    <article
      className={`duel-card${duelNeedsAction(duel, userId) ? ' duel-card-action' : ''}`}
      id={`duelo-${duel.id}`}
    >
      <h3>Duelo com {other.name}</h3>
      <div className="duel-players">
        {[me, other].map((player) => (
          <div key={player.id}>
            <CharacterPortrait
              appearance={player.character}
              label={`Personagem de ${player.name}`}
            />
            <span>{player.name}</span>
          </div>
        ))}
      </div>
      {duel.status === 'pending' && (
        <>
          <p className="muted">
            {received ? 'Você recebeu um desafio.' : 'Aguardando aceite do desafio.'}
          </p>
          {received && (
            <div className="duel-actions">
              <Button
                disabled={busy}
                onClick={() => void run(() => app.respondToDuel(userId, duel.id, true))}
              >
                Aceitar duelo
              </Button>
              <Button
                variant="secondary"
                disabled={busy}
                onClick={() => void run(() => app.respondToDuel(userId, duel.id, false))}
              >
                Recusar duelo
              </Button>
            </div>
          )}
        </>
      )}
      {duel.status === 'active' &&
        (myMoves ? (
          <p className="muted duel-waiting">
            <LockSimpleIcon size={16} aria-hidden="true" /> Jogadas enviadas. Aguardando{' '}
            {other.name}.
          </p>
        ) : (
          <>
            <p className="duel-turn">Falta sua jogada</p>
            <DuelPlayForm
              key={userId}
              busy={busy}
              submit={(moves) =>
                void run(() => app.submitDuelMoves(userId, duel.id, moves), 'Jogadas enviadas.')
              }
            />
          </>
        ))}
      {((duel.status === 'pending' && !received) || duel.status === 'active') && (
        <Button
          variant="ghost"
          disabled={busy}
          onClick={() => void run(() => app.closeDuel(userId, duel.id))}
        >
          {duel.status === 'pending' ? 'Cancelar desafio' : 'Encerrar sem resultado'}
        </Button>
      )}
      {duel.status === 'closed' && <p className="muted">Encerrado sem resultado.</p>}
      {result && (
        <DuelReveal
          key={userId}
          duel={duel}
          result={result}
          viewerId={userId}
          otherName={other.name}
          autoReveal={autoReveal}
          remember={`mannerbund-duel-seen:${duel.id}:${userId}`}
        >
          {mayRematch &&
            (open ? (
              <a className="button button-secondary" href={`#duelo-${open.id}`}>
                Ver duelo aberto
              </a>
            ) : (
              <Button
                variant="secondary"
                disabled={busy}
                onClick={() =>
                  void run(() => app.challengeDuel(userId, other.id), 'Pedido de revanche enviado.')
                }
              >
                Pedir revanche
              </Button>
            ))}
        </DuelReveal>
      )}
    </article>
  );
}

function DuelPlayForm({
  submit,
  busy = false,
  practice = false,
}: {
  submit: (moves: DuelMoves) => void;
  busy?: boolean;
  practice?: boolean;
}) {
  const [moves, setMoves] = useState<[DuelMove | '', DuelMove | '', DuelMove | '']>(['', '', '']);
  const [round, setRound] = useState(0);
  const powerId = useId();
  return (
    <form
      className="duel-play"
      onSubmit={(event) => {
        event.preventDefault();
        if (validDuelMoves(moves)) submit(moves);
      }}
    >
      <div className="duel-slots" role="group" aria-label="Escolher rodada">
        {moves.map((move, index) => (
          <button
            type="button"
            key={index}
            aria-pressed={round === index}
            disabled={busy}
            onClick={() => setRound(index)}
          >
            <span>Rodada {index + 1}</span>
            <strong>{move ? duelMoveLabels[move] : 'Escolher'}</strong>
          </button>
        ))}
      </div>
      <fieldset className="duel-powers">
        <legend>Escolha o poder da rodada {round + 1}</legend>
        <div>
          {movesAvailable.map((move) => {
            const Icon = moveIcons[move];
            const label = duelMoveLabels[move];
            return (
              <button
                type="button"
                key={move}
                className={`duel-power duel-power-${move}`}
                aria-label={label}
                aria-describedby={`${powerId}-${move}`}
                aria-pressed={moves[round] === move}
                disabled={busy}
                onClick={() => {
                  const next = [...moves] as typeof moves;
                  next[round] = move;
                  setMoves(next);
                  const empty = next.indexOf('');
                  if (empty !== -1) setRound(empty);
                }}
              >
                <Icon size={25} weight="duotone" aria-hidden="true" />
                <strong>{label}</strong>
                <small id={`${powerId}-${move}`}>Vence {duelMoveLabels[defeatedBy(move)]}</small>
              </button>
            );
          })}
        </div>
      </fieldset>
      <p className="meta duel-waiting">
        <LockSimpleIcon size={15} aria-hidden="true" />
        {practice
          ? 'O oponente de treino já escolheu seus poderes.'
          : 'As jogadas são reveladas após os dois envios.'}
      </p>
      <Button disabled={busy || !validDuelMoves(moves)} type="submit">
        {practice ? 'Jogar treino' : 'Enviar jogadas'}
      </Button>
    </form>
  );
}

const lastRound = 3;
function initialReveal(remember: string | undefined, autoReveal: boolean) {
  if (!autoReveal || window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    return lastRound;
  try {
    return remember && sessionStorage.getItem(remember) ? lastRound : 0;
  } catch {
    return 0;
  }
}

function DuelReveal({
  duel,
  result,
  viewerId,
  otherName,
  autoReveal,
  remember,
  children,
}: {
  duel: Duel;
  result: NonNullable<ReturnType<typeof duelResult>>;
  viewerId: string;
  otherName: string;
  autoReveal: boolean;
  remember?: string;
  children?: React.ReactNode;
}) {
  const [shown, setShown] = useState(() => initialReveal(remember, autoReveal));
  const received = duel.opponentId === viewerId;
  const rounds = result.rounds.slice(0, shown);
  const myScore = rounds.filter((round) => round.winner === viewerId).length;
  const opposingId = received ? duel.challengerId : duel.opponentId;
  const theirScore = rounds.filter((round) => round.winner === opposingId).length;
  const done = shown === lastRound;
  const headline = done
    ? result.winner === null
      ? 'Empate'
      : result.winner === viewerId
        ? 'Você venceu'
        : `${otherName} venceu`
    : shown === 0
      ? 'Revelando as jogadas'
      : `Após a rodada ${shown}`;

  useEffect(() => {
    if (!done) {
      const timer = window.setTimeout(() => setShown(shown + 1), 620);
      return () => window.clearTimeout(timer);
    }
    if (remember) {
      try {
        sessionStorage.setItem(remember, '1');
      } catch {
        /* The reveal still works without session storage. */
      }
    }
  }, [done, shown, remember]);

  return (
    <div className="duel-reveal">
      <p className="duel-result" role="status">
        <strong>{headline}</strong>{' '}
        <span>
          {myScore} a {theirScore}
        </span>
      </p>
      <ol className="duel-rounds" role="list">
        {rounds.map((round, index) => (
          <li key={index}>
            <strong>Rodada {index + 1}</strong>
            <span>
              Você: {duelMoveLabels[received ? round.opponentMove : round.challengerMove]}
            </span>
            <span>
              {otherName}: {duelMoveLabels[received ? round.challengerMove : round.opponentMove]}
            </span>
            <span className="duel-round-outcome">
              {round.winner === null
                ? 'Empate'
                : round.winner === viewerId
                  ? 'Sua vitória'
                  : `Vitória de ${otherName}`}
            </span>
          </li>
        ))}
      </ol>
      <div className="duel-actions">
        {!done ? (
          <Button variant="ghost" onClick={() => setShown(lastRound)}>
            Mostrar placar completo
          </Button>
        ) : (
          <>
            {!window.matchMedia('(prefers-reduced-motion: reduce)').matches && (
              <Button variant="ghost" onClick={() => setShown(0)}>
                <EyeIcon size={16} aria-hidden="true" /> Rever rodadas
              </Button>
            )}
            {children}
          </>
        )}
      </div>
    </div>
  );
}

function practiceMoves(): DuelMoves {
  const pick = () => movesAvailable[Math.floor(Math.random() * movesAvailable.length)];
  return [pick(), pick(), pick()];
}

function PracticeDuel() {
  const { userId, user } = useApp();
  const [opposingMoves, setOpposingMoves] = useState(practiceMoves);
  const [myMoves, setMyMoves] = useState<DuelMoves>();
  const duel: Duel = {
    id: practiceId,
    challengerId: userId,
    opponentId: practiceId,
    status: myMoves ? 'finished' : 'active',
    challengerMoves: myMoves,
    opponentMoves: opposingMoves,
  };
  const result = duelResult(duel);
  return (
    <article className="duel-card duel-practice">
      <h3>Treino solo</h3>
      <p className="muted">Experimente as três rodadas. O treino fica fora do histórico.</p>
      <div className="duel-players">
        <div>
          <CharacterPortrait appearance={user.character} label={`Personagem de ${user.name}`} />
          <span>Você</span>
        </div>
        <div>
          <CharacterPortrait
            appearance={{ ...defaultCharacter, background: 'stone', outfit: 'vest', face: 'bold' }}
          />
          <span>Oponente de treino</span>
        </div>
      </div>
      {result ? (
        <DuelReveal
          duel={duel}
          result={result}
          viewerId={userId}
          otherName="Oponente de treino"
          autoReveal
        >
          <Button
            variant="secondary"
            onClick={() => {
              setOpposingMoves(practiceMoves());
              setMyMoves(undefined);
            }}
          >
            Treinar de novo
          </Button>
        </DuelReveal>
      ) : (
        <DuelPlayForm submit={setMyMoves} practice />
      )}
    </article>
  );
}
