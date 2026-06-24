resource "random_pet" "rg_name" {
  prefix = var.prefix
}

resource "random_string" "name" {
  length = 6
  lower = true
  numeric = false
  special = false
  upper = false
}

resource "azurerm_resource_group" "rg" {
  name = random_pet.rg_name.id
  location = var.region
}

resource "azurerm_container_registry" "acr" {
  name = "${random_string.name.result}resgistry"
  resource_group_name = azurerm_resource_group.rg.name
  location = var.region
  sku = "Basic"
}