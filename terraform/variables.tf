variable "aws_region" {
  description = "AWS region for infrastructure provisioning"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Target deployment environment"
  type        = string
  default     = "production"
}

variable "cluster_name" {
  description = "EKS Cluster identifier"
  type        = string
  default     = "kubesphere-eks-prod"
}
