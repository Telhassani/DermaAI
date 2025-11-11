// 🔍 TEST DIAGNOSTIC - Upload Button Debug
// Copie ce code dans la Console (F12) sur la page patient avec l'onglet Images actif

console.clear();
console.log('%c🔍 DIAGNOSTIC BOUTON UPLOAD', 'color: #60a5fa; font-size: 20px; font-weight: bold');
console.log('');

// 1. Trouver le bouton "Ajouter des images"
const buttons = Array.from(document.querySelectorAll('button'));
const uploadButton = buttons.find(btn => btn.textContent.includes('Ajouter des images') || btn.textContent.includes('Masquer'));
console.log('1️⃣ Bouton trouvé:', uploadButton ? '✅ OUI' : '❌ NON');
if (uploadButton) {
    console.log('   Texte:', uploadButton.textContent);
    console.log('   Classes:', uploadButton.className);
}

// 2. Vérifier la présence de la section upload AVANT le clic
setTimeout(() => {
    const uploadSectionBefore = document.body.innerText.includes('Télécharger de nouvelles images');
    console.log('2️⃣ Section upload visible AVANT clic:', uploadSectionBefore ? '✅ OUI' : '❌ NON');

    // 3. Simuler un clic sur le bouton
    if (uploadButton) {
        console.log('3️⃣ Simulation du clic...');
        uploadButton.click();

        // 4. Vérifier la présence de la section upload APRÈS le clic
        setTimeout(() => {
            const uploadSectionAfter = document.body.innerText.includes('Télécharger de nouvelles images');
            console.log('4️⃣ Section upload visible APRÈS clic:', uploadSectionAfter ? '✅ OUI' : '❌ NON');

            // 5. Chercher le composant ImageUpload dans le DOM
            const dropzoneText = document.body.innerText.includes('Glissez-déposez') ||
                                 document.body.innerText.includes('drag') ||
                                 document.body.innerText.includes('Sélectionner');
            console.log('5️⃣ Composant Dropzone visible:', dropzoneText ? '✅ OUI' : '❌ NON');

            // 6. Vérifier les erreurs dans la console
            console.log('');
            console.log('6️⃣ Vérifie s\'il y a des ERREURS en ROUGE ci-dessus ⬆️');
            console.log('   Erreurs courantes:');
            console.log('   - useDropzone is not defined');
            console.log('   - Cannot read property of undefined');
            console.log('   - Invalid hook call');
            console.log('');

            // 7. Chercher tous les éléments avec "rounded-xl border border-slate-200"
            const possibleUploadDivs = document.querySelectorAll('[class*="rounded-xl"][class*="border-slate-200"]');
            console.log('7️⃣ Divs potentielles de upload trouvées:', possibleUploadDivs.length);
            if (possibleUploadDivs.length > 0) {
                console.log('   Contenu de chaque div:');
                possibleUploadDivs.forEach((div, i) => {
                    console.log(`   Div ${i + 1}:`, div.innerText.substring(0, 100));
                });
            }
        }, 500);
    } else {
        console.log('%c❌ PROBLÈME: Bouton non trouvé!', 'color: #f87171; font-weight: bold');
    }
}, 500);
