// Canais reais de contato da loja. O que ficar vazio não aparece no site.
export const CONTACT = {
  whatsapp: '',   // só números, com DDI e DDD. Ex: 5511987654321
  instagram: '',  // só o usuário, sem @
  email: '',
};

export const CONTACT_LINKS = [
  CONTACT.whatsapp && {
    label: 'WhatsApp',
    value: `+${CONTACT.whatsapp.replace(/^(\d{2})(\d{2})(\d{4,5})(\d{4})$/, '$1 ($2) $3-$4')}`,
    href: `https://wa.me/${CONTACT.whatsapp}`,
  },
  CONTACT.instagram && {
    label: 'Instagram',
    value: `@${CONTACT.instagram}`,
    href: `https://instagram.com/${CONTACT.instagram}`,
  },
  CONTACT.email && {
    label: 'E-mail',
    value: CONTACT.email,
    href: `mailto:${CONTACT.email}`,
  },
].filter(Boolean);
