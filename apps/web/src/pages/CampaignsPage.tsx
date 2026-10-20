import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import QRCode from 'react-qr-code';
import { CARD_THEME_PRESETS, CardThemePreset, CardStampIcon } from '@alpacard/shared';
import { api } from '../services/api';
import { useLanguage } from '../i18n/LanguageContext';
import { CardPreview, getCardStyle } from '../components/CardPreview';

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
}

interface CampaignsPageProps {
  businessId?: string;
  businessName?: string;
}

const AVAILABLE_STAMP_ICONS: { id: CardStampIcon; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
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

  // QR Preview Modal State
  const [qrModalCampaign, setQrModalCampaign] = useState<Campaign | null>(null);

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
          <h2 className="text-xl font-black text-gray-900 tracking-tight">{t.campaigns.title}</h2>
          <p className="text-xs text-gray-500">{t.campaigns.subtitle}</p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-indigo-500 transition"
        >
          <Plus className="h-4 w-4" />
          {t.campaigns.newCampaign}
        </button>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <RefreshCw className="h-6 w-6 animate-spin text-indigo-600" />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-center text-xs text-red-600">
          {error}
        </div>
      ) : campaigns.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-gray-200 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 mb-4">
            <Palette className="h-7 w-7" />
          </div>
          <h3 className="text-sm font-bold text-gray-800">{t.campaigns.noCampaignsTitle}</h3>
          <p className="mt-1 text-xs text-gray-500 max-w-sm mx-auto">{t.campaigns.noCampaignsDesc}</p>
          <button
            onClick={openCreateModal}
            className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-indigo-500"
          >
            <Plus className="h-4 w-4" />
            {t.campaigns.newCampaign}
          </button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
                className="group relative flex flex-col justify-between overflow-hidden rounded-3xl bg-white shadow-sm border border-gray-100 transition hover:shadow-lg hover:-translate-y-0.5"
              >
                {/* Visual Card Banner Header */}
                <div
                  style={cardStyle}
                  className="relative p-5 text-white transition duration-300"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {camp.logoUrl ? (
                        <img
                          src={camp.logoUrl}
                          alt="Logo"
                          className="h-8 w-8 rounded-lg object-cover border border-white/20 bg-white/10"
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 backdrop-blur-xs text-xs font-bold">
                          🦙
                        </div>
                      )}
                      <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">
                        {businessName}
                      </span>
                    </div>

                    <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold backdrop-blur-xs">
                      {camp.stampsRequired} {t.campaigns.stampsRequired.split(' ')[0]}
                    </span>
                  </div>

                  <h3 className="mt-3 text-lg font-black leading-tight line-clamp-1">{camp.name}</h3>
                  <p className="mt-0.5 text-xs opacity-90 line-clamp-1">
                    🎁 {camp.reward || 'Free Reward'}
                  </p>
                </div>

                {/* Card Content & Stats */}
                <div className="p-5 flex flex-col justify-between flex-1">
                  <div>
                    <p className="text-xs text-gray-500 line-clamp-2">{camp.description || 'No description'}</p>
                    <div className="mt-3 flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2 text-xs font-medium text-gray-700">
                      <span>{t.campaigns.cardsActive}</span>
                      <strong className="text-indigo-600 font-bold">{camp.cardsCount || 0}</strong>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => openEditModal(camp)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-gray-700 hover:text-indigo-600 transition"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      {t.campaigns.editDesign}
                    </button>

                    <button
                      onClick={() => setQrModalCampaign(camp)}
                      className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition"
                    >
                      <QrCode className="h-3.5 w-3.5" />
                      {t.campaigns.printQrPoster}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Campaign & Card Customizer Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="my-8 w-full max-w-4xl rounded-3xl bg-white p-6 shadow-2xl transition-all">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-gray-900">
                  {editingCampaignId ? t.campaigns.editTitle : t.campaigns.createTitle}
                </h3>
                <p className="text-xs text-gray-500">{t.campaigns.subtitle}</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="mt-4 flex border-b border-gray-100">
              <button
                type="button"
                onClick={() => setActiveTab('rules')}
                className={`border-b-2 px-4 py-2 text-xs font-bold transition ${
                  activeTab === 'rules'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-400 hover:text-gray-700'
                }`}
              >
                {t.campaigns.basicInfoTab}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('design')}
                className={`border-b-2 px-4 py-2 text-xs font-bold transition ${
                  activeTab === 'design'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-400 hover:text-gray-700'
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
                        <label className="block text-xs font-bold text-gray-700">
                          {t.campaigns.nameLabel} <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder={t.campaigns.namePlaceholder}
                          className="mt-1 block w-full rounded-xl border border-gray-300 p-2.5 text-xs font-medium focus:border-indigo-600 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700">
                          {t.campaigns.descLabel}
                        </label>
                        <textarea
                          rows={2}
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder={t.campaigns.descPlaceholder}
                          className="mt-1 block w-full rounded-xl border border-gray-300 p-2.5 text-xs font-medium focus:border-indigo-600 focus:outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-gray-700">
                            {t.campaigns.stampsLabel}
                          </label>
                          <input
                            type="number"
                            min={2}
                            max={50}
                            required
                            value={stampsRequired}
                            onChange={(e) => setStampsRequired(Number(e.target.value))}
                            className="mt-1 block w-full rounded-xl border border-gray-300 p-2.5 text-xs font-medium focus:border-indigo-600 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700">
                            {t.campaigns.rewardLabel} <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={reward}
                            onChange={(e) => setReward(e.target.value)}
                            placeholder={t.campaigns.rewardPlaceholder}
                            className="mt-1 block w-full rounded-xl border border-gray-300 p-2.5 text-xs font-medium focus:border-indigo-600 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => setActiveTab('design')}
                          className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700"
                        >
                          {t.campaigns.designTab} &rarr;
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Theme Presets Selection */}
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-2">
                          {t.campaigns.themePresetsLabel}
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                          {CARD_THEME_PRESETS.map((preset) => {
                            const isSelected = bgType === 'preset' && bgValue === preset.id;
                            return (
                              <button
                                key={preset.id}
                                type="button"
                                onClick={() => handleSelectPreset(preset)}
                                className={`relative flex flex-col items-center justify-between rounded-xl p-2 text-center transition-all ${
                                  isSelected
                                    ? 'ring-2 ring-indigo-600 ring-offset-2 scale-102 shadow-md'
                                    : 'border border-gray-200 hover:border-gray-300'
                                }`}
                              >
                                <div
                                  style={{ background: preset.gradient }}
                                  className="h-7 w-full rounded-lg shadow-inner flex items-center justify-center text-white"
                                >
                                  {isSelected && <Check className="h-4 w-4 stroke-[3]" />}
                                </div>
                                <span className="mt-1 text-[10px] font-bold text-gray-800 line-clamp-1">
                                  {isEs ? preset.nameEs : preset.name}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Background Style Switcher */}
                      <div className="pt-2">
                        <label className="block text-xs font-bold text-gray-700 mb-1.5">
                          {t.campaigns.cardBgLabel}
                        </label>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setBgType('preset')}
                            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                              bgType === 'preset'
                                ? 'bg-indigo-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {t.campaigns.presetBg}
                          </button>
                          <button
                            type="button"
                            onClick={() => setBgType('color')}
                            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                              bgType === 'color'
                                ? 'bg-indigo-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            <Paintbrush className="h-3.5 w-3.5 inline mr-1" />
                            {t.campaigns.colorBg}
                          </button>
                          <button
                            type="button"
                            onClick={() => setBgType('image')}
                            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                              bgType === 'image'
                                ? 'bg-indigo-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
                              value={bgValue.startsWith('#') ? bgValue : '#1e293b'}
                              onChange={(e) => setBgValue(e.target.value)}
                              className="h-8 w-12 rounded cursor-pointer border-0"
                            />
                            <input
                              type="text"
                              value={bgValue}
                              onChange={(e) => setBgValue(e.target.value)}
                              placeholder="#1e293b or gradient"
                              className="w-full rounded-xl border border-gray-300 p-2 text-xs font-mono"
                            />
                          </div>
                        )}

                        {bgType === 'image' && (
                          <div className="mt-3 flex items-center gap-3">
                            <label className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-dashed border-indigo-300 bg-indigo-50/50 px-3 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-50 transition">
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
                                className="text-xs text-red-500 hover:underline"
                              >
                                Remove Image
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Store Logo Uploader */}
                      <div className="pt-2">
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                          {t.campaigns.uploadLogoLabel}
                        </label>
                        <div className="flex items-center gap-3">
                          {logoUrl && (
                            <img
                              src={logoUrl}
                              alt="Logo"
                              className="h-10 w-10 rounded-xl object-cover border border-gray-200 shadow-sm"
                            />
                          )}
                          <label className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-50 transition">
                            <Upload className="h-3.5 w-3.5 text-gray-500" />
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
                              className="text-xs text-red-500 hover:underline"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Stamp Icon Selector */}
                      <div className="pt-2">
                        <label className="block text-xs font-bold text-gray-700 mb-1.5">
                          {t.campaigns.stampIconLabel}
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                          {AVAILABLE_STAMP_ICONS.map((item) => {
                            const IconComponent = item.icon;
                            const isSelected = stampIcon === item.id;
                            return (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => setStampIcon(item.id)}
                                className={`flex items-center justify-center gap-1.5 rounded-xl border p-2 text-xs font-bold transition ${
                                  isSelected
                                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
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
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                          {t.campaigns.textColorLabel}
                        </label>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setTextColor('#ffffff')}
                            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                              textColor === '#ffffff'
                                ? 'bg-gray-900 text-white'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {t.campaigns.lightText}
                          </button>
                          <button
                            type="button"
                            onClick={() => setTextColor('#18181b')}
                            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                              textColor === '#18181b'
                                ? 'bg-gray-900 text-white'
                                : 'bg-gray-100 text-gray-700'
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
                    <span className="text-[11px] font-black uppercase tracking-wider text-gray-400">
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
              <div className="mt-8 flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 transition"
                >
                  {t.campaigns.cancel}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-indigo-500 transition disabled:opacity-50"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl text-center">
            <div className="flex justify-end">
              <button
                onClick={() => setQrModalCampaign(null)}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <span className="text-xs font-black text-indigo-600 uppercase tracking-wider">
              {t.campaigns.printQrPoster}
            </span>
            <h3 className="mt-1 text-xl font-black text-gray-900">{qrModalCampaign.name}</h3>
            <p className="mt-1 text-xs text-gray-500">{qrModalCampaign.reward}</p>

            <div className="mt-6 flex justify-center rounded-2xl bg-gray-50 p-6 border border-gray-100 shadow-inner">
              <QRCode
                value={`${window.location.origin.replace('5173', '5174')}/claim/${qrModalCampaign.id}`}
                size={200}
              />
            </div>

            <p className="mt-4 text-[11px] text-gray-400 font-mono break-all">
              {`${window.location.origin.replace('5173', '5174')}/claim/${qrModalCampaign.id}`}
            </p>

            <button
              onClick={() => window.print()}
              className="mt-6 w-full rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-500 transition"
            >
              {isEs ? 'Imprimir Póster para Mostrador' : 'Print Counter Poster'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
