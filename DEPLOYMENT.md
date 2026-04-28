# Deployment – Vrijzinnige Feesten 2026 Fotogalerij

## Overzicht van de architectuur

```
GitHub → Azure Static Web Apps
              ├── Frontend  (Vue 3 / Vite)
              └── API       (Azure Functions v4, Node 20)
                    ├── POST /api/auth       wachtwoord valideren
                    ├── GET  /api/photos     foto-urls ophalen
                    └── POST /api/download   zip aanmaken
Azure Key Vault  → wachtwoord + JWT-geheim
Azure Blob Storage → foto's opgeslagen per categorie
```

---

## 1. Azure-resources aanmaken

### Resource Group
```bash
az group create --name rg-vfj-photos --location westeurope
```

### Storage Account (voor foto's)
```bash
az storage account create \
  --name vfjphotosstorage \
  --resource-group rg-vfj-photos \
  --location westeurope \
  --sku Standard_LRS \
  --kind StorageV2

# Container aanmaken
az storage container create \
  --name photos \
  --account-name vfjphotosstorage \
  --public-access off
```

### Key Vault
```bash
az keyvault create \
  --name vfj-photos-kv \
  --resource-group rg-vfj-photos \
  --location westeurope

# Geheimen opslaan
az keyvault secret set \
  --vault-name vfj-photos-kv \
  --name "gallery-password" \
  --value "KiesEenSterkWachtwoord2026"

az keyvault secret set \
  --vault-name vfj-photos-kv \
  --name "jwt-secret" \
  --value "$(openssl rand -base64 48)"
```

### Azure Static Web App
```bash
az staticwebapp create \
  --name vfj-photos \
  --resource-group rg-vfj-photos \
  --location westeurope \
  --sku Free
```

---

## 2. Managed Identity instellen

De Azure Functions in de Static Web App hebben een Managed Identity nodig voor Key Vault en Blob Storage.

```bash
# Managed Identity ophalen (systeem-toegewezen)
az staticwebapp show \
  --name vfj-photos \
  --resource-group rg-vfj-photos \
  --query "identity.principalId" -o tsv

# Key Vault toegang geven
az keyvault set-policy \
  --name vfj-photos-kv \
  --object-id <PRINCIPAL_ID> \
  --secret-permissions get

# Blob Storage rol toewijzen (Delegator + Reader voor SAS generatie)
STORAGE_ID=$(az storage account show \
  --name vfjphotosstorage \
  --resource-group rg-vfj-photos \
  --query id -o tsv)

az role assignment create \
  --assignee <PRINCIPAL_ID> \
  --role "Storage Blob Data Reader" \
  --scope $STORAGE_ID

az role assignment create \
  --assignee <PRINCIPAL_ID> \
  --role "Storage Blob Delegator" \
  --scope $STORAGE_ID
```

---

## 3. Applicatie-instellingen configureren

Stel de omgevingsvariabelen in. Gebruik Key Vault-verwijzingen voor geheimen:

```bash
KEYVAULT_NAME="vfj-photos-kv"

az staticwebapp appsettings set \
  --name vfj-photos \
  --resource-group rg-vfj-photos \
  --setting-names \
    "GALLERY_PASSWORD=@Microsoft.KeyVault(SecretUri=https://${KEYVAULT_NAME}.vault.azure.net/secrets/gallery-password/)" \
    "JWT_SECRET=@Microsoft.KeyVault(SecretUri=https://${KEYVAULT_NAME}.vault.azure.net/secrets/jwt-secret/)" \
    "STORAGE_ACCOUNT_NAME=vfjphotosstorage" \
    "STORAGE_CONTAINER_NAME=photos"
```

---

## 4. CORS instellen op Blob Storage

Dit is nodig zodat de browser foto's rechtstreeks kan downloaden.

```bash
az storage cors add \
  --account-name vfjphotosstorage \
  --services b \
  --methods GET OPTIONS \
  --origins "https://vfj-photos.azurestaticapps.net" \
  --allowed-headers "*" \
  --exposed-headers "Content-Disposition,Content-Length,Content-Type" \
  --max-age 86400
```

Voeg ook `http://localhost:5173` toe voor lokale ontwikkeling.

---

## 5. GitHub Actions instellen

1. Ga in de Azure Portal naar de Static Web App → **Deployment token** kopiëren.
2. Voeg toe als GitHub Secret: `AZURE_STATIC_WEB_APPS_API_TOKEN`
3. Push naar de `main`-branch → de GitHub Actions workflow deployt automatisch.

---

## 6. Foto's uploaden

Organiseer je foto's in mappen die overeenkomen met de categorieën:

```
photos/
├── feest-zaterdag/          ← Feest vrijzinnige jeugd zaterdag 25/4
│   ├── foto001.jpg
│   ├── foto002.jpg
│   └── ...
├── lentefeest-voormiddag/   ← Lentefeest zondag voormiddag 26/4
│   └── ...
└── lentefeest-namiddag/     ← Lentefeest zondag namiddag 26/4
    └── ...
```

Upload via Azure Storage Explorer (gratis desktop app) of Azure CLI:

```bash
# Met Azure Storage Explorer: sleep en zet neer in de container

# Of via CLI (voor een map):
az storage blob upload-batch \
  --account-name vfjphotosstorage \
  --destination photos/feest-zaterdag \
  --source ./mijn-fotos/zaterdag \
  --pattern "*.jpg"
```

**Tip:** Comprimeer foto's voor upload (bijv. max. 2–4 MB per foto) voor snellere laadtijden.

---

## 7. Lokale ontwikkeling

### Vereisten
- Node.js 20+
- Azure Functions Core Tools: `npm install -g azure-functions-core-tools@4`
- Azurite (lokale Azure opslag): `npm install -g azurite`

### Opstarten

**Terminal 1 – API:**
```bash
cd api
npm install
func start
```

**Terminal 2 – Frontend:**
```bash
cd frontend
npm install
npm run dev
```

De frontend is beschikbaar op `http://localhost:5173` en proxyt API-aanroepen naar `http://localhost:7071`.

Pas `api/local.settings.json` aan met je testwaarden (nooit committen!).

---

## 8. Wachtwoord wijzigen

```bash
az keyvault secret set \
  --vault-name vfj-photos-kv \
  --name "gallery-password" \
  --value "NieuwWachtwoord2026"
```

Het nieuwe wachtwoord is onmiddellijk actief. Bestaande ingelogde sessies blijven 24 uur geldig.

---

## 9. Aanbevolen verbeteringen na lancering

- **Azure CDN**: voeg een CDN-profiel toe voor snellere laadtijden van foto's wereldwijd.
- **Miniaturen**: gebruik Azure Functions + de `sharp`-bibliotheek om verkleinde previews te genereren bij upload, zodat de galerij sneller laadt.
- **Application Insights**: koppel monitoring aan de Static Web App voor foutopsporing.
