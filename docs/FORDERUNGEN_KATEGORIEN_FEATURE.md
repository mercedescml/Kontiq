# Forderungskategorien Feature - Dokumentation

## Überblick

Das Forderungskategorien-Feature ermöglicht es Benutzern, ihre Einnahmen (Forderungen) zu kategorisieren und detaillierte Analysen durchzuführen, um zu verstehen, welche Geschäftsbereiche am profitabelsten sind und wie sich das Zahlungsverhalten unterscheidet.

## 🎯 Geschäftlicher Nutzen

### Für das Unternehmen:

1. **Umsatzanalyse nach Geschäftsbereichen**
   - Welche Kategorie generiert den meisten Umsatz?
   - Welche Bereiche wachsen oder schrumpfen?
   - Strategische Entscheidungen basierend auf Datenfakten

2. **Zahlungsverhalten pro Kategorie**
   - Welche Kundensegmente zahlen pünktlich?
   - Wo sind Zahlungsverzögerungen häufig?
   - Risikomanagement und Cash Flow Planung

3. **Skonto-Optimierung**
   - In welchen Kategorien wird Skonto am häufigsten genutzt?
   - Wo lohnt sich Skonto besonders?
   - ROI-Analyse pro Geschäftsbereich

4. **Überfällige Forderungen identifizieren**
   - Welche Kategorien haben hohe Außenstände?
   - Frühwarnsystem für Liquiditätsprobleme
   - Gezielte Mahnprozesse

## 📊 Bereitgestellte Kennzahlen

### Pro Kategorie:

1. **Umsatz-Metriken**
   - Gesamtumsatz
   - Offene Forderungen
   - Bezahlte Forderungen
   - Überfällige Beträge
   - Durchschnittlicher Rechnungsbetrag

2. **Zahlungsverhalten**
   - Durchschnittliche Zahlungsdauer (in Tagen nach Fälligkeitsdatum)
   - Bewertung: "Sehr pünktlich", "Pünktlich", "Leicht verspätet", "Verspätet", "Sehr verspätet"
   - Anzahl der Forderungen

3. **Skonto-Analyse**
   - Verfügbares Skonto
   - Erfasstes Skonto
   - Verpasstes Skonto

4. **Marktanteil**
   - Prozentuale Verteilung des Umsatzes
   - Visualisierung als Tortendiagramm

### Aggregierte Insights:

1. **Top Performers (nach Umsatz)**
   - Die 5 umsatzstärksten Kategorien
   - Absolute und prozentuale Werte

2. **Top Performers (nach Anzahl)**
   - Die 5 Kategorien mit den meisten Forderungen
   - Durchschnittsbetrag pro Forderung

3. **Top Skonto-Kategorien**
   - Wo wird am meisten Skonto erfasst?
   - ROI-Berechnung

4. **Warnung: Nicht kategorisierte Forderungen**
   - Anzahl und Betrag nicht kategorisierter Forderungen
   - Call-to-Action zur Kategorisierung

## 🏗️ Technische Architektur

### Backend (Node.js / Express)

#### Neue Dateien:
- `data/forderungen_kategorien.json` - Speichert alle Kategorien

#### API Endpoints:

**Kategorieverwaltung:**
```
GET    /api/forderungen-kategorien          # Alle Kategorien abrufen
POST   /api/forderungen-kategorien          # Neue Kategorie erstellen
PUT    /api/forderungen-kategorien/:id      # Kategorie aktualisieren
DELETE /api/forderungen-kategorien/:id      # Kategorie löschen
```

**Liquiditätsanalyse:**
```
GET    /api/liquiditaet/kategorien-analyse   # Detaillierte Analyse
       Query-Parameter:
       - startDate: Filter nach Startdatum (optional)
       - endDate: Filter nach Enddatum (optional)
       - status: Filter nach Status (open/paid/overdue/all, optional)
```

#### Datenstruktur Kategorie:
```json
{
  "id": "CAT-001",
  "name": "Projektarbeit",
  "description": "Einnahmen aus abgeschlossenen Projekten",
  "color": "#1976d2",
  "icon": "briefcase",
  "isDefault": true,
  "created": "2024-01-01T00:00:00.000Z"
}
```

#### Erweiterte Forderungsstruktur:
Forderungen haben jetzt ein zusätzliches Feld:
```json
{
  "id": "INV-001",
  "customer": "Kunde GmbH",
  "amount": 5000,
  "dueDate": "2024-12-31",
  "status": "open",
  "kategorie": "CAT-001",  // NEU: Kategorie-ID
  "skonto": 2,
  "skontoDeadline": "2024-12-10",
  ...
}
```

### Frontend

#### Neue Seiten:
1. **`/views/forderungen-kategorien.html`** - Kategorieverwaltung
   - Grid-Layout mit Kategorie-Karten
   - Modal für Erstellen/Bearbeiten
   - Farbwahl und Icon-Selektor
   - Löschen nur bei nicht verwendeten Kategorien

#### Neue JavaScript-Module:
1. **`js/kategorien-analyse.js`**
   - `KategorienAnalyse` Klasse
   - Dashboard-Widget Rendering
   - Detaillierte Analyse-Seite
   - Chart.js Integration für Tortendiagramm
   - Filter-Funktionen

2. **`js/forderungen-kategorien.js`**
   - Kategorie-Zuweisung für Forderungen
   - Modal für Kategorieauswahl
   - Badge-Rendering
   - Notifications

#### Neue CSS-Dateien:
1. **`css/kategorien-analyse.css`**
   - Responsive Grid-Layouts
   - Karten-Design
   - Tabellen-Styling
   - Chart-Container
   - Insights-Sektion

## 🚀 Verwendung

### 1. Kategorien erstellen

Navigieren Sie zu **Forderungskategorien** (neuer Menüpunkt):
```
/forderungen-kategorien
```

**Standard-Kategorien (vorkonfiguriert):**
- 📁 Projektarbeit
- 🔧 Wartung & Service
- 💡 Beratung
- 🛒 Materialverkauf
- 🏠 Miete & Leasing
- 🔑 Lizenzgebühren

**Neue Kategorie erstellen:**
1. Klick auf "Neue Kategorie"
2. Name eingeben (erforderlich)
3. Beschreibung hinzufügen (optional)
4. Farbe wählen
5. Icon auswählen
6. Speichern

**Kategorie bearbeiten:**
- Klick auf "Bearbeiten" bei der jeweiligen Kategorie
- Änderungen vornehmen
- Speichern

**Kategorie löschen:**
- Nur möglich, wenn keine Forderungen zugewiesen sind
- Standard-Kategorien können nicht gelöscht werden

### 2. Kategorien zuweisen

In der **Forderungen-Ansicht**:

**Option A: Bei Erstellung**
- Beim Erstellen einer neuen Forderung
- Kategorie aus Dropdown auswählen

**Option B: Nachträgliche Zuweisung**
- Klick auf Forderung
- "Kategorie zuweisen" Button
- Kategorie aus Liste auswählen

### 3. Analyse aufrufen

**Dashboard-Widget:**
- Automatisch auf Dashboard angezeigt
- Zeigt Top 5 Kategorien nach Umsatz
- Gesamtsummen (Gesamt, Offen, Überfällig)
- Link zur detaillierten Analyse

**Detaillierte Analyse:**
Navigieren Sie zu **Liquidität** → Tab "Kategorien":
```
/liquiditaet?tab=kategorien
```

**Features:**
- Filtermöglichkeiten (Datum, Status)
- Übersichtskarten mit Key Metrics
- Tortendiagramm der Umsatzverteilung
- Detaillierte Tabelle mit allen Metriken
- Insights-Sektion mit:
  - Top Performers (Umsatz)
  - Top Performers (Anzahl)
  - Zahlungsverhalten
  - Warnung bei nicht kategorisierten Forderungen

## 📈 Business Intelligence Insights

### 1. Umsatzverteilung
**Frage:** Welche Geschäftsbereiche sind am wichtigsten?

**Antwort:** Tortendiagramm zeigt prozentuale Verteilung

**Handlungsempfehlung:**
- Fokus auf Top-Kategorien für Marketing
- Schwache Kategorien analysieren oder einstellen
- Cross-Selling-Potenziale identifizieren

### 2. Zahlungsverhalten
**Frage:** Welche Kunden zahlen wie pünktlich?

**Antwort:** Durchschnittliche Zahlungsdauer pro Kategorie

**Bewertungsskala:**
- **< -5 Tage:** Sehr pünktlich (zahlen früher als Fälligkeit)
- **-5 bis 0 Tage:** Pünktlich
- **0 bis +7 Tage:** Leicht verspätet
- **+7 bis +30 Tage:** Verspätet
- **> +30 Tage:** Sehr verspätet

**Handlungsempfehlung:**
- Bei "Sehr verspätet": Mahnsystem aktivieren
- Bei "Sehr pünktlich": Skonto-Anreize reduzieren (zahlen auch so)
- Cash Flow Planung anpassen

### 3. Skonto-Effizienz
**Frage:** Wo lohnt sich Skonto besonders?

**Antwort:** Skonto erfasst vs. verfügbar pro Kategorie

**Handlungsempfehlung:**
- Hohe Erfassungsrate: Skonto funktioniert, beibehalten
- Niedrige Erfassungsrate: Skonto-Bedingungen anpassen oder streichen
- ROI-Berechnung: Ist der Skonto-Verlust durch Liquidität gerechtfertigt?

### 4. Überfällige Forderungen
**Frage:** Wo drohen Zahlungsausfälle?

**Antwort:** Überfällige Beträge pro Kategorie

**Handlungsempfehlung:**
- Gezielte Mahnungen in Problemkategorien
- Bonitätsprüfung bei neuen Kunden dieser Kategorie
- Vorauszahlung oder Sicherheiten fordern

## 🔄 Workflow-Beispiel

### Szenario: IT-Dienstleister

**1. Kategorien anlegen:**
- Software-Entwicklung
- Wartung & Support
- Beratung
- Schulungen
- Lizenzen

**2. Forderungen kategorisieren:**
- Alle neuen Rechnungen werden kategorisiert
- Historische Rechnungen nachträglich kategorisieren

**3. Analyse nach 3 Monaten:**

**Ergebnisse:**
- Software-Entwicklung: 60% Umsatz, Ø +2 Tage Zahlungsdauer (pünktlich)
- Wartung & Support: 25% Umsatz, Ø -3 Tage (sehr pünktlich)
- Beratung: 10% Umsatz, Ø +15 Tage (verspätet)
- Schulungen: 3% Umsatz, Ø +5 Tage (leicht verspätet)
- Lizenzen: 2% Umsatz, Ø 0 Tage (pünktlich)

**Erkenntnisse:**
1. Software-Entwicklung ist Haupteinnahmequelle → Marketing-Fokus
2. Wartung zahlt am besten → Mehr Wartungsverträge akquirieren
3. Beratung hat Zahlungsprobleme → Mahnwesen aktivieren, Vorauszahlung erwägen
4. Schulungen sind marginal → Potenzial prüfen oder einstellen

**Maßnahmen:**
- Sales-Team: Fokus auf Software & Wartung
- Beratung: Neue Zahlungsbedingungen (50% Vorauszahlung)
- Schulungen: Entweder Marketing intensivieren oder einstellen

## 🔧 Integration mit bestehendem System

### Dashboard Integration

Fügen Sie im Dashboard das Widget hinzu:

```html
<!-- Im Dashboard HTML -->
<div id="kategorien-widget-container"></div>

<!-- Im Dashboard JavaScript -->
<script src="/js/kategorien-analyse.js"></script>
<link rel="stylesheet" href="/css/kategorien-analyse.css">

<script>
async function loadKategorienWidget() {
    await kategorienAnalyse.load();
    kategorienAnalyse.renderDashboardWidget('kategorien-widget-container');
}

document.addEventListener('DOMContentLoaded', loadKategorienWidget);
</script>
```

### Liquiditäts-View Integration

Fügen Sie einen neuen Tab hinzu:

```html
<!-- liquiditat.html -->
<div class="tabs">
    <button class="tab" onclick="showTab('uebersicht')">Übersicht</button>
    <button class="tab" onclick="showTab('kategorien')">Kategorien</button>
    <!-- ... andere Tabs -->
</div>

<div id="tab-kategorien" class="tab-content">
    <div id="kategorien-analyse-container"></div>
</div>

<script src="/js/kategorien-analyse.js"></script>
<link rel="stylesheet" href="/css/kategorien-analyse.css">

<script>
async function showKategorienTab() {
    await kategorienAnalyse.load();
    kategorienAnalyse.renderDetailedAnalysis('kategorien-analyse-container');
}
</script>
```

### Forderungen-View Integration

Fügen Sie Kategoriezuweisung hinzu:

```html
<!-- forderungen.html -->
<script src="/js/forderungen-kategorien.js"></script>

<!-- Im Forderungen-Formular -->
<div class="form-group">
    <label>Kategorie</label>
    <div id="kategorie-selector"></div>
</div>

<!-- In der Forderungen-Tabelle -->
<td>
    <div id="kategorie-badge-${forderung.id}"></div>
    <button onclick="openKategorieAssignModal('${forderung.id}', '${forderung.kategorie}')">
        Kategorie zuweisen
    </button>
</td>

<script>
// Kategorie-Badge rendern
document.getElementById('kategorie-badge-${forderung.id}').innerHTML =
    getKategorieBadge(forderung.kategorie);
</script>
```

## 🎨 Anpassungsmöglichkeiten

### Farben ändern

In `forderungen_kategorien.json`:
```json
{
  "color": "#1976d2"  // Hex-Farbcode
}
```

### Icons ändern

Verfügbare Icons:
- folder (📁)
- briefcase (💼)
- wrench (🔧)
- lightbulb (💡)
- shopping-cart (🛒)
- home (🏠)
- key (🔑)
- chart (📊)
- settings (⚙️)
- calendar (📅)
- phone (📞)
- star (⭐)

### Neue Icons hinzufügen

In `forderungen-kategorien.js` und `kategorien-analyse.js`:
```javascript
const iconMap = {
    'folder': '📁',
    'new-icon': '🆕'  // Neues Icon hinzufügen
};
```

## 📊 Beispiel-Daten

### Standard-Kategorien:
1. **Projektarbeit** (💼 #1976d2) - Einnahmen aus abgeschlossenen Projekten
2. **Wartung & Service** (🔧 #388e3c) - Wartungsverträge und Servicearbeiten
3. **Beratung** (💡 #f57c00) - Beratungsleistungen und Consulting
4. **Materialverkauf** (🛒 #7b1fa2) - Verkauf von Materialien und Produkten
5. **Miete & Leasing** (🏠 #c2185b) - Vermietung und Leasing-Einnahmen
6. **Lizenzgebühren** (🔑 #0097a7) - Software-Lizenzen und Nutzungsgebühren

## 🚦 Status & Roadmap

### ✅ Implementiert (v1.0)
- Kategorieverwaltung (CRUD)
- Kategoriezuweisung zu Forderungen
- Basis-Analyse (Umsatz, Anzahl, Prozent)
- Dashboard-Widget
- Detaillierte Analyse-Seite
- Tortendiagramm-Visualisierung
- Zahlungsverhalten-Analyse
- Skonto-Analyse pro Kategorie
- Filter (Datum, Status)

### 🔜 Geplant (v1.1)
- Kategorien-Hierarchie (Hauptkategorie → Unterkategorien)
- Budgetierung pro Kategorie
- Vergleich: Vormonat / Vorjahr
- Trend-Analyse (Wachstum / Schrumpfung)
- Export der Analyse (PDF/Excel)
- KI-basierte Kategorievorschläge
- Automatische Kategorisierung basierend auf Kundennamen oder Rechnungstext

### 🎯 Zukunft (v2.0)
- Predictive Analytics: Forecast pro Kategorie
- Anomalie-Erkennung
- Benchmarking mit Branchendurchschnitt
- Integration mit Buchhaltungssoftware (DATEV)
- Mobile App mit Push-Benachrichtigungen
- API für externe Tools

## 🐛 Bekannte Limitationen

1. **Keine Kategorien-Hierarchie**
   - Aktuell nur flache Struktur
   - Keine Unterkategorien

2. **Keine Historisierung**
   - Kategorieänderungen werden nicht protokolliert
   - Keine Zeitreise-Analyse

3. **Keine Budgets**
   - Keine Soll/Ist-Vergleiche pro Kategorie

4. **Keine automatische Kategorisierung**
   - Manuelle Zuweisung erforderlich
   - KI-Vorschläge fehlen

## 📚 Weiterführende Dokumentation

- **API-Dokumentation:** `/docs/API_ENDPOINTS.md`
- **Datenbankschema:** `/docs/PRODUCTION_ARCHITECTURE.md`
- **Frontend-Architektur:** `/docs/FRONTEND_STRUCTURE.md`
- **Deployment:** `/docs/DEPLOYMENT_GUIDE.md`

## 💡 Best Practices

1. **Konsistente Namensgebung**
   - Verwenden Sie klare, beschreibende Namen
   - Vermeiden Sie Überschneidungen

2. **Sinnvolle Kategorisierung**
   - 5-10 Kategorien sind optimal
   - Zu viele Kategorien → Unübersichtlich
   - Zu wenige → Keine aussagekräftige Analyse

3. **Regelmäßige Analyse**
   - Monatliche Review
   - Trends erkennen
   - Strategische Anpassungen

4. **Vollständigkeit**
   - Alle Forderungen kategorisieren
   - Nicht kategorisierte Forderungen verzerren Analyse

## 🤝 Support & Feedback

Bei Fragen oder Problemen:
- GitHub Issues: https://github.com/kontiq/kontiq/issues
- Email: support@kontiq.de
- Dokumentation: https://docs.kontiq.de

---

**Version:** 1.0.0
**Datum:** 2024-12-10
**Autor:** Kontiq Development Team
