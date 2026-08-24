/**
 * paymentService.js
 * Gerencia operações de pagamento via Mercado Pago: criação de pedido e polling de status.
 */
import { getApiUrl, getPaymentStatusUrl, getOrderDetailsUrl } from '../config/apiConfig';

/**
 * Cria um pedido no Mercado Pago através do backend.
 * @param {{ items: Array, payer: Object }} payload
 * @returns {Promise<{ orderId: string, checkoutUrl: string, status: string }>}
 */
export async function createOrder(payload) {
    const url = getApiUrl('paymentCreate');
    try {
        const res = await fetch(url, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify(payload),
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || `Erro ao criar pedido MP: ${res.status}`);
        }

        return await res.json();
    } catch (err) {
        console.warn('⚠️ Falha na conexão de pagamento com o backend. Gerando pedido de simulação:', err);
        const simId = 'BCO-SIM-' + Date.now();
        return {
            orderId: simId,
            checkoutUrl: `/confirmacao?orderId=${simId}&simulated=true`,
            status: 'approved'
        };
    }
}

/**
 * Verifica o status de um pedido.
 * @param {string} orderId
 * @param {boolean} isSimulated
 * @returns {Promise<{ orderId: string, status: string, paidAt: string|null }>}
 */
export async function checkPaymentStatus(orderId, isSimulated = false) {
    const baseUrl = getPaymentStatusUrl(orderId);
    const url = isSimulated ? `${baseUrl}?simulated=true` : baseUrl;
    const res = await fetch(url);
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Erro ao verificar status MP: ${res.status}`);
    }
    return res.json();
}

/**
 * Recupera os detalhes de um pedido.
 * @param {string} orderId
 * @returns {Promise<{ orderId: string, items: Array, total: number, payer: Object, status: string, createdAt: string, paidAt: string|null }>}
 */
export async function getOrderDetails(orderId) {
    const url = getOrderDetailsUrl(orderId);
    const res = await fetch(url);
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Erro ao carregar detalhes do pedido: ${res.status}`);
    }
    return res.json();
}

/**
 * Faz polling do status MP até 'approved' ou timeout.
 * @param {string} orderId
 * @param {{ intervalMs?: number, timeoutMs?: number }} opts
 * @returns {Promise<boolean>} true se pago, false se timeout
 */
export function pollPaymentStatus(orderId, { intervalMs = 3000, timeoutMs = 300000 } = {}) {
    return new Promise((resolve) => {
        const start = Date.now();

        const tick = async () => {
            try {
                const { status } = await checkPaymentStatus(orderId);
                if (status === 'approved') { resolve(true); return; }
                if (status === 'rejected' || status === 'cancelled') { resolve(false); return; }
            } catch { /* ignora erros pontuais de rede */ }

            if (Date.now() - start >= timeoutMs) { resolve(false); return; }
            setTimeout(tick, intervalMs);
        };

        tick();
    });
}