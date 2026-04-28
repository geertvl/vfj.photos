terraform {
  required_version = ">= 1.6"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }

  # Uncomment to store Terraform state remotely in Azure Blob Storage.
  # Create the storage account and container manually before running `terraform init`.
  #
  # backend "azurerm" {
  #   resource_group_name  = "rg-tfstate"
  #   storage_account_name = "vfjphotostfstate"
  #   container_name       = "tfstate"
  #   key                  = "vfj-photos.tfstate"
  # }
}

provider "azurerm" {
  subscription_id = var.subscription_id
  features {}
}
