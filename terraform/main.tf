terraform {
  required_version = ">= 1.7.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.40"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.27"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.12"
    }
  }

  backend "s3" {
    bucket         = "kubesphere-terraform-state-prod"
    key            = "prod/eks/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "kubesphere-tflocks"
    encrypt        = true
  }
}

provider "aws" {
  region = var.aws_region
  default_tags {
    tags = {
      Environment = var.environment
      Project     = "KubeSphere-Ops"
      ManagedBy   = "Terraform"
    }
  }
}

# Module 1: Production Multi-AZ VPC
module "vpc" {
  source = "./modules/vpc"

  vpc_cidr             = "10.0.0.0/16"
  availability_zones   = ["us-east-1a", "us-east-1b", "us-east-1c"]
  public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  private_subnet_cidrs = ["10.0.10.0/24", "10.0.20.0/24", "10.0.30.0/24"]
  enable_nat_gateway   = true
  cluster_name         = var.cluster_name
}

# Module 2: Production AWS EKS Cluster
module "eks" {
  source = "./modules/eks"

  cluster_name    = var.cluster_name
  cluster_version = "1.30"
  vpc_id          = module.vpc.vpc_id
  subnet_ids      = module.vpc.private_subnets

  node_groups = {
    # On-Demand General Compute
    general = {
      desired_size   = 3
      min_size       = 2
      max_size       = 6
      instance_types = ["t3.medium"]
      capacity_type  = "ON_DEMAND"
    }
    # Cost-Optimized Spot Worker Nodes
    spot_workers = {
      desired_size   = 2
      min_size       = 1
      max_size       = 8
      instance_types = ["t3.large", "m5.large"]
      capacity_type  = "SPOT"
    }
  }
}
