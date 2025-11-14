#!/usr/bin/env python3
"""
Tests End-to-End des 4 modules DermaAI
Tests les endpoints API et vérifie les relations
"""

import requests
import json
from typing import Dict

BASE_URL = "http://localhost:8000/api/v1"

# Couleurs pour output
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
BLUE = "\033[94m"
RESET = "\033[0m"


def login() -> str:
    """Login et récupère token"""
    print(f"\n{BLUE}=== AUTHENTIFICATION ==={RESET}")
    response = requests.post(
        f"{BASE_URL}/auth/login",
        data={"username": "dr.smith@dermai.com", "password": "password123"}
    )
    if response.status_code == 200:
        token = response.json()["access_token"]
        print(f"{GREEN}✅ Authentification réussie{RESET}")
        return token
    else:
        print(f"{RED}❌ Échec authentification: {response.status_code}{RESET}")
        exit(1)


def get_headers(token: str) -> Dict:
    """Retourne headers avec token"""
    return {"Authorization": f"Bearer {token}"}


def test_patients(token: str):
    """Test module Patients"""
    print(f"\n{BLUE}=== MODULE PATIENTS ==={RESET}")
    headers = get_headers(token)

    # Test 1: Liste patients
    response = requests.get(f"{BASE_URL}/patients", headers=headers)
    if response.status_code == 200:
        data = response.json()
        print(f"{GREEN}✅ GET /patients - {data['total']} patients{RESET}")
    else:
        print(f"{RED}❌ GET /patients failed: {response.status_code}{RESET}")

    # Test 2: Détail patient avec relations
    response = requests.get(f"{BASE_URL}/patients/1", headers=headers)
    if response.status_code == 200:
        patient = response.json()
        print(f"{GREEN}✅ GET /patients/1 - {patient['full_name']}{RESET}")
    else:
        print(f"{RED}❌ GET /patients/1 failed: {response.status_code}{RESET}")


def test_appointments(token: str):
    """Test module Calendrier/Appointments"""
    print(f"\n{BLUE}=== MODULE CALENDRIER (APPOINTMENTS) ==={RESET}")
    headers = get_headers(token)

    # Test 1: Liste appointments
    response = requests.get(f"{BASE_URL}/appointments", headers=headers)
    if response.status_code == 200:
        data = response.json()
        print(f"{GREEN}✅ GET /appointments - {data['total']} rendez-vous{RESET}")
    else:
        print(f"{RED}❌ GET /appointments failed: {response.status_code}{RESET}")

    # Test 2: Filtrer par patient
    response = requests.get(f"{BASE_URL}/appointments?patient_id=1", headers=headers)
    if response.status_code == 200:
        data = response.json()
        print(f"{GREEN}✅ GET /appointments?patient_id=1 - {data['total']} rendez-vous{RESET}")
    else:
        print(f"{RED}❌ GET /appointments?patient_id=1 failed: {response.status_code}{RESET}")


def test_consultations(token: str):
    """Test module Consultations"""
    print(f"\n{BLUE}=== MODULE CONSULTATIONS ==={RESET}")
    headers = get_headers(token)

    # Test 1: Liste consultations
    response = requests.get(f"{BASE_URL}/consultations", headers=headers)
    if response.status_code == 200:
        data = response.json()
        print(f"{GREEN}✅ GET /consultations - {data['total']} consultations{RESET}")
        if data['total'] > 0:
            first_consult = data['consultations'][0]
            print(f"   📋 Première: {first_consult['diagnosis']}")
    else:
        print(f"{RED}❌ GET /consultations failed: {response.status_code}{RESET}")

    # Test 2: Filtrer par patient
    response = requests.get(f"{BASE_URL}/consultations?patient_id=1", headers=headers)
    if response.status_code == 200:
        data = response.json()
        print(f"{GREEN}✅ GET /consultations?patient_id=1 - {data['total']} consultations{RESET}")
    else:
        print(f"{RED}❌ GET /consultations?patient_id=1 failed: {response.status_code}{RESET}")

    # Test 3: Détail consultation
    response = requests.get(f"{BASE_URL}/consultations/1", headers=headers)
    if response.status_code == 200:
        consult = response.json()
        print(f"{GREEN}✅ GET /consultations/1 - Diagnostic: {consult['diagnosis']}{RESET}")
    else:
        print(f"{RED}❌ GET /consultations/1 failed: {response.status_code}{RESET}")


def test_prescriptions(token: str):
    """Test module Prescriptions"""
    print(f"\n{BLUE}=== MODULE PRESCRIPTIONS ==={RESET}")
    headers = get_headers(token)

    # Test 1: Liste prescriptions
    response = requests.get(f"{BASE_URL}/prescriptions", headers=headers)
    if response.status_code == 200:
        data = response.json()
        print(f"{GREEN}✅ GET /prescriptions - {data['total']} prescriptions{RESET}")
        if data['total'] > 0:
            first_presc = data['prescriptions'][0]
            nb_meds = len(first_presc.get('medications', []))
            print(f"   💊 Première: {nb_meds} médicament(s)")
    else:
        print(f"{RED}❌ GET /prescriptions failed: {response.status_code}{RESET}")

    # Test 2: Filtrer par patient
    response = requests.get(f"{BASE_URL}/prescriptions?patient_id=1", headers=headers)
    if response.status_code == 200:
        data = response.json()
        print(f"{GREEN}✅ GET /prescriptions?patient_id=1 - {data['total']} prescriptions{RESET}")
    else:
        print(f"{RED}❌ GET /prescriptions?patient_id=1 failed: {response.status_code}{RESET}")

    # Test 3: Filtrer par consultation
    response = requests.get(f"{BASE_URL}/prescriptions?consultation_id=1", headers=headers)
    if response.status_code == 200:
        data = response.json()
        print(f"{GREEN}✅ GET /prescriptions?consultation_id=1 - {data['total']} prescriptions{RESET}")
    else:
        print(f"{RED}❌ GET /prescriptions?consultation_id=1 failed: {response.status_code}{RESET}")

    # Test 4: Détail prescription
    response = requests.get(f"{BASE_URL}/prescriptions/1", headers=headers)
    if response.status_code == 200:
        presc = response.json()
        nb_meds = len(presc.get('medications', []))
        print(f"{GREEN}✅ GET /prescriptions/1 - {nb_meds} médicament(s){RESET}")
        if nb_meds > 0:
            print(f"   💊 Médicaments: {', '.join([m['name'] for m in presc['medications']])}")
    else:
        print(f"{RED}❌ GET /prescriptions/1 failed: {response.status_code}{RESET}")


def test_relationships(token: str):
    """Test relations entre modules"""
    print(f"\n{BLUE}=== TEST RELATIONS ENTRE MODULES ==={RESET}")
    headers = get_headers(token)

    print(f"\n{YELLOW}Workflow Patient → Appointment → Consultation → Prescription:{RESET}")

    # 1. Récupérer patient
    response = requests.get(f"{BASE_URL}/patients/1", headers=headers)
    patient = response.json()
    print(f"1️⃣  Patient: {patient['full_name']}")

    # 2. Récupérer rendez-vous du patient
    response = requests.get(f"{BASE_URL}/appointments?patient_id=1", headers=headers)
    appointments = response.json()
    print(f"2️⃣  Rendez-vous: {appointments['total']}")

    # 3. Récupérer consultations du patient
    response = requests.get(f"{BASE_URL}/consultations?patient_id=1", headers=headers)
    consultations = response.json()
    print(f"3️⃣  Consultations: {consultations['total']}")
    if consultations['total'] > 0:
        first_consult_id = consultations['consultations'][0]['id']

        # 4. Récupérer prescriptions de la consultation
        response = requests.get(f"{BASE_URL}/prescriptions?consultation_id={first_consult_id}", headers=headers)
        prescriptions = response.json()
        print(f"4️⃣  Prescriptions: {prescriptions['total']}")

        if prescriptions['total'] > 0:
            print(f"\n{GREEN}✅ WORKFLOW COMPLET VALIDÉ !{RESET}")
        else:
            print(f"\n{YELLOW}⚠️  Workflow partiel: pas de prescription{RESET}")
    else:
        print(f"\n{YELLOW}⚠️  Workflow partiel: pas de consultation{RESET}")


def main():
    """Point d'entrée principal"""
    print(f"\n{BLUE}{'='*60}{RESET}")
    print(f"{BLUE}   TESTS END-TO-END - 4 MODULES DERMAI{RESET}")
    print(f"{BLUE}{'='*60}{RESET}")

    try:
        # Authentification
        token = login()

        # Test chaque module
        test_patients(token)
        test_appointments(token)
        test_consultations(token)
        test_prescriptions(token)

        # Test relations
        test_relationships(token)

        # Résumé
        print(f"\n{BLUE}{'='*60}{RESET}")
        print(f"{GREEN}✅ TOUS LES TESTS RÉUSSIS !{RESET}")
        print(f"{BLUE}{'='*60}{RESET}\n")

    except requests.exceptions.ConnectionError:
        print(f"\n{RED}❌ Impossible de se connecter au backend{RESET}")
        print(f"{YELLOW}Vérifiez que le serveur est démarré sur http://localhost:8000{RESET}\n")
        exit(1)
    except Exception as e:
        print(f"\n{RED}❌ Erreur: {e}{RESET}\n")
        exit(1)


if __name__ == "__main__":
    main()
