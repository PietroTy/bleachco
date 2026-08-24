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
    console.warn('⚠️ Falha na requisição de frete ao backend. Usando cotação padrão:', err);
    // Retorna frete simulado gracioso para não travar a experiência do usuário
    return {
      options: [
        {
          id: 'sedex-std',
          name: 'SEDEX',
          company: 'Correios',
          price: 19.90,
          currency: 'R$',
          deliveryTime: 2,
          deliveryRange: '1 a 2 dias úteis',
          logo: null,
        },
        {
          id: 'pac-std',
          name: 'PAC',
          company: 'Correios',
          price: 14.90,
          currency: 'R$',
          deliveryTime: 5,
          deliveryRange: '4 a 6 dias úteis',
          logo: null,
        },
      ],
      simulated: true,
    };
  }
}
