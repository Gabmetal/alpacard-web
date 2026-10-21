import { useState, useMemo } from 'react';
import { X, BookOpen, ExternalLink, UtensilsCrossed, FileText } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

export interface MenuItemData {
  id: string;
  name: string;
  price?: string;
  category?: string;
  description?: string;
}

interface MenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  business: {
    name: string;
    logoUrl?: string;
    brandColor?: string;
    menuType?: string;
    menuUrl?: string;
    menuItems?: string;
  };
}

export function MenuModal({ isOpen, onClose, business }: MenuModalProps) {
  const { t, language } = useLanguage();
  const isEs = language === 'es';
  const brandColor = business.brandColor || '#4A3525';

  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Parse items
  const items: MenuItemData[] = useMemo(() => {
    if (!business.menuItems) return [];
    try {
      const parsed = JSON.parse(business.menuItems);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [business.menuItems]);

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    items.forEach((item) => {
      if (item.category && item.category.trim()) {
        set.add(item.category.trim());
      }
    });
    return Array.from(set);
  }, [items]);

  const filteredItems = useMemo(() => {
    if (selectedCategory === 'ALL') return items;
    return items.filter((item) => item.category?.trim() === selectedCategory);
  }, [items, selectedCategory]);

  if (!isOpen) return null;

  const isLinkOrFile =
    business.menuType === 'link' ||
    business.menuType === 'file' ||
    Boolean(business.menuUrl);

  const hasDigitalItems = items.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4">
      <div className="w-full max-w-lg overflow-hidden rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl transition-all max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div
          className="relative px-6 py-5 text-white"
          style={{ backgroundColor: brandColor }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {business.logoUrl ? (
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md p-1.5 shadow-sm">
                  <img
                    src={business.logoUrl}
                    alt={business.name}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              ) : (
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md text-xl font-bold">
                  🦙
                </div>
              )}
              <div>
                <h3 className="text-base font-black leading-tight">{business.name}</h3>
                <p className="text-xs text-white/85 flex items-center gap-1 mt-0.5">
                  <BookOpen className="h-3 w-3" />
                  <span>{t.menuModalTitle}</span>
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="rounded-full bg-white/20 p-2 text-white hover:bg-white/30 transition"
              title={t.closeMenu}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* External Link or File Banner */}
          {isLinkOrFile && business.menuUrl && (
            <div className="rounded-2xl border border-[#E6D9C6] bg-[#F5EFE6]/70 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#3D2B1F] text-white shadow-xs">
                    {business.menuType === 'file' ? (
                      <FileText className="h-4 w-4" />
                    ) : (
                      <ExternalLink className="h-4 w-4" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-stone-900">
                      {business.menuType === 'file'
                        ? isEs
                          ? 'Carta en PDF / Imagen'
                          : 'Menu PDF / Image'
                        : isEs
                        ? 'Menú Online Externo'
                        : 'External Online Menu'}
                    </h4>
                    <p className="text-[11px] text-stone-600">
                      {business.menuType === 'file'
                        ? isEs
                          ? 'Descarga o visualiza la carta completa'
                          : 'Download or view full menu document'
                        : isEs
                        ? 'Accede al catálogo interactivo en la web'
                        : 'Access interactive online catalog'}
                    </p>
                  </div>
                </div>
                <a
                  href={business.menuUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#3D2B1F] px-3 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#2A1D15] transition shrink-0 active:scale-95"
                >
                  <span>{t.openExternalMenu}</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          )}

          {/* Digital Items List */}
          {hasDigitalItems ? (
            <div className="space-y-4">
              {/* Category Filter Pills */}
              {categories.length > 1 && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  <button
                    onClick={() => setSelectedCategory('ALL')}
                    className={`rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap transition ${
                      selectedCategory === 'ALL'
                        ? 'bg-gray-900 text-white shadow-xs'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {t.allCategories} ({items.length})
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap transition ${
                        selectedCategory === cat
                          ? 'bg-gray-900 text-white shadow-xs'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}

              {/* Items Card List */}
              <div className="divide-y divide-gray-100 rounded-2xl border border-gray-100 bg-white shadow-xs">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start justify-between gap-3 p-3.5 hover:bg-gray-50/70 transition"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-gray-900 truncate">{item.name}</h4>
                        {item.category && selectedCategory === 'ALL' && (
                          <span className="text-[10px] font-semibold text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">
                            {item.category}
                          </span>
                        )}
                      </div>
                      {item.description && (
                        <p className="mt-0.5 text-[11px] text-gray-500 line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>
                      )}
                    </div>
                    {item.price && (
                      <span
                        className="rounded-lg px-2.5 py-1 text-xs font-extrabold whitespace-nowrap shrink-0 shadow-xs"
                        style={{
                          backgroundColor: `${brandColor}15`,
                          color: brandColor,
                        }}
                      >
                        {item.price}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : !isLinkOrFile ? (
            <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-center">
              <UtensilsCrossed className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p className="text-xs text-gray-500">{t.noMenuItemsYet}</p>
            </div>
          ) : null}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-gray-100 bg-gray-50/70 px-6 py-3 text-center">
          <button
            onClick={onClose}
            className="w-full rounded-xl bg-gray-200/80 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-300 transition"
          >
            {t.closeMenu}
          </button>
        </div>
      </div>
    </div>
  );
}
