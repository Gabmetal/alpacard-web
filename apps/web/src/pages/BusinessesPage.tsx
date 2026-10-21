import { useState, useRef } from 'react';
import {
  Building2,
  Plus,
  Edit3,
  Check,
  Upload,
  Globe,
  Instagram,
  Sparkles,
  ArrowRight,
  Store,
  Palette,
  RefreshCw,
  X,
  BookOpen,
  Link2,
  FileText,
  UtensilsCrossed,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { api } from '../services/api';
import { useLanguage } from '../i18n/LanguageContext';

export interface BusinessItem {
  id: string;
  name: string;
  slug?: string;
  logoUrl?: string;
  brandColor?: string;
  description?: string;
  category?: string;
  website?: string;
  instagram?: string;
  menuType?: string;
  menuUrl?: string;
  menuItems?: string;
  campaigns?: unknown[];
}

interface BusinessesPageProps {
  businesses: BusinessItem[];
  activeBusinessId?: string;
  onSelectBusiness: (biz: BusinessItem) => void;
  onRefreshBusinesses: () => Promise<void>;
}

const BRAND_COLOR_PRESETS = [
  { name: 'Espresso Roast', hex: '#4A3525' },
  { name: 'Charcoal Slate', hex: '#292524' },
  { name: 'Warm Terracotta', hex: '#9A3412' },
  { name: 'Forest Olive', hex: '#166534' },
  { name: 'Amber Ochre', hex: '#B45309' },
  { name: 'Classic Stone', hex: '#57534E' },
  { name: 'Deep Burgundy', hex: '#881337' },
  { name: 'Navy Ink', hex: '#1E3A8A' },
];

const CATEGORIES = [
  'Café & Bakery',
  'Restaurant & Dining',
  'Retail & Boutique',
  'Barber & Beauty Salon',
  'Bar & Brewery',
  'Gym & Fitness',
  'Bookstore & Stationery',
  'Specialty Store',
  'Other',
];

export function BusinessesPage({
  businesses,
  activeBusinessId,
  onSelectBusiness,
  onRefreshBusinesses,
}: BusinessesPageProps) {
  const { t, language } = useLanguage();
  const isEs = language === 'es';

  // Modal / Editor state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'branding' | 'menu'>('branding');
  const [editingBusiness, setEditingBusiness] = useState<BusinessItem | null>(null);

  // Form Fields - Branding
  const [name, setName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [brandColor, setBrandColor] = useState('#4A3525');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Café & Bakery');
  const [website, setWebsite] = useState('');
  const [instagram, setInstagram] = useState('');

  // Form Fields - Menu
  const [menuType, setMenuType] = useState<string>('none');
  const [menuUrl, setMenuUrl] = useState<string>('');
  const [menuItems, setMenuItems] = useState<
    Array<{ id: string; name: string; price: string; category: string; description: string }>
  >([]);
  const [uploadingMenuFile, setUploadingMenuFile] = useState(false);
  const menuFileInputRef = useRef<HTMLInputElement>(null);

  // Digital Menu Builder inputs
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemCategory, setItemCategory] = useState('');
  const [itemDescription, setItemDescription] = useState('');

  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; isError: boolean } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const openCreateModal = () => {
    setEditingBusiness(null);
    setModalTab('branding');
    setName('');
    setLogoUrl('');
    setBrandColor('#4A3525');
    setDescription('');
    setCategory('Café & Bakery');
    setWebsite('');
    setInstagram('');
    setMenuType('none');
    setMenuUrl('');
    setMenuItems([]);
    setItemName('');
    setItemPrice('');
    setItemCategory('');
    setItemDescription('');
    setStatusMsg(null);
    setIsModalOpen(true);
  };

  const openEditModal = (biz: BusinessItem) => {
    setEditingBusiness(biz);
    setModalTab('branding');
    setName(biz.name || '');
    setLogoUrl(biz.logoUrl || '');
    setBrandColor(biz.brandColor || '#4A3525');
    setDescription(biz.description || '');
    setCategory(biz.category || 'Café & Bakery');
    setWebsite(biz.website || '');
    setInstagram(biz.instagram || '');
    setMenuType(biz.menuType || 'none');
    setMenuUrl(biz.menuUrl || '');

    let parsedItems = [];
    if (biz.menuItems) {
      try {
        parsedItems = JSON.parse(biz.menuItems);
      } catch {
        parsedItems = [];
      }
    }
    setMenuItems(parsedItems);
    setItemName('');
    setItemPrice('');
    setItemCategory('');
    setItemDescription('');
    setStatusMsg(null);
    setIsModalOpen(true);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingLogo(true);
      const res = await api.uploadFile(file);
      setLogoUrl(res.url);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Logo upload failed');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleMenuFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingMenuFile(true);
      const res = await api.uploadFile(file);
      setMenuUrl(res.url);
      setMenuType('file');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Menu file upload failed');
    } finally {
      setUploadingMenuFile(false);
    }
  };

  const handleAddMenuItem = () => {
    if (!itemName.trim()) return;
    const newItem = {
      id: `item_${Date.now()}`,
      name: itemName.trim(),
      price: itemPrice.trim(),
      category: itemCategory.trim() || (isEs ? 'General' : 'General'),
      description: itemDescription.trim(),
    };
    setMenuItems((prev) => [...prev, newItem]);
    setItemName('');
    setItemPrice('');
    setItemDescription('');
  };

  const handleRemoveMenuItem = (id: string) => {
    setMenuItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setSaving(true);
      setStatusMsg(null);

      const payload = {
        name,
        logoUrl,
        brandColor,
        description,
        category,
        website,
        instagram,
        menuType,
        menuUrl,
        menuItems: JSON.stringify(menuItems),
      };

      if (editingBusiness) {
        await api.updateBusiness(editingBusiness.id, payload);
        setStatusMsg({ text: t.businesses.updatedSuccess, isError: false });
      } else {
        const newBiz = await api.createBusiness(payload);
        setStatusMsg({ text: t.businesses.createdSuccess, isError: false });
        onSelectBusiness(newBiz);
      }

      await onRefreshBusinesses();
      setTimeout(() => {
        setIsModalOpen(false);
      }, 500);
    } catch (err: unknown) {
      setStatusMsg({
        text: err instanceof Error ? err.message : 'Failed to save business',
        isError: true,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
            {t.businesses.title}
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">{t.businesses.subtitle}</p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#3D2B1F] px-4 py-2.5 text-xs font-semibold text-white shadow-2xs hover:bg-[#2C1F16] transition active:scale-[0.99] self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          {t.businesses.createBusiness}
        </button>
      </div>

      {/* Businesses Grid */}
      {businesses.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-stone-200 bg-white p-10 sm:p-12 text-center shadow-2xs">
          <Store className="mx-auto h-11 w-11 text-stone-300" />
          <h3 className="mt-3 text-base font-bold text-stone-800">
            {t.businesses.noBusinessesTitle}
          </h3>
          <p className="mt-1 text-xs text-stone-500">{t.businesses.noBusinessesDesc}</p>
          <button
            onClick={openCreateModal}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#3D2B1F] px-4 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-[#2C1F16] transition"
          >
            <Plus className="h-4 w-4" />
            {t.businesses.createBusiness}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {businesses.map((biz) => {
            const isActive = biz.id === activeBusinessId;
            const bColor = biz.brandColor || '#4A3525';

            return (
              <div
                key={biz.id}
                className={`group relative overflow-hidden rounded-2xl bg-white p-5 sm:p-6 shadow-2xs border transition duration-200 hover:shadow-sm ${
                  isActive ? 'border-[#4A3525] ring-2 ring-[#4A3525]/15' : 'border-stone-200'
                }`}
              >
                {/* Brand Color Header Strip */}
                <div
                  className="absolute top-0 left-0 right-0 h-2 transition-all"
                  style={{ backgroundColor: bColor }}
                />

                <div className="flex items-start justify-between gap-3 mt-1">
                  <div className="flex items-center gap-3 min-w-0">
                    {biz.logoUrl ? (
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-stone-200 bg-stone-50 p-1.5 shadow-2xs overflow-hidden shrink-0">
                        <img
                          src={biz.logoUrl}
                          alt={biz.name}
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                    ) : (
                      <div
                        className="flex h-12 w-12 items-center justify-center rounded-xl text-white font-bold text-lg shadow-2xs shrink-0"
                        style={{ backgroundColor: bColor }}
                      >
                        {biz.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h3 className="text-base font-bold text-stone-900 truncate">{biz.name}</h3>
                      {biz.category && (
                        <span className="text-[11px] font-medium text-stone-500">
                          {biz.category}
                        </span>
                      )}
                    </div>
                  </div>

                  {isActive && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-[#F5EFE6] px-2.5 py-1 text-[11px] font-semibold text-[#4A3525] border border-[#E6D9C6] shrink-0">
                      <Check className="h-3 w-3" />
                      {t.businesses.activeBadge}
                    </span>
                  )}
                </div>

                {biz.description && (
                  <p className="mt-3 text-xs text-stone-600 line-clamp-2">{biz.description}</p>
                )}

                {/* Social & Contact info */}
                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-stone-500">
                  {biz.website && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-stone-50 border border-stone-200/70 px-2 py-0.5 text-[11px]">
                      <Globe className="h-3 w-3 text-stone-400" />
                      <span className="truncate max-w-[120px]">
                        {biz.website.replace(/^https?:\/\//, '')}
                      </span>
                    </span>
                  )}
                  {biz.instagram && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-stone-50 border border-stone-200/70 px-2 py-0.5 text-[11px]">
                      <Instagram className="h-3 w-3 text-stone-500" />
                      <span>{biz.instagram}</span>
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 rounded-md bg-stone-50 border border-stone-200/70 px-2 py-0.5 text-[11px]">
                    <span
                      className="h-2 w-2 rounded-full inline-block"
                      style={{ backgroundColor: bColor }}
                    />
                    <span>{bColor}</span>
                  </span>
                  {biz.menuType && biz.menuType !== 'none' && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-[#F5EFE6] border border-[#E6D9C6] px-2 py-0.5 text-[11px] font-semibold text-[#4A3525]">
                      <BookOpen className="h-3 w-3 text-[#5C4028]" />
                      <span>
                        {biz.menuType === 'link'
                          ? t.businesses.menuBadgeLink
                          : biz.menuType === 'file'
                          ? t.businesses.menuBadgeFile
                          : t.businesses.menuBadgeDigital}
                      </span>
                    </span>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="mt-5 flex items-center justify-between border-t border-stone-100 pt-4 gap-2">
                  <button
                    onClick={() => openEditModal(biz)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    {isEs ? 'Personalizar' : 'Customize'}
                  </button>

                  {!isActive ? (
                    <button
                      onClick={() => onSelectBusiness(biz)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-stone-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#3D2B1F] transition active:scale-95"
                    >
                      <span>{t.businesses.switchToBusiness}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  ) : (
                    <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                      {isEs ? 'Seleccionado' : 'Selected'}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Business Create / Edit & Branding Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="my-4 sm:my-8 w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-xl border border-stone-200 transition-all">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-stone-200 px-5 sm:px-6 py-4">
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-2xs shrink-0"
                  style={{ backgroundColor: brandColor }}
                >
                  <Palette className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-bold text-stone-900 truncate">
                    {editingBusiness ? t.businesses.editBusiness : t.businesses.createBusiness}
                  </h3>
                  <p className="text-xs text-stone-500 truncate">{t.businesses.subtitle}</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-full p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="flex border-b border-stone-200 bg-stone-50/80 px-4 sm:px-6 overflow-x-auto">
              <button
                type="button"
                onClick={() => setModalTab('branding')}
                className={`inline-flex items-center gap-2 border-b-2 py-3 px-3 sm:px-4 text-xs font-semibold whitespace-nowrap transition ${
                  modalTab === 'branding'
                    ? 'border-[#3D2B1F] text-[#3D2B1F] bg-white'
                    : 'border-transparent text-stone-500 hover:text-stone-800'
                }`}
              >
                <Palette className="h-4 w-4" />
                <span>{isEs ? 'Perfil y Marca' : 'Profile & Branding'}</span>
              </button>
              <button
                type="button"
                onClick={() => setModalTab('menu')}
                className={`inline-flex items-center gap-2 border-b-2 py-3 px-3 sm:px-4 text-xs font-semibold whitespace-nowrap transition ${
                  modalTab === 'menu'
                    ? 'border-[#3D2B1F] text-[#3D2B1F] bg-white'
                    : 'border-transparent text-stone-500 hover:text-stone-800'
                }`}
              >
                <BookOpen className="h-4 w-4" />
                <span>{t.businesses.menuTabTitle}</span>
                {menuType !== 'none' && (
                  <span className="h-2 w-2 rounded-full bg-emerald-600 inline-block" />
                )}
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave} className="p-5 sm:p-6 space-y-6">
              {statusMsg && (
                <div
                  className={`rounded-xl p-3 text-xs font-semibold ${
                    statusMsg.isError
                      ? 'bg-red-50 text-red-700 border border-red-200'
                      : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  }`}
                >
                  {statusMsg.text}
                </div>
              )}

              {modalTab === 'branding' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column: Business Details */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        {t.businesses.businessNameLabel} *
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={t.businesses.businessNamePlaceholder}
                        className="w-full rounded-xl border border-stone-300 px-3.5 py-2 text-xs font-medium focus:border-[#4A3525] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        {t.businesses.categoryLabel}
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full rounded-xl border border-stone-300 px-3.5 py-2 text-xs font-medium focus:border-[#4A3525] focus:outline-none bg-white"
                      >
                        {CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        {t.businesses.descriptionLabel}
                      </label>
                      <textarea
                        rows={2}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder={t.businesses.descriptionPlaceholder}
                        className="w-full rounded-xl border border-stone-300 px-3.5 py-2 text-xs font-medium focus:border-[#4A3525] focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                          {t.businesses.websiteLabel}
                        </label>
                        <input
                          type="text"
                          value={website}
                          onChange={(e) => setWebsite(e.target.value)}
                          placeholder="https://..."
                          className="w-full rounded-xl border border-stone-300 px-3 py-1.5 text-xs font-medium focus:border-[#4A3525] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                          {t.businesses.instagramLabel}
                        </label>
                        <input
                          type="text"
                          value={instagram}
                          onChange={(e) => setInstagram(e.target.value)}
                          placeholder="@username"
                          className="w-full rounded-xl border border-stone-300 px-3 py-1.5 text-xs font-medium focus:border-[#4A3525] focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Branding, Colors & Logo */}
                  <div className="space-y-4">
                    {/* Brand Color Customization */}
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-2">
                        {t.businesses.brandColorLabel}
                      </label>
                      <div className="grid grid-cols-2 xs:grid-cols-4 gap-2 mb-3">
                        {BRAND_COLOR_PRESETS.map((preset) => (
                          <button
                            key={preset.hex}
                            type="button"
                            onClick={() => setBrandColor(preset.hex)}
                            className={`flex items-center gap-1.5 rounded-xl border p-2 text-[11px] font-semibold transition ${
                              brandColor.toLowerCase() === preset.hex.toLowerCase()
                                ? 'border-stone-900 bg-stone-50 ring-2 ring-stone-900/10'
                                : 'border-stone-200 hover:bg-stone-50'
                            }`}
                          >
                            <span
                              className="h-3.5 w-3.5 rounded-full shrink-0 shadow-2xs"
                              style={{ backgroundColor: preset.hex }}
                            />
                            <span className="truncate">{preset.name.split(' ')[0]}</span>
                          </button>
                        ))}
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={brandColor}
                          onChange={(e) => setBrandColor(e.target.value)}
                          className="h-8 w-12 cursor-pointer rounded-lg border border-stone-300 p-0.5"
                        />
                        <input
                          type="text"
                          value={brandColor}
                          onChange={(e) => setBrandColor(e.target.value)}
                          className="flex-1 rounded-xl border border-stone-300 px-3 py-1.5 text-xs font-mono font-medium focus:border-[#4A3525] focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Logo Upload */}
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        {t.businesses.logoLabel}
                      </label>
                      <div className="flex items-center gap-3">
                        <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-stone-200 bg-stone-50 p-1 overflow-hidden shrink-0">
                          {logoUrl ? (
                            <img
                              src={logoUrl}
                              alt="Logo preview"
                              className="max-h-full max-w-full object-contain"
                            />
                          ) : (
                            <Building2 className="h-6 w-6 text-stone-300" />
                          )}
                        </div>
                        <div className="flex-1 space-y-1">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadingLogo}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition"
                          >
                            {uploadingLogo ? (
                              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Upload className="h-3.5 w-3.5" />
                            )}
                            <span>{t.businesses.uploadLogo}</span>
                          </button>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            className="hidden"
                          />
                          {logoUrl && (
                            <button
                              type="button"
                              onClick={() => setLogoUrl('')}
                              className="block text-[11px] text-red-600 hover:underline"
                            >
                              {isEs ? 'Eliminar logo' : 'Remove logo'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Wallet Header Brand Preview */}
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-500 mb-1">
                        {t.businesses.brandPreview}
                      </label>
                      <div
                        className="rounded-xl p-4 text-white shadow-2xs flex items-center justify-between"
                        style={{ backgroundColor: brandColor }}
                      >
                        <div className="flex items-center gap-2.5">
                          {logoUrl ? (
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 backdrop-blur-md p-1 shrink-0">
                              <img
                                src={logoUrl}
                                alt="Logo"
                                className="max-h-full max-w-full object-contain"
                              />
                            </div>
                          ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 backdrop-blur-md text-xs font-bold shrink-0">
                              🦙
                            </div>
                          )}
                          <div>
                            <p className="text-xs font-bold tracking-tight leading-tight">
                              {name || 'Store Name'}
                            </p>
                            <p className="text-[10px] text-white/80">{category}</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-semibold rounded-md bg-white/20 px-2 py-0.5">
                          Wallet Card
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {modalTab === 'menu' && (
                <div className="space-y-6">
                  {/* Menu Type Selector */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-2">
                      {t.businesses.menuTypeLabel}
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { type: 'none', label: t.businesses.menuTypeNone, icon: X },
                        { type: 'link', label: t.businesses.menuTypeLink, icon: Link2 },
                        { type: 'file', label: t.businesses.menuTypeFile, icon: FileText },
                        {
                          type: 'digital',
                          label: t.businesses.menuTypeDigital,
                          icon: UtensilsCrossed,
                        },
                      ].map((opt) => {
                        const Icon = opt.icon;
                        const isSelected = menuType === opt.type;
                        return (
                          <button
                            key={opt.type}
                            type="button"
                            onClick={() => setMenuType(opt.type)}
                            className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition ${
                              isSelected
                                ? 'border-[#4A3525] bg-[#F5EFE6]/70 text-[#3D2B1F] ring-2 ring-[#4A3525]/10'
                                : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                            }`}
                          >
                            <Icon
                              className={`h-5 w-5 mb-1.5 ${
                                isSelected ? 'text-[#4A3525]' : 'text-stone-400'
                              }`}
                            />
                            <span className="text-[11px] font-semibold leading-tight">
                              {opt.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Menu Type: External Link */}
                  {menuType === 'link' && (
                    <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 space-y-3">
                      <label className="block text-xs font-bold text-stone-800">
                        {t.businesses.menuUrlLabel}
                      </label>
                      <div className="flex flex-col xs:flex-row gap-2">
                        <input
                          type="url"
                          value={menuUrl}
                          onChange={(e) => setMenuUrl(e.target.value)}
                          placeholder={t.businesses.menuUrlPlaceholder}
                          className="flex-1 rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-xs font-medium focus:border-[#4A3525] focus:outline-none"
                        />
                        {menuUrl && (
                          <a
                            href={menuUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-1 rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            <span>{isEs ? 'Abrir' : 'Open'}</span>
                          </a>
                        )}
                      </div>
                      <p className="text-[11px] text-stone-500">{t.businesses.menuUrlHint}</p>
                    </div>
                  )}

                  {/* Menu Type: File Upload */}
                  {menuType === 'file' && (
                    <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 space-y-3">
                      <label className="block text-xs font-bold text-stone-800">
                        {t.businesses.uploadMenuFile}
                      </label>
                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          onClick={() => menuFileInputRef.current?.click()}
                          disabled={uploadingMenuFile}
                          className="inline-flex items-center gap-2 rounded-xl bg-[#3D2B1F] px-4 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-[#2C1F16] transition"
                        >
                          {uploadingMenuFile ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <Upload className="h-4 w-4" />
                          )}
                          <span>
                            {uploadingMenuFile
                              ? t.businesses.uploadingMenuFile
                              : t.businesses.uploadMenuFile}
                          </span>
                        </button>
                        <input
                          ref={menuFileInputRef}
                          type="file"
                          accept=".pdf,image/*"
                          onChange={handleMenuFileUpload}
                          className="hidden"
                        />
                        {menuUrl && (
                          <div className="flex items-center gap-2 text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
                            <Check className="h-4 w-4 text-emerald-700" />
                            <span>{t.businesses.menuFileUploaded}</span>
                            <a
                              href={menuUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#4A3525] underline font-semibold ml-1"
                            >
                              {isEs ? 'Ver archivo' : 'View file'}
                            </a>
                            <button
                              type="button"
                              onClick={() => setMenuUrl('')}
                              className="text-red-600 hover:text-red-800 ml-1"
                              title={t.businesses.deleteItem}
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                      <p className="text-[11px] text-stone-500">{t.businesses.menuFileHint}</p>
                    </div>
                  )}

                  {/* Menu Type: Digital Builder */}
                  {menuType === 'digital' && (
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-xs font-bold text-stone-900">
                          {t.businesses.digitalMenuTitle}
                        </h4>
                        <p className="text-[11px] text-stone-500">
                          {t.businesses.digitalMenuSubtitle}
                        </p>
                      </div>

                      {/* Add item row */}
                      <div className="rounded-xl border border-stone-200 bg-stone-50 p-3.5 space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <div>
                            <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                              {t.businesses.itemNameLabel} *
                            </label>
                            <input
                              type="text"
                              value={itemName}
                              onChange={(e) => setItemName(e.target.value)}
                              placeholder={t.businesses.itemNamePlaceholder}
                              className="w-full rounded-xl border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium focus:border-[#4A3525] focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                              {t.businesses.itemPriceLabel}
                            </label>
                            <input
                              type="text"
                              value={itemPrice}
                              onChange={(e) => setItemPrice(e.target.value)}
                              placeholder={t.businesses.itemPricePlaceholder}
                              className="w-full rounded-xl border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium focus:border-[#4A3525] focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                              {t.businesses.itemCategoryLabel}
                            </label>
                            <input
                              type="text"
                              value={itemCategory}
                              onChange={(e) => setItemCategory(e.target.value)}
                              placeholder={t.businesses.itemCategoryPlaceholder}
                              className="w-full rounded-xl border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium focus:border-[#4A3525] focus:outline-none"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                            {t.businesses.itemDescriptionLabel}
                          </label>
                          <input
                            type="text"
                            value={itemDescription}
                            onChange={(e) => setItemDescription(e.target.value)}
                            placeholder={t.businesses.itemDescriptionPlaceholder}
                            className="w-full rounded-xl border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium focus:border-[#4A3525] focus:outline-none"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={handleAddMenuItem}
                          disabled={!itemName.trim()}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-stone-900 px-4 py-2 text-xs font-semibold text-white hover:bg-[#3D2B1F] transition disabled:opacity-40"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>{t.businesses.addMenuItem}</span>
                        </button>
                      </div>

                      {/* List of items */}
                      {menuItems.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-stone-200 p-6 text-center text-xs text-stone-400">
                          <UtensilsCrossed className="h-8 w-8 mx-auto mb-2 text-stone-300" />
                          {t.businesses.noMenuItems}
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                          {menuItems.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center justify-between rounded-xl border border-stone-200 bg-white p-3 hover:border-stone-300 transition"
                            >
                              <div className="flex-1 pr-2 min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-xs font-bold text-stone-900">
                                    {item.name}
                                  </span>
                                  {item.price && (
                                    <span className="text-xs font-bold text-[#4A3525] bg-[#F5EFE6] px-2 py-0.5 rounded-md">
                                      {item.price}
                                    </span>
                                  )}
                                  {item.category && (
                                    <span className="text-[10px] font-semibold text-stone-600 bg-stone-100 px-2 py-0.5 rounded-md">
                                      {item.category}
                                    </span>
                                  )}
                                </div>
                                {item.description && (
                                  <p className="text-[11px] text-stone-500 mt-0.5">
                                    {item.description}
                                  </p>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveMenuItem(item.id)}
                                className="rounded-lg p-1.5 text-stone-400 hover:bg-red-50 hover:text-red-600 transition shrink-0"
                                title={t.businesses.deleteItem}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Menu Type: None */}
                  {menuType === 'none' && (
                    <div className="rounded-xl border border-dashed border-stone-200 p-6 text-center">
                      <p className="text-xs text-stone-500">
                        {isEs
                          ? 'Tu comercio no mostrará un botón de menú en la billetera de los clientes. Puedes activar un enlace, subir un PDF o cargar ítems digitales cuando lo desees.'
                          : "Your business will not display a menu button in customers' wallets. You can enable a link, upload a PDF, or add digital items anytime."}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 border-t border-stone-100 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-stone-200 px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  disabled={saving || !name.trim()}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#3D2B1F] px-5 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-[#2C1F16] transition disabled:opacity-50 active:scale-[0.99]"
                >
                  {saving ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  <span>{t.businesses.saveChanges}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
