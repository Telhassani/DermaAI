# 🚀 DÉMARRAGE RAPIDE - CALENDRIER DERMAAI

## ⚡ TL;DR - Démarrage en 5 minutes

```bash
# 1. Backend
cd /home/user/DermaAI/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Éditer .env avec vos credentials PostgreSQL
alembic upgrade head
uvicorn app.main:app --reload

# 2. Frontend (nouveau terminal)
cd /home/user/DermaAI/frontend
npm install
npm run dev

# 3. Ouvrir le navigateur
http://localhost:3000
Login: doctor@dermai.com / Doctor123!
```

---

## 👤 COMPTES DE TEST

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| **Docteur** | doctor@dermai.com | Doctor123! |
| **Admin** | admin@dermai.com | Admin123! |
| **Secrétaire** | secretary@dermai.com | Secretary123! |

---

## 🗓️ TESTER LE CALENDRIER

### **Créer un rendez-vous**

**Méthode 1 : Bouton "Nouveau rendez-vous"**
1. Clic sur le bouton bleu en haut à droite
2. Rechercher un patient (taper 2+ lettres)
3. Remplir date, heure, durée
4. Cliquer "Créer le rendez-vous"

**Méthode 2 : Clic sur créneau horaire** ⚡
1. Passer en vue **Semaine** ou **Jour**
2. Cliquer sur un créneau vide
3. Modal s'ouvre avec date/heure pré-remplie !

---

## ✅ VALIDATION RAPIDE

Après le démarrage, vérifier :

- [ ] Backend répond : `curl http://localhost:8000/health`
- [ ] Frontend charge : http://localhost:3000
- [ ] Login fonctionne
- [ ] Page calendrier s'affiche
- [ ] Modal "Nouveau rendez-vous" s'ouvre

Voir **TESTS.md** pour la documentation complète !
