# Деплой панели Harmony на сервер
# Перед запуском: скопируйте .env.deploy.example в .env.deploy и укажите SERVER_HOST, SERVER_USER, SERVER_PATH

$ErrorActionPreference = "Stop"
$panelRoot = $PSScriptRoot

Write-Host "=== Сборка панели ===" -ForegroundColor Cyan
Set-Location $panelRoot
npm run build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

# Загрузка на сервер (если заданы переменные)
$envFile = Join-Path $panelRoot ".env.deploy"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
            [System.Environment]::SetEnvironmentVariable($matches[1].Trim(), $matches[2].Trim(), "Process")
        }
    }
}

$hostName = $env:SERVER_HOST
$user = $env:SERVER_USER
$remotePath = $env:SERVER_PATH

if ($hostName -and $user -and $remotePath) {
    Write-Host "=== Загрузка на сервер ${user}@${hostName}:${remotePath} ===" -ForegroundColor Cyan
    $distPath = Join-Path $panelRoot "dist"
    # scp -r не поддерживает загрузку папки в существующий путь так же как rsync; используем scp -r dist/* user@host:path/
    & scp -r "$distPath\*" "${user}@${hostName}:${remotePath}/"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Ошибка загрузки. Проверьте: SSH-ключ, путь на сервере ($remotePath), права доступа." -ForegroundColor Yellow
        exit $LASTEXITCODE
    }
    Write-Host "Готово. Панель залита на сервер." -ForegroundColor Green
} else {
    Write-Host "Переменные SERVER_HOST, SERVER_USER, SERVER_PATH не заданы." -ForegroundColor Yellow
    Write-Host "Собранные файлы лежат в папке: $panelRoot\dist" -ForegroundColor Gray
    Write-Host "Создайте .env.deploy по образцу .env.deploy.example и укажите сервер для автоматической загрузки." -ForegroundColor Gray
}
