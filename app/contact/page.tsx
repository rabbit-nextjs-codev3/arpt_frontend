"use client";

import { useState } from "react";
import { toast } from "sonner";
import { 
  Clock, Mail, MapPin, Phone, CheckCircle2, ArrowUpRight, Navigation, 
  User, MessageSquare, Loader2, ClipboardList, ShieldCheck
} from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { contactArpt } from "@/data/mock";

const coordonnees = [
  { icon: MapPin, libelle: "Adresse", valeur: contactArpt.adresse },
  { icon: Phone, libelle: "Téléphone", valeur: contactArpt.telephone },
  { icon: Mail, libelle: "Courriel", valeur: contactArpt.email },
  { icon: Clock, libelle: "Horaires", valeur: contactArpt.horaires },
];

const mapQuery = encodeURIComponent("ARPT, Centre Directionnel de Koloma, Conakry, Guinée");
const mapUrl = `https://www.google.com/maps?q=${mapQuery}&z=16&output=embed`;
const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${mapQuery}`;

// 6 common tech regulatory complaints
const motifReclamations = [
  { value: "qualite_internet", label: "Qualité de service internet (débit lent, coupures fréquentes)" },
  { value: "facturation", label: "Facturation abusive ou erreur de crédit/forfait" },
  { value: "spam", label: "Réception de SMS ou appels indésirables (Spam)" },
  { value: "couverture", label: "Couverture réseau mobile insuffisante ou absente" },
  { value: "donnees", label: "Atteinte à la protection des données personnelles" },
  { value: "homologation", label: "Problème d'homologation d'équipement ou de licence" },
];

export default function Contact() {
  const [envoye, setEnvoye] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    nom: "",
    email: "",
    objet: "",
    message: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({ ...prev, objet: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate network request (replace with your actual API call)
    // console.log("Submitting:", formData);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    setIsSubmitting(false);
    setEnvoye(true);
    toast.success("Votre réclamation a bien été envoyée.");
  };

  return (
    <>
      <PageHero
        surtitre="Contact"
        titre="Nous écrire"
        description="Une question sur une démarche, un texte réglementaire ou un dossier en cours ? Nos services vous répondent sous cinq jours ouvrés."
      />

      <section className="section-y bg-[linear-gradient(180deg,var(--background)_0%,var(--surface)_100%)]">
        <div className="container-content grid gap-8 lg:grid-cols-[0.8fr_1.4fr] lg:items-start">
          {/* Contact Info Sidebar */}
          <aside className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
            <div className="bg-primary px-6 py-7 text-primary-foreground">
              <p className="text-xs font-semibold tracking-[0.16em] uppercase text-primary-foreground/70">
                Coordonnées
              </p>
              <h2 className="mt-2 text-xl font-semibold">Parlons de votre demande</h2>
              <p className="mt-2 text-sm leading-6 text-primary-foreground/75">
                Contactez directement nos services ou utilisez le formulaire sécurisé.
              </p>
            </div>

            <div className="divide-y divide-border px-6">
              {coordonnees.map((c) => {
              const isPhone = c.libelle === "Téléphone";
              const isEmail = c.libelle === "Courriel";
              const href = isPhone ? `tel:${c.valeur.replace(/\s+/g, "")}` : isEmail ? `mailto:${c.valeur}` : undefined;

              return (
                <div key={c.libelle} className="flex gap-4 py-5">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
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

            <div className="flex gap-3 border-t border-border bg-surface px-6 py-5">
              <ShieldCheck className="mt-0.5 size-5 shrink-0 text-success" aria-hidden="true" />
              <p className="text-xs leading-5 text-muted-foreground">
                Vos informations sont utilisées uniquement pour traiter votre demande.
              </p>
            </div>
          </aside>

          {/* Contact Form */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card md:p-8 lg:p-10">
            {envoye ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="grid size-16 place-items-center rounded-full bg-success/10 text-success">
                  <CheckCircle2 className="size-8" aria-hidden="true" />
                </div>
                <h2 className="mt-6 font-heading text-2xl font-semibold">Message envoyé</h2>
                <p className="mt-3 max-w-sm text-sm leading-6 text-muted-foreground">
                  Merci, votre réclamation a bien été transmise au service concerné. Nous vous répondrons dans les plus brefs délais.
                </p>
                <Button 
                  variant="outline" 
                  className="mt-8"
                  onClick={() => {
                    setEnvoye(false);
                    setFormData({ nom: "", email: "", objet: "", message: "" });
                  }}
                >
                  Envoyer un autre message
                </Button>
              </div>
            ) : (
              <form className="grid gap-x-5 gap-y-6 sm:grid-cols-2" onSubmit={handleSubmit}>
                <div className="sm:col-span-2">
                  <p className="text-xs font-semibold tracking-[0.16em] text-primary uppercase">Votre demande</p>
                  <h2 className="mt-2 font-heading text-2xl font-semibold">Formulaire de contact</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Les champs marqués d&apos;un astérisque (*) sont obligatoires.
                  </p>
                </div>

                  <div className="grid content-start gap-2">
                    <Label htmlFor="c-nom">Nom complet *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" aria-hidden="true" />
                      <Input 
                        id="c-nom" 
                        name="nom"
                        value={formData.nom}
                        onChange={handleInputChange}
                        className="h-11 bg-background pl-10 transition-all focus-visible:border-primary focus-visible:ring-primary/20" 
                        required 
                        maxLength={120} 
                        placeholder="Ex. : Jean Dupont" 
                      />
                    </div>
                  </div>
                  
                  <div className="grid content-start gap-2">
                    <Label htmlFor="c-email">Adresse e-mail *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" aria-hidden="true" />
                      <Input 
                        id="c-email" 
                        name="email"
                        type="email" 
                        value={formData.email}
                        onChange={handleInputChange}
                        className="h-11 bg-background pl-10 transition-all focus-visible:border-primary focus-visible:ring-primary/20" 
                        required 
                        maxLength={255} 
                        placeholder="jean@exemple.com" 
                      />
                    </div>
                  </div>

                <div className="grid content-start gap-2 sm:col-span-2">
                  <Label htmlFor="c-objet">Objet de la réclamation *</Label>
                  <div className="relative">
                    <ClipboardList className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none z-10" aria-hidden="true" />
                    <Select 
                      required 
                      value={formData.objet} 
                      onValueChange={handleSelectChange}
                    >
                      <SelectTrigger id="c-objet" className="h-11 bg-background pl-10 text-left transition-all focus-visible:border-primary focus-visible:ring-primary/20">
                        <SelectValue placeholder="Sélectionnez un motif" />
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
                  <Label htmlFor="c-message">Message *</Label>
                  <div className="relative">
                    <MessageSquare className="absolute left-3 top-3 size-4 text-muted-foreground pointer-events-none" aria-hidden="true" />
                    <Textarea 
                      id="c-message" 
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      className="min-h-[160px] resize-y bg-background pl-10 transition-all focus-visible:border-primary focus-visible:ring-primary/20" 
                      required 
                      rows={5} 
                      maxLength={2000} 
                      placeholder="Décrivez votre situation en détail (dates, numéros de téléphone concernés, opérateur, etc.)" 
                    />
                  </div>
                  <p className="text-xs text-muted-foreground text-right">
                    {formData.message.length}/2000 caractères
                  </p>
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-border pt-6 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs leading-5 text-muted-foreground">
                    Réponse habituelle sous cinq jours ouvrés.
                  </p>
                  <Button 
                    type="submit" 
                    size="lg" 
                    disabled={isSubmitting}
                    className="w-full gap-2 shadow-sm sm:w-auto"
                  >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                      Envoi en cours...
                    </>
                  ) : (
                    "Envoyer la réclamation"
                  )}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section aria-labelledby="map-title" className="border-t border-border bg-surface py-12 md:py-16">
        <div className="container-content">
          <div className="mb-7 flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="text-xs font-semibold tracking-[0.16em] text-primary uppercase">Nous rendre visite</p>
              <h2 id="map-title" className="mt-2 font-heading text-2xl md:text-3xl">Retrouvez-nous à Koloma</h2>
              <p className="mt-3 flex items-start gap-2 text-sm leading-6 text-muted-foreground">
                <MapPin className="mt-1 size-4 shrink-0 text-primary" aria-hidden="true" />
                {contactArpt.adresse}
              </p>
            </div>
            <a 
              href={directionsUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="inline-flex min-h-11 items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              <Navigation className="size-4" aria-hidden="true" />
              Obtenir l’itinéraire
              <ArrowUpRight className="size-4" aria-hidden="true" />
              <span className="sr-only"> (nouvel onglet)</span>
            </a>
          </div>
          
          <div className="overflow-hidden rounded-lg border border-border bg-muted">
            <iframe 
              src={mapUrl} 
              title="Google Maps — siège de l’ARPT, Centre Directionnel de Koloma, Conakry" 
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
              Ouvrir dans Google Maps
              <ArrowUpRight className="size-3.5" aria-hidden="true" />
              <span className="sr-only"> (nouvel onglet)</span>
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
