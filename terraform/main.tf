# Current Azure login context
data "azurerm_client_config" "current" {}

# Short random suffix to ensure a globally unique storage account name
resource "random_string" "suffix" {
  length  = 5
  special = false
  upper   = false
}

locals {
  # Storage account names must be lowercase alphanumeric, max 24 chars
  storage_account_name = "${replace(var.prefix, "-", "")}${random_string.suffix.result}"

  tags = merge(var.tags, {
    managed-by = "terraform"
  })
}

resource "azurerm_resource_group" "main" {
  name     = var.resource_group_name
  location = var.location
  tags     = local.tags
}
