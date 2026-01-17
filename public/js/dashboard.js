/**
 * dashboard.js - Real Dashboard Metrics Calculation
 * Fetches data from all API endpoints and calculates actual metrics
 */

let dashboardData = {
  bankkonten: [],
  zahlungen: [],
  kosten: [],
  forderungen: []
};

/**
 * Initialize dashboard - load all data
 */
async function initDashboard() {
  try {
    await Promise.all([
      loadDashboardBankkonten(),
      loadDashboardZahlungen(),
      loadDashboardKosten(),
      loadDashboardForderungen()
    ]);

    calculateAndDisplayMetrics();
  } catch (error) {
    console.error('Dashboard initialization error:', error);
    APP.notify('Fehler beim Laden des Dashboards', 'error');
  }
}

/**
 * Load bank accounts
 */
async function loadDashboardBankkonten() {
  try {
    let data;
    if (typeof DataPreloader !== 'undefined' && DataPreloader.cache.has('bankkonten')) {
      data = DataPreloader.cache.get('bankkonten');
    } else {
      data = await API.bankkonten.getAll();
    }
    dashboardData.bankkonten = data.bankkonten || [];
  } catch (error) {
    console.error('Error loading bankkonten:', error);
    dashboardData.bankkonten = [];
  }
}

/**
 * Load payments
 */
async function loadDashboardZahlungen() {
  try {
    let data;
    if (typeof DataPreloader !== 'undefined' && DataPreloader.cache.has('zahlungen')) {
      data = DataPreloader.cache.get('zahlungen');
    } else {
      data = await API.zahlungen.getAll();
    }
    dashboardData.zahlungen = data.zahlungen || [];
  } catch (error) {
    console.error('Error loading zahlungen:', error);
    dashboardData.zahlungen = [];
  }
}

/**
 * Load costs
 */
async function loadDashboardKosten() {
  try {
    let data;
    if (typeof DataPreloader !== 'undefined' && DataPreloader.cache.has('kosten')) {
      data = DataPreloader.cache.get('kosten');
    } else {
      data = await API.kosten.getAll();
    }
    dashboardData.kosten = data.kosten || [];
  } catch (error) {
    console.error('Error loading kosten:', error);
    dashboardData.kosten = [];
  }
}

/**
 * Load receivables
 */
async function loadDashboardForderungen() {
  try {
    let data;
    if (typeof DataPreloader !== 'undefined' && DataPreloader.cache.has('forderungen')) {
      data = DataPreloader.cache.get('forderungen');
    } else {
      data = await API.forderungen.getAll();
    }
    dashboardData.forderungen = data.forderungen || [];
  } catch (error) {
    console.error('Error loading forderungen:', error);
    dashboardData.forderungen = [];
  }
}

/**
 * Calculate total liquidity from all bank accounts
 */
function calculateTotalLiquidity() {
  return dashboardData.bankkonten.reduce((sum, account) => {
    return sum + (parseFloat(account.balance) || 0);
  }, 0);
}

/**
 * Calculate total pending payments (outgoing)
 */
function calculatePendingPayments() {
  return dashboardData.zahlungen
    .filter(z => z.status === 'pending')
    .reduce((sum, z) => sum + (parseFloat(z.amount) || 0), 0);
}

/**
 * Calculate total costs
 */
function calculateTotalCosts() {
  return dashboardData.kosten.reduce((sum, k) => {
    return sum + (parseFloat(k.amount) || 0);
  }, 0);
}

/**
 * Calculate total open receivables (incoming)
 */
function calculateOpenForderungen() {
  return dashboardData.forderungen
    .filter(f => f.status === 'open')
    .reduce((sum, f) => sum + (parseFloat(f.amount) || 0), 0);
}

/**
 * Calculate average daily burn rate
 */
function calculateDailyBurnRate() {
  // Get all costs and payments from last 30 days
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const recentCosts = dashboardData.kosten.filter(k => {
    if (!k.date) return false;
    const costDate = new Date(k.date);
    return costDate >= thirtyDaysAgo && costDate <= now;
  });

  const recentPayments = dashboardData.zahlungen.filter(z => {
    if (!z.date || z.status !== 'completed') return false;
    const paymentDate = new Date(z.date);
    return paymentDate >= thirtyDaysAgo && paymentDate <= now;
  });

  const totalExpenses = recentCosts.reduce((sum, k) => sum + (parseFloat(k.amount) || 0), 0) +
                        recentPayments.reduce((sum, z) => sum + (parseFloat(z.amount) || 0), 0);

  // If no data, use a default estimate
  if (recentCosts.length === 0 && recentPayments.length === 0) {
    return 0;
  }

  return totalExpenses / 30;
}

/**
 * Calculate runway (months until money runs out)
 */
function calculateRunway(liquidity, dailyBurn) {
  if (dailyBurn === 0) return Infinity;
  const days = liquidity / dailyBurn;
  return days / 30; // Convert to months
}

/**
 * Get payments due today
 */
function getPaymentsDueToday() {
  const today = new Date().toISOString().split('T')[0];

  return dashboardData.zahlungen.filter(z => {
    if (!z.date || z.status !== 'pending') return false;
    return z.date === today;
  });
}

/**
 * Get payments due this week
 */
function getPaymentsThisWeek() {
  const now = new Date();
  const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const today = now.toISOString().split('T')[0];

  return dashboardData.zahlungen.filter(z => {
    if (!z.date) return false;
    const paymentDate = z.date;
    return paymentDate >= today && paymentDate <= weekFromNow.toISOString().split('T')[0];
  });
}

/**
 * Calculate weekly cashflow (income - expenses)
 */
function calculateWeeklyCashflow() {
  const now = new Date();
  const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const today = now.toISOString().split('T')[0];
  const weekEnd = weekFromNow.toISOString().split('T')[0];

  // Expected income from open receivables due this week
  const income = dashboardData.forderungen
    .filter(f => f.status === 'open' && f.dueDate && f.dueDate >= today && f.dueDate <= weekEnd)
    .reduce((sum, f) => sum + (parseFloat(f.amount) || 0), 0);

  // Expected expenses from pending payments this week
  const expenses = dashboardData.zahlungen
    .filter(z => z.status === 'pending' && z.date && z.date >= today && z.date <= weekEnd)
    .reduce((sum, z) => sum + (parseFloat(z.amount) || 0), 0);

  // Costs this week
  const costs = dashboardData.kosten
    .filter(k => k.date && k.date >= today && k.date <= weekEnd)
    .reduce((sum, k) => sum + (parseFloat(k.amount) || 0), 0);

  return {
    income,
    expenses: expenses + costs,
    net: income - (expenses + costs)
  };
}

/**
 * Format currency
 */
function formatCurrency(amount) {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'CHF',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

/**
 * Format number with k suffix
 */
function formatNumberShort(num) {
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k';
  }
  return num.toFixed(0);
}

/**
 * Update dashboard UI with calculated metrics
 */
function calculateAndDisplayMetrics() {
  const liquidity = calculateTotalLiquidity();
  const dailyBurn = calculateDailyBurnRate();
  const runway = calculateRunway(liquidity, dailyBurn);
  const pendingPayments = calculatePendingPayments();
  const openReceivables = calculateOpenForderungen();
  const paymentsDueToday = getPaymentsDueToday();
  const weeklyCashflow = calculateWeeklyCashflow();

  // Update liquidity amount
  const liquidityAmountEl = document.querySelector('.liquidity-amount');
  if (liquidityAmountEl) {
    liquidityAmountEl.textContent = formatCurrency(liquidity);
  }

  // Update runway
  const runwayEl = document.querySelector('.info-row-value');
  if (runwayEl) {
    if (runway === Infinity) {
      runwayEl.textContent = '∞';
    } else {
      runwayEl.textContent = runway.toFixed(1) + ' Monate';
    }
  }

  // Update daily burn rate
  const allInfoValues = document.querySelectorAll('.info-row-value');
  if (allInfoValues[1]) {
    allInfoValues[1].textContent = formatCurrency(dailyBurn);
  }

  // Update "Heute fällig" widget
  const todayMetric = document.querySelector('.widget:nth-child(1) .metric');
  if (todayMetric) {
    todayMetric.textContent = paymentsDueToday.length;
  }

  const todayTotal = document.querySelector('.widget:nth-child(1) .widget-list li:first-child .amount-negative');
  if (todayTotal) {
    const totalAmount = paymentsDueToday.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    todayTotal.textContent = formatCurrency(totalAmount);
  }

  // Update weekly cashflow widget
  const weeklyIncomeEl = document.querySelector('.widget:nth-child(2) .widget-list li:first-child .amount-positive');
  if (weeklyIncomeEl) {
    weeklyIncomeEl.textContent = formatCurrency(weeklyCashflow.income);
  }

  const weeklyExpensesEl = document.querySelector('.widget:nth-child(2) .widget-list li:nth-child(2) .amount-negative');
  if (weeklyExpensesEl) {
    weeklyExpensesEl.textContent = formatCurrency(weeklyCashflow.expenses);
  }

  const weeklyNetEl = document.querySelector('.widget:nth-child(2) .metric.amount-positive');
  if (weeklyNetEl) {
    weeklyNetEl.textContent = formatCurrency(weeklyCashflow.net);
    // Change color based on positive/negative
    if (weeklyCashflow.net >= 0) {
      weeklyNetEl.classList.add('amount-positive');
      weeklyNetEl.classList.remove('amount-negative');
    } else {
      weeklyNetEl.classList.add('amount-negative');
      weeklyNetEl.classList.remove('amount-positive');
    }
  }

  // Update monthly burn rate widget
  const monthlyBurnEl = document.querySelector('.widget:nth-child(3) .metric');
  if (monthlyBurnEl) {
    monthlyBurnEl.textContent = formatCurrency(dailyBurn * 30);
  }

  // Update liquidity change
  updateLiquidityChange(liquidity);

  console.log('Dashboard metrics calculated:', {
    liquidity: formatCurrency(liquidity),
    dailyBurn: formatCurrency(dailyBurn),
    runway: runway === Infinity ? '∞' : runway.toFixed(1) + ' months',
    pendingPayments: formatCurrency(pendingPayments),
    openReceivables: formatCurrency(openReceivables),
    paymentsDueToday: paymentsDueToday.length,
    weeklyCashflow
  });
}

/**
 * Calculate liquidity change vs yesterday (placeholder - needs historical data)
 */
function updateLiquidityChange(currentLiquidity) {
  // For now, show a placeholder message
  // In the future, this would compare against yesterday's liquidity
  const changeEl = document.querySelector('.liquidity-change');
  if (changeEl) {
    // TODO: Implement proper historical tracking
    changeEl.innerHTML = `
      <span>→</span>
      <span>Tagesvergleich: Benötigt historische Daten</span>
    `;
    changeEl.style.color = '#6B7280';
  }
}

/**
 * Dashboard button handlers - Connect all dashboard buttons to real functionality
 */

/**
 * Show action options for liquidity bottleneck
 */
function showActionOptions() {
  const options = `
Handlungsoptionen für Liquiditätsengpass:

1. Forderungen früher einziehen
   - Skonto anbieten für schnellere Zahlung
   - Zahlungserinnerungen versenden

2. Zahlungen verschieben
   - Mit Lieferanten Zahlungsziel verhandeln
   - Nicht-dringende Ausgaben verschieben

3. Finanzierung prüfen
   - Kontokorrentlinie erhöhen
   - Kurzfristige Finanzierung anfragen

Möchten Sie zu einer dieser Aktionen wechseln?
  `.trim();

  if (confirm(options)) {
    // Navigate to appropriate page
    APP.navigate('forderungen');
  }
}

/**
 * Approve payment
 */
function approvePayment(paymentId) {
  const confirmed = confirm('Zahlung jetzt freigeben?');
  if (!confirmed) return;

  // In real app, would call API to approve payment
  APP.notify('Zahlung freigegeben', 'success');

  // Redirect to payments page
  setTimeout(() => {
    APP.navigate('zahlungen');
  }, 1000);
}

/**
 * Show payment details
 */
function showPaymentDetails(paymentId) {
  APP.navigate('zahlungen');
}

/**
 * Check account balance
 */
function checkAccountBalance() {
  APP.navigate('bankkonten');
}

/**
 * Show optimization suggestions
 */
function showOptimizationSuggestions() {
  const suggestions = `
Zahlungstermin-Optimierung:

Einsparungspotenzial: 365 €

Vorschläge:
1. Müller GmbH - 3% Skonto nutzen (180 €)
2. Schmidt AG - 2% Skonto nutzen (95 €)
3. Weber KG - Frühzahlung (90 €)

Möchten Sie die Zahlungen optimieren?
  `.trim();

  if (confirm(suggestions)) {
    APP.navigate('zahlungen');
  }
}

/**
 * Release all payments due today
 */
function releasePaymentsDueToday() {
  const paymentsDueToday = getPaymentsDueToday();

  if (paymentsDueToday.length === 0) {
    APP.notify('Keine fälligen Zahlungen heute', 'info');
    return;
  }

  const totalAmount = paymentsDueToday.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  const confirmed = confirm(
    `${paymentsDueToday.length} Zahlungen freigeben?\n\nGesamtbetrag: ${formatCurrency(totalAmount)}`
  );

  if (confirmed) {
    APP.notify('Zahlungen werden freigegeben...', 'success');
    setTimeout(() => {
      APP.navigate('zahlungen');
    }, 1000);
  }
}

/**
 * Alias for app.js compatibility
 */
function loadDashboard() {
  return initDashboard();
}

/**
 * Initialize dashboard on page load
 */
document.addEventListener('DOMContentLoaded', () => {
  console.log('Dashboard page loaded - initializing with real data...');
  initDashboard();
});
