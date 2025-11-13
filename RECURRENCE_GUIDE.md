# 🔄 Guide des Rendez-vous Récurrents - DermaAI

## Vue d'ensemble

Le système de rendez-vous récurrents permet de créer automatiquement des séries de rendez-vous répétitifs (quotidiens, hebdomadaires, mensuels).

---

## 📦 Composants créés

### 1. **RecurrenceSelector** (`recurrence-selector.tsx`)

Composant UI pour sélectionner les paramètres de récurrence.

**Props :**
```typescript
interface RecurrenceSelectorProps {
  value: RecurrenceRule | null
  onChange: (rule: RecurrenceRule | null) => void
  startDate: Date
  className?: string
}
```

**Features :**
- Toggle activation/désactivation de la récurrence
- Sélection de fréquence : Quotidien, Hebdomadaire, Mensuel
- Intervalle personnalisable (tous les X jours/semaines/mois)
- Fin de série :
  - Jamais (infini)
  - Après N occurrences
  - Jusqu'à une date spécifique
- Aperçu en temps réel de la règle
- Animations Framer Motion
- Design responsive

### 2. **Utilitaires de récurrence** (`lib/utils/recurrence.ts`)

**Fonctions :**

#### `generateRecurrenceOccurrences()`
Génère les dates de toutes les occurrences d'une série.

```typescript
const occurrences = generateRecurrenceOccurrences(
  startDate,
  endDate,
  {
    frequency: 'WEEKLY',
    interval: 1,
    count: 10
  }
)
// Retourne 10 occurrences hebdomadaires
```

#### `generateRecurringAppointments()`
Génère les objets d'appointment complets pour chaque occurrence.

```typescript
const appointments = generateRecurringAppointments(
  baseAppointment,
  recurrenceRule
)
// Retourne un tableau d'appointments prêts à être créés
```

#### `formatRecurrenceRule()`
Formatage human-readable de la règle.

```typescript
formatRecurrenceRule(rule, 'fr')
// "Toutes les 2 semaines, 10 fois"
```

#### `validateRecurrenceRule()`
Validation de la règle.

```typescript
const { valid, errors } = validateRecurrenceRule(rule)
if (!valid) {
  console.error(errors)
}
```

---

## 🎯 Types de récurrence supportés

### Quotidien (DAILY)
```typescript
{
  frequency: 'DAILY',
  interval: 1, // Tous les jours
  count: 30    // 30 jours
}
```

### Hebdomadaire (WEEKLY)
```typescript
{
  frequency: 'WEEKLY',
  interval: 2,  // Toutes les 2 semaines
  count: 10     // 10 occurrences
}
```

### Mensuel (MONTHLY)
```typescript
{
  frequency: 'MONTHLY',
  interval: 1,  // Tous les mois
  endDate: new Date('2026-12-31') // Jusqu'au 31/12/2026
}
```

---

## 💻 Intégration dans un formulaire

### Exemple basique :

```tsx
import { RecurrenceSelector, RecurrenceRule } from '@/components/calendar/recurrence-selector'
import { generateRecurringAppointments } from '@/lib/utils/recurrence'
import { useState } from 'react'

function MyAppointmentForm() {
  const [recurrenceRule, setRecurrenceRule] = useState<RecurrenceRule | null>(null)
  const [startDate, setStartDate] = useState(new Date())

  const handleSubmit = async (formData: any) => {
    if (recurrenceRule) {
      // Créer une série
      const appointments = generateRecurringAppointments(formData, recurrenceRule)

      // Créer tous les rendez-vous
      for (const appointment of appointments) {
        await createAppointment(appointment)
      }
    } else {
      // Créer un seul rendez-vous
      await createAppointment(formData)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* ... autres champs ... */}

      <RecurrenceSelector
        value={recurrenceRule}
        onChange={setRecurrenceRule}
        startDate={startDate}
      />

      <button type="submit">Créer</button>
    </form>
  )
}
```

---

## 📋 Cas d'usage

### 1. Séances de suivi hebdomadaires
```typescript
const rule: RecurrenceRule = {
  frequency: 'WEEKLY',
  interval: 1,
  count: 6  // 6 semaines de traitement
}
```

### 2. Contrôles mensuels
```typescript
const rule: RecurrenceRule = {
  frequency: 'MONTHLY',
  interval: 1,
  count: 12  // 1 an de suivi
}
```

### 3. Traitements quotidiens temporaires
```typescript
const rule: RecurrenceRule = {
  frequency: 'DAILY',
  interval: 1,
  endDate: new Date('2025-12-31')  // Jusqu'à fin d'année
}
```

---

## ⚙️ Configuration backend recommandée

Pour supporter pleinement les rendez-vous récurrents, le backend devrait avoir :

### Modèle `RecurringSeries`
```python
class RecurringSeries(Base):
    __tablename__ = "recurring_series"

    id = Column(Integer, primary_key=True)
    frequency = Column(String)  # DAILY, WEEKLY, MONTHLY
    interval = Column(Integer)
    count = Column(Integer, nullable=True)
    end_date = Column(DateTime, nullable=True)

    # Relations
    appointments = relationship("Appointment", back_populates="series")
```

### Endpoint `/appointments/series`
```python
@router.post("/series")
async def create_recurring_series(
    series_data: RecurringSeriesCreate,
    db: Session = Depends(get_db)
):
    # Générer toutes les occurrences
    occurrences = generate_occurrences(series_data)

    # Créer tous les rendez-vous
    appointments = []
    for occurrence in occurrences:
        appointment = create_appointment(occurrence, db)
        appointments.append(appointment)

    return {"appointments": appointments, "count": len(appointments)}
```

---

## 🔒 Limites de sécurité

Le système inclut des limites de sécurité :

- **Max occurrences** : 365 (paramétrable)
- **Max interval** : 365 jours/semaines/mois
- **Validation** : Empêche les configurations invalides
- **Prévention** : Boucles infinies impossible grâce aux checks

---

## 🎨 Personnalisation

### Changer les couleurs
```tsx
<RecurrenceSelector
  className="custom-class"
  value={rule}
  onChange={setRule}
  startDate={date}
/>
```

### Changer les limites
```typescript
// Dans recurrence.ts
function generateRecurrenceOccurrences(
  startTime,
  endTime,
  rule,
  maxOccurrences = 1000 // Augmenter la limite
)
```

---

## 📊 Métriques suggérées

Pour le monitoring des séries :

```typescript
// Statistiques de séries
{
  totalSeries: 45,
  totalOccurrences: 320,
  averageLength: 7.1,
  mostCommonFrequency: 'WEEKLY'
}
```

---

## 🚀 Améliorations futures possibles

1. **Jours de la semaine** : Sélection de jours spécifiques pour WEEKLY
2. **Exceptions** : Sauter certaines dates (vacances, etc.)
3. **Patterns complexes** : "Tous les 2e mardi du mois"
4. **Modification en masse** : Éditer toute une série
5. **Synchronisation calendrier** : Export iCal/Google Calendar
6. **Notifications** : Rappels pour séries récurrentes
7. **Statistiques** : Taux de complétion des séries

---

## 📚 Ressources

- **Framer Motion** : https://www.framer.com/motion/
- **date-fns** : https://date-fns.org/
- **RFC 5545 (iCalendar)** : https://tools.ietf.org/html/rfc5545

---

**Note** : Le composant RecurrenceSelector est prêt à l'emploi. L'intégration dans le formulaire principal et la création backend des séries sont à implémenter selon les besoins spécifiques du projet.
