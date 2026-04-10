$projectPath = $PSScriptRoot
Set-Location $projectPath

function gacp {
    param(
        [string]$Message = "更新优化"
    )

    git add .

    $hasChanges = git diff --cached --name-only
    if (-not $hasChanges) {
        Write-Host "没有可提交的改动"
        return
    }

    git commit -m $Message
    if ($LASTEXITCODE -ne 0) {
        Write-Host "提交失败，已停止 push"
        return
    }

    git push
}

function gs {
    git status
}

function glog {
    git log --oneline --decorate -n 12
}

Write-Host "已进入项目：$projectPath"
Write-Host '可用命令：gs / glog / gacp "提交信息"'
