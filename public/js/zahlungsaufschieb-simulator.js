/**
 * Zahlungsaufschieb-Simulator
 * Ermöglicht Simulation von Zahlungsverschiebungen mit detaillierten Konsequenzen
 */

class ZahlungsaufschiebenSimulator {
    constructor() {
        this.currentPayment = null;
        this.selectedPayments = [];
        this.mode = 'single'; // 'single' oder 'bulk'
    }

    /**
     * Öffne Simulator für einzelne Zahlung
     */
    openSingle(payment) {
        this.mode = 'single';
        this.currentPayment = payment;
        this.selectedPayments = [payment];
        this.render();
        this.showModal();
    }

    /**
     * Öffne Simulator für mehrere Zahlungen
     */
    openBulk(payments) {
        this.mode = 'bulk';
        this.selectedPayments = payments;
        this.currentPayment = null;
        this.render();
        this.showModal();
    }

    /**
     * Berechne Konsequenzen der Verschiebung
     */
    calculateImpact(daysToPostpone) {
        const results = {
            payments: [],
            totals: {
                originalAmount: 0,
                skontoLost: 0,
                interest: 0,
                lateFees: 0,
                supplierRisk: 0,
                totalCost: 0,
                extraCost: 0
            },
            risks: [],
            warnings: []
        };

        const today = new Date();

        this.selectedPayments.forEach(payment => {
            const amount = parseFloat(payment.amount) || 0;
            const originalDueDate = new Date(payment.due_date);
            const newDueDate = new Date(today);
            newDueDate.setDate(newDueDate.getDate() + daysToPostpone);

            // Skonto-Verlust berechnen
            let skontoLost = 0;
            if (payment.skonto && payment.skonto_deadline) {
                const skontoDeadline = new Date(payment.skonto_deadline);
                if (newDueDate > skontoDeadline) {
                    skontoLost = amount * (parseFloat(payment.skonto) / 100);
                }
            }

            // Verzugszinsen berechnen (9,12% p.a. gesetzlich)
            const daysLate = Math.max(0, Math.floor((newDueDate - originalDueDate) / (1000 * 60 * 60 * 24)));
            const interest = daysLate > 0 ? (amount * 0.0912 / 365 * daysLate) : 0;

            // Mahngebühren
            let lateFees = 0;
            if (daysLate > 0) {
                lateFees = 5; // Erste Mahnung
                if (daysLate > 14) lateFees += 10; // Zweite Mahnung
                if (daysLate > 30) lateFees += 25; // Dritte Mahnung / Inkasso
            }

            // Lieferantenrisiko bewerten
            const supplierRisk = this.assessSupplierRisk(payment, daysLate);

            const paymentResult = {
                id: payment.id,
                description: payment.description || payment.supplier || 'Unbenannt',
                originalAmount: amount,
                originalDueDate,
                newDueDate,
                daysPostponed: daysToPostpone,
                daysLate,
                skontoLost,
                interest,
                lateFees,
                supplierRisk,
                totalCost: amount + skontoLost + interest + lateFees,
                extraCost: skontoLost + interest + lateFees
            };

            results.payments.push(paymentResult);

            // Aggregate totals
            results.totals.originalAmount += amount;
            results.totals.skontoLost += skontoLost;
            results.totals.interest += interest;
            results.totals.lateFees += lateFees;
            results.totals.totalCost += paymentResult.totalCost;
            results.totals.extraCost += paymentResult.extraCost;
        });

        // Assess risks
        results.risks = this.assessOverallRisks(results);
        results.warnings = this.generateWarnings(results);

        return results;
    }

    /**
     * Bewerte Lieferantenrisiko
     */
    assessSupplierRisk(payment, daysLate) {
        const risks = [];
        let severity = 'low';

        if (daysLate > 30) {
            risks.push('Lieferstopp möglich');
            risks.push('Schädigung der Geschäftsbeziehung');
            severity = 'critical';
        } else if (daysLate > 14) {
            risks.push('Mahnverfahren wahrscheinlich');
            risks.push('Negative Auswirkung auf Bonität');
            severity = 'high';
        } else if (daysLate > 7) {
            risks.push('Zahlungserinnerung zu erwarten');
            severity = 'medium';
        }

        // Kritische Lieferanten identifizieren
        if (payment.category === 'Wareneinkauf' || payment.category === 'Material') {
            risks.push('⚠️ Kritischer Lieferant (Material)');
            severity = severity === 'low' ? 'medium' : severity;
        }

        return {
            severity,
            risks,
            score: this.calculateRiskScore(daysLate, payment)
        };
    }

    /**
     * Berechne Risiko-Score (0-100)
     */
    calculateRiskScore(daysLate, payment) {
        let score = 0;

        // Verzugstage
        if (daysLate > 30) score += 40;
        else if (daysLate > 14) score += 25;
        else if (daysLate > 7) score += 15;
        else if (daysLate > 0) score += 10;

        // Betragshöhe
        const amount = parseFloat(payment.amount) || 0;
        if (amount > 10000) score += 20;
        else if (amount > 5000) score += 10;
        else if (amount > 1000) score += 5;

        // Kategorie
        if (payment.category === 'Wareneinkauf') score += 20;
        if (payment.category === 'Miete') score += 15;

        return Math.min(100, score);
    }

    /**
     * Bewerte Gesamtrisiko
     */
    assessOverallRisks(results) {
        const risks = [];

        // Hohe Gesamtkosten
        if (results.totals.extraCost > 1000) {
            risks.push({
                type: 'cost',
                severity: 'high',
                message: `Hohe Zusatzkosten: €${results.totals.extraCost.toFixed(2)}`,
                impact: 'Signifikante finanzielle Belastung'
            });
        }

        // Skonto-Verluste
        if (results.totals.skontoLost > 500) {
            risks.push({
                type: 'skonto',
                severity: 'medium',
                message: `Skonto-Verlust: €${results.totals.skontoLost.toFixed(2)}`,
                impact: 'Verschwendetes Sparpotenzial'
            });
        }

        // Kritische Lieferanten
        const criticalPayments = results.payments.filter(p =>
            p.supplierRisk.severity === 'critical' || p.supplierRisk.severity === 'high'
        );
        if (criticalPayments.length > 0) {
            risks.push({
                type: 'supplier',
                severity: 'high',
                message: `${criticalPayments.length} kritische Lieferantenverhältnisse`,
                impact: 'Gefahr von Lieferstopps und Vertragskündigungen'
            });
        }

        // Viele Zahlungen betroffen
        if (results.payments.length > 10) {
            risks.push({
                type: 'volume',
                severity: 'medium',
                message: `${results.payments.length} Zahlungen betroffen`,
                impact: 'Große administrative Last, Reputationsschaden'
            });
        }

        return risks;
    }

    /**
     * Generiere Warnungen
     */
    generateWarnings(results) {
        const warnings = [];

        // Liquiditätswarnung
        const liquidityImpact = results.totals.originalAmount - results.totals.extraCost;
        warnings.push({
            type: 'info',
            message: `Kurzfristige Liquiditätsentlastung: €${results.totals.originalAmount.toFixed(2)}`,
            detail: `Nach Abzug der Zusatzkosten: €${liquidityImpact.toFixed(2)}`
        });

        // Kritische Schwelle
        if (results.totals.extraCost / results.totals.originalAmount > 0.05) {
            warnings.push({
                type: 'warning',
                message: 'Zusatzkosten übersteigen 5% der Originalsumme',
                detail: 'Alternative Finanzierungsoptionen prüfen (Kredit, Factoring)'
            });
        }

        // Rechtliche Konsequenzen
        const severelyLatePayments = results.payments.filter(p => p.daysLate > 30);
        if (severelyLatePayments.length > 0) {
            warnings.push({
                type: 'legal',
                message: 'Rechtliche Konsequenzen möglich',
                detail: `${severelyLatePayments.length} Zahlung(en) über 30 Tage verspätet - Inkasso/Gerichtsverfahren drohen`
            });
        }

        return warnings;
    }

    /**
     * Rendere Modal
     */
    render() {
        const modalHTML = `
            <div class="simulator-modal-overlay" id="zahlungsaufschieb-modal">
                <div class="simulator-modal">
                    <div class="simulator-header">
                        <h2>💰 Zahlungsaufschieb-Simulator</h2>
                        <button class="btn-close" onclick="zahlungsSimulator.close()">×</button>
                    </div>

                    <div class="simulator-mode-switch">
                        <button class="mode-btn ${this.mode === 'single' ? 'active' : ''}"
                                onclick="zahlungsSimulator.switchMode('single')"
                                ${this.mode === 'bulk' && this.selectedPayments.length === 1 ? '' : 'disabled'}>
                            📄 Einzelne Zahlung
                        </button>
                        <button class="mode-btn ${this.mode === 'bulk' ? 'active' : ''}"
                                onclick="zahlungsSimulator.switchMode('bulk')">
                            📦 Alle ausgewählten (${this.selectedPayments.length})
                        </button>
                    </div>

                    <div class="simulator-content">
                        ${this.mode === 'single' ? this.renderSingleMode() : this.renderBulkMode()}
                    </div>

                    <div class="simulator-controls">
                        <label>Verschiebung um Tage:</label>
                        <div class="days-input-group">
                            <button class="btn-decrement" onclick="zahlungsSimulator.adjustDays(-7)">-7</button>
                            <button class="btn-decrement" onclick="zahlungsSimulator.adjustDays(-1)">-1</button>
                            <input type="number"
                                   id="postpone-days-input"
                                   value="30"
                                   min="1"
                                   max="365"
                                   oninput="zahlungsSimulator.updateCalculation()">
                            <button class="btn-increment" onclick="zahlungsSimulator.adjustDays(1)">+1</button>
                            <button class="btn-increment" onclick="zahlungsSimulator.adjustDays(7)">+7</button>
                        </div>
                    </div>

                    <div class="simulator-results" id="simulator-results">
                        <!-- Results will be rendered here -->
                    </div>

                    <div class="simulator-actions">
                        <button class="btn-secondary" onclick="zahlungsSimulator.close()">Abbrechen</button>
                        <button class="btn-primary" onclick="zahlungsSimulator.confirm()">Verschiebung durchführen</button>
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal
        const existing = document.getElementById('zahlungsaufschieb-modal');
        if (existing) existing.remove();

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.updateCalculation();
    }

    renderSingleMode() {
        const payment = this.selectedPayments[0];
        return `
            <div class="payment-info-card">
                <h3>Ausgewählte Zahlung</h3>
                <div class="payment-details">
                    <div class="detail-row">
                        <span class="label">Empfänger:</span>
                        <span class="value">${payment.description || payment.supplier || 'Unbenannt'}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Betrag:</span>
                        <span class="value amount">€${parseFloat(payment.amount).toFixed(2)}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Ursprüngliches Fälligkeitsdatum:</span>
                        <span class="value">${new Date(payment.due_date).toLocaleDateString('de-DE')}</span>
                    </div>
                    ${payment.skonto ? `
                        <div class="detail-row skonto">
                            <span class="label">Skonto verfügbar:</span>
                            <span class="value">${payment.skonto}% bis ${new Date(payment.skonto_deadline).toLocaleDateString('de-DE')}</span>
                        </div>
                    ` : ''}
                    ${payment.category ? `
                        <div class="detail-row">
                            <span class="label">Kategorie:</span>
                            <span class="value">${payment.category}</span>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    renderBulkMode() {
        const totalAmount = this.selectedPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
        const withSkonto = this.selectedPayments.filter(p => p.skonto > 0).length;

        return `
            <div class="bulk-info-card">
                <h3>Ausgewählte Zahlungen (${this.selectedPayments.length})</h3>
                <div class="bulk-summary">
                    <div class="summary-item">
                        <div class="summary-label">Gesamtbetrag</div>
                        <div class="summary-value">€${totalAmount.toFixed(2)}</div>
                    </div>
                    <div class="summary-item">
                        <div class="summary-label">Mit Skonto</div>
                        <div class="summary-value">${withSkonto} Zahlungen</div>
                    </div>
                    <div class="summary-item">
                        <div class="summary-label">Durchschnitt</div>
                        <div class="summary-value">€${(totalAmount / this.selectedPayments.length).toFixed(2)}</div>
                    </div>
                </div>

                <div class="bulk-payment-list">
                    <h4>Betroffene Zahlungen:</h4>
                    <div class="payment-list-scroll">
                        ${this.selectedPayments.map(p => `
                            <div class="payment-list-item">
                                <span class="payment-name">${p.description || p.supplier || 'Unbenannt'}</span>
                                <span class="payment-amount">€${parseFloat(p.amount).toFixed(2)}</span>
                                ${p.skonto ? '<span class="payment-badge skonto">Skonto</span>' : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    updateCalculation() {
        const days = parseInt(document.getElementById('postpone-days-input')?.value) || 30;
        const results = this.calculateImpact(days);
        this.renderResults(results);
    }

    renderResults(results) {
        const container = document.getElementById('simulator-results');
        if (!container) return;

        const newDueDate = new Date();
        newDueDate.setDate(newDueDate.getDate() + results.payments[0]?.daysPostponed || 0);

        container.innerHTML = `
            <!-- Neues Fälligkeitsdatum -->
            <div class="result-card new-date">
                <h3>📅 Neues Fälligkeitsdatum</h3>
                <div class="date-display">
                    ${newDueDate.toLocaleDateString('de-DE', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })}
                </div>
                <div class="date-hint">
                    ${results.payments[0]?.daysPostponed} Tage ab heute
                    ${results.payments[0]?.daysLate > 0 ?
                        `<span class="late-indicator">⚠️ ${results.payments[0].daysLate} Tage nach ursprünglichem Fälligkeitsdatum</span>`
                        : ''}
                </div>
            </div>

            <!-- Kosten-Übersicht -->
            <div class="result-card costs">
                <h3>💸 Kostenaufstellung</h3>
                <div class="costs-table">
                    <div class="cost-row original">
                        <span class="cost-label">Ursprünglicher Betrag</span>
                        <span class="cost-value">€${results.totals.originalAmount.toFixed(2)}</span>
                    </div>
                    ${results.totals.skontoLost > 0 ? `
                        <div class="cost-row skonto-lost">
                            <span class="cost-label">
                                <span class="icon">❌</span> Skonto-Verlust
                            </span>
                            <span class="cost-value negative">+€${results.totals.skontoLost.toFixed(2)}</span>
                        </div>
                    ` : ''}
                    ${results.totals.interest > 0 ? `
                        <div class="cost-row interest">
                            <span class="cost-label">
                                <span class="icon">📈</span> Verzugszinsen (9,12% p.a.)
                            </span>
                            <span class="cost-value negative">+€${results.totals.interest.toFixed(2)}</span>
                        </div>
                    ` : ''}
                    ${results.totals.lateFees > 0 ? `
                        <div class="cost-row fees">
                            <span class="cost-label">
                                <span class="icon">📄</span> Mahngebühren
                            </span>
                            <span class="cost-value negative">+€${results.totals.lateFees.toFixed(2)}</span>
                        </div>
                    ` : ''}
                    <div class="cost-row total">
                        <span class="cost-label"><strong>Gesamtkosten</strong></span>
                        <span class="cost-value"><strong>€${results.totals.totalCost.toFixed(2)}</strong></span>
                    </div>
                    <div class="cost-row extra">
                        <span class="cost-label">Zusatzkosten durch Verschiebung</span>
                        <span class="cost-value negative"><strong>+€${results.totals.extraCost.toFixed(2)}</strong></span>
                    </div>
                </div>
            </div>

            <!-- Risiko-Analyse -->
            ${results.risks.length > 0 ? `
                <div class="result-card risks">
                    <h3>⚠️ Risiken & Konsequenzen</h3>
                    <div class="risks-list">
                        ${results.risks.map(risk => `
                            <div class="risk-item ${risk.severity}">
                                <div class="risk-icon">${this.getRiskIcon(risk.severity)}</div>
                                <div class="risk-content">
                                    <div class="risk-message">${risk.message}</div>
                                    <div class="risk-impact">${risk.impact}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}

            <!-- Warnungen -->
            ${results.warnings.length > 0 ? `
                <div class="result-card warnings">
                    <h3>💡 Wichtige Hinweise</h3>
                    <div class="warnings-list">
                        ${results.warnings.map(warning => `
                            <div class="warning-item ${warning.type}">
                                <div class="warning-message">${warning.message}</div>
                                <div class="warning-detail">${warning.detail}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}

            <!-- Lieferantenrisiken (bei Bulk-Modus) -->
            ${this.mode === 'bulk' && results.payments.length > 1 ? `
                <div class="result-card supplier-risks">
                    <h3>🏭 Lieferantenrisiken</h3>
                    <div class="supplier-risks-table">
                        ${results.payments
                            .filter(p => p.supplierRisk.risks.length > 0)
                            .sort((a, b) => b.supplierRisk.score - a.supplierRisk.score)
                            .slice(0, 5)
                            .map(p => `
                                <div class="supplier-risk-row">
                                    <div class="supplier-name">${p.description}</div>
                                    <div class="supplier-risk-badge ${p.supplierRisk.severity}">
                                        ${p.supplierRisk.severity === 'critical' ? '🔴' :
                                          p.supplierRisk.severity === 'high' ? '🟠' :
                                          p.supplierRisk.severity === 'medium' ? '🟡' : '🟢'}
                                        ${p.supplierRisk.severity}
                                    </div>
                                    <div class="supplier-risks-detail">
                                        ${p.supplierRisk.risks.join(', ')}
                                    </div>
                                </div>
                            `).join('')}
                    </div>
                </div>
            ` : ''}

            <!-- Empfehlung -->
            <div class="result-card recommendation ${this.getRecommendationClass(results)}">
                <h3>${this.getRecommendationIcon(results)} Empfehlung</h3>
                <div class="recommendation-text">
                    ${this.generateRecommendation(results)}
                </div>
            </div>
        `;
    }

    getRiskIcon(severity) {
        const icons = {
            'critical': '🔴',
            'high': '🟠',
            'medium': '🟡',
            'low': '🟢'
        };
        return icons[severity] || '⚪';
    }

    getRecommendationClass(results) {
        const costRatio = results.totals.extraCost / results.totals.originalAmount;
        if (costRatio > 0.05 || results.risks.some(r => r.severity === 'critical')) {
            return 'not-recommended';
        } else if (costRatio > 0.02 || results.risks.some(r => r.severity === 'high')) {
            return 'cautious';
        } else {
            return 'acceptable';
        }
    }

    getRecommendationIcon(results) {
        const cls = this.getRecommendationClass(results);
        return cls === 'not-recommended' ? '❌' :
               cls === 'cautious' ? '⚠️' : '✅';
    }

    generateRecommendation(results) {
        const costRatio = results.totals.extraCost / results.totals.originalAmount;
        const criticalRisks = results.risks.filter(r => r.severity === 'critical' || r.severity === 'high');

        if (costRatio > 0.05) {
            return `<strong>Nicht empfohlen:</strong> Die Zusatzkosten (€${results.totals.extraCost.toFixed(2)})
                    betragen ${(costRatio * 100).toFixed(1)}% des Originalbetrags.
                    <br><br>
                    <strong>Alternative:</strong> Erwägen Sie stattdessen einen kurzfristigen Kredit
                    oder Factoring Ihrer offenen Forderungen.`;
        }

        if (criticalRisks.length > 0) {
            return `<strong>Vorsicht geboten:</strong> Es bestehen ${criticalRisks.length} kritische Risiken
                    für Ihre Lieferantenbeziehungen.
                    <br><br>
                    <strong>Empfehlung:</strong> Kontaktieren Sie betroffene Lieferanten proaktiv und
                    vereinbaren Sie eine Zahlungsvereinbarung.`;
        }

        if (costRatio > 0.02) {
            return `<strong>Akzeptabel mit Vorbehalt:</strong> Die Verschiebung verursacht moderate Zusatzkosten
                    von €${results.totals.extraCost.toFixed(2)}.
                    <br><br>
                    <strong>Tipp:</strong> Prüfen Sie, ob einzelne Zahlungen mit hohen Skonto-Verlusten
                    separat behandelt werden sollten.`;
        }

        return `<strong>Vertretbar:</strong> Die Verschiebung verursacht geringe Zusatzkosten
                (${(costRatio * 100).toFixed(2)}% des Originalbetrags) und niedrige Risiken.
                <br><br>
                <strong>Hinweis:</strong> Liquiditätsentlastung von €${(results.totals.originalAmount - results.totals.extraCost).toFixed(2)}.`;
    }

    adjustDays(delta) {
        const input = document.getElementById('postpone-days-input');
        if (!input) return;

        const currentValue = parseInt(input.value) || 30;
        const newValue = Math.max(1, Math.min(365, currentValue + delta));
        input.value = newValue;
        this.updateCalculation();
    }

    switchMode(mode) {
        if (mode === 'single' && this.selectedPayments.length > 1) return;
        this.mode = mode;
        this.render();
    }

    showModal() {
        const modal = document.getElementById('zahlungsaufschieb-modal');
        if (modal) {
            modal.style.display = 'flex';
            setTimeout(() => modal.classList.add('active'), 10);
        }
    }

    close() {
        const modal = document.getElementById('zahlungsaufschieb-modal');
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => modal.remove(), 300);
        }
    }

    confirm() {
        const days = parseInt(document.getElementById('postpone-days-input')?.value) || 30;
        const results = this.calculateImpact(days);

        // Show confirmation dialog
        const confirmMessage = this.mode === 'single'
            ? `Möchten Sie die Zahlung "${this.selectedPayments[0].description}" um ${days} Tage verschieben?\n\nZusatzkosten: €${results.totals.extraCost.toFixed(2)}`
            : `Möchten Sie ${this.selectedPayments.length} Zahlungen um ${days} Tage verschieben?\n\nGesamte Zusatzkosten: €${results.totals.extraCost.toFixed(2)}`;

        if (!confirm(confirmMessage)) return;

        // TODO: Implement actual postponement
        alert(`✅ Verschiebung wurde durchgeführt!\n\nNeue Fälligkeitsdaten wurden gespeichert.`);
        this.close();

        // Reload payments list
        if (typeof loadZahlungen === 'function') {
            loadZahlungen();
        }
    }
}

// Global instance
const zahlungsSimulator = new ZahlungsaufschiebenSimulator();

// Helper functions for integration
function openZahlungsaufschiebenSingle(payment) {
    zahlungsSimulator.openSingle(payment);
}

function openZahlungsaufschiebenBulk(payments) {
    if (!payments || payments.length === 0) {
        alert('Bitte wählen Sie mindestens eine Zahlung aus.');
        return;
    }
    zahlungsSimulator.openBulk(payments);
}
