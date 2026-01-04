#!/bin/bash
# Quick Start - Kontiq Improvements
# Guide rapide pour vérifier les améliorations

echo "🚀 Kontiq - Vérification des Améliorations"
echo "=========================================="
echo ""

# Vérifier que tous les fichiers existent
echo "📁 Vérification des fichiers..."
files=(
  "public/css/global-harmonized.css"
  "public/js/modal-manager.js"
  "public/js/close-button-fixer.js"
  "public/js/form-harmonizer.js"
  "public/js/clickability-fixer.js"
  "public/js/performance-optimizer.js"
  "public/service-worker.js"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "✅ $file"
  else
    echo "❌ $file (MANQUANT)"
  fi
done

echo ""
echo "📊 Statistiques des Fichiers:"
echo "---"

echo "CSS Global:"
wc -l public/css/global-harmonized.css 2>/dev/null | awk '{print "  - " $1 " lignes"}'

echo "Scripts de Gestion:"
for js in public/js/modal-manager.js public/js/form-harmonizer.js public/js/clickability-fixer.js; do
  wc -l "$js" 2>/dev/null | awk -v file="$js" '{print "  - " file ": " $1 " lignes"}'
done

echo ""
echo "🔍 Vérification du Serveur:"
if pgrep -f "node server.js" > /dev/null; then
  echo "✅ Serveur Node.js en cours d'exécution"
else
  echo "❌ Serveur Node.js n'est pas lancé"
  echo "   Lancez avec: npm start ou node server.js"
fi

echo ""
echo "🌐 Test du Serveur:"
if timeout 2 curl -s http://localhost:3000 > /dev/null; then
  echo "✅ Serveur répond sur http://localhost:3000"
else
  echo "❌ Serveur ne répond pas"
  echo "   Vérifiez que le serveur est lancé et le port 3000 est disponible"
fi

echo ""
echo "📋 Points à Vérifier Manuellement:"
echo "---"
echo "1. Ouvrir http://localhost:3000"
echo "2. Aller sur 'Kosten'"
echo "3. Cliquer '+ Plan hinzufügen'"
echo "   ✓ Vérifier la croix × en haut à droite"
echo "   ✓ Cliquer la croix - modale doit fermer"
echo "   ✓ Appuyer Échap - modale doit fermer"
echo "4. Tester les boutons:"
echo "   ✓ Cliquer 'Ajouter' - doit répondre"
echo "   ✓ Pas besoin de rafraîchir"
echo "5. Vérifier le design:"
echo "   ✓ Tous les inputs ont la même hauteur"
echo "   ✓ Même taille de padding partout"
echo ""
echo "✨ C'est Tout! Les améliorations sont en place."
echo ""
