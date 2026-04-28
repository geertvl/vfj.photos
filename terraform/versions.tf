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
  features {
    key_vault {
      # Allows re-running `terraform destroy` + `terraform apply` cleanly
      purge_soft_delete_on_destroy    = true
      recover_soft_deleted_key_vaults = true
    }
  }
}
