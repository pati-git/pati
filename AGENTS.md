<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

# Règle de Déploiement et Synchronisation Git

> [!IMPORTANT]
> **Pousser automatiquement les modifications sur le dépôt distant :**
> Après chaque tâche, modification ou correction validée (compilation vérifiée), l'agent doit **toujours et automatiquement créer un commit clair et pousser les modifications sur la branche distante (`git push origin main`)**.
> Cela assure le déploiement automatique continu en production sur Vercel et la synchronisation immédiate avec Lovable.
