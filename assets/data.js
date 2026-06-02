window.SEC_DATA = {
  translations: {
    en: {
      appName: 'Smart Emergency Companion',
      startDemo: 'Start Scenario Demo',
      roleSelect: 'Choose your role',
      spectator: 'Spectator',
      agent: 'Security Agent',
      organizer: 'Event Organizer',
      login: 'Login',
      email: 'Email or ID',
      password: 'Password',
      qrScan: 'Scan event QR',
      connectWearable: 'Connect wearable',
      quickEmergency: 'Quick emergency access',
      emergencyMode: 'Emergency mode',
      guideMe: 'Guide Me',
      nearestExit: 'Nearest Exit',
      systemHealth: 'System health',
      globalRisk: 'Global risk',
      postIncident: 'Post-incident analysis',
      liveAlerts: 'Live alerts'
    },
    fr: {
      appName: 'Smart Emergency Companion',
      startDemo: 'Démarrer le scénario',
      roleSelect: 'Choisissez votre rôle',
      spectator: 'Spectateur',
      agent: 'Agent de sécurité',
      organizer: 'Organisateur',
      login: 'Connexion',
      email: 'Email ou identifiant',
      password: 'Mot de passe',
      qrScan: 'Scanner le QR événement',
      connectWearable: 'Connecter le bracelet',
      quickEmergency: 'Accès urgence rapide',
      emergencyMode: 'Mode urgence',
      guideMe: 'Guidez-moi',
      nearestExit: 'Sortie la plus proche',
      systemHealth: 'Santé système',
      globalRisk: 'Risque global',
      postIncident: 'Analyse post-incident',
      liveAlerts: 'Alertes en direct'
    }
  },
  roles: [
    { id: 'spectator', route: '#/spectator/home', color: 'var(--blue)', icon: '👤' },
    { id: 'agent', route: '#/agent/dashboard', color: 'var(--green)', icon: '🛡️' },
    { id: 'organizer', route: '#/organizer/command-center', color: 'var(--purple)', icon: '🧭' }
  ],
  alerts: [
    { type: 'critical', msg: 'Crowd surge detected at Gate B2', zone: 'B2' },
    { type: 'warning', msg: 'High density near Hall 7', zone: 'H7' },
    { type: 'info', msg: 'Exit E12 reopened', zone: 'E12' }
  ],
  teams: [
    { name: 'Alpha', status: 'In mission', distance: '120m' },
    { name: 'Bravo', status: 'Available', distance: '210m' },
    { name: 'Charlie', status: 'Support ready', distance: '350m' }
  ],
  groupMembers: [
    { name: 'Lina', status: 'Safe', distance: '95m' },
    { name: 'Karim', status: 'Moving', distance: '140m' },
    { name: 'Sam', status: 'Safe', distance: '60m' }
  ]
};
