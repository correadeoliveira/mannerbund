import { useState } from 'react';
import { app } from '../services/app';
import { Avatar, Button, ImageUpload, Modal, useApp, useBusy } from './ui';

export function PostComposer({
  communityId,
  onClose,
}: {
  communityId?: string;
  onClose: () => void;
}) {
  const { data, userId, user } = useApp(),
    { busy, run } = useBusy(),
    [text, setText] = useState(''),
    [image, setImage] = useState<string>(),
    [asCommunity, setAsCommunity] = useState(communityId ?? '');
  const owned = data.communities.filter((c) => c.ownerId === userId);
  return (
    <Modal title="Uma história para compartilhar" onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void run(async () => {
            await app.createPost(userId, text, image || undefined, asCommunity || undefined);
            onClose();
          }, 'Sua história já está no feed.');
        }}
      >
        <div className="composer-author">
          <Avatar user={user} />
          <div>
            <strong>{user.name}</strong>
            <span className="meta">Publicação no feed global</span>
          </div>
        </div>
        {!!owned.length && (
          <label>
            Publicar como
            <select value={asCommunity} onChange={(e) => setAsCommunity(e.target.value)}>
              <option value="">Meu perfil</option>
              {owned.map((c) => (
                <option value={c.id} key={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="sr-only" htmlFor="post-text">
          Texto da publicação
        </label>
        <textarea
          id="post-text"
          required
          autoFocus
          rows={5}
          maxLength={3000}
          placeholder="O que vocês viveram hoje?"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <ImageUpload value={image} onChange={setImage} label="Adicionar uma foto" />
        <div className="form-actions">
          <span className="meta">{text.length}/3000</span>
          <Button disabled={busy || !text.trim()} type="submit">
            {busy ? 'Publicando…' : 'Compartilhar história'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
