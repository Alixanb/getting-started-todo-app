output "rg_name" {
  value = azurerm_resource_group.rg.name
}

output "registry_name" {
  value = azurerm_container_registry.acr.name
}

output "registry_login_server" {
  value = azurerm_container_registry.acr.login_server
}