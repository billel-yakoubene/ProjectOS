/**
 * n8n Function Node: Stagnation Calculator
 * Calculates the time elapsed since the last activity on a project.
 * 
 * Input: Expects a 'last_activity_date' field (ISO string or timestamp)
 */

const lastActivity = new Date($input.item.json.last_activity_date);
const now = new Date();

// Calculate difference in hours
const diffMs = now - lastActivity;
const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
const diffDays = Math.floor(diffHours / 24);

return {
    stagnation_hours: diffHours,
    stagnation_days: diffDays,
    is_stagnant: diffHours > 48, // Flagged after 48h of inactivity
    readable_stagnation: diffDays > 0 ? `${diffDays} jours` : `${diffHours} heures`
};
