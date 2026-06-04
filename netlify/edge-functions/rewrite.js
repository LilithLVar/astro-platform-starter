export default async (request, context) => {
    const country = context.geo?.country?.code;
    
    // Validate country code to prevent open redirect
    const allowedCountries = ['AU'];
    const isAustralia = country === 'AU';
    const path = isAustralia ? '/edge/australia' : '/edge/not-australia';
    
    return Response.redirect(new URL(path, request.url));
};

export const config = {
    path: '/edge'
};
