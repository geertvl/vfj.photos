# Vrijzinnige Feesten 2026 – Fotogalerij

Password-protected photo gallery for parents to view and download photos from the **Vrijzinnige Feesten 2026** weekend events. Built for [Vrijzinnig Groot-Lier](https://www.vrijzinniggrootlier.be).

## Features

- 🔒 Password gate — single shared password stored in Azure Key Vault
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

Azure Key Vault       gallery-password, jwt-secret
Azure Blob Storage    private container, SAS tokens via Managed Identity
```

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | [Vue 3](https://vuejs.org/) + [Vite](https://vitejs.dev/) |
| API | [Azure Functions v4](https://learn.microsoft.com/azure/azure-functions/) (Node 20) |
| Hosting | [Azure Static Web Apps](https://azure.microsoft.com/products/app-service/static) |
| Storage | [Azure Blob Storage](https://azure.microsoft.com/products/storage/blobs) |
| Secrets | [Azure Key Vault](https://azure.microsoft.com/products/key-vault) |
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
├── staticwebapp.config.json
├── .github/workflows/
│   └── azure-static-web-apps.yml
├── DEPLOYMENT.md
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
    "GALLERY_PASSWORD": "test123",
    "JWT_SECRET": "lokaal-geheim-minimaal-32-tekens-lang!!",
    "STORAGE_ACCOUNT_NAME": "jouwstorageaccount",
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

**Tip:** Resize photos to a maximum of 2–4 MB before uploading for faster loading in the browser.

## License

[MIT](LICENSE) © 2026 Vrijzinnig Groot-Lier
