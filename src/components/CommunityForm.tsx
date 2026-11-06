import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import type { Community, Emblem } from '../domain/types';
import { membershipError } from '../domain/rules';
import { app } from '../services/app';
import { Button, EmblemIcon, ImageUpload, Media, Modal, Seal, useApp, useBusy } from './ui';

export const presets = [
  { name: 'Bronze', color: '#B68A4D', cover: '/images/running.jpg' },
  { name: 'Pátina', color: '#779389', cover: '/images/trail.jpg' },
  { name: 'Argila', color: '#A97468', cover: '/images/pottery.jpg' },
  { name: 'Areia', color: '#BAA274', cover: '/images/table.jpg' },
  { name: 'Pedra', color: '#87959E', cover: '/images/yoga.jpg' },
  { name: 'Oliva', color: '#8D9471', cover: '/images/city.jpg' },
];
export const categories = [
  'Esporte',
  'Arte e cultura',
  'Ao ar livre',
  'Gastronomia',
  'Bem-estar',
  'Fotografia',
  'Espiritualidade',
  'Tecnologia',
  'Outros',
];
export function CommunityForm({
  community,
  onClose,
}: {
  community?: Community;
  onClose: () => void;
}) {
  const { data, userId, user } = useApp(),
    navigate = useNavigate(),
    { busy, run } = useBusy();
  const [name, setName] = useState(community?.name ?? ''),
    [description, setDescription] = useState(community?.description ?? ''),
    [category, setCategory] = useState(community?.category ?? categories[0]),
    [preset, setPreset] = useState(community?.preset ?? 'Bronze'),
    [color, setColor] = useState(community?.color ?? presets[0].color),
    [emblem, setEmblem] = useState<Emblem>(community?.emblem ?? 'sun'),
    [cover, setCover] = useState(community?.cover ?? presets[0].cover);
  const error = !community ? membershipError(data, user, 'own') : null;
  return (
    <Modal
      title={community ? 'Dê sua cara à comunidade' : 'Comece uma nova história'}
      onClose={onClose}
      wide
    >
      <form
        className="community-form"
        onSubmit={(e) => {
          e.preventDefault();
          void run(
            async () => {
              const input = { name, description, category, preset, color, emblem, cover };
              if (community) {
                await app.editCommunity(userId, community.id, input);
                onClose();
              } else {
                const id = await app.createCommunity(userId, input);
                onClose();
                navigate(`/comunidades/${id}`);
              }
            },
            community
              ? 'A nova personalidade da comunidade foi salva.'
              : 'Sua comunidade está pronta para reunir histórias.',
          );
        }}
      >
        <div className="form-fields">
          <label>
            Nome da comunidade
            <input
              required
              maxLength={60}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Como sua comunidade se chama?"
            />
          </label>
          {!community && (
            <label>
              Categoria
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                {categories.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
          )}
          <label>
            O que une vocês?
            <textarea
              required
              maxLength={1000}
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Conte um pouco da história que querem construir."
            />
          </label>
          <fieldset>
            <legend>Uma personalidade para começar</legend>
            <div className="preset-options">
              {presets.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  className={preset === p.name ? 'preset selected' : 'preset'}
                  onClick={() => {
                    setPreset(p.name);
                    setColor(p.color);
                    setCover(p.cover);
                  }}
                  aria-pressed={preset === p.name}
                >
                  <span style={{ background: p.color }} />
                  {p.name}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend>Escolha seu símbolo</legend>
            <div className="emblem-options">
              {(['sun', 'mountain', 'leaf', 'flame', 'waves', 'aperture'] as Emblem[]).map(
                (v, i) => (
                  <button
                    className={emblem === v ? 'selected' : ''}
                    aria-pressed={emblem === v}
                    aria-label={['Sol', 'Montanha', 'Folha', 'Chama', 'Ondas', 'Lente'][i]}
                    key={v}
                    type="button"
                    onClick={() => setEmblem(v)}
                  >
                    <EmblemIcon emblem={v} />
                  </button>
                ),
              )}
            </div>
          </fieldset>
          <label className="color-input-label">
            Sua cor
            <input
              type="color"
              aria-label="Cor da comunidade"
              value={color}
              onInput={(e) => setColor(e.currentTarget.value)}
              onChange={(e) => setColor(e.target.value)}
            />
            <span className="meta">Aplicada ao emblema e aos territórios.</span>
          </label>
          <p className="form-help">
            Sua cor é preservada. Símbolos e números usam uma versão com contraste para continuar
            fáceis de ler.
          </p>
          <ImageUpload value={cover} onChange={setCover} label="Escolher outra capa" />
        </div>
        <div className="community-preview">
          <span className="preview-label">Prévia da comunidade</span>
          <div className="community-card">
            <Media src={cover} alt="Capa da comunidade" className="community-cover" />
            <div className="community-card-content">
              <Seal community={{ color, emblem }} size={54} />
              <span className="meta">{category}</span>
              <h3>{name || 'O nome da sua comunidade'}</h3>
              <p>{description || 'O próximo encontro começa com uma ideia. Conte a sua.'}</p>
              <span className="meta">Criada por {user.name.split(' ')[0]}</span>
            </div>
          </div>
          <p className="form-help">
            Você pode mudar o visual quando quiser. A navegação continua simples para todo mundo.
          </p>
        </div>
        {error && (
          <p className="notice form-full">
            {error}{' '}
            <Link to="/premium" onClick={onClose}>
              Conhecer o Premium
            </Link>
          </p>
        )}
        <div className="form-actions form-full">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={busy || !!error}>
            {busy ? 'Salvando…' : community ? 'Salvar personalidade' : 'Criar comunidade'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
