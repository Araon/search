export const EVENTS = {
    COOL_SEARCH: 'Semantic Search',
    SEARCH: 'Normal Search',
}

export const CONFIG = {
    PH_KEY:
        process.env.REACT_APP_PUBLIC_POSTHOG_KEY ||
        'phc_QO2eSDN69Kq1aHdny9u8r6x5NRyMorjZ0nbh7nYpHA1',
    PH_HOST:
        process.env.REACT_APP_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
}
