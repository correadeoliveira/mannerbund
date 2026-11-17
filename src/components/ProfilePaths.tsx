import { useState } from 'react';
import { CheckIcon } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';
import { earnedPathEvents } from '../domain/rules';
import type { CommunityPath } from '../domain/types';
import { PostComposer } from './PostComposer';
import { Button, useApp } from './ui';

export function ProfilePaths() {
  const { data, userId } = useApp();
  const [sharing, setSharing] = useState<CommunityPath>();
  const enrollments = data.pathEnrollments
    .filter((entry) => entry.userId === userId)
    .sort((a, b) => b.startedAt - a.startedAt);

  return (
    <section className="profile-paths">
      <h2>Meus caminhos</h2>
      {enrollments.length ? (
        <ul className="profile-path-list" role="list">
          {enrollments.map(({ pathId }) => {
            const path = data.paths.find((item) => item.id === pathId)!;
            const community = data.communities.find((item) => item.id === path.communityId)!;
            const earned = earnedPathEvents(data, path, userId).size;
            const complete = earned === path.eventIds.length;
            return (
              <li key={path.id}>
                <div>
                  <Link to={`/comunidades/${path.communityId}?tab=caminhos`}>{path.title}</Link>
                  <p className="meta">{community.name}</p>
                </div>
                <div className="profile-path-result">
                  <span className="path-progress">
                    {complete ? (
                      <>
                        <CheckIcon size={16} weight="bold" /> Concluído
                      </>
                    ) : (
                      `${earned} de ${path.eventIds.length}`
                    )}
                  </span>
                  {complete && (
                    <Button variant="secondary" onClick={() => setSharing(path)}>
                      Compartilhar no feed
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="muted">
          Escolha um caminho na página de uma comunidade da qual você participa.
        </p>
      )}
      {sharing && (
        <PostComposer
          personalDraft={`Completei o caminho “${sharing.title}”!`}
          onClose={() => setSharing(undefined)}
        />
      )}
    </section>
  );
}
