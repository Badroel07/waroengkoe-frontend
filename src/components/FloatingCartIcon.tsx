import Icon from './Icon';

interface FloatingCartIconProps {
  cartCount?: number;
  count?: number;
  onClick: () => void;
}

export default function FloatingCartIcon({ cartCount, count, onClick }: FloatingCartIconProps) {
  const finalCount = cartCount !== undefined ? cartCount : (count || 0);

  return (
    <button
      onClick={onClick}
      className="fixed bottom-24 md:bottom-6 right-6 w-16 h-16 bg-[#006eff] rounded-full shadow-lg shadow-blue-500/30 flex items-center justify-center z-30 transition-transform transform hover:scale-110 active:scale-100 cursor-pointer"
      aria-label="Buka Keranjang"
    >
      <Icon name="shopping_cart" className="text-white text-3xl" />
      {finalCount > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[24px] h-6 px-1.5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white">
          {finalCount}
        </span>
      )}
    </button>
  );
}
