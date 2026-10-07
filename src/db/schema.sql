-- ============================================================================
-- REDHACK AI v2 - Enterprise Cybersecurity Operations Platform Data Model
-- PostgreSQL Production DDL Schema
-- Compatible with PostgreSQL 14+, Cloud SQL, Neon, Supabase, and RDS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. Organizations & Workspaces (Multi-Tenancy)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS organizations (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    plan VARCHAR(50) DEFAULT 'enterprise',
    max_workspaces INT DEFAULT 20,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS workspaces (
    id VARCHAR(64) PRIMARY KEY,
    organization_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    environment VARCHAR(50) DEFAULT 'production', -- 'production', 'staging', 'lab', 'isolated-sandbox'
    scope_policy JSONB NOT NULL DEFAULT '{"authorizedSubnets": [], "authorizedDomains": [], "excludedAssets": []}'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_workspaces_org ON workspaces(organization_id);

-- ----------------------------------------------------------------------------
-- 2. Roles & Permissions (RBAC)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS roles (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    is_system_role BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS permissions (
    id VARCHAR(64) PRIMARY KEY,
    code VARCHAR(100) UNIQUE NOT NULL,
    module VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS role_permissions (
    role_id VARCHAR(64) REFERENCES roles(id) ON DELETE CASCADE,
    permission_id VARCHAR(64) REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- ----------------------------------------------------------------------------
-- 3. Users & Tenant Memberships
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    role_id VARCHAR(64) REFERENCES roles(id),
    default_organization_id VARCHAR(64) REFERENCES organizations(id),
    default_workspace_id VARCHAR(64) REFERENCES workspaces(id),
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_workspace_memberships (
    user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
    workspace_id VARCHAR(64) REFERENCES workspaces(id) ON DELETE CASCADE,
    role_id VARCHAR(64) REFERENCES roles(id),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, workspace_id)
);

-- ----------------------------------------------------------------------------
-- 4. Projects & Asset Inventory
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS projects (
    id VARCHAR(64) PRIMARY KEY,
    workspace_id VARCHAR(64) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    lead_owner_id VARCHAR(64) REFERENCES users(id),
    status VARCHAR(50) DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_projects_workspace ON projects(workspace_id);

CREATE TABLE IF NOT EXISTS assets (
    id VARCHAR(64) PRIMARY KEY,
    workspace_id VARCHAR(64) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    project_id VARCHAR(64) REFERENCES projects(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    asset_type VARCHAR(50) NOT NULL, -- 'server', 'database', 'cloud_workload', 'api_gateway', 'ai_model_service', 'mcp_server', 'endpoint', 'container'
    ip_address VARCHAR(45),
    hostname VARCHAR(255),
    cloud_provider VARCHAR(50), -- 'AWS', 'GCP', 'Azure', 'On-Premise'
    exposure VARCHAR(50) NOT NULL DEFAULT 'INTERNAL', -- 'PUBLIC_INTERNET', 'INTERNAL', 'RESTRICTED_ISOLATED'
    business_criticality VARCHAR(50) NOT NULL DEFAULT 'MEDIUM', -- 'MISSION_CRITICAL', 'HIGH', 'MEDIUM', 'LOW'
    owner_team VARCHAR(100),
    tags TEXT[],
    is_in_testing_scope BOOLEAN DEFAULT TRUE,
    security_score NUMERIC(5,2) DEFAULT 85.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_assets_workspace ON assets(workspace_id);
CREATE INDEX IF NOT EXISTS idx_assets_type ON assets(asset_type);

-- ----------------------------------------------------------------------------
-- 5. Vulnerabilities, Threats, & Threat Intel
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS vulnerabilities (
    id VARCHAR(64) PRIMARY KEY,
    cve_id VARCHAR(50) UNIQUE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    cvss_v31_vector VARCHAR(150),
    cvss_score NUMERIC(3,1) NOT NULL,
    severity VARCHAR(20) NOT NULL, -- 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'
    epss_score NUMERIC(4,3),
    cisa_kev BOOLEAN DEFAULT FALSE,
    remediation_guidance TEXT,
    published_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS threats (
    id VARCHAR(64) PRIMARY KEY,
    workspace_id VARCHAR(64) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    threat_actor VARCHAR(100), -- 'APT29 (Cozy Bear)', 'Lazarus Group', 'Volt Typhoon', 'FIN7', 'Scattered Spider'
    category VARCHAR(50) NOT NULL,
    mitre_attack_id VARCHAR(50),
    mitre_tactic VARCHAR(100),
    description TEXT NOT NULL,
    confidence VARCHAR(20) DEFAULT 'HIGH',
    indicators TEXT[],
    stix_bundle JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_threats_workspace ON threats(workspace_id);

-- ----------------------------------------------------------------------------
-- 6. Unified Finding Lifecycle
-- DISCOVERED -> TRIAGED -> VALIDATING -> CONFIRMED / DISMISSED -> REMEDIATION -> RETEST -> RESOLVED
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS findings (
    id VARCHAR(64) PRIMARY KEY,
    workspace_id VARCHAR(64) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    asset_id VARCHAR(64) REFERENCES assets(id) ON DELETE CASCADE,
    vulnerability_id VARCHAR(64) REFERENCES vulnerabilities(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    severity VARCHAR(20) NOT NULL, -- 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'
    confidence VARCHAR(20) NOT NULL, -- 'CONFIRMED', 'HIGH', 'MEDIUM', 'LOW'
    lifecycle_status VARCHAR(30) NOT NULL DEFAULT 'DISCOVERED', -- 'DISCOVERED', 'TRIAGED', 'VALIDATING', 'CONFIRMED', 'DISMISSED', 'REMEDIATION', 'RETEST', 'RESOLVED'
    explanation TEXT NOT NULL,
    business_impact TEXT NOT NULL,
    recommended_remediation TEXT NOT NULL,
    assigned_to_user_id VARCHAR(64) REFERENCES users(id),
    discovered_by_agent VARCHAR(64),
    validation_status VARCHAR(50) DEFAULT 'PENDING_VALIDATION',
    remediation_status VARCHAR(50) DEFAULT 'OPEN',
    verified_at TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_findings_workspace ON findings(workspace_id);
CREATE INDEX IF NOT EXISTS idx_findings_lifecycle ON findings(lifecycle_status);
CREATE INDEX IF NOT EXISTS idx_findings_severity ON findings(severity);

-- ----------------------------------------------------------------------------
-- 7. SOC Alerts, Incidents, & Investigations
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS alerts (
    id VARCHAR(64) PRIMARY KEY,
    workspace_id VARCHAR(64) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    asset_id VARCHAR(64) REFERENCES assets(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    status VARCHAR(30) DEFAULT 'NEW', -- 'NEW', 'TRIAGED', 'ESCALATED_TO_INCIDENT', 'FALSE_POSITIVE', 'CLOSED'
    source_type VARCHAR(50) NOT NULL, -- 'aws_cloudtrail', 'crowdstrike_falcon', 'suricata_nids', 'sysmon', etc.
    source_ip VARCHAR(45),
    destination_ip VARCHAR(45),
    target_port INT,
    user_identity VARCHAR(100),
    mitre_technique_id VARCHAR(50),
    raw_payload JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_alerts_workspace ON alerts(workspace_id);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);

CREATE TABLE IF NOT EXISTS incidents (
    id VARCHAR(64) PRIMARY KEY,
    workspace_id VARCHAR(64) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE', 'CONTAINED', 'ERADICATED', 'POST_MORTEM', 'CLOSED'
    assigned_lead_id VARCHAR(64) REFERENCES users(id),
    impact_summary TEXT,
    containment_actions JSONB DEFAULT '[]'::jsonb,
    root_cause TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_incidents_workspace ON incidents(workspace_id);

CREATE TABLE IF NOT EXISTS investigations (
    id VARCHAR(64) PRIMARY KEY,
    workspace_id VARCHAR(64) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    incident_id VARCHAR(64) REFERENCES incidents(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    hypothesis TEXT,
    findings_summary TEXT,
    timeline JSONB DEFAULT '[]'::jsonb,
    lead_investigator_id VARCHAR(64) REFERENCES users(id),
    status VARCHAR(30) DEFAULT 'IN_PROGRESS',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 8. Evidence Center
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS evidence (
    id VARCHAR(64) PRIMARY KEY,
    workspace_id VARCHAR(64) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    finding_id VARCHAR(64) REFERENCES findings(id) ON DELETE CASCADE,
    investigation_id VARCHAR(64) REFERENCES investigations(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    evidence_type VARCHAR(50) NOT NULL, -- 'pcap_snippet', 'raw_log', 'terminal_session', 'screenshot', 'config_dump', 'memory_hex'
    sha256_hash VARCHAR(64) NOT NULL,
    chain_of_custody JSONB NOT NULL DEFAULT '[]'::jsonb,
    content TEXT NOT NULL,
    collected_by VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_evidence_workspace ON evidence(workspace_id);

-- ----------------------------------------------------------------------------
-- 9. Authorized Security Simulations (Purple Team)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS simulations (
    id VARCHAR(64) PRIMARY KEY,
    workspace_id VARCHAR(64) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    scenario_id VARCHAR(64) NOT NULL,
    title VARCHAR(255) NOT NULL,
    target_asset_id VARCHAR(64) REFERENCES assets(id),
    target_asset_scope VARCHAR(255) NOT NULL,
    authorized_by_user_id VARCHAR(64) REFERENCES users(id),
    status VARCHAR(30) NOT NULL DEFAULT 'READY', -- 'READY', 'VALIDATING_SCOPE', 'EXECUTING', 'COMPLETED', 'HALTED_BY_OPERATOR', 'ABORTED_OUT_OF_SCOPE'
    prevention_score NUMERIC(5,2),
    detection_score NUMERIC(5,2),
    response_score NUMERIC(5,2),
    execution_log JSONB DEFAULT '[]'::jsonb,
    started_at TIMESTAMP WITH TIME ZONE,
    finished_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_simulations_workspace ON simulations(workspace_id);

-- ----------------------------------------------------------------------------
-- 10. Multi-Agent Architecture & Agent Runs
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS agents (
    id VARCHAR(64) PRIMARY KEY,
    code_name VARCHAR(100) UNIQUE NOT NULL, -- 'orchestrator', 'security_analyst', 'code_security', 'threat_intel', 'detection_engineer', 'incident_response', 'validation_agent', 'reporting_agent', 'ai_security_agent'
    display_name VARCHAR(255) NOT NULL,
    role_description TEXT NOT NULL,
    permission_scope TEXT[] NOT NULL,
    available_tools JSONB NOT NULL,
    requires_human_approval_for TEXT[] NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS agent_runs (
    id VARCHAR(64) PRIMARY KEY,
    workspace_id VARCHAR(64) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    agent_id VARCHAR(64) NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    invoked_by_user_id VARCHAR(64) REFERENCES users(id),
    trigger_type VARCHAR(50) NOT NULL, -- 'MANUAL', 'ALERT_PIPELINE', 'SOAR_ORCHESTRATION', 'SCHEDULED_SCAN'
    status VARCHAR(30) NOT NULL DEFAULT 'RUNNING', -- 'RUNNING', 'WAITING_FOR_HUMAN_APPROVAL', 'COMPLETED', 'FAILED', 'REVOKED'
    input_context JSONB NOT NULL,
    output_result JSONB,
    approval_pending_action JSONB,
    tool_calls JSONB DEFAULT '[]'::jsonb,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);
CREATE INDEX IF NOT EXISTS idx_agent_runs_workspace ON agent_runs(workspace_id);

-- ----------------------------------------------------------------------------
-- 11. Security Scores & Metrics
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS security_scores (
    id VARCHAR(64) PRIMARY KEY,
    workspace_id VARCHAR(64) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    overall_score NUMERIC(5,2) NOT NULL, -- 0.00 to 100.00
    letter_grade VARCHAR(5) NOT NULL, -- 'A+', 'A', 'B', 'C', 'D', 'F'
    breakdown JSONB NOT NULL, -- { "assetExposure": 82, "severityExploitability": 74, "detectionCoverage": 91, "remediationStatus": 88, "businessImpactRisk": 22 }
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_security_scores_workspace ON security_scores(workspace_id);

-- ----------------------------------------------------------------------------
-- 12. Reports & Exports
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reports (
    id VARCHAR(64) PRIMARY KEY,
    workspace_id VARCHAR(64) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    report_type VARCHAR(50) NOT NULL, -- 'EXECUTIVE_SUMMARY', 'PENTEST_ASSESSMENT', 'INCIDENT_POSTMORTEM', 'COMPLIANCE_AUDIT', 'SOC_OPERATIONS'
    format VARCHAR(20) NOT NULL, -- 'MARKDOWN', 'JSON', 'HTML', 'CSV', 'PDF'
    generated_by_user_id VARCHAR(64) REFERENCES users(id),
    generated_by_agent VARCHAR(64),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_reports_workspace ON reports(workspace_id);

-- ----------------------------------------------------------------------------
-- 13. Integrations, Webhooks, & APIs
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS integrations (
    id VARCHAR(64) PRIMARY KEY,
    workspace_id VARCHAR(64) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    service_name VARCHAR(100) NOT NULL, -- 'aws_cloudtrail', 'crowdstrike', 'splunk_hec', 'slack_alerts', 'pagerduty', 'jira', 'github_security'
    category VARCHAR(50) NOT NULL, -- 'SIEM', 'EDR', 'CLOUD', 'TICKETING', 'NOTIFICATION'
    config JSONB NOT NULL,
    status VARCHAR(30) DEFAULT 'ACTIVE',
    last_sync_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 14. Audit Events (Immutable Security Log)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_events (
    id VARCHAR(64) PRIMARY KEY,
    workspace_id VARCHAR(64) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    actor_id VARCHAR(64) NOT NULL,
    actor_type VARCHAR(30) NOT NULL, -- 'USER', 'AGENT', 'SYSTEM'
    actor_name VARCHAR(255) NOT NULL,
    action VARCHAR(100) NOT NULL, -- e.g. 'ISOLATE_HOST_TRIGGERED', 'APPROVAL_GRANTED', 'SCOPE_EXCLUSION_MODIFIED', 'KILL_SWITCH_ENGAGED'
    target_type VARCHAR(50) NOT NULL,
    target_id VARCHAR(64),
    details JSONB DEFAULT '{}'::jsonb,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_audit_events_workspace ON audit_events(workspace_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_created ON audit_events(created_at DESC);
