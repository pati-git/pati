import React, { createContext, useContext, useState, useMemo } from "react";
import type { Product } from "@/lib/site";
import { formatPrice, buildWhatsAppInquiryUrl, WHATSAPP_PHONE } from "@/lib/site";

export type InquiryType = "commander" | "personnaliser" | "question";

interface WhatsAppContextType {
  isOpen: boolean;
  openForm: (product?: Product | null, note?: string) => void;
  closeForm: () => void;
  toggleForm: () => void;
  selectedProduct: Product | null;
  setSelectedProduct: (product: Product | null) => void;
  customerName: string;
  setCustomerName: (name: string) => void;
  customerNote: string;
  setCustomerNote: (note: string) => void;
  inquiryType: InquiryType;
  setInquiryType: (type: InquiryType) => void;
  generatedMessage: string;
  whatsappUrl: string;
}

const WhatsAppContext = createContext<WhatsAppContextType | undefined>(undefined);

export function WhatsAppProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerNote, setCustomerNote] = useState("");
  const [inquiryType, setInquiryType] = useState<InquiryType>("commander");

  const openForm = (product?: Product | null, note?: string) => {
    if (product !== undefined) {
      setSelectedProduct(product);
    }
    if (note !== undefined) {
      setCustomerNote(note);
    }
    setIsOpen(true);
  };

  const closeForm = () => setIsOpen(false);
  const toggleForm = () => setIsOpen((prev) => !prev);

  const inquiryLabel = useMemo(() => {
    switch (inquiryType) {
      case "commander":
        return "Commander cette création";
      case "personnaliser":
        return "Personnalisation sur-mesure (couleur/taille)";
      case "question":
        return "Renseignement / Devis";
      default:
        return "Commander";
    }
  }, [inquiryType]);

  const generatedMessage = useMemo(() => {
    const lines: string[] = ["Bonjour Pati' !"];
    if (customerName.trim()) {
      lines.push(`Je m'appelle ${customerName.trim()}.`);
    }
    if (selectedProduct) {
      const priceText = formatPrice(selectedProduct.price);
      lines.push(`Je vous contacte au sujet de la création « ${selectedProduct.name} » (${priceText}).`);
    } else {
      lines.push("Je vous contacte pour une commande de crochet personnalisée.");
    }

    lines.push(`Objet de ma demande : ${inquiryLabel}.`);

    if (customerNote.trim()) {
      lines.push(`Précisions / préférences : ${customerNote.trim()}`);
    } else {
      lines.push("Pouvons-nous échanger sur la disponibilité et les modalités ?");
    }
    lines.push("Merci et à très vite !");
    return lines.join("\n");
  }, [customerName, selectedProduct, inquiryLabel, customerNote]);

  const whatsappUrl = useMemo(() => {
    return `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(generatedMessage)}`;
  }, [generatedMessage]);

  return (
    <WhatsAppContext.Provider
      value={{
        isOpen,
        openForm,
        closeForm,
        toggleForm,
        selectedProduct,
        setSelectedProduct,
        customerName,
        setCustomerName,
        customerNote,
        setCustomerNote,
        inquiryType,
        setInquiryType,
        generatedMessage,
        whatsappUrl,
      }}
    >
      {children}
    </WhatsAppContext.Provider>
  );
}

export function useWhatsApp() {
  const context = useContext(WhatsAppContext);
  if (!context) {
    throw new Error("useWhatsApp must be used within a WhatsAppProvider");
  }
  return context;
}
