import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LockSimpleIcon, PencilSimpleIcon } from '@phosphor-icons/react';
import { availableBrooches, characterLook, characterOptions } from '../domain/play';
import { isMember } from '../domain/rules';
import type { CharacterAppearance, User } from '../domain/types';
import { accessibleAccent } from '../lib/colors';
import { app } from '../services/app';
import { Button, EmblemIcon, Modal, useApp, useBusy } from './ui';

export function CharacterPortrait({
  appearance,
  label,
}: {
  appearance?: CharacterAppearance;
  label?: string;
}) {
  const { data } = useApp();
  const look = characterLook(appearance);
  const brooch = data.communities.find((community) => look.accessory === `brooch:${community.id}`);
  const layers = [`skin-${look.skin}`, `face-${look.face}`, look.outfit, look.hair];
  if (look.accessory === 'hoop' || look.accessory === 'pendant')
    layers.push(`accessory-${look.accessory}`);
  return (
    <div
      className={`character-portrait character-${look.background}`}
      role={label ? 'img' : undefined}
      aria-label={label && brooch ? `${label} com broche de ${brooch.name}` : label}
      aria-hidden={label ? undefined : true}
    >
      {layers.map((layer) => (
        <img key={layer} src={`/images/character/${layer}.png`} alt="" width={512} height={512} />
      ))}
      {brooch && (
        <span
          className="character-brooch"
          style={{ '--brooch-color': accessibleAccent(brooch.color) } as React.CSSProperties}
          aria-hidden="true"
        >
          <EmblemIcon emblem={brooch.emblem} size={16} weight="bold" />
        </span>
      )}
    </div>
  );
}

const categories = [
  { key: 'hair', label: 'Penteado' },
  { key: 'outfit', label: 'Traje' },
  { key: 'skin', label: 'Pele' },
  { key: 'face', label: 'Rosto' },
  { key: 'background', label: 'Fundo' },
  { key: 'accessory', label: 'Acessórios' },
] as const;

type SaveLook = (appearance: CharacterAppearance) => Promise<void>;
export function ProfileCharacter({
  profile,
  own,
  save,
}: {
  profile: User;
  own: boolean;
  save?: SaveLook;
}) {
  const [editing, setEditing] = useState(false);
  return (
    <section className="profile-character">
      <CharacterPortrait appearance={profile.character} label={`Personagem de ${profile.name}`} />
      <div className="profile-character-info">
        <h2>Personagem</h2>
        {own && (
          <Button variant="secondary" onClick={() => setEditing(true)}>
            <PencilSimpleIcon size={16} />
            Personalizar personagem
          </Button>
        )}
      </div>
      {own && editing && (
        <CharacterEditor profile={profile} save={save} onClose={() => setEditing(false)} />
      )}
    </section>
  );
}

function CharacterEditor({
  profile,
  onClose,
  save,
}: {
  profile: User;
  onClose: () => void;
  save?: SaveLook;
}) {
  const { data } = useApp();
  const [draft, setDraft] = useState(() => characterLook(profile.character));
  const [category, setCategory] = useState<(typeof categories)[number]['key']>('hair');
  const { busy, run } = useBusy();
  const unlocked = category === 'accessory' ? availableBrooches(data, profile.id) : [];
  const options = Object.entries(characterOptions[category]).concat(
    unlocked.map((community): [string, string] => [
      `brooch:${community.id}`,
      `Broche de ${community.name}`,
    ]),
  );
  const upcomingBrooch =
    category === 'accessory'
      ? data.communities.find(
          (community) =>
            isMember(data, profile.id, community.id) &&
            data.paths.some((path) => path.communityId === community.id) &&
            !unlocked.includes(community),
        )
      : undefined;

  return (
    <Modal title="Personalizar personagem" onClose={onClose}>
      <div className="character-preview">
        <CharacterPortrait appearance={draft} label="Prévia do personagem" />
      </div>
      <form
        className="character-editor"
        onSubmit={(event) => {
          event.preventDefault();
          void run(async () => {
            if (save) await save(draft);
            else await app.editCharacter(profile.id, draft);
            onClose();
          }, 'Personagem atualizado.');
        }}
      >
        <div
          className="character-categories"
          role="group"
          aria-label="Categorias de personalização"
        >
          {categories.map(({ key, label }) => (
            <Button
              type="button"
              variant="secondary"
              key={key}
              aria-pressed={category === key}
              onClick={() => setCategory(key)}
            >
              {label}
            </Button>
          ))}
        </div>
        <div
          className="character-options"
          role="group"
          aria-label={categories.find(({ key }) => key === category)?.label}
        >
          {options.map(([value, label]) => {
            const preview = { ...draft, [category]: value };
            return (
              <button
                className="character-option"
                key={value}
                type="button"
                aria-pressed={draft[category] === value}
                onClick={() => setDraft(preview)}
              >
                <CharacterPortrait appearance={preview} />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
        {upcomingBrooch && (
          <p className="character-unlock">
            <LockSimpleIcon size={16} aria-hidden="true" />
            <span>
              Conclua um{' '}
              <Link to={`/comunidades/${upcomingBrooch.id}?tab=caminhos`} onClick={onClose}>
                Caminho de {upcomingBrooch.name}
              </Link>{' '}
              para liberar seu broche.
            </span>
          </p>
        )}
        <div className="form-actions">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancelar
          </Button>
          <Button disabled={busy} type="submit">
            Salvar personagem
          </Button>
        </div>
      </form>
    </Modal>
  );
}
