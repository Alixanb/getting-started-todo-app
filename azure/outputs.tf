output "rg_name" {
  value = azurerm_resource_group.rg.name
}

output "registry_name" {
  value = azurerm_container_registry.acr.name
}

output "registry_login_server" {
  value = azurerm_container_registry.acr.login_server
}

output "aks_cluster_name" {
  value = azurerm_kubernetes_cluster.aks.name
}

output "kube_config" {
  value     = azurerm_kubernetes_cluster.aks.kube_config_raw
  sensitive = true
}

output "get_credentials_command" {
  value = "az aks get-credentials --resource-group ${azurerm_resource_group.rg.name} --name ${azurerm_kubernetes_cluster.aks.name}"
}

output "acr_admin_username" {
  value     = azurerm_container_registry.acr.admin_username
  sensitive = true
}

output "acr_admin_password" {
  value     = azurerm_container_registry.acr.admin_password
  sensitive = true
}

output "create_pull_secret_command" {
  value     = "kubectl create secret docker-registry acr-pull-secret --docker-server=${azurerm_container_registry.acr.login_server} --docker-username=${azurerm_container_registry.acr.admin_username} --docker-password=$(terraform output -raw acr_admin_password)"
  sensitive = true
}