# Check for ffmpeg
if (-not (Get-Command "ffmpeg" -ErrorAction SilentlyContinue)) {
    Write-Error "FFmpeg is not installed or not in your PATH. Please install FFmpeg to run this script."
    exit 1
}

$dirs = @("voiceoff", "assets/audio")
$root = "$PSScriptRoot/../"

foreach ($dir in $dirs) {
    $fullPath = Join-Path $root $dir
    if (Test-Path $fullPath) {
        Write-Host "Processing directory: $dir"
        $files = Get-ChildItem -Path $fullPath -Filter "*.wav"
        
        foreach ($file in $files) {
            $input = $file.FullName
            $output = $file.FullName -replace '\.wav$', '.mp3'
            
            Write-Host "Converting $($file.Name) to MP3..."
            
            # Convert to MP3, 128k bitrate, -y to overwrite
            ffmpeg -i "$input" -b:a 128k -y "$output" | Out-Null
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "  Success: $output"
            } else {
                Write-Host "  Error converting $($file.Name)" -ForegroundColor Red
            }
        }
    } else {
        Write-Warning "Directory not found: $dir"
    }
}

Write-Host "Done! Please verify the .mp3 files and check if they play correctly."
