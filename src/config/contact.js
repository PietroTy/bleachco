// Canais reais de contato da loja, na ordem em que aparecem. O que ficar vazio não aparece no site.
export const CONTACT = {
  email: 'bleach.co.br@gmail.com',
  instagram: '',  // só o usuário, sem @ (ex: usebleach.co)
  tiktok: '',
  whatsapp: '',   // só números, com DDI e DDD
};

export const CONTACT_LINKS = [
  CONTACT.email && {
    label: 'E-mail',
    value: CONTACT.email,
    href: `mailto:${CONTACT.email}`,
  },
  CONTACT.instagram && {
    label: 'Instagram',
    value: `@${CONTACT.instagram}`,
    href: `https://instagram.com/${CONTACT.instagram}`,
  },
  CONTACT.tiktok && {
    label: 'TikTok',
    value: `@${CONTACT.tiktok}`,
    href: `https://www.tiktok.com/@${CONTACT.tiktok}`,
  },
  CONTACT.whatsapp && {
    label: 'WhatsApp',
    value: `+${CONTACT.whatsapp.replace(/^(\d{2})(\d{2})(\d{4,5})(\d{4})$/, '$1 ($2) $3-$4')}`,
    href: `https://wa.me/${CONTACT.whatsapp}`,
  },
].filter(Boolean);
