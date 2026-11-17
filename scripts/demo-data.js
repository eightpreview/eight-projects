window.EP_DATA = {
  clients: [
    { id: 'lumen', name: 'Maison Lumen', contact: 'Claire Martin', email: 'claire@maisonlumen.be', last: '2026-11-16' },
    { id: 'nord', name: 'Atelier Nord', contact: 'Thomas Peeters', email: 'thomas@ateliernord.be', last: '2026-11-12' },
    { id: 'vela', name: 'Studio Vela', contact: 'Inès Haddad', email: 'ines@studiovela.com', last: '2026-11-03' },
    { id: 'oriol', name: 'Cave Oriol', contact: 'Marc Oriol', email: 'marc@caveoriol.be', last: '2026-10-21' },
    { id: 'pell', name: 'Bureau Pell', contact: 'Anne Dubois', email: 'anne@bureaupell.be', last: '2026-11-14' }
  ],
  projects: [
    { id: 'site', client: 'lumen', name: 'Refonte du site web', service: 'Web', status: 'En cours', progress: 62, start: '2026-09-08', due: '2026-12-12', lead: 'Sarah Lambert', leadMail: 'sarah@eightprojects.be',
      steps: [{ t: 'Kick-off & brief', d: '08.09', s: 'done' }, { t: 'Arborescence & wireframes', d: '26.09', s: 'done' }, { t: 'Design UI', d: '24.10', s: 'done' }, { t: 'Développement', d: '28.11', s: 'current' }, { t: 'Recette & mise en ligne', d: '12.12', s: 'todo' }],
      deliverables: [
        { id: 'd1', name: 'Maquettes desktop — v2', type: 'Figma', date: '2026-10-24', status: 'validé', comments: [{ a: 'Sarah Lambert', d: '2026-10-24', t: 'Version 2 avec vos retours sur la page Collections et le footer.' }, { a: 'Claire Martin', c: 1, d: '2026-10-25', t: 'Parfait pour nous, on valide.' }] },
        { id: 'd2', name: 'Maquettes mobile — v1', type: 'Figma', date: '2026-11-10', status: 'à valider', comments: [{ a: 'Sarah Lambert', d: '2026-11-10', t: 'Voici la déclinaison mobile. Le menu passe en plein écran, comme sur desktop.' }] },
        { id: 'd3', name: 'Page d’accueil — préprod', type: 'Lien', date: '2026-11-14', status: 'à valider', comments: [] }
      ] },
    { id: 'brand', client: 'lumen', name: 'Identité visuelle', service: 'Branding', status: 'Livré', progress: 100, start: '2026-05-04', due: '2026-07-10', lead: 'Sarah Lambert', leadMail: 'sarah@eightprojects.be',
      steps: [{ t: 'Recherche & moodboard', d: '15.05', s: 'done' }, { t: 'Pistes créatives', d: '02.06', s: 'done' }, { t: 'Logo & déclinaisons', d: '24.06', s: 'done' }, { t: 'Charte graphique', d: '10.07', s: 'done' }],
      deliverables: [
        { id: 'b1', name: 'Logo — fichiers finaux', type: 'ZIP', date: '2026-07-10', status: 'validé', comments: [] },
        { id: 'b2', name: 'Charte graphique', type: 'PDF', date: '2026-07-10', status: 'validé', comments: [{ a: 'Claire Martin', c: 1, d: '2026-07-11', t: 'Superbe travail, merci à toute l’équipe.' }] }
      ] },
    { id: 'social', client: 'lumen', name: 'Contenus social — Q4', service: 'Contenu', status: 'En cours', progress: 35, start: '2026-10-06', due: '2027-01-09', lead: 'Hugo Renard', leadMail: 'hugo@eightprojects.be',
      steps: [{ t: 'Ligne éditoriale', d: '05.11', s: 'done' }, { t: 'Shooting photo', d: '21.11', s: 'current' }, { t: 'Production des visuels', d: '12.12', s: 'todo' }, { t: 'Planification', d: '09.01', s: 'todo' }],
      deliverables: [{ id: 's1', name: 'Ligne éditoriale Q4', type: 'PDF', date: '2026-11-05', status: 'à valider', comments: [{ a: 'Hugo Renard', d: '2026-11-05', t: 'Trois piliers éditoriaux et un rythme de 3 posts par semaine. Dites-nous ce qui vous parle.' }] }] },
    { id: 'nord-shop', client: 'nord', name: 'Site e-commerce', service: 'Web', status: 'En cours', progress: 40, start: '2026-10-01', due: '2027-02-15', lead: 'Sarah Lambert', leadMail: 'sarah@eightprojects.be',
      steps: [{ t: 'Brief', d: '01.10', s: 'done' }, { t: 'Wireframes', d: '20.11', s: 'current' }, { t: 'Design UI', d: '18.12', s: 'todo' }, { t: 'Développement', d: '15.02', s: 'todo' }],
      deliverables: [{ id: 'n1', name: 'Wireframes — tunnel d’achat', type: 'Figma', date: '2026-11-13', status: 'à valider', comments: [] }] },
    { id: 'vela-brand', client: 'vela', name: 'Rebranding', service: 'Branding', status: 'En cours', progress: 80, start: '2026-08-18', due: '2026-12-05', lead: 'Sarah Lambert', leadMail: 'sarah@eightprojects.be',
      steps: [{ t: 'Recherche', d: '29.08', s: 'done' }, { t: 'Pistes', d: '25.09', s: 'done' }, { t: 'Logo', d: '30.10', s: 'done' }, { t: 'Charte', d: '05.12', s: 'current' }], deliverables: [] },
    { id: 'oriol-photo', client: 'oriol', name: 'Photos produits', service: 'Contenu', status: 'Livré', progress: 100, start: '2026-09-15', due: '2026-10-20', lead: 'Hugo Renard', leadMail: 'hugo@eightprojects.be',
      steps: [{ t: 'Direction artistique', d: '22.09', s: 'done' }, { t: 'Shooting', d: '06.10', s: 'done' }, { t: 'Retouches', d: '20.10', s: 'done' }], deliverables: [] },
    { id: 'pell-site', client: 'pell', name: 'Site vitrine', service: 'Web', status: 'En pause', progress: 20, start: '2026-10-12', due: '2027-01-30', lead: 'Sarah Lambert', leadMail: 'sarah@eightprojects.be',
      steps: [{ t: 'Brief', d: '12.10', s: 'done' }, { t: 'Arborescence', d: '—', s: 'current' }], deliverables: [] }
  ],
  docs: [
    { id: 'doc1', project: 'site', name: 'Brief projet — refonte site', type: 'PDF', size: '1,2 Mo', date: '2026-09-08', by: 'studio' },
    { id: 'doc2', project: 'site', name: 'Arborescence v3', type: 'PDF', size: '640 Ko', date: '2026-09-26', by: 'studio' },
    { id: 'doc3', project: 'site', name: 'Contenus textes — pages', type: 'DOCX', size: '88 Ko', date: '2026-10-30', by: 'client' },
    { id: 'doc4', project: 'site', name: 'Photos équipe (sélection)', type: 'ZIP', size: '48 Mo', date: '2026-11-04', by: 'client' },
    { id: 'doc5', project: 'brand', name: 'Charte graphique Maison Lumen', type: 'PDF', size: '8,4 Mo', date: '2026-07-10', by: 'studio' },
    { id: 'doc6', project: 'brand', name: 'Logo — fichiers finaux', type: 'ZIP', size: '22 Mo', date: '2026-07-10', by: 'studio' },
    { id: 'doc7', project: 'social', name: 'Ligne éditoriale Q4', type: 'PDF', size: '2,1 Mo', date: '2026-11-05', by: 'studio' },
    { id: 'doc8', project: 'social', name: 'Planning shooting 21.11', type: 'PDF', size: '310 Ko', date: '2026-11-12', by: 'studio' },
    { id: 'doc9', project: 'nord-shop', name: 'Brief e-commerce', type: 'PDF', size: '940 Ko', date: '2026-10-01', by: 'studio' },
    { id: 'doc10', project: 'nord-shop', name: 'Catalogue produits', type: 'XLSX', size: '1,8 Mo', date: '2026-10-14', by: 'client' },
    { id: 'doc11', project: 'vela-brand', name: 'Pistes créatives', type: 'PDF', size: '12 Mo', date: '2026-09-25', by: 'studio' },
    { id: 'doc12', project: 'oriol-photo', name: 'Photos HD — sélection finale', type: 'ZIP', size: '320 Mo', date: '2026-10-20', by: 'studio' }
  ],
  invoices: [
    { id: 'F-2026-044', project: 'site', label: 'Refonte site — 2e tranche 30 %', amount: 4356, date: '2026-11-03', due: '2026-12-03', status: 'à payer' },
    { id: 'F-2026-042', project: 'social', label: 'Contenus Q4 — octobre', amount: 1815, date: '2026-10-31', due: '2026-11-15', status: 'en retard' },
    { id: 'F-2026-036', project: 'site', label: 'Refonte site — acompte 40 %', amount: 5808, date: '2026-09-08', due: '2026-10-08', status: 'payée' },
    { id: 'F-2026-031', project: 'brand', label: 'Identité visuelle — solde 50 %', amount: 3630, date: '2026-07-10', due: '2026-08-09', status: 'payée' },
    { id: 'F-2026-018', project: 'brand', label: 'Identité visuelle — acompte 50 %', amount: 3630, date: '2026-05-04', due: '2026-06-03', status: 'payée' },
    { id: 'F-2026-043', project: 'nord-shop', label: 'Site e-commerce — acompte 30 %', amount: 5445, date: '2026-11-02', due: '2026-12-02', status: 'à payer' },
    { id: 'F-2026-039', project: 'vela-brand', label: 'Rebranding — 2e tranche', amount: 6050, date: '2026-10-15', due: '2026-11-14', status: 'en retard' },
    { id: 'F-2026-040', project: 'oriol-photo', label: 'Photos produits', amount: 2420, date: '2026-10-20', due: '2026-11-19', status: 'payée' },
    { id: 'F-2026-037', project: 'pell-site', label: 'Site vitrine — acompte', amount: 1210, date: '2026-10-12', due: '2026-11-11', status: 'payée' }
  ],
  quotes: [
    { id: 'D-2026-021', project: 'site', label: 'Module de réservation en ligne', date: '2026-11-12', valid: '2026-12-12', status: 'à signer',
      lines: [{ l: 'Conception & UX du parcours de réservation', q: 1, p: 1200 }, { l: 'Développement & intégration calendrier', q: 1, p: 2400 }, { l: 'Tests & mise en ligne', q: 1, p: 400 }] },
    { id: 'D-2026-019', project: 'social', label: 'Contenus social — Q4', date: '2026-09-28', valid: '2026-10-28', status: 'signé', signed: '2026-10-02', signedBy: 'Claire Martin',
      lines: [{ l: 'Ligne éditoriale', q: 1, p: 900 }, { l: 'Shooting photo (1 journée)', q: 1, p: 1400 }, { l: 'Visuels social', q: 24, p: 85 }, { l: 'Planification & publication (mois)', q: 3, p: 250 }] },
    { id: 'D-2026-014', project: 'site', label: 'Refonte du site web', date: '2026-08-25', valid: '2026-09-25', status: 'signé', signed: '2026-09-01', signedBy: 'Claire Martin',
      lines: [{ l: 'Arborescence & wireframes', q: 1, p: 2200 }, { l: 'Design UI (12 pages)', q: 1, p: 4400 }, { l: 'Développement & CMS', q: 1, p: 5400 }] },
    { id: 'D-2026-009', project: 'brand', label: 'Identité visuelle', date: '2026-04-20', valid: '2026-05-20', status: 'signé', signed: '2026-04-28', signedBy: 'Claire Martin',
      lines: [{ l: 'Recherche & pistes créatives', q: 1, p: 2400 }, { l: 'Logo & déclinaisons', q: 1, p: 2600 }, { l: 'Charte graphique', q: 1, p: 1000 }] },
    { id: 'D-2026-022', project: 'nord-shop', label: 'Fiches produits — rédaction', date: '2026-11-10', valid: '2026-12-10', status: 'à signer', lines: [{ l: 'Rédaction fiches produits', q: 40, p: 45 }] },
    { id: 'D-2026-017', project: 'pell-site', label: 'Shooting équipe', date: '2026-10-20', valid: '2026-11-20', status: 'refusé', lines: [{ l: 'Shooting portraits (½ journée)', q: 1, p: 850 }] }
  ],
  activity: [
    { client: 'lumen', d: '2026-11-14', t: 'Nouveau livrable : <b>Page d’accueil — préprod</b>' },
    { client: 'nord', d: '2026-11-13', t: 'Nouveau livrable : <b>Wireframes — tunnel d’achat</b>' },
    { client: 'lumen', d: '2026-11-12', t: 'Nouveau devis : <b>D-2026-021</b> — Module de réservation' },
    { client: 'lumen', d: '2026-11-12', t: 'Document ajouté : <b>Planning shooting 21.11</b>' },
    { client: 'lumen', d: '2026-11-10', t: 'Nouveau livrable : <b>Maquettes mobile — v1</b>' },
    { client: 'pell', d: '2026-11-08', t: 'Devis <b>D-2026-017</b> refusé' },
    { client: 'lumen', d: '2026-11-05', t: 'Nouveau livrable : <b>Ligne éditoriale Q4</b>' },
    { client: 'lumen', d: '2026-11-04', t: 'Vous avez déposé <b>Photos équipe (sélection)</b>' },
    { client: 'lumen', d: '2026-11-03', t: 'Nouvelle facture : <b>F-2026-044</b>' }
  ]
};
