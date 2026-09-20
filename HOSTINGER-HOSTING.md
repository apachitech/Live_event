# Guide Complet d'Hébergement sur Hostinger : Coûts & Déploiement Pas-à-Pas

Ce document détaille **précisément combien coûte** l'hébergement de cette plateforme de streaming en direct sur **Hostinger**, quelle offre choisir, ainsi que le **tutoriel complet étape par étape** pour déployer le site, la base de données PostgreSQL, Redis, Socket.IO, Nginx et le certificat SSL gratuit.

---

## 1. Analyse des Besoins Techniques du Projet

Cette plateforme n'est **pas un simple site web statique ou WordPress**. Elle intègre :
1. **Next.js 14** (App Router avec rendu hybride SSR / API Routes).
2. **Serveur Node.js personnalisé (`server.js`)** exécutant **Socket.IO** en continu pour le chat en temps réel, les tips en direct et le comptage des spectateurs.
3. **Base de données PostgreSQL** gérée avec l'ORM Prisma.
4. **Redis & Worker Bull** (`src/worker/bullWorker.ts`) pour les files d'attente et tâches d'arrière-plan.
5. **Streaming Vidéo WebRTC / LiveKit** pour la diffusion en direct ultra-basse latence.
6. **Passerelles de Paiement** (SasPay, VaultPay, Crypto).

> [!CAUTION]
> **Attention aux offres « Hébergement Web Mutualisé » (Shared / Cloud Hosting standard) :**
> L'hébergement web mutualisé classique de Hostinger (ex: *Hébergement Premium à 2,99 €/mois*) est conçu pour PHP / WordPress. Il **ne permet pas** de faire tourner un démon Node.js persistant avec des WebSockets Socket.IO haute fréquence, ni de gérer des workers d'arrière-plan ou PostgreSQL natif avec accès root.
> **Pour cette application, vous devez impérativement opter pour un VPS Hostinger (Virtual Private Server).**

---

## 2. Combien Cela Va-t-il Vous Coûter ? (Grille Tarifaire Réelle)

Hostinger propose des VPS KVM Linux (processeur AMD EPYC, disques NVMe, réseau 300 Mb/s, IP dédiée, accès root complet).

### Comparatif des Formules VPS Hostinger

| Formule | Caractéristiques | Prix Promo (Engagement 1 à 2 ans) | Prix Renouvellement Mensuel | Recommandation pour ce Projet |
| :--- | :--- | :--- | :--- | :--- |
| **KVM 1** | 1 vCPU, 4 Go RAM, 50 Go SSD NVMe, 4 To Bande Passante | **~5,49 $ à 5,99 $ / mois** | ~9,99 $ / mois | Pour phase de test / staging (un peu juste si beaucoup de spectateurs simultanés). |
| **KVM 2** ⭐ *(Idéal)* | **2 vCPU, 8 Go RAM, 100 Go SSD NVMe, 8 To Bande Passante** | **~7,99 $ à 8,99 $ / mois** (~7,50 €) | **~13,99 $ / mois** | **RECOMMANDÉ** : Fait tourner Next.js + Socket.IO + PostgreSQL + Redis + PM2 sans ralentissement. |
| **KVM 4** | 4 vCPU, 16 Go RAM, 200 Go SSD NVMe, 16 To Bande Passante | **~12,99 $ à 13,99 $ / mois** | ~23,99 $ / mois | Pour montée en charge (milliers de spectateurs actifs en direct). |

---

### Récapitulatif du Budget Global

| Composant | Fournisseur / Solution | Coût Estimé |
| :--- | :--- | :--- |
| **Serveur VPS (KVM 2 - 8 Go RAM)** | Hostinger | **~8,00 $ / mois** (payé à l'année) |
| **Nom de Domaine** (`.com`, `.net`, `.live`) | Hostinger ou Namecheap | **Gratuit la 1ère année** avec l'offre Hostinger (puis ~12 $ à 14 $ / an) |
| **Certificat SSL HTTPS** | Let's Encrypt (Certbot) | **100% GRATUIT** et renouvelé automatiquement |
| **Base de Données PostgreSQL** | Auto-hébergée sur votre VPS Hostinger | **0 $** (inclus sur le VPS) |
| **Cache & Queue Redis** | Auto-hébergé sur votre VPS Hostinger | **0 $** (inclus sur le VPS) |
| **LiveKit Cloud (Serveur Média Vidéo)** | LiveKit Cloud (ou auto-hébergé) | **0 $** (Tier Gratuit généreux : 50 Go de bande passante/mois) |
| **Passerelle SasPay** | SasPay (`saspay.me`) | **0 $ de frais fixes** (frais uniquement par transaction) |
| **Total Mensuel Estimé** | | **~8,00 $ à 10,00 $ / mois** |

---

## 3. Guide de Déploiement Pas-à-Pas sur Hostinger VPS

### Étape 1 : Commande et Choix du VPS sur Hostinger
1. Rendez-vous sur **[Hostinger VPS Hosting](https://www.hostinger.com/vps-hosting)**.
2. Choisissez le plan **KVM 2** (2 vCPU, 8 Go RAM).
3. Choisissez la période d'abonnement (12 mois ou 24 mois pour bénéficier du tarif réduit à ~7,99 $/mois).
4. Sélectionnez le centre de données le plus proche de votre audience (ex: **France / Allemagne** pour l'Europe et l'Afrique de l'Ouest, ou **USA**).
5. Lors de la sélection du système d'exploitation, choisissez :
   - **OS : Ubuntu 22.04 64bit** (ou **Ubuntu 24.04**).
   - Définissez un mot de passe `root` solide et notez-le.
6. Une fois le VPS activé, Hostinger vous fournit votre **Adresse IP Publique Dédiée** (ex: `195.35.20.100`).

---

### Étape 2 : Configuration du Nom de Domaine (DNS)
Dans le panneau de gestion de votre nom de domaine (chez Hostinger ou votre registrar) :
1. Créez un enregistrement **Type A** :
   - **Nom / Hôte** : `@` (ou votre sous-domaine)
   - **Valeur / Cible** : L'adresse IP de votre VPS Hostinger (ex: `195.35.20.100`)
   - **TTL** : 300 ou Automatique
2. Créez un enregistrement **Type A** (ou CNAME) pour `www` :
   - **Nom / Hôte** : `www`
   - **Valeur** : L'adresse IP de votre VPS Hostinger

---

### Étape 3 : Connexion au VPS et Mises à Jour de Base
Ouvrez votre terminal (PowerShell, Git Bash ou macOS/Linux) et connectez-vous en SSH :

```bash
ssh root@IP_DE_VOTRE_VPS
```
*(Entrez le mot de passe root défini sur Hostinger)*

Mettez à jour le système d'exploitation :
```bash
apt update && apt upgrade -y
apt install -y curl wget git build-essential nginx ufw certbot python3-certbot-nginx
```

---

### Étape 4 : Installation de Node.js, PM2, PostgreSQL et Redis

#### 1. Installer Node.js 20 LTS
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
node -v # Doit afficher v20.x.x
npm -v
```

#### 2. Installer PM2 (Gestionnaire de processus en arrière-plan)
```bash
npm install -g pm2
```

#### 3. Installer et Configurer PostgreSQL
```bash
apt install -y postgresql postgresql-contrib

# Passer sous l'utilisateur postgres
sudo -u postgres psql
```

Dans la console PostgreSQL (`psql`), tapez les commandes SQL suivantes :
```sql
CREATE DATABASE live_stream_db;
CREATE USER live_user WITH ENCRYPTED PASSWORD 'VotreMotDePasseTresSecurise123!';
GRANT ALL PRIVILEGES ON DATABASE live_stream_db TO live_user;
ALTER DATABASE live_stream_db OWNER TO live_user;
\q
```

#### 4. Installer et Démarrer Redis
```bash
apt install -y redis-server
systemctl enable redis-server
systemctl start redis-server
redis-cli ping # Doit répondre PONG
```

---

### Étape 5 : Cloner le Projet et Installer les Dépendances

Créez le répertoire pour votre application :
```bash
mkdir -p /var/www/live-event
cd /var/www/live-event

# Cloner le projet depuis GitHub
git clone https://github.com/apachitech/Live_event.git .
```

Installez les packages npm :
```bash
npm install
```

---

### Étape 6 : Configuration du Fichier d'Environnement (`.env`)

Créez et éditez le fichier `.env` de production :
```bash
nano .env
```

Collez la configuration suivante en remplaçant par vos valeurs réelles :
```env
NODE_ENV=production
PORT=3000

# Base de Données PostgreSQL Locale sur le VPS
DATABASE_URL="postgresql://live_user:VotreMotDePasseTresSecurise123!@localhost:5432/live_stream_db?schema=public"

# URL Publique du Site (Votre Domaine)
NEXT_PUBLIC_APP_URL="https://votre-domaine.com"

# Sécurité & Tokens d'Authentification
JWT_SECRET="votre_cle_secrete_jwt_tres_longue_et_aleatoire_64_caracteres"
ADMIN_KEY="votre_cle_admin_secrete"

# Redis
REDIS_URL="redis://localhost:6379"

# Passerelle SasPay (Paiements Mobiles)
SASPAY_SECRET_KEY="saspay_live_secret_key_ici"
SASPAY_WEBHOOK_SECRET="saspay_webhook_secret_ici"
SASPAY_ENVIRONMENT="production"

# Passerelle VaultPay (Cartes Bancaires)
VAULTPAY_API_KEY="votre_cle_vaultpay"
VAULTPAY_ENVIRONMENT="production"

# Passerelle Crypto (NOWPayments)
NOWPAYMENTS_API_KEY="votre_cle_nowpayments"

# LiveKit (Streaming Vidéo WebRTC)
LIVEKIT_API_KEY="votre_cle_livekit"
LIVEKIT_API_SECRET="votre_secret_livekit"
NEXT_PUBLIC_LIVEKIT_WS_URL="wss://votre-projet.livekit.cloud"

# SMTP Emails (Hostinger ou Gmail / Resend)
SMTP_HOST="smtp.hostinger.com"
SMTP_PORT=465
SMTP_USER="contact@votre-domaine.com"
SMTP_PASS="mot_de_passe_email"
```
*(Appuyez sur `Ctrl + O` puis `Entrée` pour sauvegarder, et `Ctrl + X` pour quitter nano)*

---

### Étape 7 : Initialisation de la Base de Données & Build Next.js

Exécutez la synchronisation Prisma et la compilation de production :
```bash
# Appliquer les migrations Prisma à PostgreSQL
npx prisma db push

# Créer les données initiales (Admin, Packages de tokens, Paramètres plateforme)
npm run db:seed

# Compiler le projet Next.js en production
npm run build
```

---

### Étape 8 : Lancement des Processus avec PM2

Configurez un fichier de démarrage PM2 optimisé :
```bash
nano ecosystem.config.js
```

Collez la configuration :
```javascript
module.exports = {
  apps: [
    {
      name: 'live-stream-web',
      script: 'server.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
    {
      name: 'live-stream-worker',
      script: 'npm',
      args: 'run worker',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
```

Démarrez les services et activez le redémarrage automatique en cas de redémarrage du VPS :
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```
*(Copiez-collez la commande affichée par `pm2 startup` si demandée).*

Vérifiez le statut :
```bash
pm2 status
```

---

### Étape 9 : Configuration de Nginx en Reverse Proxy & WebSockets

Créez la configuration Nginx pour votre domaine :
```bash
nano /etc/nginx/sites-available/live-stream.conf
```

Collez la configuration suivante (remplacez `votre-domaine.com` par votre vrai domaine) :
```nginx
server {
    listen 80;
    server_name votre-domaine.com www.votre-domaine.com;

    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;

        # Configuration essentielle pour Socket.IO (WebSockets)
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # En-têtes standards de transmission
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts pour garder les WebSockets vivants
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}
```

Activez le site et testez la configuration :
```bash
ln -s /etc/nginx/sites-available/live-stream.conf /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

---

### Étape 10 : Sécurisation HTTPS Gratuite (SSL Let's Encrypt)

Générez le certificat SSL en 1 ligne de commande :
```bash
certbot --nginx -d votre-domaine.com -d www.votre-domaine.com
```
* Certbot configurera automatiquement le certificat et activera la redirection automatique HTTP vers HTTPS.
* Le renouvellement est 100% automatique via un cronjob système.

---

### Étape 11 : Pare-feu & Sécurité (UFW)
Activez le pare-feu du serveur pour protéger vos ports :
```bash
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable
```

---

### Étape 12 : Whitelist de l'IP du VPS sur SasPay
Comme documenté dans [`SASPAY-INGEST.md`](file:///c:/Users/XPRISTO/Desktop/tva/Live_event/SASPAY-INGEST.md), SasPay exige l'autorisation de l'IP de votre serveur :
1. Notez l'IP publique de votre VPS Hostinger.
2. Connectez-vous sur **[https://app.saspay.me](https://app.saspay.me)** > **Settings** > **IP Whitelist**.
3. Ajoutez l'adresse IP de votre VPS Hostinger.
4. Mettez à jour votre URL de Webhook dans le dashboard SasPay :
   ```text
   https://votre-domaine.com/api/wallet/webhook
   ```

---

## 4. Maintenance, Déploiements Futurs & Monitoring

Pour déployer vos futures mises à jour depuis GitHub sur le VPS, il vous suffira de lancer :
```bash
cd /var/www/live-event
git pull origin main
npm install
npm run build
pm2 reload all
```

Pour voir les logs en temps réel :
```bash
pm2 logs live-stream-web
```

---

## Résumé : Pourquoi Hostinger VPS est la meilleure option ?
1. **Économique** : ~8 $ / mois au lieu de 25 $ à 50 $ / mois sur d'autres services cloud (Render, Heroku, AWS).
2. **Performances Dédiées** : 8 Go de RAM et 2 cœurs vCPU NVMe rapides, permettant de supporter des dizaines de flux et des milliers de spectateurs simultanés.
3. **Contrôle Total** : Base PostgreSQL locale ultra-rapide (faible latence), support complet des WebSockets pour Socket.IO, et gestionnaire de processus PM2 permanent.
