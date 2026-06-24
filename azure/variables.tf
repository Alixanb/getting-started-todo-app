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