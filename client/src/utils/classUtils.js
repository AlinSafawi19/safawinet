export const getStatusClass = (status) => {
    switch (status) {
        case 'good':
        case 'strong':
        case 'enabled':
        case 'active':
        case 'connected':
        case 'verified':
        case 'operational':
        case 'success':
        case 'verified':
        case 'excellent':
        case 'ok':
            return 'status-good';
        case 'warning':
        case 'disabled':
        case 'degraded':
        case 'connecting':
        case 'weak':
        case 'medium':
        case 'pending':
        case 'unverified':
        case 'degraded':
        case 'deactivating':
        case 'deactivated':
        case 'deactivating':
            return 'status-warning';
        case 'error':
        case 'inactive':
        case 'slow':
        case 'failed':
        case 'disconnected':
        case 'failed':
        case 'degraded':
            return 'status-error';
        case 'unknown':
        default:
            return 'status-unknown';
    }
};