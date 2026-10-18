/**
 * shippingService.js
 * Serviço frontend para cálculo de frete e prazos via Melhor Envio.
 */
import { getApiUrl } from '../config/apiConfig';

/**
 * Solicita o cálculo de frete para um determinado CEP.
 * @param {{ cep: string, items?: Array }} payload
 * @returns {Promise<{ options: Array<{ id: number|string, name: string, company: string, price: number, currency: string, deliveryTime: number, deliveryRange: string, logo: string|null }>, simulated: boolean }>}
 */
export async function calculateShipping({ cep, items = [] }) {
  const url = getApiUrl('shippingCalculate');
  const cleanCep = (cep || '').replace(/\D/g, '');

  if (cleanCep.length !== 8) {
    throw new Error('CEP deve conter 8 dígitos.');
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cep: cleanCep, items }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || err.details || `Erro ao calcular frete: ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    // Frete inventado não serve: o backend recota na hora do pagamento e recusaria
    throw new Error(err.message.startsWith('Failed to fetch')
      ? 'Não conseguimos calcular o frete agora. Tente de novo em alguns minutos.'
      : err.message);
  }
}
