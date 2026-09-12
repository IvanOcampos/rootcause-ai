[CmdletBinding()]
param(
    [string]$ApiBaseUrl = "http://localhost:8000",
    [switch]$RequireFullFlow,
    [int]$TimeoutSeconds = 75
)

$ErrorActionPreference = "Stop"
$ApiBaseUrl = $ApiBaseUrl.TrimEnd("/")

function Assert-Equal {
    param([object]$Actual, [object]$Expected, [string]$Message)
    if ($Actual -ne $Expected) {
        throw "$Message Expected '$Expected'; received '$Actual'."
    }
}

function Get-Investigation {
    param([string]$InvestigationId)
    Invoke-RestMethod -Method Get -Uri "$ApiBaseUrl/api/investigations/$InvestigationId"
}

Write-Host "Checking RootCause API at $ApiBaseUrl ..."
$health = Invoke-RestMethod -Method Get -Uri "$ApiBaseUrl/health"
Assert-Equal $health.status "ok" "Health endpoint is invalid."
Assert-Equal $health.service "rootcause-api" "Health endpoint is invalid."
Write-Host "PASS health"

if (-not $RequireFullFlow) {
    Write-Host "Health smoke test completed. Use -RequireFullFlow after agent, backend, and frontend changes are integrated."
    exit 0
}

$request = @{ user_request = "Investiga por que las ventas estan 38% por debajo de lo normal." } | ConvertTo-Json
$created = Invoke-RestMethod -Method Post -Uri "$ApiBaseUrl/api/investigations" -ContentType "application/json" -Body $request
if (-not $created.investigation_id -or -not $created.incident_id) {
    throw "Create-investigation response must include investigation_id and incident_id."
}
Assert-Equal $created.status "CREATED" "Create-investigation response is invalid."
Write-Host "PASS create investigation $($created.investigation_id)"

$deadline = (Get-Date).AddSeconds($TimeoutSeconds)
do {
    Start-Sleep -Milliseconds 500
    $investigation = Get-Investigation $created.investigation_id
    if ($investigation.status -in @("WAITING_APPROVAL", "FAILED", "CANCELLED")) { break }
} while ((Get-Date) -lt $deadline)

Assert-Equal $investigation.status "WAITING_APPROVAL" "Investigation did not reach human approval."
if (-not $investigation.recovery.approval_id) {
    throw "Waiting-approval investigation must expose recovery.approval_id."
}
if (-not $investigation.root_cause -or -not $investigation.impact) {
    throw "Recovery was proposed without root cause and impact evidence."
}
Write-Host "PASS evidence and approval gate"

$approval = @{ decision = "APPROVED" } | ConvertTo-Json
$approvalResult = Invoke-RestMethod -Method Post -Uri "$ApiBaseUrl/api/investigations/$($created.investigation_id)/approvals/$($investigation.recovery.approval_id)" -ContentType "application/json" -Body $approval
Assert-Equal $approvalResult.status "APPROVED" "Approval response is invalid."
Write-Host "PASS approval"

$deadline = (Get-Date).AddSeconds($TimeoutSeconds)
do {
    Start-Sleep -Milliseconds 500
    $investigation = Get-Investigation $created.investigation_id
    if ($investigation.status -in @("RESOLVED", "FAILED", "CANCELLED")) { break }
} while ((Get-Date) -lt $deadline)

Assert-Equal $investigation.status "RESOLVED" "Approved recovery did not resolve the incident."
Assert-Equal $investigation.verification.verified $true "Resolved investigation lacks successful verification."
Write-Host "PASS recovery and verified resolution"
