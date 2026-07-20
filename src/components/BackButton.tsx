import { Link, useNavigate } from 'react-router-dom';
import Icon from './Icon';

interface BackButtonProps {
  href?: string;
  onClick?: () => void;
  className?: string;
}

export default function BackButton({ href, onClick, className = '' }: BackButtonProps) {
  const navigate = useNavigate();
  const baseClass = "size-9 shrink-0 flex items-center justify-center rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all shadow-sm active:scale-[0.98] cursor-pointer";
  const combinedClass = `${baseClass} ${className}`.trim();

  if (href) {
    return (
      <Link
        to={href}
        className={combinedClass}
        aria-label="Kembali"
      >
        <Icon name="arrow_back" className="text-xl" />
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick || (() => navigate(-1))}
      className={combinedClass}
      aria-label="Kembali"
    >
      <Icon name="arrow_back" className="text-xl" />
    </button>
  );
}
