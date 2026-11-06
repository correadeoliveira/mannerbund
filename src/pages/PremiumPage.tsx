import { CheckIcon, CrownSimpleIcon, InfinityIcon } from '@phosphor-icons/react';
import { app } from '../services/app';
import { act } from '../state/ui';
import { Button, Media, useApp } from '../components/ui';

export default function PremiumPage() {
  const { user, userId, data } = useApp(),
    owned = data.communities.filter((c) => c.ownerId === userId).length,
    joined = data.memberships.filter(
      (m) =>
        m.userId === userId &&
        !data.communities.some((c) => c.id === m.communityId && c.ownerId === userId),
    ).length;
  return (
    <div className="content-page premium-page">
      <div className="premium-art">
        <Media src="/images/medallion.jpg" alt="Medalhão de bronze Mannerbund" />
      </div>
      <div className="premium-content">
        <CrownSimpleIcon size={36} weight="thin" />
        <h1>Seu mundo pode ser maior.</h1>
        <p>
          Mais comunidades para encontrar. Mais histórias para construir. O mesmo jeito de
          pertencer.
        </p>
        <div className="premium-comparison">
          <div>
            <h2>Seu plano gratuito</h2>
            <span>
              <CheckIcon size={17} />
              Uma comunidade própria
            </span>
            <span>
              <CheckIcon size={17} />
              Uma comunidade de outro usuário
            </span>
            <small>
              Você tem {owned} própria{owned !== 1 ? 's' : ''} e participa de {joined} de outro
              {joined !== 1 ? 's' : ''}.
            </small>
          </div>
          <div>
            <h2>Mannerbund Premium</h2>
            <span>
              <InfinityIcon size={19} />
              Crie mais comunidades
            </span>
            <span>
              <InfinityIcon size={19} />
              Participe de quantas quiser
            </span>
            <small>
              Chats, feed, encontros e insígnias continuam disponíveis em ambos os planos.
            </small>
          </div>
        </div>
        <Button
          onClick={() =>
            void act(
              () => app.premium(userId),
              user.premium
                ? 'Premium demonstrativo desativado. Seus vínculos foram preservados.'
                : 'Premium demonstrativo ativado. Seu mundo ficou maior.',
            )
          }
        >
          <CrownSimpleIcon size={19} />
          {user.premium ? 'Desativar Premium demonstrativo' : 'Experimentar Premium demonstrativo'}
        </Button>
        <p className="premium-disclaimer">
          Esta é uma demonstração. Não há cobrança, cartão ou assinatura real. Ao desativar, suas
          comunidades permanecem; novas adesões e criações voltam aos limites gratuitos.
        </p>
      </div>
    </div>
  );
}
