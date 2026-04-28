# JWT signing secret — auto-generated at first apply, stable across future applies.
resource "random_password" "jwt_secret" {
  length           = 64
  special          = true
  override_special = "!#$%&*+-=?@_"
}

resource "azurerm_static_web_app" "main" {
  name                = var.prefix
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  sku_tier            = "Free"
  sku_size            = "Free"

  identity {
    type = "SystemAssigned"
  }

  app_settings = {
    GALLERY_PASSWORD       = var.gallery_password
    JWT_SECRET             = random_password.jwt_secret.result
    STORAGE_ACCOUNT_NAME   = azurerm_storage_account.main.name
    STORAGE_CONTAINER_NAME = azurerm_storage_container.photos.name
  }

  tags = local.tags
}
