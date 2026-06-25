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
  name                = "${random_string.name.result}resgistry"
  resource_group_name = azurerm_resource_group.rg.name
  location            = var.region
  sku                 = "Basic"
  admin_enabled       = true
}

resource "azurerm_kubernetes_cluster" "aks" {
  name                = "${random_string.name.result}aks"
  location            = var.region
  resource_group_name = azurerm_resource_group.rg.name
  dns_prefix          = "${random_string.name.result}aks"
  kubernetes_version  = var.kubernetes_version

  default_node_pool {
    name       = "default"
    node_count = var.node_count
    vm_size    = var.vm_size

    upgrade_settings {
      max_surge = "10%"
    }
  }

  identity {
    type = "SystemAssigned"
  }
}