// 🔍 TEST DIAGNOSTIC - Copie ce code dans la Console (F12)
// Sur la page patient (http://localhost:3000/dashboard/patients/[ID])

console.clear();
console.log('%c🔍 DIAGNOSTIC ONGLET IMAGES', 'color: #60a5fa; font-size: 20px; font-weight: bold');
console.log('');

// 1. Trouver tous les onglets
const allTabs = document.querySelectorAll('button');
const imageTabs = Array.from(allTabs).filter(btn => btn.textContent.includes('Images'));
console.log('1️⃣ Onglets "Images" trouvés:', imageTabs.length);
if (imageTabs.length > 0) {
    console.log('   Position:', imageTabs[0]);
    console.log('   Classes:', imageTabs[0].className);
}

// 2. Vérifier l'état actif
setTimeout(() => {
    const activeTab = Array.from(allTabs).find(btn =>
        btn.className.includes('border-blue') || btn.className.includes('text-blue-600')
    );
    console.log('2️⃣ Onglet actif:', activeTab?.textContent?.trim());
}, 500);

// 3. Vérifier le contenu affiché
setTimeout(() => {
    const content = document.body.innerText;
    if (content.includes('Images médicales')) {
        console.log('%c✅ SUCCÈS: Contenu Images visible!', 'color: #4ade80; font-weight: bold');
    } else if (content.includes('bientôt disponible')) {
        console.log('%c❌ PROBLÈME: Message "bientôt disponible" affiché', 'color: #f87171; font-weight: bold');
        console.log('   Le composant Images ne se charge pas correctement');
    } else {
        console.log('%c⚠️ ATTENTION: Contenu inconnu', 'color: #fbbf24; font-weight: bold');
    }
}, 1000);

// 4. Chercher des erreurs React
setTimeout(() => {
    console.log('');
    console.log('4️⃣ Vérifie s\'il y a des erreurs en ROUGE ci-dessus ⬆️');
    console.log('   Erreurs courantes:');
    console.log('   - Module not found');
    console.log('   - Cannot read property of undefined');
    console.log('   - Invalid hook call');
}, 1500);
