$ErrorActionPreference = 'Stop'
$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) { throw 'Node.js 14+ is required for the offline preview' }
& $node.Source (Join-Path $PSScriptRoot 'preview_fx_drive.js')
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
