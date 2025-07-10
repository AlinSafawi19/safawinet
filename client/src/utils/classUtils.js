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
        case 'ok':
            return 'status-good';
        case 'warning':
        case 'disabled':
        case 'degraded':
        case 'connecting':
            return 'status-warning';
        case 'error':
        case 'inactive':
        case 'slow':
        case 'failed':
        case 'disconnected':
            return 'status-error';
        case 'unknown':
        default:
            return 'status-unknown';
    }
};