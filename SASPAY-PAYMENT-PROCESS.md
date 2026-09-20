# SASPAY PAYMENT PROCESS - GUIDE OFFICIEL COMPLET & EXHAUSTIF

Ce document détaille l'intégralité du cycle de vie des paiements **SasPay (saspay.me)** sur la plateforme, depuis l'ouverture du modal d'achat par l'utilisateur jusqu'à la délivrance du bordereau de paiement officiel et l'actualisation du solde de jetons.

---

## 1. Schéma d'Architecture & Flux Global

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                               1. UTILISATEUR (CLIENT)                                  │
│  - Ouvre le modal "Get Stream Tokens"                                                  │
│  - Sélectionne le Pack de Jetons (ex: 100 Tokens = 0,99 $ ≈ 600 FCFA)                  │
│  - Choisit le Pays (🇨🇮, 🇸🇳, 🇧🇯, 🇨🇲, 🇹🇬, 🇲🇱, 🇧🇫, 🇬🇦, 🇨🇩, 🇬🇳, 🇨🇬, 💳)                    │
│  - Sélectionne l'Opérateur (Wave, Orange, MTN, Moov, Djamo, etc.)                       │
│  - Renseigne éventuellement son numéro de téléphone pour le push direct USSD           │
│  - Clique sur "Buy Tokens"                                                             │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │ Requête POST /api/wallet/purchase
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                         2. BACKEND API (SERVEUR RENDER)                                │
│  - Vérifie la session JWT de l'utilisateur                                             │
│  - Calcule la parité USD / FCFA (1 USD ≈ 600 FCFA)                                     │
│  - Détermine l'URL publique de retour via getPublicBaseUrl() (évite 0.0.0.0)           │
│  - Contacte l'API SasPay (POST https://api.saspay.me/api/v1/checkout-sessions/)        │
│  - Reçoit l'URL de paiement sécurisée (checkout_url : https://pay.saspay.me/...)       │
│  - Renvoie la réponse JSON au navigateur avec checkoutUrl                              │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │ Redirection du navigateur
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        3. PASSERELLE DE PAIEMENT SASPAY                                │
│  - L'utilisateur est sur la page hébergée sécurisée pay.saspay.me                      │
│  - Règle via Mobile Money (Scan QR Wave, Push USSD Orange/MTN) ou Carte Bancaire       │
│  - SasPay valide le débit auprès de l'opérateur télécom                                │
└─────────────────────────────────────┬───────────────────┬──────────────────────────────┘
                                      │                   │
               A. Webhook HTTP POST   │                   │ B. Redirection Navigateur
               (Asynchrone serveur)   │                   │ (Synchrone client)
                                      ▼                   ▼
┌──────────────────────────────────────────────────┐ ┌───────────────────────────────────┐
│     4. WEBHOOK IPN (/api/wallet/webhook)         │ │ 5. ROUTE RETOUR (/api/wallet/     │
│  - Vérifie la signature HMAC-SHA256              │ │    complete)                      │
│    (X-SasPay-Signature)                          │ │  - Vérifie la session du compte   │
│  - Contrôle anti-doublon (Idempotency Key)       │ │  - Sécurise le crédit comptable   │
│  - Crédite le portefeuille de l'utilisateur      │ │  - Redirige vers le domaine       │
│  - Écrit la transaction dans la table Transaction│ │    public Render réel avec :      │
│  - Émet le bordereau officiel de paiement        │ │    /?purchased_tokens=X&tx_id=Y   │
│    (ReceiptService) par email & messagerie       │ └─────────────────┬─────────────────┘
└──────────────────────────────────────────────────┘                   │
                                                                       ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                         6. CONFIRMATION & BORDEREAU OFFICIEL                           │
│  - Le bandeau vert émeraude s'affiche sur la page d'accueil :                          │
│    "Payment Confirmed! +X Tokens Credited"                                             │
│  - Un bouton direct permet d'ouvrir le reçu : "View Payment Slip"                      │
│  - Page web dédiée au reçu : https://<votre-app>.onrender.com/receipt/<tx_id>          │
│  - Bouton d'exportation et impression PDF propre pour le client et la comptabilité     │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Déroulement Détaillé Étape par Étape

### Étape 2.1 : Sélection dans le Modal Client (`TokenPurchaseModal.tsx`)
1. **Packs de jetons** :
   * Définis par défaut ou configurables dynamiquement dans la table `PlatformSetting`.
   * Chaque pack indique son équivalent en USD et en FCFA.
2. **Sélecteur de Pays avec drapeaux graphiques haute résolution** :
   * Les drapeaux sont affichés via le composant `CountryFlagBadge` (FlagCDN).
   * Compatible à 100 % avec Windows (qui ne supporte pas les émojis drapeaux Unicode par défaut), macOS, iOS et Android.
   * L'utilisateur peut filtrer en 1 clic par pays :
     * 🌍 **Tous les pays** (Affiche les 29 opérateurs)
     * 🇨🇮 **Côte d'Ivoire** (Wave, Orange, MTN, Moov, Djamo)
     * 🇸🇳 **Sénégal** (Wave, Orange, Free Money)
     * 🇧🇯 **Bénin** (MTN, Moov, Celtiis Cash)
     * 🇨🇲 **Cameroun** (Orange, MTN)
     * 🇹🇬 **Togo** (T-Money, Moov)
     * 🇲🇱 **Mali** (Orange, Moov Malitel)
     * 🇧🇫 **Burkina Faso** (Orange, Moov Onatel)
     * 🇬🇦 **Gabon** (Airtel, Moov)
     * 🇨🇩 **RDC** (Vodacom M-Pesa, Airtel, Orange)
     * 🇬🇳 **Guinée** (Orange, MTN)
     * 🇨🇬 **Congo Brazzaville** (MTN, Airtel)
     * 💳 **Cartes Bancaires Internationales** (Visa, Mastercard)
3. **Numéro de Téléphone (Facultatif)** :
   * Permet le déclenchement immédiat d'un push USSD si renseigné.
   * Si laissé vide, l'utilisateur saisit simplement son numéro sur l'interface sécurisée de SasPay.
4. **Indicateur d'attente progressif** :
   * Dès le clic, le bouton passe en chargement avec spinner animé :
     * *0s à 2.8s* : "Connecting to Gateway..."
     * *Après 2.8s* : "Establishing secure link..."
   * Un garde-fou côté client (`AbortSignal.timeout(14000)`) garantit que l'utilisateur n'est jamais bloqué sans réponse.

---

### Étape 2.2 : Initialisation Serveur (`/api/wallet/purchase`)
1. **Fichier concerné** : [`src/app/api/wallet/purchase/route.ts`](file:///c:/Users/XPRISTO/Desktop/tva/Live_event/src/app/api/wallet/purchase/route.ts)
2. **Authentification** : Le serveur valide la session utilisateur (`getSession()`).
3. **Résolution de l'URL publique** :
   * Utilise `getPublicBaseUrl(req)` ([`src/lib/url.ts`](file:///c:/Users/XPRISTO/Desktop/tva/Live_event/src/lib/url.ts)).
   * Détecte `RENDER_EXTERNAL_URL` ou `x-forwarded-host` pour que l'adresse de retour soit garantie sur votre nom de domaine public (ex: `https://votre-app.onrender.com/api/wallet/complete`) et **jamais** sur l'adresse socket interne `0.0.0.0`.
4. **Appel à SasPay** ([`src/lib/payment/sasPayAdapter.ts`](file:///c:/Users/XPRISTO/Desktop/tva/Live_event/src/lib/payment/sasPayAdapter.ts)) :
   * Équipé d'un timeout strict `AbortSignal.timeout(7000)` (7 secondes).
   * Si le mode production est configuré (`SASPAY_SECRET_KEY`), appelle l'API REST de SasPay.
   * Si les clés de production ne sont pas encore renseignées, bascule automatiquement en mode Sandbox / Simulation développeur sans générer d'erreur.
5. **Réponse** : Renvoie `{ success: true, checkout: { checkoutUrl: "https://pay.saspay.me/..." } }`. Le navigateur redirige l'utilisateur vers cette URL.

---

### Étape 2.3 : Règlement sur la Passerelle SasPay
1. Le client effectue son paiement :
   * **Wave** : Scan de QR code ou ouverture automatique de l'application Wave.
   * **Orange Money / MTN / Moov** : Validation par code secret sur le prompt USSD du téléphone.
   * **Carte Bancaire** : Saisie 3D-Secure (Visa / Mastercard).
2. SasPay enregistre le succès de la transaction et envoie deux signaux :
   * **Un Webhook asynchrone** vers `/api/wallet/webhook`.
   * **Une redirection du navigateur** vers votre URL de retour `/api/wallet/complete`.

---

### Étape 2.4 : Traitement Webhook & Sécurité (`/api/wallet/webhook`)
1. **Fichier concerné** : [`src/app/api/wallet/webhook/route.ts`](file:///c:/Users/XPRISTO/Desktop/tva/Live_event/src/app/api/wallet/webhook/route.ts)
2. **Validation Cryptographique** :
   * SasPay envoie la signature dans l'en-tête `X-SasPay-Signature`.
   * Le serveur calcule le HMAC-SHA256 du corps brut avec `SASPAY_WEBHOOK_SECRET`.
   * Si la signature ne correspond pas, la requête est rejetée avec une erreur 400.
3. **Garde d'Idempotence (Anti-Fraude)** :
   * La référence de paiement (ex: `saspay_pay_live_123456`) est vérifiée dans la base de données.
   * Si cette transaction a déjà été créditée, le système répond `200 OK - ALREADY_PROCESSED` pour éviter tout double crédit.
4. **Crédit Comptable** :
   * La méthode `WalletService.creditPurchasedTokens()` est exécutée dans une transaction atomique Prisma :
     * Incrémente `wallet.balance` et `wallet.purchasedBalance`.
     * Crée un enregistrement d'audit immuable dans la table `Transaction` (type `PURCHASE`).
     * Écrit un événement de conformité dans la table `AuditLog`.

---

### Étape 2.5 : Envoi Automatique du Bordereau de Paiement (`ReceiptService`)
1. **Fichier concerné** : [`src/lib/messaging/receiptService.ts`](file:///c:/Users/XPRISTO/Desktop/tva/Live_event/src/lib/messaging/receiptService.ts)
2. **Génération du Bordereau** :
   * Numéro de bordereau officiel unique : `SLIP-PAY-XXXXXXXX`.
   * Nom et adresse de messagerie du payeur.
   * Quantité de jetons crédités.
   * Montant en double devise ($ USD et conversion FCFA).
   * Mode de paiement et référence de transaction passerelle.
   * Badge de certification : `VERIFIED & SETTLED`.
   * Lien direct vers le reçu électronique en ligne.
3. **Expédition Multi-Canal** :
   * **Resend** : Si `RESEND_API_KEY` est configuré sur Render.
   * **SMTP (Gmail, Zoho, SendGrid, Amazon SES)** : Si `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` sont configurés.
   * **Repli sécurisé (Fail-Safe)** : Si aucun serveur mail n'est configuré, la transaction **ne bloque pas** et s'exécute parfaitement. Le reçu est consigné dans la base de données et affiché sur le web.
4. **Bordereau Administrateur** : Une notification de règlement marchand est envoyée à l'adresse `ADMIN_EMAIL`.

---

### Étape 2.6 : Redirection Utilisateur & Affichage Reçu (`/receipt/[txId]`)
1. **Fichier de retour** : [`src/app/api/wallet/complete/route.ts`](file:///c:/Users/XPRISTO/Desktop/tva/Live_event/src/app/api/wallet/complete/route.ts)
   * Redirige l'utilisateur vers votre page d'accueil avec :
     `https://<votre-domaine>/?purchased_tokens=100&tx_id=eadd6a43-670c-449a-ae77-393051e0de4a`
2. **Bandeau de confirmation sur le site** ([`src/components/stream/LiveDirectoryView.tsx`](file:///c:/Users/XPRISTO/Desktop/tva/Live_event/src/components/stream/LiveDirectoryView.tsx)) :
   * Bandeau émeraude animé : *"Payment Confirmed - +100 Tokens"*.
   * Bouton d'action : **"View Payment Slip"**.
3. **Page du Bordereau Électronique** ([`src/app/receipt/[txId]/page.tsx`](file:///c:/Users/XPRISTO/Desktop/tva/Live_event/src/app/receipt/[txId]/page.tsx)) :
   * Affichage d'un bordereau au design haut de gamme avec filigrane d'authenticité.
   * Bouton **"Print / Save as PDF"** configuré avec des styles d'impression CSS professionnels (sans éléments d'interface inutiles).

---

## 3. Retraits & Reversements Streamers (Payouts SasPay)

Lorsqu'un créateur ou streamer demande un encaissement de ses gains :

1. **Demande de Payout** : Le streamer soumet son numéro Mobile Money et le montant de jetons à retirer depuis son tableau de bord (`/dashboard/streamer/payouts`).
2. **Validation Administrateur** : L'administrateur approuve le paiement dans le panneau d'administration (`/admin/payouts`).
3. **Exécution SasPay B2C** :
   * Le backend appelle `POST https://api.saspay.me/api/v1/payouts/initialize/` ([`src/lib/payment/sasPayAdapter.ts`](file:///c:/Users/XPRISTO/Desktop/tva/Live_event/src/lib/payment/sasPayAdapter.ts)).
   * SasPay envoie les fonds directement sur le portefeuille Mobile Money du streamer (Orange, Wave, MTN, etc.).
4. **Bordereau de Versement Streamer** :
   * Le `ReceiptService.sendPayoutSlip()` émet automatiquement un bordereau de décaissement détaillant :
     * Nombre de jetons rachetés.
     * Frais de commission plateforme.
     * Montant net versé en FCFA.
     * Numéro de téléphone / opérateur de destination.

---

## 4. Tableau Complet des 29 Opérateurs Supportés

| Pays | Drapeau | Opérateur | Code API | Devise | Paiement (In) | Retrait (Out) |
| :--- | :---: | :--- | :--- | :---: | :---: | :---: |
| **Côte d'Ivoire** | 🇨🇮 | Wave | `wave_ci` | XOF | ✅ Oui | ✅ Oui |
| **Côte d'Ivoire** | 🇨🇮 | Orange Money | `orange_ci` | XOF | ✅ Oui | ✅ Oui |
| **Côte d'Ivoire** | 🇨🇮 | MTN MoMo | `mtn_ci` | XOF | ✅ Oui | ✅ Oui |
| **Côte d'Ivoire** | 🇨🇮 | Moov Money | `moov_ci` | XOF | ✅ Oui | ✅ Oui |
| **Côte d'Ivoire** | 🇨🇮 | Djamo | `djamo_ci` | XOF | ✅ Oui | ❌ Non |
| **Sénégal** | 🇸🇳 | Wave | `wave_sn` | XOF | ✅ Oui | ✅ Oui |
| **Sénégal** | 🇸🇳 | Orange Money | `orange_sn` | XOF | ✅ Oui | ✅ Oui |
| **Sénégal** | 🇸🇳 | Free Money | `free_sn` | XOF | ✅ Oui | ✅ Oui |
| **Bénin** | 🇧🇯 | MTN Mobile Money | `mtn_bj` | XOF | ✅ Oui | ✅ Oui |
| **Bénin** | 🇧🇯 | Moov Money | `moov_bj` | XOF | ✅ Oui | ✅ Oui |
| **Bénin** | 🇧🇯 | Celtiis Cash | `celtiis_bj` | XOF | ✅ Oui | ✅ Oui |
| **Cameroun** | 🇨🇲 | Orange Money | `orange_cm` | XAF | ✅ Oui | ✅ Oui |
| **Cameroun** | 🇨🇲 | MTN MoMo | `mtn_cm` | XAF | ✅ Oui | ✅ Oui |
| **Togo** | 🇹🇬 | T-Money (Togocom) | `tmoney_tg` | XOF | ✅ Oui | ✅ Oui |
| **Togo** | 🇹🇬 | Moov Money | `moov_tg` | XOF | ✅ Oui | ✅ Oui |
| **Mali** | 🇲🇱 | Orange Money | `orange_ml` | XOF | ✅ Oui | ✅ Oui |
| **Mali** | 🇲🇱 | Moov Money (Malitel)| `moov_ml` | XOF | ✅ Oui | ✅ Oui |
| **Burkina Faso**| 🇧🇫 | Orange Money | `orange_bf` | XOF | ✅ Oui | ✅ Oui |
| **Burkina Faso**| 🇧🇫 | Moov Money (Onatel) | `moov_bf` | XOF | ✅ Oui | ✅ Oui |
| **Gabon** | 🇬🇦 | Airtel Money | `airtel_ga` | XAF | ✅ Oui | ✅ Oui |
| **Gabon** | 🇬🇦 | Moov Money | `moov_ga` | XAF | ✅ Oui | ✅ Oui |
| **RDC** | 🇨🇩 | Vodacom M-Pesa | `mpesa_cd` | USD | ✅ Oui | ✅ Oui |
| **RDC** | 🇨🇩 | Airtel Money | `airtel_cd` | USD | ✅ Oui | ✅ Oui |
| **RDC** | 🇨🇩 | Orange Money | `orange_cd` | USD | ✅ Oui | ✅ Oui |
| **Guinée** | 🇬🇳 | Orange Money | `orange_gn` | GNF | ✅ Oui | ✅ Oui |
| **Guinée** | 🇬🇳 | MTN MoMo | `mtn_gn` | GNF | ✅ Oui | ✅ Oui |
| **Congo** | 🇨🇬 | MTN MoMo | `mtn_cg` | XAF | ✅ Oui | ✅ Oui |
| **Congo** | 🇨🇬 | Airtel Money | `airtel_cg` | XAF | ✅ Oui | ✅ Oui |
| **International**| 💳 | Cartes Visa / MC | `card` | XOF / USD | ✅ Oui | ❌ Non |

---

## 5. Checklist des Variables d'Environnement sur Render

Dans votre **Dashboard Render > Web Service > Environment**, assurez-vous d'avoir configuré :

```env
# 1. Clés SasPay
SASPAY_SECRET_KEY=votre_cle_secrete_saspay
SASPAY_WEBHOOK_SECRET=votre_secret_webhook_saspay
SASPAY_ENVIRONMENT=production

# 2. Domaine Public (Résolution d'URL)
NEXT_PUBLIC_APP_URL=https://votre-app.onrender.com

# 3. Messagerie & Bordereaux Électroniques (Option Resend recommandée)
RESEND_API_KEY=re_votre_cle_resend
MAIL_FROM="PulseStream Billing" <billing@votredomaine.com>
ADMIN_EMAIL=admin@votredomaine.com

# Ou Option SMTP classique :
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=465
# SMTP_USER=votre-email@gmail.com
# SMTP_PASS=votre-mot-de-passe-application
# SMTP_FROM="PulseStream Billing" <votre-email@gmail.com>
```

---

## 6. Fichiers du Projet Liés au Processus

| Composant | Fichier Source | Rôle |
| :--- | :--- | :--- |
| **Modal d'Achat** | [`src/components/wallet/TokenPurchaseModal.tsx`](file:///c:/Users/XPRISTO/Desktop/tva/Live_event/src/components/wallet/TokenPurchaseModal.tsx) | Interface utilisateur, sélecteur de pays avec drapeaux, opérateurs et saisie téléphone. |
| **Adaptateur SasPay** | [`src/lib/payment/sasPayAdapter.ts`](file:///c:/Users/XPRISTO/Desktop/tva/Live_event/src/lib/payment/sasPayAdapter.ts) | Communication API REST SasPay, conversion devises, gestion des timeouts et payouts. |
| **Route d'Achat** | [`src/app/api/wallet/purchase/route.ts`](file:///c:/Users/XPRISTO/Desktop/tva/Live_event/src/app/api/wallet/purchase/route.ts) | Initialisation de la session et renvoi de l'URL de paiement. |
| **Route Webhook** | [`src/app/api/wallet/webhook/route.ts`](file:///c:/Users/XPRISTO/Desktop/tva/Live_event/src/app/api/wallet/webhook/route.ts) | Réception des notifications de paiement, vérification HMAC et crédit du grand livre. |
| **Route Retour** | [`src/app/api/wallet/complete/route.ts`](file:///c:/Users/XPRISTO/Desktop/tva/Live_event/src/app/api/wallet/complete/route.ts) | Redirection sécurisée vers le domaine public Render après paiement. |
| **Service Bordereaux**| [`src/lib/messaging/receiptService.ts`](file:///c:/Users/XPRISTO/Desktop/tva/Live_event/src/lib/messaging/receiptService.ts) | Modèle HTML, calcul FCFA/USD, expédition d'emails multi-fournisseurs. |
| **Page Reçu Web** | [`src/app/receipt/[txId]/page.tsx`](file:///c:/Users/XPRISTO/Desktop/tva/Live_event/src/app/receipt/[txId]/page.tsx) | Reçu numérique officiel imprimable en PDF. |
| **API Reçu** | [`src/app/api/receipt/[txId]/route.ts`](file:///c:/Users/XPRISTO/Desktop/tva/Live_event/src/app/api/receipt/[txId]/route.ts) | Données JSON validées de la transaction. |
| **Résolveur d'URL** | [`src/lib/url.ts`](file:///c:/Users/XPRISTO/Desktop/tva/Live_event/src/lib/url.ts) | Élimine les fuites de l'adresse interne `0.0.0.0` et garantit le domaine public réel. |
| **Bandeau Succès** | [`src/components/stream/LiveDirectoryView.tsx`](file:///c:/Users/XPRISTO/Desktop/tva/Live_event/src/components/stream/LiveDirectoryView.tsx) | Notification visuelle d'ajout des jetons et bouton vers le reçu. |
| **Reversements Admin**| [`src/app/api/admin/payouts/route.ts`](file:///c:/Users/XPRISTO/Desktop/tva/Live_event/src/app/api/admin/payouts/route.ts) | Approbation des retraits streamers et envoi du bordereau de décaissement. |

---

## 7. Vérifications & Tests de Bon Fonctionnement

Pour vous assurer que tout fonctionne correctement :

1. **Test d'un Achat de Jetons** :
   * Connectez-vous sur votre site et cliquez sur **"Get Stream Tokens"**.
   * Choisissez **SasPay**, filtrez par pays (ex. Côte d'Ivoire ou Sénégal).
   * Sélectionnez un opérateur (ex. Wave ou Orange Money).
   * Cliquez sur **"Buy Tokens"** : le modal affiche le spinner animé avec *"Connecting to Gateway..."*.
   * La redirection s'effectue vers SasPay (ou en simulation si les clés live ne sont pas encore renseignées).
   * Après le paiement, vous êtes redirigé vers l'adresse publique Render (`https://votre-app.onrender.com/?purchased_tokens=100&tx_id=...`).
   * Le bandeau émeraude de confirmation apparaît sur la page d'accueil.
2. **Test du Bordereau de Paiement** :
   * Cliquez sur **"View Payment Slip"** sur le bandeau ou rendez-vous sur `/receipt/<tx_id>`.
   * Le reçu officiel s'affiche avec le statut **`VERIFIED & SETTLED`**, les montants en USD et FCFA.
   * Cliquez sur **"Print / Save as PDF"** pour vérifier la mise en page d'impression.
