"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import {
  Clock,
  Mail,
  MapPin,
  Phone,
  CheckCircle2,
  ArrowUpRight,
  Navigation,
  LogIn,
  MessageSquare,
  Loader2,
  ClipboardList,
} from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { AuthTrigger } from "@/components/site/AuthModal";
import { useApiOne, useContentBlock } from "@/lib/hooks";

interface HeroContent {
  surtitre: string;
  titre: string;
  description: string;
}

const HERO_DEFAUT: HeroContent = {
  surtitre: "Contact",
  titre: "Nous écrire",
  description:
    "Une question sur une démarche, un texte réglementaire ou un dossier en cours ? Nos services vous répondent sous cinq jours ouvrés.",
};

interface SiteConfigPublic {
  contactInfo: {
    address?: { fr?: string };
    phone?: string;
    email?: string;
    hours?: { fr?: string };
  };
}

export default function Contact() {
  const t = useTranslations("contactPage");
  const { user, loading: authLoading } = useAuth();
  const { data: hero } = useContentBlock<HeroContent>(
    "contact.hero",
    HERO_DEFAUT,
  );
  const { data: config } = useApiOne<SiteConfigPublic>("/site-config");
  const contactArpt = {
    adresse: config?.contactInfo?.address?.fr || t("defaultAddress"),
    telephone: config?.contactInfo?.phone || t("defaultPhone"),
    email: config?.contactInfo?.email || t("defaultEmail"),
    horaires: config?.contactInfo?.hours?.fr || t("defaultHours"),
  };
  const motifReclamations = [
    { value: "qualite_internet", label: t("reasons.internetQuality") },
    { value: "facturation", label: t("reasons.billing") },
    { value: "spam", label: t("reasons.spam") },
    { value: "couverture", label: t("reasons.coverage") },
    { value: "donnees", label: t("reasons.dataProtection") },
    { value: "homologation", label: t("reasons.approval") },
  ];
  const coordonnees = [
    {
      type: "address" as const,
      icon: MapPin,
      libelle: t("address"),
      valeur: contactArpt.adresse,
    },
    {
      type: "phone" as const,
      icon: Phone,
      libelle: t("phone"),
      valeur: contactArpt.telephone,
    },
    {
      type: "email" as const,
      icon: Mail,
      libelle: t("email"),
      valeur: contactArpt.email,
    },
    {
      type: "hours" as const,
      icon: Clock,
      libelle: t("hours"),
      valeur: contactArpt.horaires,
    },
  ];
  const mapQuery = encodeURIComponent(contactArpt.adresse);
  const mapUrl = `https://www.google.com/maps?q=${mapQuery}&z=16&output=embed`;
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${mapQuery}`;
  const [envoye, setEnvoye] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [erreur, setErreur] = useState("");
  const [formData, setFormData] = useState({
    objet: "",
    message: "",
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({ ...prev, objet: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErreur("");
    setIsSubmitting(true);

    if (!formData.objet) {
      setErreur(t("subjectPlaceholder"));
      setIsSubmitting(false);
      return;
    }
    const motif =
      motifReclamations.find((m) => m.value === formData.objet)?.label ??
      formData.objet;

    try {
      await api.post("/contact/me", {
        subject: motif,
        message: formData.message,
      });
      setEnvoye(true);
      toast.success(t("submitSuccess"));
    } catch (err) {
      setErreur(err instanceof ApiError ? err.message : t("genericError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <PageHero
        surtitre={hero.surtitre}
        titre={hero.titre}
        description={hero.description}
      />

      <section className="section-y bg-[linear-gradient(180deg,var(--background)_0%,var(--surface)_100%)]">
        <div className="container-content grid gap-8 lg:grid-cols-[0.8fr_1.4fr] lg:items-start">
          {/* Contact Info Sidebar */}
          <aside className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
            <div className="bg-teal-600 px-6 py-7 text-primary-foreground">
              <p className="text-xs font-semibold tracking-[0.16em] uppercase text-primary-foreground/70">
                {t("coordinatesLabel")}
              </p>
              <h2 className="mt-2 text-xl font-semibold">{t("letsTalk")}</h2>
              <p className="mt-2 text-sm leading-6 text-primary-foreground/75">
                {t("contactIntro")}
              </p>
            </div>

            <div className="divide-y divide-border px-6">
              {coordonnees.map((c) => {
                const href =
                  c.type === "phone"
                    ? `tel:${c.valeur.replace(/\s+/g, "")}`
                    : c.type === "email"
                      ? `mailto:${c.valeur}`
                      : undefined;

                return (
                  <div key={c.type} className="flex gap-4 py-5">
                    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-teal-100 text-teal-600">
                      <c.icon className="size-5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                        {c.libelle}
                      </p>
                      <p className="mt-1 text-sm leading-6 font-medium break-words">
                        {href ? (
                          <a
                            href={href}
                            className="transition-colors hover:text-primary hover:underline"
                          >
                            {c.valeur}
                          </a>
                        ) : (
                          c.valeur
                        )}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-border bg-surface px-6 py-5">
              <p className="text-xs leading-5 text-muted-foreground">
                {t("privacyNote")}
              </p>
            </div>
          </aside>

          {/* Contact Form */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card md:p-8 lg:p-10">
            {envoye ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="grid size-16 place-items-center rounded-full bg-teal-600 text-white shadow transition-colors hover:bg-teal-700">
                  <CheckCircle2 className="size-8" aria-hidden="true" />
                </div>
                <h2 className="mt-6 font-heading text-2xl font-semibold">
                  {t("sentTitle")}
                </h2>
                <p className="mt-3 max-w-sm text-sm leading-6 text-muted-foreground">
                  {t("sentBody")}
                </p>
                <Button
                  variant="outline"
                  className="mt-8"
                  onClick={() => {
                    setEnvoye(false);
                    setFormData({ objet: "", message: "" });
                  }}
                >
                  {t("sendAnother")}
                </Button>
              </div>
            ) : authLoading ? (
              <Loader
                className="flex justify-center py-10"
                label={t("loading")}
              />
            ) : !user ? (
              <div className="py-10 text-center">
                <LogIn className="mx-auto size-12 text-teal-600" aria-hidden />
                <h2 className="mt-4 font-heading text-xl font-semibold">
                  {t("loginRequiredTitle")}
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {t("loginRequiredBody")}
                </p>
                <Button asChild className="mt-6">
                  <AuthTrigger>{t("loginOrCreateAccount")}</AuthTrigger>
                </Button>
              </div>
            ) : (
              <form
                className="grid gap-x-5 gap-y-6 sm:grid-cols-2"
                onSubmit={handleSubmit}
              >
                <div className="sm:col-span-2">
                  <p className="text-xs font-semibold tracking-[0.16em] text-primary uppercase">
                    {t("yourRequest")}
                  </p>
                  <h2 className="mt-2 font-heading text-2xl font-semibold">
                    {t("formTitle")}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {t("requiredFieldsNote")}
                  </p>
                </div>

                <div className="grid gap-2 sm:col-span-2">
                  <Label htmlFor="c-objet">{t("subject")}</Label>
                  <div className="relative">
                    <ClipboardList
                      className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground"
                      aria-hidden
                    />
                    <Select
                      value={formData.objet}
                      onValueChange={handleSelectChange}
                      required
                    >
                      <SelectTrigger
                        id="c-objet"
                        className="h-11 bg-background pl-10"
                      >
                        <SelectValue placeholder={t("subjectPlaceholder")} />
                      </SelectTrigger>
                      <SelectContent>
                        {motifReclamations.map((motif) => (
                          <SelectItem key={motif.value} value={motif.value}>
                            {motif.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2 sm:col-span-2">
                  <Label htmlFor="c-message">{t("message")}</Label>
                  <div className="relative">
                    <MessageSquare
                      className="absolute left-3 top-3 size-4 text-muted-foreground pointer-events-none"
                      aria-hidden="true"
                    />
                    <Textarea
                      id="c-message"
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      className="min-h-[160px] resize-y bg-background pl-10 transition-all focus-visible:border-primary focus-visible:ring-primary/20"
                      required
                      rows={5}
                      minLength={10}
                      maxLength={2000}
                      placeholder={t("messagePlaceholder")}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground text-right">
                    {t("charCount", { count: formData.message.length })}
                  </p>
                </div>

                {erreur && (
                  <p
                    className="text-sm text-destructive sm:col-span-2"
                    role="alert"
                  >
                    {erreur}
                  </p>
                )}

                <div className="flex flex-col-reverse gap-3 border-t border-border pt-6 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs leading-5 text-muted-foreground">
                    {t("responseTime")}
                  </p>
                  <Button
                    type="submit"
                    size="lg"
                    disabled={isSubmitting}
                    className="w-full gap-2 shadow-sm sm:w-auto"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2
                          className="size-4 animate-spin"
                          aria-hidden="true"
                        />
                        {t("submitting")}
                      </>
                    ) : (
                      t("submit")
                    )}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section
        aria-labelledby="map-title"
        className="border-t border-border bg-surface py-6 md:py-16"
      >
        <div className="container-content">
          <div className="mb-7 flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="text-xs font-semibold tracking-[0.16em] text-primary uppercase">
                {t("visitUs")}
              </p>
              <h2
                id="map-title"
                className="mt-2 font-heading text-2xl md:text-3xl"
              >
                {t("findUs")}
              </h2>
              <p className="mt-3 flex items-start gap-2 text-sm leading-6 text-muted-foreground">
                <MapPin
                  className="mt-1 size-4 shrink-0 text-primary"
                  aria-hidden="true"
                />
                {contactArpt.adresse}
              </p>
            </div>
            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-2 rounded-md bg-teal-600 px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-teal-700"
            >
              <Navigation className="size-4" aria-hidden="true" />
              {t("getDirections")}
              <ArrowUpRight className="size-4" aria-hidden="true" />
              <span className="sr-only">{t("newTab")}</span>
            </a>
          </div>

          <div className="overflow-hidden rounded-lg border border-border bg-muted">
            <iframe
              src={mapUrl}
              title={t("mapTitle")}
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
              className="h-80 w-full border-0 md:h-[440px]"
            />
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <Clock className="size-3.5" aria-hidden="true" />
              {contactArpt.horaires}
            </span>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 py-2 text-primary transition-colors hover:underline"
            >
              {t("openInGoogleMaps")}
              <ArrowUpRight className="size-3.5" aria-hidden="true" />
              <span className="sr-only">{t("newTab")}</span>
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
