function getBackendBaseUrl() {
    if (typeof window !== 'undefined') {
        const host = window.location.hostname;
        const port = window.location.port;
        
        // Se estiver rodando com porta de dev (ex: :3004) ou IP de rede local
        if (port || host === 'localhost' || host === '127.0.0.1' || host.startsWith('192.168.') || host.startsWith('10.')) {
            const protocol = window.location.protocol || 'http:';
            return `${protocol}//${host}:3003`;
        }
    }
    return process.env.REACT_APP_BACKEND_URL || 'http://localhost:3003';
}

export const API_CONFIG = {
    get BACKEND_URL() {
        return getBackendBaseUrl();
    },

    ENDPOINTS: {
        health:           '/health',
        config:           '/config',
        paymentCreate:    '/payment/create',
        paymentStatus:    '/payment/:id/status',
        orderGet:         '/order/:id',
        shippingCalculate: '/shipping/calculate',
    }
};

export function getApiUrl(endpoint) {
    const baseUrl = API_CONFIG.BACKEND_URL;
    const path    = API_CONFIG.ENDPOINTS[endpoint] || `/${endpoint}`;
    return `${baseUrl}${path}`;
}

export function getPaymentStatusUrl(orderId) {
    return `${API_CONFIG.BACKEND_URL}/payment/${orderId}/status`;
}

export function getOrderDetailsUrl(orderId) {
    return `${API_CONFIG.BACKEND_URL}/order/${orderId}`;
}
