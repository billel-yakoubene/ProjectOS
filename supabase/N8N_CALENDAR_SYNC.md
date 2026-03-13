# ProjectOS : Connexion n8n & Calendrier

Ce guide explique comment synchroniser vos tâches ProjectOS avec Google Calendar via n8n.

## 1. Création du Workflow n8n

### Étape 1 : Trigger Supabase
Ajoutez un nœud **Supabase Trigger** :
- **Table** : `tasks`
- **Events** : `Insert`, `Update`
- **Filter** : `status = 'done'` (pour marquer la fin d'une étape) ou utilisez un champ `due_date` si vous en ajoutez un.

### Étape 2 : Formatage des données
Ajoutez un nœud **Set** ou **Code** pour préparer le titre de l'événement Calendar :
```javascript
return {
  title: `✅ Fait: ${$json.content}`,
  description: `Tâche complétée dans ProjectOS.`,
  startTime: new Date().toISOString(),
  endTime: new Date(new Date().getTime() + 30*60000).toISOString() // Durée 30min
}
```

### Étape 3 : Google Calendar
Ajoutez un nœud **Google Calendar** :
- **Resource** : `Event`
- **Operation** : `Create`
- **Calendar** : `Primary`
- **Summary** : `{{$json.title}}`
- **Start Time** : `{{$json.startTime}}`
- **End Time** : `{{$json.endTime}}`

## 2. Webhook de Notification
Le fichier `supabase/schema.sql` contient déjà le trigger SQL pour envoyer un webhook à n8n dès qu'une tâche est terminée. Utilisez l'URL de votre workflow n8n dans le trigger `notify_task_completion`.
