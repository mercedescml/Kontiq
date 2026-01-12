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
                <div class="analyse-header">
                    <h2>💼 Detaillierte Kategorieanalyse</h2>
                    <div class="analyse-filters">
                        <select id="status-filter" onchange="filterKategorienAnalyse()">
                            <option value="all">Alle Status</option>
                            <option value="open">Offen</option>
                            <option value="paid">Bezahlt</option>
                            <option value="overdue">Überfällig</option>
                        </select>
                        <input type="date" id="start-date-filter" onchange="filterKategorienAnalyse()" placeholder="Von">
                        <input type="date" id="end-date-filter" onchange="filterKategorienAnalyse()" placeholder="Bis">
                    </div>
                </div>

                <!-- Overview Cards -->
                <div class="overview-cards">
                    <div class="overview-card">
                        <div class="card-icon">💰</div>
                        <div class="card-content">
                            <div class="card-label">Gesamtumsatz</div>
                            <div class="card-value">€${this.formatNumber(this.data.totals.totalAmount)}</div>
                            <div class="card-detail">${this.data.totals.count} Forderungen</div>
                        </div>
                    </div>
                    <div class="overview-card">
                        <div class="card-icon">📈</div>
                        <div class="card-content">
                            <div class="card-label">Top Kategorie</div>
                            <div class="card-value">${this.data.insights.topByRevenue[0]?.name || 'N/A'}</div>
                            <div class="card-detail">€${this.formatNumber(this.data.insights.topByRevenue[0]?.totalAmount || 0)}</div>
                        </div>
                    </div>
                    <div class="overview-card">
                        <div class="card-icon">⚠️</div>
                        <div class="card-content">
                            <div class="card-label">Überfällig</div>
                            <div class="card-value">€${this.formatNumber(this.data.totals.overdueAmount)}</div>
                            <div class="card-detail">${this.data.totals.overdueAmount > 0 ? 'Maßnahmen erforderlich' : 'Alles aktuell'}</div>
                        </div>
                    </div>
                    <div class="overview-card">
                        <div class="card-icon">🎯</div>
                        <div class="card-content">
                            <div class="card-label">Skonto erfasst</div>
                            <div class="card-value">€${this.formatNumber(this.data.totals.skontoCaptured)}</div>
                            <div class="card-detail">von €${this.formatNumber(this.data.totals.skontoAvailable)}</div>
                        </div>
                    </div>
                </div>

                <!-- Chart Container -->
                <div class="chart-section">
                    <h3>Umsatzverteilung</h3>
                    <canvas id="kategorien-chart" style="max-height: 300px;"></canvas>
                </div>

                <!-- Detailed Table -->
                <div class="table-section">
                    <h3>Kategorien im Detail</h3>
                    <div class="table-responsive">
                        <table class="kategorien-table">
                            <thead>
                                <tr>
                                    <th>Kategorie</th>
                                    <th>Gesamt</th>
                                    <th>Offen</th>
                                    <th>Bezahlt</th>
                                    <th>Überfällig</th>
                                    <th>Anzahl</th>
                                    <th>Ø Betrag</th>
                                    <th>Ø Zahlungsdauer</th>
                                    <th>Anteil</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${this.data.kategorien.map(kat => `
                                    <tr>
                                        <td>
                                            <span class="kategorie-indicator" style="background-color: ${kat.color};"></span>
                                            ${kat.name}
                                        </td>
                                        <td>€${this.formatNumber(kat.totalAmount)}</td>
                                        <td>€${this.formatNumber(kat.openAmount)}</td>
                                        <td>€${this.formatNumber(kat.paidAmount)}</td>
                                        <td style="color: ${kat.overdueAmount > 0 ? '#d32f2f' : 'inherit'};">
                                            €${this.formatNumber(kat.overdueAmount)}
                                        </td>
                                        <td>${kat.count}</td>
                                        <td>€${this.formatNumber(kat.avgAmount)}</td>
                                        <td>${this.formatPaymentDays(kat.avgPaymentDays)}</td>
                                        <td>
                                            <div class="percentage-bar">
                                                <div class="percentage-fill" style="width: ${kat.percentOfTotal}%; background-color: ${kat.color};"></div>
                                                <span>${kat.percentOfTotal.toFixed(1)}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Insights -->
                <div class="insights-section">
                    <div class="insight-card">
                        <h4>💡 Top Performers (Umsatz)</h4>
                        <ol>
                            ${this.data.insights.topByRevenue.map(kat => `
                                <li>${kat.name}: <strong>€${this.formatNumber(kat.totalAmount)}</strong> (${kat.count} Forderungen)</li>
                            `).join('')}
                        </ol>
                    </div>

                    <div class="insight-card">
                        <h4>📊 Top Performers (Anzahl)</h4>
                        <ol>
                            ${this.data.insights.topByCount.map(kat => `
                                <li>${kat.name}: <strong>${kat.count}</strong> Forderungen (Ø €${this.formatNumber(kat.avgAmount)})</li>
                            `).join('')}
                        </ol>
                    </div>

                    <div class="insight-card">
                        <h4>⚡ Zahlungsverhalten</h4>
                        <ul>
                            ${this.data.insights.paymentBehavior.map(behavior => `
                                <li>
                                    <span class="behavior-label ${this.getBehaviorClass(behavior.avgPaymentDays)}">
                                        ${behavior.behavior}
                                    </span>
                                    ${behavior.kategorie}: ${this.formatPaymentDays(behavior.avgPaymentDays)}
                                </li>
                            `).join('')}
                        </ul>
                    </div>

                    ${this.data.insights.uncategorizedCount > 0 ? `
                        <div class="insight-card warning">
                            <h4>⚠️ Nicht kategorisierte Forderungen</h4>
                            <p>
                                <strong>${this.data.insights.uncategorizedCount}</strong> Forderungen
                                im Wert von <strong>€${this.formatNumber(this.data.insights.uncategorizedAmount)}</strong>
                                sind noch nicht kategorisiert.
                            </p>
                            <a href="#" onclick="navigateTo('/forderungen'); return false;" class="btn-link">
                                Kategorien zuweisen →
                            </a>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;

        // Render chart
        this.renderChart();
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
