# Vrijzinnige Feesten 2026 – Fotogalerij

Password-protected photo gallery for parents to view and download photos from the **Vrijzinnige Feesten 2026** weekend events. Built for [Vrijzinnig Groot-Lier](https://www.vrijzinniggrootlier.be).

## Features

- 🔒 Password gate — one password per event, parents only see their own event's photos
- 📂 Three event categories with photo counts
- ✅ Multi-select with "select all in category"
- 📥 Download selected photos as a single ZIP file
- 🔍 Full-screen lightbox with keyboard navigation (← → Esc)
- 📱 Responsive — works on phones, tablets, and desktops
- 🌐 Deployed on Azure Static Web Apps with integrated Azure Functions API

## Event categories

| Folder in blob storage | Category |
|---|---|
| `feest-zaterdag/` | Feest vrijzinnige jeugd op zaterdag 25/4/2026 |
| `lentefeest-voormiddag/` | Lentefeest op zondag voormiddag 26/4/2026 |
| `lentefeest-namiddag/` | Lentefeest op zondag namiddag 26/4/2026 |

## Architecture

```
GitHub Actions
    └─▶ Azure Static Web Apps
              ├── Frontend  (Vue 3 + Vite)
              └── API       (Azure Functions v4, Node 20)
                    ├── POST /api/auth      validate password → JWT
                    ├── GET  /api/photos    list blobs + generate SAS URLs
                    └── POST /api/download  stream selected photos as ZIP

Azure Blob Storage    private container, SAS tokens via storage account key
```

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | [Vue 3](https://vuejs.org/) + [Vite](https://vitejs.dev/) |
| API | [Azure Functions v4](https://learn.microsoft.com/azure/azure-functions/) (Node 20) |
| Hosting | [Azure Static Web Apps](https://azure.microsoft.com/products/app-service/static) |
| Storage | [Azure Blob Storage](https://azure.microsoft.com/products/storage/blobs) |
| Secrets | App settings on Azure Static Web Apps (managed by Terraform) |
| Auth | JWT (24-hour expiry) |
| CI/CD | GitHub Actions |

## Project structure

```
vfj.photos/
├── frontend/                   Vue 3 SPA
│   ├── src/
│   │   ├── App.vue
│   │   ├── main.js
│   │   ├── assets/main.css
│   │   └── components/
│   │       ├── PasswordGate.vue
│   │       ├── PhotoGallery.vue
│   │       ├── PhotoCard.vue
│   │       └── Lightbox.vue
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── api/                        Azure Functions
│   ├── src/functions/
│   │   ├── auth.js
│   │   ├── photos.js
│   │   └── download.js
│   ├── host.json
│   └── package.json
├── scripts/                    Utility scripts
│   ├── generate-thumbnails.js
│   └── package.json
├── terraform/                  Infrastructure as code
├── staticwebapp.config.json
├── .github/workflows/
│   └── azure-static-web-apps.yml
└── LICENSE
```

## Quick start (local development)

### Prerequisites

- Node.js 20+
- [Azure Functions Core Tools v4](https://learn.microsoft.com/azure/azure-functions/functions-run-local): `npm install -g azure-functions-core-tools@4`

### 1. Configure local API settings

Copy and edit `api/local.settings.json` (already in `.gitignore`):

```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "GALLERY_PASSWORD_FEEST_ZATERDAG": "WachtwoordZaterdag2026",
    "GALLERY_PASSWORD_LENTEFEEST_VOORMIDDAG": "WachtwoordVoormiddag2026",
    "GALLERY_PASSWORD_LENTEFEEST_NAMIDDAG": "WachtwoordNamiddag2026",
    "JWT_SECRET": "lokaal-geheim-minimaal-32-tekens-lang!!",
    "STORAGE_ACCOUNT_NAME": "jouwstorageaccount",
    "STORAGE_ACCOUNT_KEY": "jouw-storage-account-sleutel",
    "STORAGE_CONTAINER_NAME": "photos"
  }
}
```

### 2. Start the API

```bash
cd api
npm install
func start
```

### 3. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). API calls are proxied to `http://localhost:7071`.

## Deployment

See **[DEPLOYMENT.md](DEPLOYMENT.md)** for the full step-by-step Azure setup, including:

- Creating the Resource Group, Storage Account, Key Vault, and Static Web App
- Assigning Managed Identity roles
- Configuring Key Vault references as app settings
- Setting up CORS on Blob Storage
- Uploading photos to the correct folders
- Changing the password

## Uploading photos

Upload photos into the three subfolders of the `photos` container in Azure Blob Storage.  
The easiest way is with [Azure Storage Explorer](https://azure.microsoft.com/products/storage/storage-explorer) (free desktop app).

| Blob folder | Event |
|---|---|
| `feest-zaterdag/` | Feest vrijzinnige jeugd — zaterdag 25/4/2026 |
| `lentefeest-voormiddag/` | Lentefeest — zondag voormiddag 26/4/2026 |
| `lentefeest-namiddag/` | Lentefeest — zondag namiddag 26/4/2026 |

## Generating thumbnails

The gallery grid shows small thumbnails for fast loading; clicking a photo opens the full-size version in the lightbox. Thumbnails are **not** generated automatically — run the script below after every batch of uploads.

### First-time setup

```powershell
cd scripts
npm install
```

### Run after every upload

```powershell
cd scripts
node generate-thumbnails.js
```

The script:
- Reads storage credentials automatically from `api/local.settings.json`
- Resizes each photo to a maximum of 800 px (longest side) at 82 % JPEG quality
- Uploads the result to `thumbnails/<event>/<filename>` in the same blob container
- **Skips photos that already have a thumbnail** — safe to re-run at any time

Example output:
```
Storage account : vfjphotosq42o1
Container       : photos

📁  feest-zaterdag
·····++++++++++

📁  lentefeest-voormiddag
·····++++

✅  Done!  Generated: 18  |  Already existed: 10  |  Errors: 0
```

`·` = thumbnail already existed and was skipped  
`+` = new thumbnail generated

### Removing a photo

When the organisation reports a photo ID (e.g. `DSC_0042` shown on the card), delete both the original and its thumbnail:

```powershell
$account = "vfjphotosq42o1"
$key     = "<storage-account-key>"

# Delete the original
az storage blob delete --account-name $account --account-key $key `
  --container-name photos --name feest-zaterdag/DSC_0042.jpg

# Delete the thumbnail
az storage blob delete --account-name $account --account-key $key `
  --container-name photos --name thumbnails/feest-zaterdag/DSC_0042.jpg
```

## License

[MIT](LICENSE) © 2026 Vrijzinnig Groot-Lier
