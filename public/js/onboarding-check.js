// Vérifier si l'onboarding est complété et afficher une notification si nécessaire
(function() {
    async function checkOnboardingStatus() {
        const onboardingComplete = localStorage.getItem('kontiq_onboarding_complete');
        const onboardingProgress = localStorage.getItem('kontiq_onboarding_progress');
        
        // Si l'onboarding n'est pas complété et qu'il y a une progression sauvegardée
        if (!onboardingComplete && onboardingProgress) {
            showOnboardingBanner();
            return;
        }

        // Sinon, tenter de récupérer depuis le serveur si l'utilisateur est connecté
        try {
            const user = JSON.parse(localStorage.getItem('kontiq_user') || '{}');
            if (!user || !user.email) return;
            const res = await fetch('/api/onboarding?email=' + encodeURIComponent(user.email));
            if (!res.ok) return;
            const result = await res.json();
            if (result && result.data && result.data.status !== 'complete') {
                // stocker localement pour persister la bannière et la reprise
                const d = result.data;
                const local = {
                    step: d.lastStep || 1,
                    userEmail: user.email,
                    companyName: d.company || '',
                    legalForm: d.legalForm || '',
                    tradeRegister: d.tradeRegister || '',
                    vatId: d.vatId || '',
                    industry: d.industry || '',
                    employeeCount: d.employeeCount || '',
                    annualRevenue: d.annualRevenue || '',
                    hq: d.hq || '',
                    address: d.address || '',
                    zipCode: d.zipCode || '',
                    city: d.city || '',
                    supplierInvoices: d.supplierInvoices || '',
                    avgPaymentTerm: d.avgPaymentTerm || '',
                    accountingSoftware: d.accountingSoftware || '',
                    mainBanks: d.mainBanks || '',
                    iban: d.iban || '',
                    bankName: d.bankName || '',
                    contactName: d.contactName || '',
                    contactPosition: d.contactPosition || '',
                    contactEmail: d.contactEmail || '',
                    contactPhone: d.contactPhone || '',
                    minLiquidity: d.minLiquidity || '',
                    paymentTerm: d.paymentTerm || ''
                };
                localStorage.setItem('kontiq_onboarding_progress', JSON.stringify(local));
                showOnboardingBanner();
            }
        } catch (e) {
            console.warn('checkOnboardingStatus failed', e);
        }
    }
    
    function showOnboardingBanner() {
        // Vérifier si le banner existe déjà
        if (document.getElementById('onboarding-incomplete-banner')) {
            return;
        }
        
        const banner = document.createElement('div');
        banner.id = 'onboarding-incomplete-banner';
        banner.style.cssText = `
            position: fixed;
            top: 0;
            left: 50%;
            transform: translateX(-50%);
            max-width: 480px;
            width: calc(100% - 32px);
            background: #0A2540;
            color: #E5E7EB;
            border: 1px solid #1F2937;
            padding: 10px 14px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            z-index: 9999;
            border-radius: 10px;
            box-shadow: 0 10px 30px rgba(10,37,64,0.25);
            animation: fadeInBanner 0.25s ease-out;
            backdrop-filter: blur(6px);
        `;
        
        banner.innerHTML = `
            <div style="display:flex; align-items:center; gap:10px; flex:1; min-width:0;">
                <span style="font-size:18px; color:#10B981;">•</span>
                <div style="font-size:13px; font-weight:600; color:#F9FAFB; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                    Vervollständigen Sie Ihre Unternehmensdaten
                </div>
            </div>
            <div style="display:flex; align-items:center; gap:8px;">
                <button onclick="continueOnboarding()" style="
                    background: #10B981;
                    color: #0A2540;
                    border: none;
                    padding: 8px 12px;
                    border-radius: 7px;
                    font-weight: 700;
                    font-size: 12px;
                    cursor: pointer;
                    transition: opacity 0.2s;
                    white-space: nowrap;
                " onmouseover="this.style.opacity='0.85'" onmouseout="this.style.opacity='1'">
                    Fortsetzen
                </button>
                <button onclick="dismissOnboardingBanner()" style="
                    background: transparent;
                    color: #9CA3AF;
                    border: none;
                    padding: 6px;
                    cursor: pointer;
                    font-size: 16px;
                    line-height: 1;
                    transition: opacity 0.2s;
                " onmouseover="this.style.opacity='0.6'" onmouseout="this.style.opacity='1'" title="Schließen">
                    ×
                </button>
            </div>
        `;

        // Ajouter l'animation CSS
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeInBanner { from { opacity: 0; transform: translate(-50%, -10px);} to { opacity: 1; transform: translate(-50%, 0);} }
        `;
        document.head.appendChild(style);
        
        // Insérer le banner au début du body
        document.body.insertBefore(banner, document.body.firstChild);
    }
    
    // Fonction globale pour continuer l'onboarding
    window.continueOnboarding = function() {
        const progress = localStorage.getItem('kontiq_onboarding_progress');
        if (progress) {
            const data = JSON.parse(progress);
            window.location.href = '/onboarding.html?step=' + (data.step || 1);
        } else {
            window.location.href = '/onboarding.html';
        }
    };
    
    // Fonction globale pour fermer le banner
    window.dismissOnboardingBanner = function() {
        const banner = document.getElementById('onboarding-incomplete-banner');
        if (banner) {
            banner.remove();
        }
        // Pas de mémorisation : le banner réapparaît tant que l'onboarding n'est pas terminé
    };
    
    // Vérifier au chargement de la page
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            checkOnboardingStatus();
        });
    } else {
        checkOnboardingStatus();
    }
})();
