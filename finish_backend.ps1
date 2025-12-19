# Move Backend Files Specific
$source = "ipl-auction-server/ipl-auction-server"
$dest = "backend"

if (Test-Path "$source/index.js") { Move-Item -Path "$source/index.js" -Destination $dest -Force }
if (Test-Path "$source/package.json") { Move-Item -Path "$source/package.json" -Destination $dest -Force }
if (Test-Path "$source/package-lock.json") { Move-Item -Path "$source/package-lock.json" -Destination $dest -Force }

# Move node_modules if it exists (might be slow, but let's try)
if (Test-Path "$source/node_modules") { Move-Item -Path "$source/node_modules" -Destination $dest -Force }

# Clean up
if (Test-Path "ipl-auction-server") { Remove-Item -Path "ipl-auction-server" -Recurse -Force }

Write-Host "Backend Move Complete"
