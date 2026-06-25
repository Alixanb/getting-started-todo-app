# Group variables
variable "region" {
  type = string
  default = "swedencentral"
  description = "ressources location"
}

variable "prefix" {
  type = string
  default = "rg"
  description = "ressource group name prefix"
}

# AKS variables
variable "node_count" {
  type        = number
  default     = 2
  description = "number of nodes in the AKS default node pool"
}

variable "vm_size" {
  type        = string
  default     = "Standard_B2s_v2"
  description = "VM size for the AKS default node pool (B2s_v2 is the v1 B2s replacement available on most subscriptions; list options with: az aks list-vm-skus -l <region> -s Standard_B -o table)"
}

variable "kubernetes_version" {
  type        = string
  default     = null
  description = "Kubernetes version for AKS (null = Azure default)"
}