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

  app_settings = {
    GALLERY_PASSWORD_FEEST_ZATERDAG          = var.gallery_password_feest_zaterdag
    GALLERY_PASSWORD_LENTEFEEST_VOORMIDDAG   = var.gallery_password_lentefeest_voormiddag
    GALLERY_PASSWORD_LENTEFEEST_NAMIDDAG     = var.gallery_password_lentefeest_namiddag
    JWT_SECRET                               = random_password.jwt_secret.result
    STORAGE_ACCOUNT_NAME                     = azurerm_storage_account.main.name
    STORAGE_ACCOUNT_KEY                      = azurerm_storage_account.main.primary_access_key
    STORAGE_CONTAINER_NAME                   = azurerm_storage_container.photos.name
  }

  tags = local.tags
}

resource "azurerm_static_web_app_custom_domain" "main" {
  static_web_app_id = azurerm_static_web_app.main.id
  domain_name       = var.custom_domain
  validation_type   = "cname-delegation"
}
