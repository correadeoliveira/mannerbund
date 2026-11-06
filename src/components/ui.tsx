import {
  useEffect,
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ImgHTMLAttributes,
  type ReactNode,
} from 'react';
import {
  ApertureIcon,
  ArrowUpRightIcon,
  CheckIcon,
  FireIcon,
  LeafIcon,
  MountainsIcon,
  SunHorizonIcon,
  WavesIcon,
  XIcon,
} from '@phosphor-icons/react';
import { Link } from 'react-router-dom';
import { db, saveImage } from '../data/database';
import type { Community, Emblem, User } from '../domain/types';
import { useUI, act } from '../state/ui';
import { accessibleAccent } from '../lib/colors';

export { useApp } from '../state/context';
const emblems = {
  sun: SunHorizonIcon,
  mountain: MountainsIcon,
  leaf: LeafIcon,
  flame: FireIcon,
  waves: WavesIcon,
  aperture: ApertureIcon,
};
export function EmblemIcon({
  emblem,
  size = 24,
  weight = 'regular',
}: {
  emblem: Emblem;
  size?: number;
  weight?: 'regular' | 'bold' | 'fill';
}) {
  const Icon = emblems[emblem];
  return <Icon size={size} weight={weight} aria-hidden="true" />;
}
export function Seal({
  community,
  size = 44,
}: {
  community: Pick<Community, 'emblem' | 'color'>;
  size?: number;
}) {
  return (
    <span
      className="seal"
      style={
        {
          '--seal-color': accessibleAccent(community.color),
          width: size,
          height: size,
        } as React.CSSProperties
      }
    >
      <EmblemIcon emblem={community.emblem} size={size * 0.53} />
    </span>
  );
}
export function Media({ src, alt, ...props }: ImgHTMLAttributes<HTMLImageElement>) {
  const [url, setUrl] = useState(src?.startsWith('media:') ? undefined : src);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true,
      objectUrl: string | undefined;
    setFailed(false);
    if (!src?.startsWith('media:')) {
      setUrl(src);
      return;
    }
    setUrl(undefined);
    db.media
      .get(src.slice(6))
      .then((entry) => {
        if (entry && active) {
          objectUrl = URL.createObjectURL(entry.blob);
          setUrl(objectUrl);
        }
      })
      .catch(() => setFailed(true));
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src]);
  return url && !failed ? (
    <img src={url} alt={alt ?? ''} {...props} onError={() => setFailed(true)} />
  ) : (
    <span
      role="img"
      aria-label={alt || 'Imagem indisponível'}
      className={`media-placeholder ${props.className || ''}`}
    >
      <MountainsIcon size={32} />
    </span>
  );
}
export function Avatar({
  user,
  size = 40,
  link = false,
}: {
  user: User;
  size?: number;
  link?: boolean;
}) {
  const element = (
    <span
      className="avatar"
      style={{
        width: size,
        height: size,
        backgroundColor: user.color + '24',
        color: user.color,
        fontSize: size * 0.32,
      }}
    >
      {user.avatar ? (
        <Media src={user.avatar} alt={user.name} />
      ) : (
        user.name
          .split(' ')
          .map((s) => s[0])
          .slice(0, 2)
          .join('')
      )}
    </span>
  );
  return link ? (
    <Link to={`/perfil/${user.id}`} aria-label={`Ver perfil de ${user.name}`}>
      {element}
    </Link>
  ) : (
    element
  );
}
export function Button({
  children,
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
}) {
  return (
    <button className={`button button-${variant} ${className}`} {...props}>
      {children}
    </button>
  );
}
export function IconButton({
  children,
  label,
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button className={`icon-button ${className}`} aria-label={label} title={label} {...props}>
      {children}
    </button>
  );
}
export function Modal({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null),
    titleId = useId();
  useEffect(() => {
    const d = ref.current!;
    d.showModal();
    return () => {
      if (d.open) d.close();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={`modal ${wide ? 'modal-wide' : ''}`}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          const rect = e.currentTarget.getBoundingClientRect();
          if (
            e.clientX < rect.left ||
            e.clientX > rect.right ||
            e.clientY < rect.top ||
            e.clientY > rect.bottom
          )
            onClose();
        }
      }}
      aria-labelledby={titleId}
    >
      <div className="modal-head">
        <h2 id={titleId}>{title}</h2>
        <IconButton label="Fechar janela" onClick={onClose}>
          <XIcon size={20} />
        </IconButton>
      </div>
      <div className="modal-body">{children}</div>
    </dialog>
  );
}
export function Confirm({
  title,
  description,
  action = 'Confirmar',
  onConfirm,
  onClose,
}: {
  title: string;
  description: string;
  action?: string;
  onConfirm: () => Promise<unknown>;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <Modal title={title} onClose={onClose}>
      <p className="muted">{description}</p>
      <div className="form-actions">
        <Button variant="secondary" onClick={onClose}>
          Cancelar
        </Button>
        <Button
          variant="danger"
          disabled={busy}
          onClick={() => {
            setBusy(true);
            void act(async () => {
              await onConfirm();
              onClose();
            }).finally(() => setBusy(false));
          }}
        >
          {busy ? 'Salvando…' : action}
        </Button>
      </div>
    </Modal>
  );
}
export function Empty({
  title,
  text,
  action,
}: {
  title: string;
  text: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <SunHorizonIcon size={40} weight="thin" />
      <h3>{title}</h3>
      <p>{text}</p>
      {action}
    </div>
  );
}
export function PageHeading({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {children && <div className="heading-actions">{children}</div>}
    </div>
  );
}
export function ImageUpload({
  value,
  onChange,
  label = 'Escolher imagem',
}: {
  value?: string;
  onChange: (value: string) => void;
  label?: string;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <div className="image-upload">
      {value && <Media src={value} alt="Prévia da imagem escolhida" />}
      <label className="button button-secondary upload-label">
        {busy ? 'Salvando imagem…' : label}
        <input
          type="file"
          accept="image/*"
          disabled={busy}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setBusy(true);
            void act(async () => {
              onChange(await saveImage(file));
            }).finally(() => setBusy(false));
          }}
        />
      </label>
      {value?.startsWith('media:') && (
        <button type="button" className="text-button" onClick={() => onChange('')}>
          Remover imagem
        </button>
      )}
      <small>JPG, PNG ou WebP. Até 5 MB.</small>
    </div>
  );
}
export function Toast() {
  const toast = useUI((s) => s.toast),
    dismiss = useUI((s) => s.dismiss);
  useEffect(() => {
    if (toast) {
      const t = setTimeout(dismiss, toast.error ? 8500 : 5000);
      return () => clearTimeout(t);
    }
  }, [toast, dismiss]);
  return toast ? (
    <div
      className={`toast ${toast.error ? 'toast-error' : ''}`}
      role={toast.error ? 'alert' : 'status'}
    >
      {toast.error ? <XIcon size={20} /> : <CheckIcon size={20} />}
      <span>{toast.message}</span>
      <IconButton label="Fechar aviso" onClick={dismiss}>
        <XIcon size={16} />
      </IconButton>
    </div>
  ) : null;
}
export function TextLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link className="text-link" to={to}>
      {children}
      <ArrowUpRightIcon size={15} />
    </Link>
  );
}
export function useBusy() {
  const [busy, setBusy] = useState(false);
  const run = async (fn: () => Promise<unknown>, success?: string) => {
    if (busy) return;
    setBusy(true);
    await act(fn, success);
    setBusy(false);
  };
  return { busy, run };
}
