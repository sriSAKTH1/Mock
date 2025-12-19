# Create directories
New-Item -ItemType Directory -Force -Path "frontend"
New-Item -ItemType Directory -Force -Path "backend"

# Move Backend Files
# Check if source exists to avoid errors
if (Test-Path "ipl-auction-server/ipl-auction-server") {
    Move-Item -Path "ipl-auction-server/ipl-auction-server/*" -Destination "backend" -Force
    Remove-Item -Path "ipl-auction-server" -Recurse -Force
}

# Move Frontend Files
$frontendItems = @(
    "components", "context", "pages", "services", "src", ".vercel",
    "App.tsx", "constants.ts", "index.html", "index.tsx", "metadata.json",
    "package-lock.json", "package.json", "tsconfig.json", "types.ts",
    "vercel.json", "vite.config.ts", ".gitignore", ".vercelignore"
)

foreach ($item in $frontendItems) {
    if (Test-Path $item) {
        Move-Item -Path $item -Destination "frontend" -Force
    }
}

Write-Host "Restructuring Complete"
