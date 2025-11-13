
---

## 🤖 TESTS AUTOMATISÉS

### Vue d'ensemble

Une suite complète de tests automatisés a été créée pour garantir la qualité et la fiabilité du calendrier DermaAI.

**Rapport détaillé** : Voir [TEST_REPORT.md](./TEST_REPORT.md)

### Tests Backend (Pytest)

**Fichier** : `backend/tests/api/v1/test_appointments.py`
**Tests** : 12 classes, 20+ scénarios

```bash
# Installation et exécution
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pytest tests/api/v1/test_appointments.py -v
```

**Couverture** :
- ✅ Création de rendez-vous (succès, erreurs, conflits)
- ✅ Récupération (liste, par ID, filtres)
- ✅ Mise à jour (données, statut)
- ✅ Suppression
- ✅ Vérification de conflits
- ✅ Statistiques

### Tests Frontend (Vitest + React Testing Library)

**Fichiers** : 6 fichiers de tests dans `frontend/src/__tests__/`
**Tests** : 99 scénarios, 230+ assertions

```bash
# Installation et exécution
cd frontend
npm install
npm test
```

**Fichiers de tests** :
1. `hooks/use-appointments.test.ts` - Tests des hooks React Query
2. `components/appointment-card.test.tsx` - Tests du composant carte
3. `components/calendar-toolbar.test.tsx` - Tests de la barre d'outils
4. `components/patient-search-select.test.tsx` - Tests de l'autocomplete
5. `components/appointment-form.test.tsx` - Tests du formulaire
6. `components/appointment-modals.test.tsx` - Tests des modaux

**Couverture** :
- ✅ Tous les composants React testés
- ✅ Tous les hooks personnalisés testés
- ✅ Interactions utilisateur simulées
- ✅ Validation des formulaires
- ✅ Gestion des erreurs
- ✅ Modes responsives

### Exécution rapide

```bash
# Backend
cd backend && source venv/bin/activate && pytest tests/api/v1/test_appointments.py -v

# Frontend
cd frontend && npm test

# Avec couverture
pytest tests/api/v1/test_appointments.py --cov=app.api.v1.appointments
npm run test:coverage
```

### Résultats attendus

**Backend** :
```
===== 12 passed in X.XXs =====
✅ TestAppointmentCreation (3 tests)
✅ TestAppointmentRetrieval (3 tests)
✅ TestAppointmentUpdate (2 tests)
✅ TestAppointmentDeletion (1 test)
✅ TestAppointmentConflictCheck (2 tests)
✅ TestAppointmentStats (1 test)
```

**Frontend** :
```
Test Files  6 passed (6)
     Tests  99 passed (99)
  Duration  X.XXs
```

### Documentation complète

Pour plus de détails sur :
- Structure des tests
- Scénarios couverts
- Instructions d'exécution
- Statistiques de couverture

👉 **Consultez [TEST_REPORT.md](./TEST_REPORT.md)**

