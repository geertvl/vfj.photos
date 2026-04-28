# ── Blob Storage roles for the SWA managed identity ─────────────────────────
#
# "Storage Blob Data Reader"  → list and download blobs
# "Storage Blob Delegator"    → generate user-delegation SAS tokens (required
#                               when using DefaultAzureCredential instead of
#                               a storage account key)

resource "azurerm_role_assignment" "swa_storage_reader" {
  scope                = azurerm_storage_account.main.id
  role_definition_name = "Storage Blob Data Reader"
  principal_id         = azurerm_static_web_app.main.identity[0].principal_id
}

resource "azurerm_role_assignment" "swa_storage_delegator" {
  scope                = azurerm_storage_account.main.id
  role_definition_name = "Storage Blob Delegator"
  principal_id         = azurerm_static_web_app.main.identity[0].principal_id
}

