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

variable "gallery_password_feest_zaterdag" {
  description = <<-EOT
    Password for parents of the Saturday event (feest-zaterdag).
    PowerShell: $env:TF_VAR_gallery_password_feest_zaterdag = "WachtwoordZaterdag2026"
  EOT
  type      = string
  sensitive = true
}

variable "gallery_password_lentefeest_voormiddag" {
  description = <<-EOT
    Password for parents of the Sunday morning event (lentefeest-voormiddag).
    PowerShell: $env:TF_VAR_gallery_password_lentefeest_voormiddag = "WachtwoordVoormiddag2026"
  EOT
  type      = string
  sensitive = true
}

variable "gallery_password_lentefeest_namiddag" {
  description = <<-EOT
    Password for parents of the Sunday afternoon event (lentefeest-namiddag).
    PowerShell: $env:TF_VAR_gallery_password_lentefeest_namiddag = "WachtwoordNamiddag2026"
  EOT
  type      = string
  sensitive = true
}

variable "custom_domain" {
  description = "Custom domain for the photo gallery (e.g. fotos.vrijzinniggrootlier.be)."
  type        = string
  default     = "fotos.vrijzinniggrootlier.be"
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
