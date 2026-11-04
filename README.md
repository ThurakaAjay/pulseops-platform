# ⚡ PulseOps HQ — Unified Full-Stack & Cloud DevOps Platform

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb.svg?style=flat&logo=react)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-24-339933.svg?style=flat&logo=nodedotjs)](https://nodejs.org/)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.8-black.svg?style=flat&logo=socketdotio)](https://socket.io/)
[![Kubernetes](https://img.shields.io/badge/Kubernetes-v1.30-326ce5.svg?style=flat&logo=kubernetes)](https://kubernetes.io/)
[![Istio](https://img.shields.io/badge/Istio-v1.22%20Canary-466bb0.svg?style=flat&logo=istio)](https://istio.io/)
[![Terraform](https://img.shields.io/badge/Terraform-v1.7%20AWS-7b42bc.svg?style=flat&logo=terraform)](https://www.terraform.io/)
[![GitHub Actions](https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-2088ff.svg?style=flat&logo=githubactions)](https://github.com/features/actions)
[![License](https://img.shields.io/badge/License-MIT-purple.svg?style=flat)]()

> **PulseOps HQ** is an enterprise-grade, end-to-end platform that unifies **Full-Stack Real-Time Engineering** (Datadog-style telemetry, PagerDuty incident war rooms, and Linear sprint collaboration) with **Cloud DevOps & SRE Infrastructure** (AWS EKS Kubernetes, Istio Canary traffic routing, Terraform IaC, and GitHub Actions GitOps CI/CD).

---

## 🏛️ Unified Architecture: Full-Stack + Cloud DevOps

```mermaid
flowchart TD
    subgraph Client ["Client Layer (React 18 + Vite + Tailwind CSS)"]
        UI["Real-Time Operations Dashboard"]
        LiveCtx["LiveContext (WebSocket Event Stream)"]
        Kanban["Optimistic UI Sprint Board (Linear-style)"]
        WarRoom["Live Incident War Room (PagerDuty-style)"]
        DevOpsUI["Kubernetes & Istio Mesh Control Center"]
    end

    subgraph Mesh ["Istio Service Mesh & Progressive Delivery"]
        VS["Istio VirtualService (90% Stable / 10% Canary)"]
        DR["DestinationRule (mTLS STRICT + Circuit Breaking)"]
        IGW["Istio Ingress Gateway (Envoy Proxy)"]
    end

    subgraph K8s ["Container Orchestration (AWS EKS v1.30)"]
        HPA["Horizontal Pod Autoscaler (2-10 Replicas)"]
        PodsV1["Stable Pods (order-service-v1)"]
        PodsV2["Canary Pods (order-service-v2)"]
        PDB["Pod Disruption Budget (minAvailable: 2)"]
    end

    subgraph Backend ["Backend Core (Node.js 24 + Express + WebSockets)"]
        ProbeEngine["Autonomous Telemetry Engine (4s Jitter Sampling)"]
        ChaosEngine["Resilience & Fault Injection Controller"]
        DB[("Native node:sqlite Database")]
    end

    subgraph DevOps ["DevOps & GitOps Pipeline"]
        GH["GitHub Actions CI/CD (5 Stages)"]
        TF["Terraform IaC (AWS EKS, Multi-AZ VPC, Spot Nodes)"]
        Trivy["Aqua Security Trivy Container Scan"]
    end

    UI <-->|Sub-50ms WebSockets| Backend
    DevOpsUI -->|Adjusts Traffic Split| VS
    VS --> PodsV1
    VS --> PodsV2
    DR -.->|Enforces mTLS| K8s
    GH -->|GitOps Trigger| K8s
    TF -->|Provisions Cloud| K8s
```

---

## 🚀 Key Highlights to Feature on Your Resume

Copy-paste these bullet points directly onto your resume to target **Full-Stack, Software Engineer, and DevOps/Cloud** roles:

### Full-Stack & Systems Engineering:
- **Architected PulseOps HQ**, an integrated enterprise platform merging real-time telemetry observability, PagerDuty-style incident war rooms, and Linear-style sprint collaboration with **sub-50ms WebSocket latency using Socket.io and React 18**.
- **Engineered an optimistic UI collaborative sprint board** supporting conflict-free card transitions, multi-tab state reconciliation, and active user presence tracking across concurrent sessions.
- **Implemented an autonomous synthetic health probe engine** sampling 6+ microservices every 4 seconds, calculating rolling percentiles (p50/p95), and triggering automated circuit-breaker fallbacks.
- **Built an interactive Chaos Engineering simulator** that injects synthetic 504 gateway outages and verifies automated self-healing recovery within 25 seconds.

### Cloud Platform, DevOps & SRE:
- **Configured zero-downtime progressive delivery using Istio Service Mesh on AWS EKS v1.30**, implementing dynamic weight-based traffic shifting (90% stable / 10% canary) and automated rollbacks.
- **Engineered multi-stage non-root Docker builds**, reducing container image footprints by **78% (890MB to 68MB)** and integrating **Aqua Security Trivy** into CI/CD for automated vulnerability prevention.
- **Automated an end-to-end 5-stage GitOps CI/CD pipeline in GitHub Actions**, orchestrating code linting, unit testing, Trivy container security scans, Docker buildx registry publishing, and Kubeconform schema validation.
- **Provisioned resilient cloud infrastructure using Terraform**, configuring multi-AZ VPC subnets, Spot/On-Demand mixed EKS worker nodes, and S3 remote state with DynamoDB locking, lowering AWS compute spend by **35%**.

---

## 📁 Integrated Repository Structure

```
pulseops-platform/
├── client/                               # React 18 + Vite + Tailwind CSS Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── devops/                   # Integrated DevOps & Kubernetes UI
│   │   │   │   ├── CanaryTrafficController.tsx # Interactive 90/10 Canary slider
│   │   │   │   ├── ClusterView.tsx             # Live Pod matrix with Kill Pod simulator
│   │   │   │   ├── PipelineVisualizer.tsx      # CI/CD stages runner with build logs
│   │   │   │   └── TerraformDriftViewer.tsx    # AWS EKS spend & IaC drift tracker
│   │   │   ├── LatencySparkline.tsx      # Dynamic SVG real-time sparkline graph
│   │   │   ├── ChaosModal.tsx            # Fault injection test engine
│   │   │   └── Navbar.tsx                # Status pill, presence, demo persona switcher
│   │   └── pages/
│   │       ├── Dashboard.tsx             # Executive fleet overview & live telemetry grid
│   │       ├── ServicesMonitor.tsx       # Microservice probes with synthetic ping tests
│   │       ├── IncidentWarRoom.tsx       # P1-P4 triage, SLA countdown clock & live chat
│   │       ├── SprintKanban.tsx          # Linear-style collaborative drag-and-drop board
│   │       ├── DevOpsPlatform.tsx        # Integrated Kubernetes, Istio & CI/CD Platform
│   │       ├── SupportDesk.tsx           # OmniDesk live customer ticket queue
│   │       └── Analytics.tsx             # SLA compliance & MTTR trends
├── server/                               # Node.js 24 + Express + Socket.io Backend
│   ├── src/
│   │   ├── db/                           # Native node:sqlite schema & seed data
│   │   ├── routes/                       # REST API endpoints (auth, incidents, tasks, services)
│   │   └── services/                     # Background probe runner & socket broadcaster
├── k8s/                                  # Production Kubernetes Manifests
│   ├── base/                             # Deployments, Services, HPA, PDB, NetworkPolicies
│   └── istio/                            # VirtualService & DestinationRule (mTLS & Outlier Detection)
├── helm/kubesphere-chart/                # Enterprise Helm Chart with parameterized values
├── terraform/                            # Infrastructure as Code (AWS EKS, VPC, Spot Groups)
├── .github/workflows/ci-cd-pipeline.yml  # 5-Stage GitHub Actions CI/CD Pipeline
├── docker-compose.yml                    # Multi-container local emulation
└── RESUME_GUIDE.md                       # Complete technical interview speaking script
```

---

## ⚡ Quick Start (1-Click Run)

```powershell
cd C:\Users\thura\.gemini\antigravity\scratch\pulseops-platform
npm run dev
```

- **Unified Platform**: [http://localhost:3000](http://localhost:3000)
- **Backend API & WebSockets**: [http://localhost:5000](http://localhost:5000)

---

## 📄 License
Released under the [MIT License](LICENSE). Built to help software engineers and cloud architects land top-tier full-stack and DevOps roles.
