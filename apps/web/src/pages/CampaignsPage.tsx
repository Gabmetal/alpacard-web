import React, { useState, useEffect, useRef } from 'react';
import {
  Plus,
  QrCode,
  X,
  RefreshCw,
  Palette,
  Upload,
  Paintbrush,
  Image as ImageIcon,
  Check,
  Pencil,
  Sparkles,
  Coffee,
  Star,
  Heart,
  Gift,
  Cake,
  Crown,
  Tag,
  Trash2,
  Pause,
  Play,
} from 'lucide-react';
import QRCode from 'react-qr-code';
import { CARD_THEME_PRESETS, CardThemePreset, CardStampIcon } from '@alpacard/shared';
import { api } from '../services/api';
import { useLanguage } from '../i18n/LanguageContext';
import { CardPreview, getCardStyle, parseImageBgConfig } from '../components/CardPreview';

interface Campaign {
  id: string;
  name: string;
  description: string;
  stampsRequired: number;
  reward: string;
  logoUrl?: string;
  bgType?: string;
  bgValue?: string;
  bgImageUrl?: string;
  textColor?: string;
  stampIcon?: string;
  isActive: boolean;
  cardsCount?: number;
  totalStamps?: number;
}

interface CampaignsPageProps {
  businessId?: string;
  businessName?: string;
}

const AVAILABLE_STAMP_ICONS: {
  id: CardStampIcon;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: 'coffee', label: 'Coffee', icon: Coffee },
  { id: 'star', label: 'Star', icon: Star },
  { id: 'sparkle', label: 'Sparkle', icon: Sparkles },
  { id: 'heart', label: 'Heart', icon: Heart },
  { id: 'gift', label: 'Gift', icon: Gift },
  { id: 'cupcake', label: 'Bakery', icon: Cake },
  { id: 'crown', label: 'VIP', icon: Crown },
  { id: 'tag', label: 'Tag', icon: Tag },
];

export function CampaignsPage({ businessId, businessName = 'Alpacard Store' }: CampaignsPageProps) {
  const { t, language } = useLanguage();
  const isEs = language === 'es';

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State (Create or Edit)
  const [showModal, setShowModal] = useState(false);
  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'rules' | 'design'>('rules');
  const [qrModalCampaign, setQrModalCampaign] = useState<Campaign | null>(null);
  const modalContainerRef = useRef<HTMLDivElement>(null);

  // Prevent background scroll and reset modal scroll when opening
  useEffect(() => {
    if (showModal || qrModalCampaign) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [showModal, qrModalCampaign]);

  // Scroll to top whenever tab changes or modal opens
  useEffect(() => {
    if (showModal && modalContainerRef.current) {
      modalContainerRef.current.scrollTop = 0;
    }
  }, [showModal, activeTab]);

  const handleTabChange = (tab: 'rules' | 'design') => {
    setActiveTab(tab);
    if (modalContainerRef.current) {
      modalContainerRef.current.scrollTo({ top: 0, behavior: 'instant' });
    }
  };

  // Form Fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [stampsRequired, setStampsRequired] = useState(10);
  const [reward, setReward] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [bgType, setBgType] = useState<'preset' | 'color' | 'image'>('preset');
  const [bgValue, setBgValue] = useState('espresso');
  const [bgImageUrl, setBgImageUrl] = useState('');
  const [textColor, setTextColor] = useState('#ffffff');
  const [stampIcon, setStampIcon] = useState<CardStampIcon>('coffee');

  const [submitting, setSubmitting] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBg, setUploadingBg] = useState(false);

  const loadCampaigns = async () => {
    if (!businessId) return;
    try {
      setLoading(true);
      const data = await api.listCampaigns(businessId);
      setCampaigns(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to fetch campaigns');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCampaigns();
  }, [businessId]);

  const openCreateModal = () => {
    setEditingCampaignId(null);
    setName('');
    setDescription('');
    setStampsRequired(10);
    setReward('');
    setLogoUrl('');
    setBgType('preset');
    setBgValue('espresso');
    setBgImageUrl('');
    setTextColor('#ffffff');
    setStampIcon('coffee');
    setActiveTab('rules');
    setShowModal(true);
  };

  const openEditModal = (camp: Campaign) => {
    setEditingCampaignId(camp.id);
    setName(camp.name);
    setDescription(camp.description || '');
    setStampsRequired(camp.stampsRequired || 10);
    setReward(camp.reward || '');
    setLogoUrl(camp.logoUrl || '');
    setBgType((camp.bgType as 'preset' | 'color' | 'image') || 'preset');
    setBgValue(camp.bgValue || 'espresso');
    setBgImageUrl(camp.bgImageUrl || '');
    setTextColor(camp.textColor || '#ffffff');
    setStampIcon((camp.stampIcon as CardStampIcon) || 'coffee');
    setActiveTab('design');
    setShowModal(true);
  };

  const handleToggleActive = async (camp: Campaign) => {
    try {
      const nextActive = !camp.isActive;
      await api.updateCampaign(camp.id, { isActive: nextActive });
      setCampaigns((prev) =>
        prev.map((c) => (c.id === camp.id ? { ...c, isActive: nextActive } : c))
      );
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to update campaign status');
    }
  };

  const handleDeleteCampaign = async (camp: Campaign) => {
    const confirmMsg = isEs
      ? `¿Estás seguro de que deseas eliminar la campaña "${camp.name}"? Esta acción archivará la campaña y sus tarjetas.`
      : `Are you sure you want to delete campaign "${camp.name}"? This will archive the campaign and its cards.`;
    if (!window.confirm(confirmMsg)) return;

    try {
      await api.deleteCampaign(camp.id);
      setCampaigns((prev) => prev.filter((c) => c.id !== camp.id));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to delete campaign');
    }
  };

  const handleSelectPreset = (preset: CardThemePreset) => {
    setBgType('preset');
    setBgValue(preset.id);
    setTextColor(preset.textColor);
    setStampIcon(preset.icon);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingLogo(true);
      const res = await api.uploadFile(file);
      setLogoUrl(res.url);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingBg(true);
      const res = await api.uploadFile(file);
      setBgType('image');
      setBgImageUrl(res.url);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploadingBg(false);
    }
  };

  const handleSaveCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessId) return;
    setSubmitting(true);
    try {
      if (editingCampaignId) {
        await api.updateCampaign(editingCampaignId, {
          name,
          description,
          stampsRequired: Number(stampsRequired),
          reward,
          logoUrl,
          bgType,
          bgValue,
          bgImageUrl,
          textColor,
          stampIcon,
        });
      } else {
        await api.createCampaign({
          businessId,
          name,
          description,
          stampsRequired: Number(stampsRequired),
          reward,
          logoUrl,
          bgType,
          bgValue,
          bgImageUrl,
          textColor,
          stampIcon,
        });
      }
      setShowModal(false);
      loadCampaigns();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to save campaign');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
            {t.campaigns.title}
          </h2>
          <p className="text-xs sm:text-sm text-stone-500">{t.campaigns.subtitle}</p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#3D2B1F] px-4 py-2.5 text-xs font-semibold text-white shadow-2xs hover:bg-[#2C1F16] transition self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          {t.campaigns.newCampaign}
        </button>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <RefreshCw className="h-6 w-6 animate-spin text-[#5C4028]" />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-center text-xs text-red-700">
          {error}
        </div>
      ) : campaigns.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-stone-200 bg-white p-10 sm:p-12 text-center shadow-2xs">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#F5EFE6] text-[#4A3525] mb-4">
            <Palette className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-bold text-stone-800">{t.campaigns.noCampaignsTitle}</h3>
          <p className="mt-1 text-xs text-stone-500 max-w-sm mx-auto">
            {t.campaigns.noCampaignsDesc}
          </p>
          <button
            onClick={openCreateModal}
            className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-[#3D2B1F] px-4 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-[#2C1F16]"
          >
            <Plus className="h-4 w-4" />
            {t.campaigns.newCampaign}
          </button>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((camp) => {
            const cardStyle = getCardStyle({
              bgType: camp.bgType,
              bgValue: camp.bgValue,
              bgImageUrl: camp.bgImageUrl,
              textColor: camp.textColor,
            });

            return (
              <div
                key={camp.id}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-white shadow-2xs border border-stone-200 transition hover:shadow-md"
              >
                {/* Visual Card Banner Header */}
                <div style={cardStyle} className="relative p-5 text-white transition duration-300">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {camp.logoUrl ? (
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/20 bg-white/15 backdrop-blur-xs p-1 shadow-2xs shrink-0 overflow-hidden">
                          <img
                            src={camp.logoUrl}
                            alt="Logo"
                            className="max-h-full max-w-full object-contain object-center"
                          />
                        </div>
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 backdrop-blur-xs text-xs font-bold shrink-0">
                          🦙
                        </div>
                      )}
                      <span className="text-[10px] font-bold uppercase tracking-wider opacity-85 truncate">
                        {businessName}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold backdrop-blur-xs ${
                        camp.isActive ? 'bg-emerald-500/30 text-white' : 'bg-amber-500/40 text-amber-100'
                      }`}>
                        {camp.isActive ? (isEs ? '🟢 Activa' : '🟢 Active') : (isEs ? '⏸️ Pausada' : '⏸️ Paused')}
                      </span>
                      <span className="rounded-md bg-white/20 px-2 py-0.5 text-[10px] font-semibold backdrop-blur-xs">
                        {camp.stampsRequired} {t.campaigns.stampsRequired.split(' ')[0]}
                      </span>
                    </div>
                  </div>

                  <h3 className="mt-3 text-lg font-bold leading-tight line-clamp-1">{camp.name}</h3>
                  <p className="mt-0.5 text-xs opacity-90 line-clamp-1">
                    🎁 {camp.reward || 'Free Reward'}
                  </p>
                </div>

                {/* Card Content & Stats */}
                <div className="p-5 flex flex-col justify-between flex-1">
                  <div>
                    <p className="text-xs text-stone-500 line-clamp-2">
                      {camp.description || 'No description'}
                    </p>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <div className="flex flex-col rounded-xl bg-stone-50 border border-stone-200/60 p-2.5 text-center">
                        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                          {isEs ? 'Clientes' : 'Customers'}
                        </span>
                        <strong className="text-sm font-extrabold text-[#4A3525] mt-0.5">
                          {camp.cardsCount || 0}
                        </strong>
                      </div>
                      <div className="flex flex-col rounded-xl bg-stone-50 border border-stone-200/60 p-2.5 text-center">
                        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                          {isEs ? 'Sellos Emitidos' : 'Stamps Awarded'}
                        </span>
                        <strong className="text-sm font-extrabold text-[#4A3525] mt-0.5">
                          {camp.totalStamps || 0}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="mt-4 pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(camp)}
                        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-stone-700 hover:text-stone-900 hover:bg-stone-100 transition"
                        title={t.campaigns.editDesign}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">{t.campaigns.editDesign}</span>
                      </button>

                      <button
                        onClick={() => handleToggleActive(camp)}
                        className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold transition ${
                          camp.isActive
                            ? 'text-amber-700 hover:bg-amber-50'
                            : 'text-emerald-700 hover:bg-emerald-50'
                        }`}
                        title={camp.isActive ? (isEs ? 'Pausar campaña' : 'Pause campaign') : (isEs ? 'Reanudar campaña' : 'Resume campaign')}
                      >
                        {camp.isActive ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                        <span>{camp.isActive ? (isEs ? 'Pausar' : 'Pause') : (isEs ? 'Activar' : 'Activate')}</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setQrModalCampaign(camp)}
                        className="inline-flex items-center gap-1 rounded-lg bg-[#F5EFE6] border border-[#E6D9C6] px-2.5 py-1 text-xs font-semibold text-[#4A3525] hover:bg-[#EBE1D2] transition"
                        title={t.campaigns.printQrPoster}
                      >
                        <QrCode className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">{t.campaigns.printQrPoster}</span>
                      </button>

                      <button
                        onClick={() => handleDeleteCampaign(camp)}
                        className="inline-flex items-center gap-1 rounded-lg p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 transition"
                        title={isEs ? 'Eliminar campaña' : 'Delete campaign'}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Campaign & Card Customizer Modal */}
      {showModal && (
        <div
          ref={modalContainerRef}
          className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-black/50 backdrop-blur-xs p-3 sm:p-6 flex justify-center items-start"
        >
          <div className="my-2 sm:my-8 w-full max-w-4xl rounded-2xl bg-white p-5 sm:p-6 shadow-xl border border-stone-200 transition-all">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-stone-200 pb-4">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-stone-900">
                  {editingCampaignId ? t.campaigns.editTitle : t.campaigns.createTitle}
                </h3>
                <p className="text-xs text-stone-500">{t.campaigns.subtitle}</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-full p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="mt-4 flex border-b border-stone-200 overflow-x-auto">
              <button
                type="button"
                onClick={() => handleTabChange('rules')}
                className={`border-b-2 px-4 py-2 text-xs font-semibold whitespace-nowrap transition ${
                  activeTab === 'rules'
                    ? 'border-[#3D2B1F] text-[#3D2B1F]'
                    : 'border-transparent text-stone-400 hover:text-stone-700'
                }`}
              >
                {t.campaigns.basicInfoTab}
              </button>
              <button
                type="button"
                onClick={() => handleTabChange('design')}
                className={`border-b-2 px-4 py-2 text-xs font-semibold whitespace-nowrap transition ${
                  activeTab === 'design'
                    ? 'border-[#3D2B1F] text-[#3D2B1F]'
                    : 'border-transparent text-stone-400 hover:text-stone-700'
                }`}
              >
                {t.campaigns.designTab}
              </button>
            </div>

            {/* Modal Body: Two columns layout */}
            <form onSubmit={handleSaveCampaign} className="mt-6">
              <div className="grid gap-6 lg:grid-cols-12">
                {/* Left Column: Form Controls */}
                <div className="space-y-4 lg:col-span-7">
                  {activeTab === 'rules' ? (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-stone-700">
                          {t.campaigns.nameLabel} <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder={t.campaigns.namePlaceholder}
                          className="mt-1 block w-full rounded-xl border border-stone-300 p-2.5 text-xs font-medium focus:border-[#4A3525] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-stone-700">
                          {t.campaigns.descLabel}
                        </label>
                        <textarea
                          rows={2}
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder={t.campaigns.descPlaceholder}
                          className="mt-1 block w-full rounded-xl border border-stone-300 p-2.5 text-xs font-medium focus:border-[#4A3525] focus:outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-stone-700">
                            {t.campaigns.stampsLabel}
                          </label>
                          <input
                            type="number"
                            min={2}
                            max={50}
                            required
                            value={stampsRequired}
                            onChange={(e) => setStampsRequired(Number(e.target.value))}
                            className="mt-1 block w-full rounded-xl border border-stone-300 p-2.5 text-xs font-medium focus:border-[#4A3525] focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-stone-700">
                            {t.campaigns.rewardLabel} <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={reward}
                            onChange={(e) => setReward(e.target.value)}
                            placeholder={t.campaigns.rewardPlaceholder}
                            className="mt-1 block w-full rounded-xl border border-stone-300 p-2.5 text-xs font-medium focus:border-[#4A3525] focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => handleTabChange('design')}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[#5C4028] hover:text-[#3D2B1F]"
                        >
                          {t.campaigns.designTab} &rarr;
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Theme Presets Selection */}
                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-2">
                          {t.campaigns.themePresetsLabel}
                        </label>
                        <div className="grid grid-cols-2 xs:grid-cols-4 gap-2">
                          {CARD_THEME_PRESETS.map((preset) => {
                            const isSelected = bgType === 'preset' && bgValue === preset.id;
                            return (
                              <button
                                key={preset.id}
                                type="button"
                                onClick={() => handleSelectPreset(preset)}
                                className={`relative flex flex-col items-center justify-between rounded-xl p-2 text-center transition-all ${
                                  isSelected
                                    ? 'ring-2 ring-[#4A3525] ring-offset-2 shadow-xs'
                                    : 'border border-stone-200 hover:border-stone-300'
                                }`}
                              >
                                <div
                                  style={{ background: preset.gradient }}
                                  className="h-7 w-full rounded-lg shadow-inner flex items-center justify-center text-white"
                                >
                                  {isSelected && <Check className="h-4 w-4 stroke-[3]" />}
                                </div>
                                <span className="mt-1 text-[10px] font-semibold text-stone-800 line-clamp-1">
                                  {isEs ? preset.nameEs : preset.name}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Background Style Switcher */}
                      <div className="pt-2">
                        <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                          {t.campaigns.cardBgLabel}
                        </label>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => setBgType('preset')}
                            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                              bgType === 'preset'
                                ? 'bg-[#3D2B1F] text-white'
                                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                            }`}
                          >
                            {t.campaigns.presetBg}
                          </button>
                          <button
                            type="button"
                            onClick={() => setBgType('color')}
                            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                              bgType === 'color'
                                ? 'bg-[#3D2B1F] text-white'
                                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                            }`}
                          >
                            <Paintbrush className="h-3.5 w-3.5 inline mr-1" />
                            {t.campaigns.colorBg}
                          </button>
                          <button
                            type="button"
                            onClick={() => setBgType('image')}
                            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                              bgType === 'image'
                                ? 'bg-[#3D2B1F] text-white'
                                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                            }`}
                          >
                            <ImageIcon className="h-3.5 w-3.5 inline mr-1" />
                            {t.campaigns.imageBg}
                          </button>
                        </div>

                        {bgType === 'color' && (
                          <div className="mt-3 flex items-center gap-2">
                            <input
                              type="color"
                              value={bgValue.startsWith('#') ? bgValue : '#292524'}
                              onChange={(e) => setBgValue(e.target.value)}
                              className="h-8 w-12 rounded cursor-pointer border-0"
                            />
                            <input
                              type="text"
                              value={bgValue}
                              onChange={(e) => setBgValue(e.target.value)}
                              placeholder="#292524 or gradient"
                              className="w-full rounded-xl border border-stone-300 p-2 text-xs font-mono"
                            />
                          </div>
                        )}

                        {bgType === 'image' && (
                          <div className="mt-3 space-y-3">
                            {/* Image Uploader & Thumbnail */}
                            <div className="flex flex-wrap items-center gap-3">
                              {bgImageUrl && (
                                <div className="flex h-12 w-16 items-center justify-center rounded-xl border border-stone-200 bg-white p-1 shadow-2xs overflow-hidden shrink-0">
                                  <img
                                    src={bgImageUrl}
                                    alt="Card Background"
                                    className="max-h-full max-w-full object-contain object-center"
                                  />
                                </div>
                              )}
                              <label className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-dashed border-stone-300 bg-stone-50 px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-100 transition">
                                <Upload className="h-3.5 w-3.5" />
                                {uploadingBg ? 'Uploading...' : t.campaigns.uploadBgLabel}
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleBgUpload}
                                  className="hidden"
                                />
                              </label>
                              {bgImageUrl && (
                                <button
                                  type="button"
                                  onClick={() => setBgImageUrl('')}
                                  className="text-xs text-red-600 hover:underline"
                                >
                                  Remove Image
                                </button>
                              )}
                            </div>

                            {/* Fit & Position Mode */}
                            <div>
                              <span className="block text-[11px] font-semibold text-stone-600 mb-1">
                                {t.campaigns.bgFitLabel}
                              </span>
                              {(() => {
                                const { mode: currentMode, color: currentColor } =
                                  parseImageBgConfig(bgValue);
                                return (
                                  <div className="flex flex-wrap gap-2">
                                    <button
                                      type="button"
                                      onClick={() => setBgValue(`contain:${currentColor}`)}
                                      className={`rounded-xl px-2.5 py-1 text-xs font-semibold transition ${
                                        currentMode === 'contain'
                                          ? 'bg-[#3D2B1F] text-white'
                                          : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                                      }`}
                                    >
                                      {t.campaigns.fitContain}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setBgValue(`cover:${currentColor}`)}
                                      className={`rounded-xl px-2.5 py-1 text-xs font-semibold transition ${
                                        currentMode === 'cover'
                                          ? 'bg-[#3D2B1F] text-white'
                                          : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                                      }`}
                                    >
                                      {t.campaigns.fitCover}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setBgValue(`watermark:${currentColor}`)}
                                      className={`rounded-xl px-2.5 py-1 text-xs font-semibold transition ${
                                        currentMode === 'watermark'
                                          ? 'bg-[#3D2B1F] text-white'
                                          : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                                      }`}
                                    >
                                      {t.campaigns.fitWatermark}
                                    </button>
                                  </div>
                                );
                              })()}
                            </div>

                            {/* Base Background Color */}
                            <div>
                              <span className="block text-[11px] font-semibold text-stone-600 mb-1">
                                {t.campaigns.baseColorLabel}
                              </span>
                              {(() => {
                                const { mode: currentMode, color: currentColor } =
                                  parseImageBgConfig(bgValue);
                                return (
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="color"
                                      value={
                                        currentColor.startsWith('#') ? currentColor : '#292524'
                                      }
                                      onChange={(e) =>
                                        setBgValue(`${currentMode}:${e.target.value}`)
                                      }
                                      className="h-8 w-12 rounded cursor-pointer border-0"
                                    />
                                    <input
                                      type="text"
                                      value={currentColor}
                                      onChange={(e) =>
                                        setBgValue(`${currentMode}:${e.target.value}`)
                                      }
                                      placeholder="#292524"
                                      className="w-40 rounded-xl border border-stone-300 p-1.5 text-xs font-mono"
                                    />
                                  </div>
                                );
                              })()}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Store Logo Uploader */}
                      <div className="pt-2">
                        <label className="block text-xs font-semibold text-stone-700 mb-1">
                          {t.campaigns.uploadLogoLabel}
                        </label>
                        <div className="flex flex-wrap items-center gap-3">
                          {logoUrl && (
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-stone-200 bg-stone-50 p-1 shadow-2xs shrink-0 overflow-hidden">
                              <img
                                src={logoUrl}
                                alt="Logo"
                                className="max-h-full max-w-full object-contain object-center"
                              />
                            </div>
                          )}
                          <label className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-stone-200 px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition">
                            <Upload className="h-3.5 w-3.5 text-stone-500" />
                            {uploadingLogo ? 'Uploading...' : 'Choose Logo File'}
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleLogoUpload}
                              className="hidden"
                            />
                          </label>
                          {logoUrl && (
                            <button
                              type="button"
                              onClick={() => setLogoUrl('')}
                              className="text-xs text-red-600 hover:underline"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Stamp Icon Selector */}
                      <div className="pt-2">
                        <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                          {t.campaigns.stampIconLabel}
                        </label>
                        <div className="grid grid-cols-2 xs:grid-cols-4 gap-2">
                          {AVAILABLE_STAMP_ICONS.map((item) => {
                            const IconComponent = item.icon;
                            const isSelected = stampIcon === item.id;
                            return (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => setStampIcon(item.id)}
                                className={`flex items-center justify-center gap-1.5 rounded-xl border p-2 text-xs font-semibold transition ${
                                  isSelected
                                    ? 'border-[#4A3525] bg-[#F5EFE6] text-[#3D2B1F]'
                                    : 'border-stone-200 text-stone-600 hover:border-stone-300'
                                }`}
                              >
                                <IconComponent className="h-4 w-4" />
                                <span>{item.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Text Contrast Color */}
                      <div className="pt-2">
                        <label className="block text-xs font-semibold text-stone-700 mb-1">
                          {t.campaigns.textColorLabel}
                        </label>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setTextColor('#ffffff')}
                            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                              textColor === '#ffffff'
                                ? 'bg-stone-900 text-white'
                                : 'bg-stone-100 text-stone-700'
                            }`}
                          >
                            {t.campaigns.lightText}
                          </button>
                          <button
                            type="button"
                            onClick={() => setTextColor('#18181b')}
                            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                              textColor === '#18181b'
                                ? 'bg-stone-900 text-white'
                                : 'bg-stone-100 text-stone-700'
                            }`}
                          >
                            {t.campaigns.darkText}
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Right Column: Real-time Live Preview */}
                <div className="lg:col-span-5 flex flex-col justify-start">
                  <div className="sticky top-4 space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                      {t.campaigns.livePreview}
                    </span>
                    <CardPreview
                      name={name}
                      storeName={businessName}
                      reward={reward}
                      stampsRequired={stampsRequired}
                      stampsCollected={Math.min(3, stampsRequired)}
                      bgType={bgType}
                      bgValue={bgValue}
                      bgImageUrl={bgImageUrl}
                      textColor={textColor}
                      stampIcon={stampIcon}
                      logoUrl={logoUrl}
                    />
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="mt-8 flex items-center justify-end gap-3 border-t border-stone-100 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-stone-200 px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition"
                >
                  {t.campaigns.cancel}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-[#3D2B1F] px-5 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-[#2C1F16] transition disabled:opacity-50"
                >
                  {submitting ? t.campaigns.saving : t.campaigns.saveCampaign}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Poster Modal */}
      {qrModalCampaign && (
        <div className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-black/50 backdrop-blur-xs p-4 flex items-center justify-center">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl border border-stone-200 text-center my-auto">
            <div className="flex justify-end">
              <button
                onClick={() => setQrModalCampaign(null)}
                className="rounded-full p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <span className="text-xs font-bold text-[#5C4028] uppercase tracking-wider">
              {t.campaigns.printQrPoster}
            </span>
            <h3 className="mt-1 text-xl font-bold text-stone-900">{qrModalCampaign.name}</h3>
            <p className="mt-1 text-xs text-stone-500">{qrModalCampaign.reward}</p>

            <div className="mt-6 flex flex-col items-center justify-center rounded-2xl bg-stone-50 p-6 border border-stone-200">
              <div className="keep-light rounded-xl bg-white p-3 shadow-2xs">
                <QRCode
                  value={`${window.location.origin.replace('5173', '5174')}/claim/${qrModalCampaign.id}`}
                  size={200}
                />
              </div>
              <p className="mt-3 text-[11px] font-semibold text-stone-600">
                {isEs
                  ? '📷 Escanea con la cámara de tu celular para abrir tu tarjeta'
                  : '📷 Scan with phone camera to open your punch card'}
              </p>
            </div>

            {/* Subtle viral branding on counter poster */}
            <div className="mt-3 text-center">
              <p className="text-[10px] text-stone-400 font-medium">
                Powered by <strong className="text-stone-600 font-semibold">Alpacard</strong> • {isEs ? 'Tarjetas digitales gratis para tu negocio' : 'Free digital loyalty cards for your store'}
              </p>
              <p className="text-[9px] text-stone-400 font-mono mt-0.5">
                alpacard.app
              </p>
            </div>

            <button
              onClick={() => window.print()}
              className="mt-5 w-full rounded-xl bg-[#3D2B1F] py-2.5 text-xs font-semibold text-white shadow-2xs hover:bg-[#2C1F16] transition"
            >
              {isEs ? 'Imprimir Póster para Mostrador' : 'Print Counter Poster'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
