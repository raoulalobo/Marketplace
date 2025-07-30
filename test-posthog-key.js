// Test simple pour vérifier la clé PostHog
console.log('Testing PostHog key...');

// Clé publique depuis .env.local
const POSTHOG_KEY = 'phc_G0YgQZkeHY8zsj3qwoiiA6rUN2Z4H2mEDkbcBKAxeDC';
const POSTHOG_HOST = 'https://eu.i.posthog.com';

console.log('Key:', POSTHOG_KEY);
console.log('Host:', POSTHOG_HOST);

// Test avec l'API PostHog pour vérifier la clé
fetch(`${POSTHOG_HOST}/api/projects/@current`, {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${POSTHOG_KEY}`,
    'Content-Type': 'application/json',
  },
})
.then(response => {
  console.log('Response status:', response.status);
  return response.json();
})
.then(data => {
  console.log('Response data:', data);
})
.catch(error => {
  console.error('Error:', error);
});