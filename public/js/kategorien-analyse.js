/**
 * Kategorien-Analyse Module
 * Visualizes revenue analysis by invoice categories
 */

class KategorienAnalyse {
    constructor() {
        this.data = null;
        this.chart = null;
    }

    async load(filters = {}) {
        try {
            const params = new URLSearchParams();
            if (filters.startDate) params.append('startDate', filters.startDate);
            if (filters.endDate) params.append('endDate', filters.endDate);
            if (filters.status) params.append('status', filters.status);

            const response = await fetch(`/api/liquiditaet/kategorien-analyse?${params}`);
            if (!response.ok) throw new Error('Fehler beim Laden der Analyse');

            this.data = await response.json();
            return this.data;
        } catch (error) {
            console.error('Error loading kategorien analyse:', error);
            throw error;
        }
    }

    renderDashboardWidget(containerId) {
        if (!this.data || !this.data.kategorien.length) {
            document.getElementById(containerId).innerHTML = `
                <div style="text-align: center; padding: 2rem; color: #666;">
                    <p>Keine Daten verfügbar</p>
                    <small>Fügen Sie Forderungen mit Kategorien hinzu, um die Analyse zu sehen.</small>
                </div>
            `;
            return;
        }

        const container = document.getElementById(containerId);
        const top5 = this.data.kategorien.slice(0, 5);

        container.innerHTML = `
            <div class="kategorien-widget">
                <h3>📊 Umsatz nach Kategorien</h3>
                <div class="kategorien-summary">
                    <div class="summary-card">
                        <div class="summary-label">Gesamt</div>
                        <div class="summary-value">€${this.formatNumber(this.data.totals.totalAmount)}</div>
                    </div>
                    <div class="summary-card">
                        <div class="summary-label">Offen</div>
                        <div class="summary-value">€${this.formatNumber(this.data.totals.openAmount)}</div>
                    </div>
                    <div class="summary-card">
                        <div class="summary-label">Überfällig</div>
                        <div class="summary-value" style="color: #d32f2f;">€${this.formatNumber(this.data.totals.overdueAmount)}</div>
                    </div>
                </div>
                <div class="kategorien-list">
                    ${top5.map((kat, index) => `
                        <div class="kategorie-item">
                            <div class="kategorie-rank">${index + 1}</div>
                            <div class="kategorie-color" style="background-color: ${kat.color};"></div>
                            <div class="kategorie-name">${kat.name}</div>
                            <div class="kategorie-amount">€${this.formatNumber(kat.totalAmount)}</div>
                            <div class="kategorie-percentage">${kat.percentOfTotal.toFixed(1)}%</div>
                        </div>
                    `).join('')}
                </div>
                <div class="widget-footer">
                    <a href="#" onclick="navigateTo('/liquiditaet?tab=kategorien'); return false;">
                        Detaillierte Analyse anzeigen →
                    </a>
                </div>
            </div>
        `;
    }

    renderDetailedAnalysis(containerId) {
        if (!this.data) {
            document.getElementById(containerId).innerHTML = '<p>Keine Daten geladen</p>';
            return;
        }

        const container = document.getElementById(containerId);

        container.innerHTML = `
            <div class="kategorien-analyse-detail">
                <!-- Overview Stats -->
                <div class="cashflow-grid" style="margin-bottom: 24px;">
                    <div class="cashflow-card">
                        <div class="cashflow-header">
                            <div class="cashflow-title">Gesamtumsatz</div>
                        </div>
                        <div class="cashflow-amount" style="color: var(--navy);">€${this.formatNumber(this.data.totals.totalAmount)}</div>
                        <div style="font-size: 13px; color: var(--gray); margin-top: 8px;">${this.data.totals.count} Forderungen</div>
                    </div>
                    <div class="cashflow-card">
                        <div class="cashflow-header">
                            <div class="cashflow-title">Top Kategorie</div>
                        </div>
                        <div class="cashflow-amount" style="color: var(--teal); font-size: 16px; font-weight: 700;">${this.data.insights.topByRevenue[0]?.name || 'N/A'}</div>
                        <div style="font-size: 13px; color: var(--gray); margin-top: 8px;">€${this.formatNumber(this.data.insights.topByRevenue[0]?.totalAmount || 0)}</div>
                    </div>
                    <div class="cashflow-card">
                        <div class="cashflow-header">
                            <div class="cashflow-title">Überfällig</div>
                        </div>
                        <div class="cashflow-amount" style="color: ${this.data.totals.overdueAmount > 0 ? '#dc2626' : 'var(--navy)'};">€${this.formatNumber(this.data.totals.overdueAmount)}</div>
                        <div style="font-size: 13px; color: var(--gray); margin-top: 8px;">${this.data.totals.overdueAmount > 0 ? 'Maßnahmen erforderlich' : 'Alles aktuell'}</div>
                    </div>
                    <div class="cashflow-card">
                        <div class="cashflow-header">
                            <div class="cashflow-title">Skonto erfasst</div>
                        </div>
                        <div class="cashflow-amount" style="color: var(--teal);">€${this.formatNumber(this.data.totals.skontoCaptured)}</div>
                        <div style="font-size: 13px; color: var(--gray); margin-top: 8px;">von €${this.formatNumber(this.data.totals.skontoAvailable)}</div>
                    </div>
                </div>

                <!-- Kategorien Cards -->
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; margin-top: 24px;">
                    ${this.data.kategorien.map(kat => `
                        <div class="cashflow-card">
                            <div class="cashflow-header">
                                <div class="cashflow-title" style="font-size: 13px; font-weight: 600;">${kat.name}</div>
                            </div>
                            <div class="cashflow-amount" style="color: var(--navy); font-size: 18px; font-weight: 700; font-family: 'Inter', sans-serif;">€${this.formatNumber(kat.totalAmount)}</div>
                            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-top: 12px; font-size: 11px; color: var(--gray);">
                                <div>
                                    <div style="font-weight: 600; color: var(--navy); font-size: 13px; font-family: 'Inter', sans-serif;">${kat.count}</div>
                                    <div style="font-size: 11px; font-family: 'Inter', sans-serif;">Forderungen</div>
                                </div>
                                <div>
                                    <div style="font-weight: 600; color: var(--navy); font-size: 13px; font-family: 'Inter', sans-serif;">€${this.formatNumber(kat.avgAmount)}</div>
                                    <div style="font-size: 11px; font-family: 'Inter', sans-serif;">Ø Betrag</div>
                                </div>
                            </div>
                            ${kat.overdueAmount > 0 ? `
                                <div style="margin-top: 12px; padding: 6px 10px; background: var(--light-gray); border: 1px solid var(--border-gray); border-radius: 6px; font-size: 11px; color: var(--gray); font-weight: 500; font-family: 'Inter', sans-serif;">
                                    <strong style="color: var(--navy);">€${this.formatNumber(kat.overdueAmount)}</strong> überfällig
                                </div>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>

                <!-- Insights -->
                <div class="cashflow-grid" style="margin-top: 24px;">
                    <div class="cashflow-card">
                        <div class="cashflow-header">
                            <div class="cashflow-title">Top Kategorien (Umsatz)</div>
                        </div>
                        <ol style="padding-left: 1.2rem; margin: 0; font-size: 13px; line-height: 1.8;">
                            ${this.data.insights.topByRevenue.map(kat => `
                                <li>${kat.name}: <strong>€${this.formatNumber(kat.totalAmount)}</strong></li>
                            `).join('')}
                        </ol>
                    </div>

                    <div class="cashflow-card">
                        <div class="cashflow-header">
                            <div class="cashflow-title">Top Kategorien (Anzahl)</div>
                        </div>
                        <ol style="padding-left: 1.2rem; margin: 0; font-size: 13px; line-height: 1.8;">
                            ${this.data.insights.topByCount.map(kat => `
                                <li>${kat.name}: <strong>${kat.count}</strong> Forderungen</li>
                            `).join('')}
                        </ol>
                    </div>
                </div>

                ${this.data.insights.uncategorizedCount > 0 ? `
                    <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 16px; margin-top: 20px;">
                        <div style="font-size: 14px; font-weight: 600; color: var(--navy); margin-bottom: 8px;">Nicht kategorisierte Forderungen</div>
                        <div style="font-size: 13px; color: var(--gray);">
                            <strong>${this.data.insights.uncategorizedCount}</strong> Forderungen
                            im Wert von <strong>€${this.formatNumber(this.data.insights.uncategorizedAmount)}</strong>
                            sind noch nicht kategorisiert.
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    renderChart() {
        const canvas = document.getElementById('kategorien-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');

        // Destroy existing chart if any
        if (this.chart) {
            this.chart.destroy();
        }

        const chartData = this.data.kategorien.slice(0, 10); // Top 10

        this.chart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: chartData.map(k => k.name),
                datasets: [{
                    data: chartData.map(k => k.totalAmount),
                    backgroundColor: chartData.map(k => k.color),
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            generateLabels: (chart) => {
                                const data = chart.data;
                                return data.labels.map((label, i) => ({
                                    text: `${label}: €${this.formatNumber(data.datasets[0].data[i])}`,
                                    fillStyle: data.datasets[0].backgroundColor[i],
                                    hidden: false,
                                    index: i
                                }));
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const value = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `€${this.formatNumber(value)} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    formatNumber(num) {
        return new Intl.NumberFormat('de-DE', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(num);
    }

    formatPaymentDays(days) {
        if (days === 0) return 'Pünktlich';
        if (days < 0) return `${Math.abs(days)} Tage früher`;
        return `+${days} Tage`;
    }

    getBehaviorClass(days) {
        if (days < -5) return 'very-punctual';
        if (days < 0) return 'punctual';
        if (days < 7) return 'slightly-late';
        if (days < 30) return 'late';
        return 'very-late';
    }
}

// Global instance
const kategorienAnalyse = new KategorienAnalyse();

// Filter function
async function filterKategorienAnalyse() {
    const status = document.getElementById('status-filter')?.value;
    const startDate = document.getElementById('start-date-filter')?.value;
    const endDate = document.getElementById('end-date-filter')?.value;

    const filters = {};
    if (status && status !== 'all') filters.status = status;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    await kategorienAnalyse.load(filters);
    kategorienAnalyse.renderDetailedAnalysis('kategorien-analyse-container');
}
