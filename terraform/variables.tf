variable "subscription_id" {
  description = <<-EOT
    Azure subscription ID to deploy into.
    Find yours with: az account show --query id -o tsv
  EOT
  type = string
}

variable "prefix" {
  description = "Short prefix used in all resource names."
  type        = string
  default     = "vfj-photos"
}

variable "resource_group_name" {
  description = "Name of the Azure Resource Group to create."
  type        = string
  default     = "rg-vfj-photos"
}

variable "location" {
  description = "Azure region for all resources. West Europe is closest to Belgium."
  type        = string
  default     = "westeurope"
}

variable "gallery_password" {
  description = <<-EOT
    Shared password parents use to access the photo gallery.
    Stored as a plain app setting on the Static Web App.
    Prefer setting via environment variable to keep it out of shell history:
      PowerShell: $env:TF_VAR_gallery_password = "YourPassword2026"
  EOT
  type      = string
  sensitive = true
}

variable "cors_origins" {
  description = <<-EOT
    CORS origins allowed to fetch photos directly from Blob Storage.
    Defaults to ["*"] so the first deploy works without knowing the SWA URL yet.
    After deploy, tighten this to your actual URL:
      cors_origins = ["https://vfj-photos.azurestaticapps.net"]
    then re-run terraform apply.
  EOT
  type    = list(string)
  default = ["*"]
}

variable "local_dev_cors_origins" {
  description = "Extra CORS origins added to Blob Storage for local development."
  type        = list(string)
  default     = ["http://localhost:5173"]
}

variable "tags" {
  description = "Tags applied to every resource."
  type        = map(string)
  default = {
    environment = "production"
    project     = "vfj-photos-2026"
  }
}
