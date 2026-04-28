output "app_url" {
  description = "Public URL of the photo gallery."
  value       = "https://${azurerm_static_web_app.main.default_host_name}"
}

output "deployment_token" {
  description = <<-EOT
    GitHub Actions deployment token.
    Add this as the AZURE_STATIC_WEB_APPS_API_TOKEN secret in your GitHub repository.
    Retrieve after apply with:
      terraform output -raw deployment_token
  EOT
  value     = azurerm_static_web_app.main.api_key
  sensitive = true
}

output "storage_account_name" {
  description = "Storage account name — use in api/local.settings.json for local development."
  value       = azurerm_storage_account.main.name
}

output "storage_container_name" {
  description = "Blob container name for photos."
  value       = azurerm_storage_container.photos.name
}

output "resource_group_name" {
  description = "Resource group name."
  value       = azurerm_resource_group.main.name
}

output "static_web_app_name" {
  description = "Static Web App name."
  value       = azurerm_static_web_app.main.name
}
